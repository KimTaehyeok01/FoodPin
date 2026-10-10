// 카카오 OAuth2 프로필로 유저를 조회·생성하고 인증 주체(AuthUser)를 반환하는 Passport 전략
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-kakao';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { AuthUser } from '../../common/types/auth-request';

// passport-kakao가 넘겨주는 프로필 중 실제로 소비하는 필드만 선언한다.
// 라이브러리 타입이 any라 여기서 좁히지 않으면 호출부 전체가 unsafe로 번진다.
interface KakaoProfile {
  id: number | string;
  username?: string;
  _json?: {
    kakao_account?: {
      profile?: {
        profile_image_url?: string;
      };
    };
  };
}

// Spring Security의 OAuth2UserService 역할
@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor(
    config: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: config.get('KAKAO_CLIENT_ID')!,
      clientSecret: config.get('KAKAO_CLIENT_SECRET')!,
      callbackURL: config.get('KAKAO_CALLBACK_URL')!,
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: KakaoProfile,
  ): Promise<AuthUser> {
    const { id, username, _json } = profile;
    const profileImage =
      _json?.kakao_account?.profile?.profile_image_url ?? null;

    return this.authService.findOrCreate({
      provider: 'kakao',
      providerId: String(id),
      nickname: username ?? '카카오사용자',
      profileImage,
    });
  }
}
