import {
  Controller,
  Post,
  Get,
  Body,
  Query,
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
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';

const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // 이메일 중복 확인 (회원가입 기본 정보 단계에서 다음으로 넘어갈 때 호출)
  @Get('check-email')
  async checkEmail(@Query('email') email: string) {
    const available = await this.authService.isEmailAvailable(email);
    return { available };
  }

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

  // 관리자 로그인 (이메일+비밀번호만, role이 admin인 계정만 허용)
  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  async adminLogin(@Body() dto: LoginDto) {
    const token = await this.authService.adminLogin(dto);
    return { token };
  }

  // 관리자 세션 확인
  @Get('admin/me')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getAdminMe(@Req() req: { user: User }) {
    const { id, nickname, email, role } = req.user;
    return { id, nickname, email, role };
  }

  // 카카오 소셜 로그인
  @Get('kakao')
  @UseGuards(AuthGuard('kakao'))
  kakaoLogin() {}

  @Get('kakao/callback')
  @UseGuards(AuthGuard('kakao'))
  kakaoCallback(@Req() req: { user: User }, @Res() res: any) {
    const token = this.authService.generateToken(req.user);
    res.redirect(`${FRONTEND_URL}/auth/callback#token=${token}`);
  }

  // 네이버 소셜 로그인
  @Get('naver')
  @UseGuards(AuthGuard('naver'))
  naverLogin() {}

  @Get('naver/callback')
  @UseGuards(AuthGuard('naver'))
  naverCallback(@Req() req: { user: User }, @Res() res: any) {
    const token = this.authService.generateToken(req.user);
    res.redirect(`${FRONTEND_URL}/auth/callback#token=${token}`);
  }
}
