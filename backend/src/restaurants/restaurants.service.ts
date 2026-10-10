// 식당 조회·등록·수정·삭제와 소유권 검사를 담당하는 서비스
import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Restaurant } from './restaurant.entity';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import {
  RestaurantDetailResponse,
  RestaurantResponse,
} from './dto/restaurant.response.dto';
import { AuthUser } from '../common/types/auth-request';

@Injectable()
export class RestaurantsService {
  private readonly logger = new Logger(RestaurantsService.name);

  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurantRepo: Repository<Restaurant>,
  ) {}

  async findAll(): Promise<RestaurantResponse[]> {
    const restaurants = await this.restaurantRepo.find({
      order: { createdAt: 'DESC' },
    });
    return RestaurantResponse.fromList(restaurants);
  }

  async findOne(id: number): Promise<RestaurantDetailResponse> {
    return RestaurantDetailResponse.from(await this.findEntityOrFail(id));
  }

  // 단일 INSERT라 트랜잭션을 열지 않는다 (TypeORM autocommit으로 원자적).
  async create(
    dto: CreateRestaurantDto,
    userId: number,
  ): Promise<RestaurantResponse> {
    const saved = await this.restaurantRepo.save(
      this.restaurantRepo.create({ ...dto, userId }),
    );
    this.logger.log(`식당 등록: restaurantId=${saved.id}, actorId=${userId}`);
    return RestaurantResponse.from(saved);
  }

  async update(
    id: number,
    actor: AuthUser,
    dto: UpdateRestaurantDto,
  ): Promise<RestaurantDetailResponse> {
    const restaurant = await this.findEntityOrFail(id);
    this.assertCanModify(restaurant, actor, '수정 권한이 없습니다.');
    Object.assign(restaurant, dto);
    // save()는 전달한 엔티티를 그대로 돌려주므로 로드된 menus가 유지된다 (상세 응답과 동일 shape).
    const saved = await this.restaurantRepo.save(restaurant);
    this.logger.log(`식당 수정: restaurantId=${id}, actorId=${actor.id}`);
    return RestaurantDetailResponse.from(saved);
  }

  async remove(id: number, actor: AuthUser): Promise<void> {
    const restaurant = await this.findEntityOrFail(id);
    this.assertCanModify(restaurant, actor, '삭제 권한이 없습니다.');
    await this.restaurantRepo.remove(restaurant);
    this.logger.log(`식당 삭제: restaurantId=${id}, actorId=${actor.id}`);
  }

  // Entity를 다루는 조회는 서비스 내부에만 노출한다. update·remove가 소유권 검사에 재사용한다.
  private async findEntityOrFail(id: number): Promise<Restaurant> {
    const restaurant = await this.restaurantRepo.findOne({
      where: { id },
      relations: { menus: true },
      order: { menus: { id: 'ASC' } },
    });
    if (!restaurant) throw new NotFoundException('식당을 찾을 수 없습니다.');
    return restaurant;
  }

  // 소유자 본인만 수정·삭제 가능. 소유자 없는(시드) 식당은 관리자만 가능
  private assertCanModify(
    restaurant: Restaurant,
    actor: AuthUser,
    message: string,
  ): void {
    const allowed =
      restaurant.userId === null
        ? actor.role === 'admin'
        : restaurant.userId === actor.id;
    if (!allowed) throw new ForbiddenException(message);
  }
}
