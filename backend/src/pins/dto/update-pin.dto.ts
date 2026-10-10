// 핀 수정 요청 DTO — 등록 DTO의 모든 필드를 선택적으로 만든다
import { PartialType } from '@nestjs/swagger';
import { CreatePinDto } from './create-pin.dto';

// @nestjs/swagger의 PartialType을 쓴다 — mapped-types 판은 @ApiProperty 메타데이터를
// 상속하지 않아 Swagger 스키마가 빈 객체로 나온다. 검증 동작은 두 구현이 동일하다.
export class UpdatePinDto extends PartialType(CreatePinDto) {}
