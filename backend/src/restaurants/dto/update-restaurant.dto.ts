import { PartialType } from '@nestjs/mapped-types';
import { CreateRestaurantDto } from './create-restaurant.dto';

// Spring의 @PatchMapping DTO — 모든 필드를 optional로 만들어줌
export class UpdateRestaurantDto extends PartialType(CreateRestaurantDto) {}
