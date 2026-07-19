import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Restaurant } from './restaurant.entity';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { User } from '../users/user.entity';

@Injectable()
export class RestaurantsService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurantRepo: Repository<Restaurant>,
  ) {}

  findAll(): Promise<Restaurant[]> {
    return this.restaurantRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: number): Promise<Restaurant> {
    const restaurant = await this.restaurantRepo.findOne({
      where: { id },
      relations: { menus: true },
      order: { menus: { id: 'ASC' } },
    });
    if (!restaurant) throw new NotFoundException('식당을 찾을 수 없습니다.');
    return restaurant;
  }

  create(dto: CreateRestaurantDto, userId: number): Promise<Restaurant> {
    const restaurant = this.restaurantRepo.create({ ...dto, userId });
    return this.restaurantRepo.save(restaurant);
  }

  async update(id: number, user: User, dto: UpdateRestaurantDto): Promise<Restaurant> {
    const restaurant = await this.findOne(id);
    this.assertCanModify(restaurant, user, '수정 권한이 없습니다.');
    Object.assign(restaurant, dto);
    return this.restaurantRepo.save(restaurant);
  }

  async remove(id: number, user: User): Promise<void> {
    const restaurant = await this.findOne(id);
    this.assertCanModify(restaurant, user, '삭제 권한이 없습니다.');
    await this.restaurantRepo.remove(restaurant);
  }

  // 소유자 본인만 수정·삭제 가능. 소유자 없는(시드) 식당은 관리자만 가능
  private assertCanModify(restaurant: Restaurant, user: User, message: string): void {
    const allowed =
      restaurant.userId === null ? user.role === 'admin' : restaurant.userId === user.id;
    if (!allowed) throw new ForbiddenException(message);
  }
}
