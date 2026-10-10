// UsersService의 트랜잭션 경계와 선호 카테고리 교체 시맨틱을 고정하는 단위 테스트
import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { UserFavoriteCategory } from './user-favorite-category.entity';

const mockUser = () =>
  ({
    id: 1,
    provider: null,
    email: 'hong@example.com',
    name: '홍길동',
    nickname: '길동이',
    profileImage: null,
    address: '서울시 어딘가',
    age: 30,
    gender: 'male',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  }) as unknown as User;

describe('UsersService', () => {
  // 트랜잭션 콜백이 쓰는 manager 쪽 repository (주입 repository와 구분해야 T3 회귀를 잡을 수 있다)
  let txUserRepo: Record<string, jest.Mock>;
  let txFavRepo: Record<string, jest.Mock>;
  let userRepo: Record<string, jest.Mock>;
  let favCategoryRepo: Record<string, jest.Mock>;
  let dataSource: { transaction: jest.Mock };
  let service: UsersService;
  let callOrder: string[];

  beforeEach(async () => {
    callOrder = [];

    txUserRepo = { save: jest.fn() };
    txFavRepo = {
      delete: jest.fn(() => {
        callOrder.push('tx:delete');
      }),
      save: jest.fn(() => {
        callOrder.push('tx:save');
      }),
      create: jest.fn((row: unknown) => row),
    };

    userRepo = {
      findOne: jest.fn(() => {
        callOrder.push('getMe:findOne');
        return Promise.resolve(mockUser());
      }),
      findOneBy: jest.fn(() => Promise.resolve(mockUser())),
    };
    favCategoryRepo = { find: jest.fn(() => Promise.resolve([])) };

    dataSource = {
      transaction: jest.fn(async (cb: (m: unknown) => Promise<unknown>) => {
        callOrder.push('tx:start');
        const manager = {
          getRepository: (entity: unknown) =>
            entity === User ? txUserRepo : txFavRepo,
        };
        const result = await cb(manager);
        callOrder.push('tx:commit');
        return result;
      }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        {
          provide: getRepositoryToken(UserFavoriteCategory),
          useValue: favCategoryRepo,
        },
        { provide: getDataSourceToken(), useValue: dataSource },
      ],
    }).compile();

    service = moduleRef.get(UsersService);
  });

  describe('getMe', () => {
    it('프로필과 선호 카테고리 이름 배열을 함께 반환한다', async () => {
      // Given
      favCategoryRepo.find.mockResolvedValue([
        { category: '한식' },
        { category: '일식' },
      ]);

      // When
      const result = await service.getMe(1);

      // Then
      expect(result.favoriteCategories).toEqual(['한식', '일식']);
      expect(Object.keys(result)).toHaveLength(11);
    });

    it('유저가 없으면 NotFoundException을 던진다', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.getMe(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('updateProfile — 트랜잭션 경계', () => {
    it('유저가 없으면 트랜잭션을 시작하지 않고 NotFoundException을 던진다', async () => {
      // Given
      userRepo.findOneBy.mockResolvedValue(null);

      // When / Then
      await expect(service.updateProfile(999, {})).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('프로필 저장과 카테고리 교체를 하나의 트랜잭션으로 묶는다', async () => {
      // When
      await service.updateProfile(1, { favoriteCategories: ['한식'] });

      // Then — 트랜잭션은 한 번만 열리고, 그 안에서 저장과 교체가 모두 일어난다
      expect(dataSource.transaction).toHaveBeenCalledTimes(1);
      expect(txUserRepo.save).toHaveBeenCalledTimes(1);
      expect(txFavRepo.delete).toHaveBeenCalledWith({ userId: 1 });
      expect(txFavRepo.save).toHaveBeenCalledTimes(1);
    });

    it('T3 회귀 방지 — 콜백 안에서 주입 repository를 쓰지 않는다', async () => {
      // 주입된 repository로 쓰기를 하면 트랜잭션 밖 커넥션이라 원자성이 사라진다.
      // When
      await service.updateProfile(1, { favoriteCategories: ['한식'] });

      // Then
      expect(userRepo.findOneBy).toHaveBeenCalled(); // 조회는 트랜잭션 밖이라 정상
      expect(userRepo['save']).toBeUndefined();
      expect(favCategoryRepo['delete']).toBeUndefined();
      expect(favCategoryRepo['save']).toBeUndefined();
    });

    it('T1 회귀 방지 — getMe는 커밋 이후에 호출한다', async () => {
      // 콜백 안에서 부르면 미커밋 데이터를 못 읽어 카테고리가 빈 배열로 응답된다.
      // When
      await service.updateProfile(1, { favoriteCategories: ['한식'] });

      // Then
      expect(callOrder).toEqual([
        'tx:start',
        'tx:delete',
        'tx:save',
        'tx:commit',
        'getMe:findOne',
      ]);
      expect(callOrder.indexOf('getMe:findOne')).toBeGreaterThan(
        callOrder.indexOf('tx:commit'),
      );
    });

    it('트랜잭션 내부에서 예외가 나면 전파되고 getMe를 호출하지 않는다', async () => {
      // Given
      txFavRepo.save.mockRejectedValue(new Error('insert 실패'));

      // When / Then
      await expect(
        service.updateProfile(1, { favoriteCategories: ['한식'] }),
      ).rejects.toThrow('insert 실패');
      expect(callOrder).not.toContain('getMe:findOne');
      expect(callOrder).not.toContain('tx:commit');
    });
  });

  describe('updateProfile — favoriteCategories 3분기 시맨틱', () => {
    it('미지정(undefined)이면 카테고리를 건드리지 않는다', async () => {
      await service.updateProfile(1, { nickname: '새닉네임' });

      expect(txUserRepo.save).toHaveBeenCalledTimes(1);
      expect(txFavRepo.delete).not.toHaveBeenCalled();
      expect(txFavRepo.save).not.toHaveBeenCalled();
    });

    it('null이면 카테고리를 건드리지 않는다 (TypeError 회귀 방지)', async () => {
      // @IsOptional()은 null도 통과시키고 whitelist는 선언된 프로퍼티를 지우지 않는다.
      // truthy 판정 대신 `!== undefined`로 바꾸면 null.length에서 500이 난다.
      await service.updateProfile(1, {
        favoriteCategories: null,
      } as unknown as Parameters<typeof service.updateProfile>[1]);

      expect(txFavRepo.delete).not.toHaveBeenCalled();
      expect(txFavRepo.save).not.toHaveBeenCalled();
    });

    it('빈 배열이면 전량 삭제만 하고 재삽입하지 않는다', async () => {
      await service.updateProfile(1, { favoriteCategories: [] });

      expect(txFavRepo.delete).toHaveBeenCalledWith({ userId: 1 });
      expect(txFavRepo.save).not.toHaveBeenCalled();
    });

    it('값이 있으면 삭제 후 재삽입한다', async () => {
      await service.updateProfile(1, { favoriteCategories: ['한식', '일식'] });

      expect(txFavRepo.delete).toHaveBeenCalledWith({ userId: 1 });
      expect(txFavRepo.save).toHaveBeenCalledWith([
        { userId: 1, category: '한식' },
        { userId: 1, category: '일식' },
      ]);
    });
  });
});
