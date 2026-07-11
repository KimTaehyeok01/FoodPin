// 관리자 전용 회원·식당·리뷰·문의 관리 서비스
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Restaurant } from '../restaurants/restaurant.entity';
import { Pin } from '../pins/pin.entity';
import { Inquiry } from '../inquiries/inquiry.entity';

const USER_LIST_SELECT = {
  id: true,
  provider: true,
  email: true,
  nickname: true,
  role: true,
  isBanned: true,
  createdAt: true,
} as const;

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Restaurant) private readonly restaurantRepo: Repository<Restaurant>,
    @InjectRepository(Pin) private readonly pinRepo: Repository<Pin>,
    @InjectRepository(Inquiry) private readonly inquiryRepo: Repository<Inquiry>,
  ) {}

  async getStats() {
    const [userCount, restaurantCount, pendingInquiryCount] = await Promise.all([
      this.userRepo.count(),
      this.restaurantRepo.count(),
      this.inquiryRepo.count({ where: { status: 'pending' } }),
    ]);
    return { userCount, restaurantCount, pendingInquiryCount };
  }

  // ── 회원관리 ──

  async getUsers(search?: string) {
    return this.userRepo.find({
      where: search
        ? [{ nickname: ILike(`%${search}%`) }, { email: ILike(`%${search}%`) }]
        : {},
      select: USER_LIST_SELECT,
      order: { createdAt: 'DESC' },
    });
  }

  async setUserBanned(id: number, banned: boolean): Promise<void> {
    const user = await this.userRepo.findOneBy({ id });
    if (!user) throw new NotFoundException('유저를 찾을 수 없습니다.');
    user.isBanned = banned;
    await this.userRepo.save(user);
  }

  async deleteUser(id: number): Promise<void> {
    const user = await this.userRepo.findOneBy({ id });
    if (!user) throw new NotFoundException('유저를 찾을 수 없습니다.');
    await this.userRepo.remove(user);
  }

  // ── 식당(앱) 관리 ──

  async getRestaurants(search?: string) {
    return this.restaurantRepo.find({
      where: search ? { name: ILike(`%${search}%`) } : {},
      order: { createdAt: 'DESC' },
    });
  }

  async deleteRestaurant(id: number): Promise<void> {
    const restaurant = await this.restaurantRepo.findOneBy({ id });
    if (!restaurant) throw new NotFoundException('식당을 찾을 수 없습니다.');
    await this.restaurantRepo.remove(restaurant);
  }

  // ── 리뷰(핀) 관리 ──

  async getPins() {
    return this.pinRepo.find({
      relations: { user: true, restaurant: true },
      select: {
        id: true,
        rating: true,
        memo: true,
        createdAt: true,
        user: { id: true, nickname: true },
        restaurant: { id: true, name: true },
      },
      order: { createdAt: 'DESC' },
    });
  }

  async deletePin(id: number): Promise<void> {
    const pin = await this.pinRepo.findOneBy({ id });
    if (!pin) throw new NotFoundException('리뷰를 찾을 수 없습니다.');
    await this.pinRepo.remove(pin);
  }

  // ── 문의 관리 ──

  async getInquiries() {
    return this.inquiryRepo.find({
      relations: { user: true },
      select: {
        id: true,
        title: true,
        content: true,
        status: true,
        answer: true,
        answeredAt: true,
        createdAt: true,
        user: { id: true, nickname: true, email: true },
      },
      order: { createdAt: 'DESC' },
    });
  }

  async answerInquiry(id: number, answer: string): Promise<Inquiry> {
    const inquiry = await this.inquiryRepo.findOneBy({ id });
    if (!inquiry) throw new NotFoundException('문의를 찾을 수 없습니다.');
    inquiry.answer = answer;
    inquiry.status = 'answered';
    inquiry.answeredAt = new Date();
    return this.inquiryRepo.save(inquiry);
  }
}
