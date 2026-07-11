// 회원 정지/해제 요청 DTO
import { IsBoolean } from 'class-validator';

export class BanUserDto {
  @IsBoolean()
  banned: boolean;
}
