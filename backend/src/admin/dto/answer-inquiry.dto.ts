// 문의 답변 등록 요청 DTO
import { IsString, MinLength } from 'class-validator';

export class AnswerInquiryDto {
  @IsString()
  @MinLength(1)
  answer: string;
}
