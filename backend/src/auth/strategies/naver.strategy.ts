import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-naver-v2';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class NaverStrategy extends PassportStrategy(Strategy, 'naver') {
  constructor(
    config: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: config.get('NAVER_CLIENT_ID')!,
      clientSecret: config.get('NAVER_CLIENT_SECRET')!,
      callbackURL: config.get('NAVER_CALLBACK_URL')!,
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
  ) {
    const { id, displayName, profileImage } = profile;

    return this.authService.findOrCreate({
      provider: 'naver',
      providerId: String(id),
      nickname: displayName ?? '네이버사용자',
      profileImage: profileImage ?? null,
    });
  }
}
