import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Pin } from './pin.entity';
import { Restaurant } from '../restaurants/restaurant.entity';
import { CreatePinDto } from './dto/create-pin.dto';
import { UpdatePinDto } from './dto/update-pin.dto';

@Injectable()
export class PinsService {
  constructor(
    @InjectRepository(Pin)
    private readonly pinRepo: Repository<Pin>,
    @InjectRepository(Restaurant)
    private readonly restaurantRepo: Repository<Restaurant>,
  ) {}

  async getMyPins(userId: number): Promise<Pin[]> {
    return this.pinRepo.find({
      where: { userId },
      relations: { restaurant: true },
      order: { createdAt: 'DESC' },
    });
  }

  async getRestaurantPins(restaurantId: number): Promise<Pin[]> {
    return this.pinRepo.find({
      where: { restaurantId },
      relations: { user: true },
      select: {
        id: true,
        userId: true,
        restaurantId: true,
        rating: true,
        memo: true,
        createdAt: true,
        user: { id: true, nickname: true, profileImage: true },
      },
      order: { createdAt: 'DESC' },
    });
  }

  async pin(userId: number, restaurantId: number, dto: CreatePinDto): Promise<Pin> {
    const restaurant = await this.restaurantRepo.findOneBy({ id: restaurantId });
    if (!restaurant) throw new NotFoundException('식당을 찾을 수 없습니다.');

    const exists = await this.pinRepo.findOne({ where: { userId, restaurantId } });
    if (exists) throw new ConflictException('이미 핀한 식당입니다.');

    const pin = this.pinRepo.create({ userId, restaurantId, ...dto });
    try {
      return await this.pinRepo.save(pin);
    } catch (err) {
      // exists 체크와 save 사이 race: 유니크 제약 위반은 409로 변환
      if (this.isDuplicateError(err)) {
        throw new ConflictException('이미 핀한 식당입니다.');
      }
      throw err;
    }
  }

  async updatePin(userId: number, restaurantId: number, dto: UpdatePinDto): Promise<Pin> {
    const pin = await this.pinRepo.findOne({ where: { userId, restaurantId } });
    if (!pin) throw new NotFoundException('핀을 찾을 수 없습니다.');
    Object.assign(pin, dto);
    return this.pinRepo.save(pin);
  }

  async unpin(userId: number, restaurantId: number): Promise<void> {
    const pin = await this.pinRepo.findOne({ where: { userId, restaurantId } });
    if (!pin) throw new NotFoundException('핀을 찾을 수 없습니다.');
    await this.pinRepo.remove(pin);
  }

  async isPinned(userId: number, restaurantId: number): Promise<boolean> {
    const pin = await this.pinRepo.findOne({ where: { userId, restaurantId } });
    return !!pin;
  }

  // MySQL 유니크 제약 위반(ER_DUP_ENTRY) 여부 판별
  private isDuplicateError(err: unknown): boolean {
    return (
      err instanceof QueryFailedError &&
      (err.driverError as { code?: string })?.code === 'ER_DUP_ENTRY'
    );
  }
}
