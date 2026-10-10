// 핀(별점·메모) 조회·등록·수정·삭제를 담당하는 서비스
import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Pin } from './pin.entity';
import { Restaurant } from '../restaurants/restaurant.entity';
import { CreatePinDto } from './dto/create-pin.dto';
import { UpdatePinDto } from './dto/update-pin.dto';
import {
  MyPinResponse,
  PinResponse,
  RestaurantPinResponse,
} from './dto/pin.response.dto';

@Injectable()
export class PinsService {
  private readonly logger = new Logger(PinsService.name);

  constructor(
    @InjectRepository(Pin)
    private readonly pinRepo: Repository<Pin>,
    @InjectRepository(Restaurant)
    private readonly restaurantRepo: Repository<Restaurant>,
  ) {}

  async getMyPins(userId: number): Promise<MyPinResponse[]> {
    const pins = await this.pinRepo.find({
      where: { userId },
      relations: { restaurant: true },
      order: { createdAt: 'DESC' },
    });
    return MyPinResponse.fromList(pins);
  }

  async getRestaurantPins(
    restaurantId: number,
  ): Promise<RestaurantPinResponse[]> {
    const pins = await this.pinRepo.find({
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
    return RestaurantPinResponse.fromList(pins);
  }

  // 단일 INSERT라 트랜잭션을 열지 않는다. 동시 요청은 유니크 제약 + 409 변환으로 방어한다.
  async pin(
    userId: number,
    restaurantId: number,
    dto: CreatePinDto,
  ): Promise<PinResponse> {
    const restaurant = await this.restaurantRepo.findOneBy({
      id: restaurantId,
    });
    if (!restaurant) throw new NotFoundException('식당을 찾을 수 없습니다.');

    const exists = await this.pinRepo.findOne({
      where: { userId, restaurantId },
    });
    if (exists) throw new ConflictException('이미 핀한 식당입니다.');

    const pin = this.pinRepo.create({ userId, restaurantId, ...dto });
    try {
      const saved = await this.pinRepo.save(pin);
      this.logger.log(
        `핀 등록: userId=${userId}, restaurantId=${restaurantId}`,
      );
      return PinResponse.from(saved);
    } catch (err) {
      // exists 체크와 save 사이 race: 유니크 제약 위반은 409로 변환
      if (this.isDuplicateError(err)) {
        this.logger.warn(
          `핀 중복 race 감지: userId=${userId}, restaurantId=${restaurantId}`,
        );
        throw new ConflictException('이미 핀한 식당입니다.');
      }
      throw err;
    }
  }

  async updatePin(
    userId: number,
    restaurantId: number,
    dto: UpdatePinDto,
  ): Promise<PinResponse> {
    const pin = await this.findMyPinOrFail(userId, restaurantId);
    Object.assign(pin, dto);
    const saved = await this.pinRepo.save(pin);
    this.logger.log(`핀 수정: userId=${userId}, restaurantId=${restaurantId}`);
    return PinResponse.from(saved);
  }

  async unpin(userId: number, restaurantId: number): Promise<void> {
    const pin = await this.findMyPinOrFail(userId, restaurantId);
    await this.pinRepo.remove(pin);
    this.logger.log(`핀 삭제: userId=${userId}, restaurantId=${restaurantId}`);
  }

  async isPinned(userId: number, restaurantId: number): Promise<boolean> {
    const pin = await this.pinRepo.findOne({
      where: { userId, restaurantId },
    });
    return !!pin;
  }

  // Entity를 다루는 조회는 서비스 내부에만 노출한다. updatePin·unpin이 재사용한다.
  private async findMyPinOrFail(
    userId: number,
    restaurantId: number,
  ): Promise<Pin> {
    const pin = await this.pinRepo.findOne({
      where: { userId, restaurantId },
    });
    if (!pin) throw new NotFoundException('핀을 찾을 수 없습니다.');
    return pin;
  }

  // MySQL 유니크 제약 위반(ER_DUP_ENTRY) 여부 판별
  private isDuplicateError(err: unknown): boolean {
    return (
      err instanceof QueryFailedError &&
      (err.driverError as { code?: string })?.code === 'ER_DUP_ENTRY'
    );
  }
}
