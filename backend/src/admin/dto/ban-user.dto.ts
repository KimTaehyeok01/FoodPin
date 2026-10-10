// 회원 정지/해제 요청 DTO
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class BanUserDto {
  @ApiProperty({
    description: '정지 여부. true면 정지, false면 해제.',
    example: true,
  })
  @IsBoolean()
  banned: boolean;
}
