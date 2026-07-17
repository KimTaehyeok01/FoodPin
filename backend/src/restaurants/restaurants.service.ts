import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Restaurant } from './restaurant.entity';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';

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

  async update(id: number, userId: number, dto: UpdateRestaurantDto): Promise<Restaurant> {
    const restaurant = await this.findOne(id);
    if (restaurant.userId !== null && restaurant.userId !== userId) {
      throw new ForbiddenException('수정 권한이 없습니다.');
    }
    Object.assign(restaurant, dto);
    return this.restaurantRepo.save(restaurant);
  }

  async remove(id: number, userId: number): Promise<void> {
    const restaurant = await this.findOne(id);
    if (restaurant.userId !== null && restaurant.userId !== userId) {
      throw new ForbiddenException('삭제 권한이 없습니다.');
    }
    await this.restaurantRepo.remove(restaurant);
  }
}
