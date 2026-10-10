// 유저 프로필 조회·수정 서비스
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from './user.entity';
import { UserFavoriteCategory } from './user-favorite-category.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserProfileResponse } from './dto/user.response.dto';

// password 등 민감 정보를 제외한 프로필 필드
const PROFILE_SELECT = {
  id: true,
  provider: true,
  email: true,
  name: true,
  nickname: true,
  profileImage: true,
  address: true,
  age: true,
  gender: true,
  createdAt: true,
} as const;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserFavoriteCategory)
    private readonly favCategoryRepo: Repository<UserFavoriteCategory>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async getMe(userId: number): Promise<UserProfileResponse> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: PROFILE_SELECT,
    });
    if (!user) throw new NotFoundException('유저를 찾을 수 없습니다.');
    const categories = await this.favCategoryRepo.find({ where: { userId } });
    return UserProfileResponse.from(
      user,
      categories.map((c) => c.category),
    );
  }

  async updateProfile(
    userId: number,
    dto: UpdateProfileDto,
  ): Promise<UserProfileResponse> {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('유저를 찾을 수 없습니다.');

    const { favoriteCategories, ...fields } = dto;
    Object.assign(user, fields);

    // 프로필 저장과 선호 카테고리 교체(delete + insert)를 한 트랜잭션으로 묶는다.
    // 분리하면 delete 성공 후 insert 실패 시 선호 카테고리가 전량 소실된다.
    // 콜백 안에서는 반드시 manager.getRepository를 쓴다 — 주입된 Repository는 트랜잭션 밖 커넥션이다.
    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(User).save(user);

      // 미지정(undefined/null)이면 카테고리를 건드리지 않는 부분 수정 시맨틱,
      // 빈 배열이면 전량 삭제. 현행 truthy 판정을 그대로 유지한다.
      if (favoriteCategories) {
        const favCategoryRepo = manager.getRepository(UserFavoriteCategory);
        await favCategoryRepo.delete({ userId });
        if (favoriteCategories.length) {
          await favCategoryRepo.save(
            favoriteCategories.map((category) =>
              favCategoryRepo.create({ userId, category }),
            ),
          );
        }
      }
    });

    this.logger.log(`프로필 수정 완료: userId=${userId}`);

    // 반드시 트랜잭션 콜백 밖(커밋 이후)에서 조회한다.
    // 콜백 안에서 부르면 getMe가 별도 커넥션을 써서 미커밋 데이터를 못 읽고 카테고리가 빈 배열로 응답된다.
    return this.getMe(userId);
  }
}
