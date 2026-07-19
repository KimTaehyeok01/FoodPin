import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity';
import { UserFavoriteCategory } from '../users/user-favorite-category.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

interface SocialProfile {
  provider: string;
  providerId: string;
  nickname: string;
  profileImage: string | null;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserFavoriteCategory)
    private readonly favCategoryRepo: Repository<UserFavoriteCategory>,
    private readonly jwtService: JwtService,
  ) {}

  // 소셜 로그인: 없으면 생성, 있으면 조회
  async findOrCreate(profile: SocialProfile): Promise<User> {
    let user = await this.userRepository.findOneBy({
      provider: profile.provider,
      providerId: profile.providerId,
    });
    if (!user) {
      try {
        user = await this.userRepository.save(
          this.userRepository.create({
            ...profile,
            email: null,
            password: null,
          }),
        );
      } catch (err) {
        // 동시 콜백 race: 유니크 제약에 걸리면 먼저 생성된 유저를 재조회
        if (!this.isDuplicateError(err)) throw err;
        user = await this.userRepository.findOneByOrFail({
          provider: profile.provider,
          providerId: profile.providerId,
        });
      }
    }
    return user;
  }

  // 이메일 중복 여부 확인 (회원가입 1단계에서 사용)
  async isEmailAvailable(email: string): Promise<boolean> {
    if (!email) return false;
    const exists = await this.userRepository.findOneBy({ email });
    return !exists;
  }

  // 일반 회원가입
  async register(dto: RegisterDto): Promise<User> {
    const exists = await this.userRepository.findOneBy({ email: dto.email });
    if (exists) throw new ConflictException('이미 사용 중인 이메일입니다.');

    const hashed = await bcrypt.hash(dto.password, 10);
    let user: User;
    try {
      user = await this.userRepository.save(
        this.userRepository.create({
          email: dto.email,
          password: hashed,
          name: dto.name,
          nickname: dto.nickname,
          address: dto.address,
          age: dto.age,
          gender: dto.gender,
          provider: null,
          providerId: null,
          profileImage: null,
        }),
      );
    } catch (err) {
      // check-email과 register 사이 race: 이메일 유니크 위반은 409로 변환
      if (this.isDuplicateError(err)) {
        throw new ConflictException('이미 사용 중인 이메일입니다.');
      }
      throw err;
    }

    if (dto.favoriteCategories?.length) {
      await this.favCategoryRepo.save(
        dto.favoriteCategories.map((category) =>
          this.favCategoryRepo.create({ userId: user.id, category }),
        ),
      );
    }

    return user;
  }

  // 일반 로그인
  async login(dto: LoginDto): Promise<string> {
    const user = await this.userRepository.findOneBy({ email: dto.email });
    if (!user || !user.password) throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');

    return this.generateToken(user);
  }

  // 관리자 로그인 — 이메일+비밀번호 검증은 일반 로그인과 동일하되, role이 admin인 계정만 허용
  async adminLogin(dto: LoginDto): Promise<string> {
    const user = await this.userRepository.findOneBy({ email: dto.email });
    if (!user || !user.password) throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');

    if (user.role !== 'admin') throw new UnauthorizedException('관리자 권한이 없습니다.');

    return this.generateToken(user);
  }

  // 모든 로그인 경로(일반·관리자·소셜)의 토큰 발급 전 정지 여부를 일괄 차단
  generateToken(user: User): string {
    if (user.isBanned) throw new UnauthorizedException('정지된 계정입니다.');
    return this.jwtService.sign({ sub: user.id });
  }

  // MySQL 유니크 제약 위반(ER_DUP_ENTRY) 여부 판별
  private isDuplicateError(err: unknown): boolean {
    return (
      err instanceof QueryFailedError &&
      (err.driverError as { code?: string })?.code === 'ER_DUP_ENTRY'
    );
  }
}
