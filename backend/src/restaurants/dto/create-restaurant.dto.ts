import { IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateRestaurantDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  photoUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;
}
