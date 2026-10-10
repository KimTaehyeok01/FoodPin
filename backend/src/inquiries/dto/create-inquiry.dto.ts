// 문의 등록 요청 DTO
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateInquiryDto {
  @ApiProperty({
    description: '문의 제목 (1~100자)',
    example: '핀이 지도에 안 보여요',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title: string;

  @ApiProperty({
    description: '문의 내용 (1~2000자)',
    example: '어제 등록한 핀이 지도에 표시되지 않습니다.',
    minLength: 1,
    maxLength: 2000,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content: string;
}
