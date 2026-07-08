// 유저 프로필 조회·수정 서비스
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

// password 등 민감 정보를 제외한 프로필 필드
const PROFILE_SELECT = {
  id: true,
  provider: true,
  email: true,
  nickname: true,
  profileImage: true,
  address: true,
  age: true,
  createdAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async getMe(userId: number): Promise<Partial<User>> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: PROFILE_SELECT,
    });
    if (!user) throw new NotFoundException('유저를 찾을 수 없습니다.');
    return user;
  }

  async updateProfile(
    userId: number,
    dto: UpdateProfileDto,
  ): Promise<Partial<User>> {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('유저를 찾을 수 없습니다.');
    Object.assign(user, dto);
    await this.userRepo.save(user);
    return this.getMe(userId);
  }
}
