// 네이버 OAuth2 프로필로 유저를 조회·생성하고 인증 주체(AuthUser)를 반환하는 Passport 전략
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-naver-v2';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { AuthUser } from '../../common/types/auth-request';

// passport-naver-v2가 넘겨주는 프로필 중 실제로 소비하는 필드만 선언한다.
// 라이브러리 타입이 any라 여기서 좁히지 않으면 호출부 전체가 unsafe로 번진다.
interface NaverProfile {
  id: number | string;
  displayName?: string;
  profileImage?: string;
}

@Injectable()
export class NaverStrategy extends PassportStrategy(Strategy, 'naver') {
  constructor(
    config: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: config.get<string>('NAVER_CLIENT_ID')!,
      clientSecret: config.get<string>('NAVER_CLIENT_SECRET')!,
      callbackURL: config.get<string>('NAVER_CALLBACK_URL')!,
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: NaverProfile,
  ): Promise<AuthUser> {
    const { id, displayName, profileImage } = profile;

    return this.authService.findOrCreate({
      provider: 'naver',
      providerId: String(id),
      nickname: displayName ?? '네이버사용자',
      profileImage: profileImage ?? null,
    });
  }
}
