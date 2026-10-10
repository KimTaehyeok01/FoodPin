// 문의 답변 등록 요청 DTO
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class AnswerInquiryDto {
  @ApiProperty({
    description: '관리자 답변 내용',
    example: '캐시 문제였습니다. 새로고침 후 확인 부탁드립니다.',
    minLength: 1,
  })
  @IsString()
  @MinLength(1)
  answer: string;
}
