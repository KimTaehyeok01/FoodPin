import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/user.entity';
import { AuthUser } from '../../common/types/auth-request';

interface JwtPayload {
  sub: number;
}

// Spring Security의 JwtAuthenticationFilter 역할
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    // AuthUser가 소비하는 5필드만 조회 — 비밀번호 해시를 포함한 불필요한 PII를 요청 컨텍스트에 싣지 않는다
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      select: {
        id: true,
        nickname: true,
        email: true,
        role: true,
        isBanned: true,
      },
    });
    if (!user) throw new UnauthorizedException();
    if (user.isBanned) throw new UnauthorizedException('정지된 계정입니다.');

    return {
      id: user.id,
      nickname: user.nickname,
      email: user.email,
      role: user.role,
      isBanned: user.isBanned,
    };
  }
}
