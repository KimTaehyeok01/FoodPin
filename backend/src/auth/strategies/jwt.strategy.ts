import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/user.entity';

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

  async validate(payload: JwtPayload): Promise<User> {
    // password를 제외하고 조회 — req.user가 실수로 응답에 실려도 해시가 유출되지 않도록
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      select: {
        id: true,
        provider: true,
        providerId: true,
        email: true,
        name: true,
        nickname: true,
        profileImage: true,
        address: true,
        age: true,
        gender: true,
        role: true,
        isBanned: true,
        createdAt: true,
      },
    });
    if (!user) throw new UnauthorizedException();
    if (user.isBanned) throw new UnauthorizedException('정지된 계정입니다.');
    return user;
  }
}
