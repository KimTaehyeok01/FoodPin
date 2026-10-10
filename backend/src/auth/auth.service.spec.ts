// AuthService의 트랜잭션 경계·정지 계정 차단·race 변환을 고정하는 단위 테스트
import { Test } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { QueryFailedError } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from '../users/user.entity';
import { RegisterDto } from './dto/register.dto';

jest.mock('bcrypt');

const dupError = () => {
  const err = new QueryFailedError('INSERT', [], new Error('dup'));
  (err as unknown as { driverError: { code: string } }).driverError = {
    code: 'ER_DUP_ENTRY',
  };
  return err;
};

const registerDto = (over: Partial<RegisterDto> = {}): RegisterDto => ({
  email: 'hong@example.com',
  password: 'pw12345678',
  name: '홍길동',
  nickname: '길동이',
  address: '서울시 어딘가',
  age: 30,
  gender: 'male',
  ...over,
});

describe('AuthService', () => {
  let userRepository: Record<string, jest.Mock>;
  let txUserRepo: Record<string, jest.Mock>;
  let txFavRepo: Record<string, jest.Mock>;
  let dataSource: { transaction: jest.Mock };
  let jwtService: { sign: jest.Mock };
  let service: AuthService;
  let callOrder: string[];

  beforeEach(async () => {
    jest.clearAllMocks();
    callOrder = [];

    (bcrypt.hash as jest.Mock).mockImplementation(() => {
      callOrder.push('bcrypt:hash');
      return Promise.resolve('hashed-pw');
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    txUserRepo = {
      create: jest.fn((row: unknown) => row),
      save: jest.fn((row: Record<string, unknown>) => {
        callOrder.push('tx:saveUser');
        return Promise.resolve({
          ...row,
          id: 1,
          role: 'user',
          isBanned: false,
        });
      }),
    };
    txFavRepo = {
      create: jest.fn((row: unknown) => row),
      save: jest.fn(() => {
        callOrder.push('tx:saveCategories');
        return Promise.resolve([]);
      }),
    };

    userRepository = {
      findOneBy: jest.fn(() => Promise.resolve(null)),
      findOneByOrFail: jest.fn(),
      create: jest.fn((row: unknown) => row),
      save: jest.fn(),
    };

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

    jwtService = { sign: jest.fn(() => 'jwt-token') };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: getDataSourceToken(), useValue: dataSource },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  describe('register — 트랜잭션 경계', () => {
    it('토큰만 반환한다 (Entity가 컨트롤러로 새지 않는다)', async () => {
      const result = await service.register(registerDto());

      expect(result).toEqual({ token: 'jwt-token' });
      expect(Object.keys(result)).toEqual(['token']);
    });

    it('사전 이메일 중복이면 트랜잭션을 열지 않고 409를 던진다', async () => {
      userRepository.findOneBy.mockResolvedValue({ id: 9 });

      await expect(service.register(registerDto())).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('T2 회귀 방지 — bcrypt.hash는 트랜잭션 밖에서 먼저 실행한다', async () => {
      // 트랜잭션 안에서 해싱하면 100ms 동안 DB 커넥션이 묶인다.
      await service.register(registerDto());

      expect(callOrder.indexOf('bcrypt:hash')).toBeLessThan(
        callOrder.indexOf('tx:start'),
      );
    });

    it('유저 저장과 선호 카테고리 저장을 한 트랜잭션으로 묶는다', async () => {
      await service.register(registerDto({ favoriteCategories: ['한식'] }));

      expect(dataSource.transaction).toHaveBeenCalledTimes(1);
      expect(callOrder).toEqual([
        'bcrypt:hash',
        'tx:start',
        'tx:saveUser',
        'tx:saveCategories',
        'tx:commit',
      ]);
    });

    it('T3 회귀 방지 — 콜백 안에서 주입 repository로 쓰지 않는다', async () => {
      await service.register(registerDto({ favoriteCategories: ['한식'] }));

      expect(userRepository.save).not.toHaveBeenCalled();
      expect(txUserRepo.save).toHaveBeenCalledTimes(1);
    });

    it('선호 카테고리가 없으면 카테고리 저장을 건너뛴다', async () => {
      await service.register(registerDto());

      expect(txUserRepo.save).toHaveBeenCalledTimes(1);
      expect(txFavRepo.save).not.toHaveBeenCalled();
    });

    it('카테고리 저장이 실패하면 트랜잭션이 커밋되지 않고 예외가 전파된다', async () => {
      txFavRepo.save.mockRejectedValue(new Error('insert 실패'));

      await expect(
        service.register(registerDto({ favoriteCategories: ['한식'] })),
      ).rejects.toThrow('insert 실패');
      expect(callOrder).not.toContain('tx:commit');
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('저장 중 유니크 위반(race)은 409로 변환한다', async () => {
      txUserRepo.save.mockRejectedValue(dupError());

      await expect(service.register(registerDto())).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('유니크 위반이 아닌 오류는 그대로 전파한다', async () => {
      txUserRepo.save.mockRejectedValue(new Error('연결 끊김'));

      await expect(service.register(registerDto())).rejects.toThrow(
        '연결 끊김',
      );
    });
  });

  describe('issueToken — 정지 계정 차단', () => {
    const banned = {
      id: 1,
      nickname: '길동이',
      email: 'a@b.com',
      role: 'user',
      isBanned: true,
    };

    it('정지 계정은 토큰을 발급하지 않는다', () => {
      expect(() => service.issueToken(banned)).toThrow(UnauthorizedException);
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('정상 계정은 sub 클레임으로 토큰을 발급한다', () => {
      expect(service.issueToken({ ...banned, isBanned: false })).toBe(
        'jwt-token',
      );
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: 1 });
    });
  });

  describe('login', () => {
    it('소셜 가입 계정(password null)은 비밀번호 로그인을 거부한다', async () => {
      userRepository.findOneBy.mockResolvedValue({ id: 1, password: null });

      await expect(
        service.login({ email: 'a@b.com', password: 'pw' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('비밀번호가 틀리면 401을 던진다', async () => {
      userRepository.findOneBy.mockResolvedValue({ id: 1, password: 'hash' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'a@b.com', password: 'pw' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('정지 계정은 로그인해도 토큰이 발급되지 않는다', async () => {
      userRepository.findOneBy.mockResolvedValue({
        id: 1,
        password: 'hash',
        isBanned: true,
      });

      await expect(
        service.login({ email: 'a@b.com', password: 'pw' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('adminLogin', () => {
    it('admin이 아니면 401을 던진다', async () => {
      userRepository.findOneBy.mockResolvedValue({
        id: 1,
        password: 'hash',
        role: 'user',
        isBanned: false,
      });

      await expect(
        service.adminLogin({ email: 'a@b.com', password: 'pw' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('admin이면 토큰을 발급한다', async () => {
      userRepository.findOneBy.mockResolvedValue({
        id: 1,
        password: 'hash',
        role: 'admin',
        isBanned: false,
      });

      await expect(
        service.adminLogin({ email: 'a@b.com', password: 'pw' }),
      ).resolves.toEqual({ token: 'jwt-token' });
    });
  });

  describe('findOrCreate — 소셜 로그인', () => {
    const profile = {
      provider: 'kakao',
      providerId: '123',
      nickname: '카카오사용자',
      profileImage: null,
    };

    it('A3 회귀 방지 — 신규 유저의 isBanned가 undefined면 false로 보정한다', async () => {
      // 보정하지 않으면 issueToken의 정지 계정 차단이 무력화된다.
      userRepository.findOneBy.mockResolvedValue(null);
      userRepository.save.mockResolvedValue({
        id: 5,
        nickname: '카카오사용자',
        email: null,
        role: 'user',
        // isBanned 없음 (DB default라 인스턴스에 미반영)
      });

      const result = await service.findOrCreate(profile);

      expect(result.isBanned).toBe(false);
      expect(Object.keys(result).sort()).toEqual([
        'email',
        'id',
        'isBanned',
        'nickname',
        'role',
      ]);
    });

    it('동시 콜백 race(유니크 위반)면 먼저 생성된 유저를 재조회한다', async () => {
      userRepository.findOneBy.mockResolvedValue(null);
      userRepository.save.mockRejectedValue(dupError());
      userRepository.findOneByOrFail.mockResolvedValue({
        id: 7,
        nickname: '카카오사용자',
        email: null,
        role: 'user',
        isBanned: false,
      });

      const result = await service.findOrCreate(profile);

      expect(result.id).toBe(7);
      expect(userRepository.findOneByOrFail).toHaveBeenCalled();
    });
  });
});
