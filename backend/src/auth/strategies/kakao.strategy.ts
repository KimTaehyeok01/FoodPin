import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-kakao';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

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
    profile: any,
  ) {
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
