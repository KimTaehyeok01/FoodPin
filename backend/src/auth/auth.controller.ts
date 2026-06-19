import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '../users/user.entity';

const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // 일반 회원가입
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const user = await this.authService.register(dto);
    const token = this.authService.generateToken(user);
    return { token };
  }

  // 일반 로그인
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    const token = await this.authService.login(dto);
    return { token };
  }

  // 카카오 소셜 로그인
  @Get('kakao')
  @UseGuards(AuthGuard('kakao'))
  kakaoLogin() {}

  @Get('kakao/callback')
  @UseGuards(AuthGuard('kakao'))
  kakaoCallback(@Req() req: { user: User }, @Res() res: any) {
    const token = this.authService.generateToken(req.user);
    res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);
  }

  // 네이버 소셜 로그인
  @Get('naver')
  @UseGuards(AuthGuard('naver'))
  naverLogin() {}

  @Get('naver/callback')
  @UseGuards(AuthGuard('naver'))
  naverCallback(@Req() req: { user: User }, @Res() res: any) {
    const token = this.authService.generateToken(req.user);
    res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);
  }
}
