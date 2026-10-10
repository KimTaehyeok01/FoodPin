// 일반·관리자 로그인 요청 DTO
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: '가입 이메일', example: 'hong@foodpin.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: '비밀번호', example: 'foodpin1234' })
  @IsString()
  password: string;
}
