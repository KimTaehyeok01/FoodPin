// 관리자 전용 회원·식당·리뷰·문의 관리 서비스
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Restaurant } from '../restaurants/restaurant.entity';
import { Pin } from '../pins/pin.entity';
import { Inquiry } from '../inquiries/inquiry.entity';
import { RestaurantResponse } from '../restaurants/dto/restaurant.response.dto';
import { InquiryResponse } from '../inquiries/dto/inquiry.response.dto';
import {
  AdminInquiryListResponse,
  AdminPinResponse,
  AdminStatsResponse,
  AdminUserResponse,
} from './dto/admin.response.dto';
import { maskEmail } from '../common/utils/mask.util';

const USER_LIST_SELECT = {
  id: true,
  provider: true,
  email: true,
  nickname: true,
  role: true,
  isBanned: true,
  createdAt: true,
} as const;

// 자체 엔티티가 없는 집계 전용 도메인이라 타 도메인 Repository를 직접 주입한다.
// 반환은 반드시 Response DTO로 감싸 Entity가 컨트롤러 밖으로 새지 않게 한다.
@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Restaurant)
    private readonly restaurantRepo: Repository<Restaurant>,
    @InjectRepository(Pin) private readonly pinRepo: Repository<Pin>,
    @InjectRepository(Inquiry)
    private readonly inquiryRepo: Repository<Inquiry>,
  ) {}

  async getStats(): Promise<AdminStatsResponse> {
    const [userCount, restaurantCount, pendingInquiryCount] = await Promise.all(
      [
        this.userRepo.count(),
        this.restaurantRepo.count(),
        this.inquiryRepo.count({ where: { status: 'pending' } }),
      ],
    );
    return { userCount, restaurantCount, pendingInquiryCount };
  }

  // ── 회원관리 ──

  async getUsers(search?: string): Promise<AdminUserResponse[]> {
    const users = await this.userRepo.find({
      where: search
        ? [{ nickname: ILike(`%${search}%`) }, { email: ILike(`%${search}%`) }]
        : {},
      select: USER_LIST_SELECT,
      order: { createdAt: 'DESC' },
    });
    return AdminUserResponse.fromList(users);
  }

  async setUserBanned(id: number, banned: boolean): Promise<void> {
    const user = await this.findUserOrFail(id);
    user.isBanned = banned;
    await this.userRepo.save(user);
    this.logger.log(
      `회원 정지 상태 변경: userId=${id}, banned=${banned}, email=${maskEmail(user.email)}`,
    );
  }

  async deleteUser(id: number): Promise<void> {
    const user = await this.findUserOrFail(id);
    await this.userRepo.remove(user);
    this.logger.log(`회원 삭제: userId=${id}, email=${maskEmail(user.email)}`);
  }

  // ── 식당(앱) 관리 ──

  async getRestaurants(search?: string): Promise<RestaurantResponse[]> {
    const restaurants = await this.restaurantRepo.find({
      where: search ? { name: ILike(`%${search}%`) } : {},
      order: { createdAt: 'DESC' },
    });
    return RestaurantResponse.fromList(restaurants);
  }

  async deleteRestaurant(id: number): Promise<void> {
    const restaurant = await this.restaurantRepo.findOneBy({ id });
    if (!restaurant) throw new NotFoundException('식당을 찾을 수 없습니다.');
    await this.restaurantRepo.remove(restaurant);
    this.logger.log(`식당 삭제(관리자): restaurantId=${id}`);
  }

  // ── 리뷰(핀) 관리 ──

  async getPins(): Promise<AdminPinResponse[]> {
    const pins = await this.pinRepo.find({
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
    return AdminPinResponse.fromList(pins);
  }

  async deletePin(id: number): Promise<void> {
    const pin = await this.pinRepo.findOneBy({ id });
    if (!pin) throw new NotFoundException('리뷰를 찾을 수 없습니다.');
    await this.pinRepo.remove(pin);
    this.logger.log(`리뷰 삭제(관리자): pinId=${id}`);
  }

  // ── 문의 관리 ──

  async getInquiries(): Promise<AdminInquiryListResponse[]> {
    const inquiries = await this.inquiryRepo.find({
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
    return AdminInquiryListResponse.fromList(inquiries);
  }

  async answerInquiry(id: number, answer: string): Promise<InquiryResponse> {
    const inquiry = await this.inquiryRepo.findOneBy({ id });
    if (!inquiry) throw new NotFoundException('문의를 찾을 수 없습니다.');
    inquiry.answer = answer;
    inquiry.status = 'answered';
    inquiry.answeredAt = new Date();
    const saved = await this.inquiryRepo.save(inquiry);
    this.logger.log(`문의 답변 등록: inquiryId=${id}`);
    return InquiryResponse.from(saved);
  }

  // Entity를 다루는 조회는 서비스 내부에만 노출한다.
  private async findUserOrFail(id: number): Promise<User> {
    const user = await this.userRepo.findOneBy({ id });
    if (!user) throw new NotFoundException('유저를 찾을 수 없습니다.');
    return user;
  }
}
