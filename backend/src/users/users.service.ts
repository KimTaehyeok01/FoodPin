// 유저 프로필 조회·수정 서비스
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { UserFavoriteCategory } from './user-favorite-category.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

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

// User의 favoriteCategories(관계 엔티티 배열)를 카테고리 이름 배열로 바꿔서 응답한다
type UserProfileResult = Omit<Partial<User>, 'favoriteCategories'> & {
  favoriteCategories: string[];
};

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserFavoriteCategory)
    private readonly favCategoryRepo: Repository<UserFavoriteCategory>,
  ) {}

  async getMe(userId: number): Promise<UserProfileResult> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: PROFILE_SELECT,
    });
    if (!user) throw new NotFoundException('유저를 찾을 수 없습니다.');
    const categories = await this.favCategoryRepo.find({ where: { userId } });
    return { ...user, favoriteCategories: categories.map((c) => c.category) };
  }

  async updateProfile(
    userId: number,
    dto: UpdateProfileDto,
  ): Promise<UserProfileResult> {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('유저를 찾을 수 없습니다.');

    const { favoriteCategories, ...fields } = dto;
    Object.assign(user, fields);
    await this.userRepo.save(user);

    if (favoriteCategories) {
      await this.favCategoryRepo.delete({ userId });
      if (favoriteCategories.length) {
        await this.favCategoryRepo.save(
          favoriteCategories.map((category) =>
            this.favCategoryRepo.create({ userId, category }),
          ),
        );
      }
    }

    return this.getMe(userId);
  }
}
