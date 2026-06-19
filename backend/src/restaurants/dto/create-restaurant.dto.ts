import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

// Spring의 @RequestBody DTO + @Valid 역할
export class CreateRestaurantDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  memo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;
}
