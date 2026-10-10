// 식당 수정 요청 DTO — 등록 DTO의 모든 필드를 선택적으로 만든다
// PartialType은 @nestjs/swagger 판을 쓴다. mapped-types 판은 @ApiProperty 메타데이터를 상속시키지 않아
// Swagger 스키마가 빈 객체로 노출된다 (검증 동작은 두 구현이 동일하다).
import { PartialType } from '@nestjs/swagger';
import { CreateRestaurantDto } from './create-restaurant.dto';

export class UpdateRestaurantDto extends PartialType(CreateRestaurantDto) {}
