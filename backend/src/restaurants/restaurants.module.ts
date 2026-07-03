import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from './restaurant.entity';
import { RestaurantMenu } from './restaurant-menu.entity';
import { RestaurantsController } from './restaurants.controller';
import { RestaurantsService } from './restaurants.service';

// Spring의 @Configuration + @ComponentScan 역할
@Module({
  imports: [TypeOrmModule.forFeature([Restaurant, RestaurantMenu])],
  controllers: [RestaurantsController],
  providers: [RestaurantsService],
})
export class RestaurantsModule {}
