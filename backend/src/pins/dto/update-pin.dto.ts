import { PartialType } from '@nestjs/mapped-types';
import { CreatePinDto } from './create-pin.dto';

// Spring의 @PatchMapping DTO — 모든 필드를 optional로 만들어줌
export class UpdatePinDto extends PartialType(CreatePinDto) {}
