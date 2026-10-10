// 인증 API 엔드포인트 — 이메일 확인·회원가입·로그인·관리자 세션·소셜 로그인 콜백
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
import { ConfigService } from '@nestjs/config';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import {
  AdminMeResponse,
  EmailAvailabilityResponse,
  TokenResponse,
} from './dto/auth.response.dto';
import { AuthRequest } from '../common/types/auth-request';
import { ApiErrorResponses } from '../common/swagger/api-error-responses.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';

@ApiTags('1.인증')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  // 이메일 중복 확인 (회원가입 기본 정보 단계에서 다음으로 넘어갈 때 호출)
  @Get('check-email')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: '이메일 중복 확인' })
  @ApiQuery({
    name: 'email',
    description: '중복 여부를 확인할 이메일',
    example: 'hong@foodpin.com',
  })
  @ApiOkResponse({ type: EmailAvailabilityResponse })
  async checkEmail(
    @Query('email') email: string,
  ): Promise<EmailAvailabilityResponse> {
    const available = await this.authService.isEmailAvailable(email);
    return EmailAvailabilityResponse.from(available);
  }

  // 일반 회원가입
  @Post('register')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: '일반 회원가입' })
  @ApiCreatedResponse({ type: TokenResponse })
  @ApiErrorResponses(400, 409)
  async register(@Body() dto: RegisterDto): Promise<TokenResponse> {
    return this.authService.register(dto);
  }

  // 일반 로그인
  @Post('login')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '일반 로그인' })
  @ApiOkResponse({ type: TokenResponse })
  @ApiErrorResponses(400, 401)
  async login(@Body() dto: LoginDto): Promise<TokenResponse> {
    return this.authService.login(dto);
  }

  // 관리자 로그인 (이메일+비밀번호만, role이 admin인 계정만 허용)
  @Post('admin/login')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '관리자 로그인' })
  @ApiOkResponse({ type: TokenResponse })
  @ApiErrorResponses(400, 401)
  async adminLogin(@Body() dto: LoginDto): Promise<TokenResponse> {
    return this.authService.adminLogin(dto);
  }

  // 관리자 세션 확인
  @Get('admin/me')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '관리자 세션 확인' })
  @ApiOkResponse({ type: AdminMeResponse })
  @ApiErrorResponses(401, 403)
  getAdminMe(@Req() req: AuthRequest): AdminMeResponse {
    return AdminMeResponse.from(req.user);
  }

  // 카카오 소셜 로그인
  @Get('kakao')
  @UseGuards(AuthGuard('kakao'))
  @ApiOperation({ summary: '카카오 로그인 개시 (카카오 인증 화면으로 이동)' })
  @ApiFoundResponse({ description: '카카오 인증 페이지로 리다이렉트한다.' })
  kakaoLogin() {}

  @Get('kakao/callback')
  @UseGuards(AuthGuard('kakao'))
  @ApiOperation({
    summary: '카카오 로그인 콜백 (카카오 콘솔 등록 경로라 /v1 미적용)',
  })
  @ApiFoundResponse({
    description:
      '프런트 콜백 페이지로 토큰을 프래그먼트에 담아 리다이렉트한다.',
  })
  kakaoCallback(@Req() req: AuthRequest, @Res() res: Response) {
    const token = this.authService.issueToken(req.user);
    const frontendUrl =
      this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/callback#token=${token}`);
  }

  // 네이버 소셜 로그인
  @Get('naver')
  @UseGuards(AuthGuard('naver'))
  @ApiOperation({ summary: '네이버 로그인 개시 (네이버 인증 화면으로 이동)' })
  @ApiFoundResponse({ description: '네이버 인증 페이지로 리다이렉트한다.' })
  naverLogin() {}

  @Get('naver/callback')
  @UseGuards(AuthGuard('naver'))
  @ApiOperation({
    summary: '네이버 로그인 콜백 (네이버 콘솔 등록 경로라 /v1 미적용)',
  })
  @ApiFoundResponse({
    description:
      '프런트 콜백 페이지로 토큰을 프래그먼트에 담아 리다이렉트한다.',
  })
  naverCallback(@Req() req: AuthRequest, @Res() res: Response) {
    const token = this.authService.issueToken(req.user);
    const frontendUrl =
      this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/callback#token=${token}`);
  }
}
