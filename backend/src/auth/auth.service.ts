// 회원가입·로그인·소셜 계정 연결과 JWT 발급을 담당하는 인증 서비스
import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity';
import { UserFavoriteCategory } from '../users/user-favorite-category.entity';
import { AuthUser } from '../common/types/auth-request';
import { maskEmail } from '../common/utils/mask.util';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { TokenResponse } from './dto/auth.response.dto';

interface SocialProfile {
  provider: string;
  providerId: string;
  nickname: string;
  profileImage: string | null;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
  ) {}

  // 소셜 로그인: 없으면 생성, 있으면 조회
  async findOrCreate(profile: SocialProfile): Promise<AuthUser> {
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

    return {
      id: user.id,
      nickname: user.nickname,
      email: user.email,
      role: user.role,
      // 신규 생성 유저는 DB default라 인스턴스 프로퍼티가 undefined일 수 있다.
      // 보정하지 않으면 토큰 발급 시 정지 계정 차단이 무력화된다.
      isBanned: user.isBanned ?? false,
    };
  }

  // 이메일 중복 여부 확인 (회원가입 1단계에서 사용)
  async isEmailAvailable(email: string): Promise<boolean> {
    if (!email) return false;
    const exists = await this.userRepository.findOneBy({ email });
    return !exists;
  }

  // 일반 회원가입
  async register(dto: RegisterDto): Promise<TokenResponse> {
    const exists = await this.userRepository.findOneBy({ email: dto.email });
    if (exists) throw new ConflictException('이미 사용 중인 이메일입니다.');

    // 해싱은 CPU를 100ms 급으로 점유한다. 트랜잭션 안에서 돌리면 그동안 DB 커넥션이 묶인다.
    const hashed = await bcrypt.hash(dto.password, 10);

    let user: User;
    try {
      // 유저와 선호 카테고리를 한 트랜잭션으로 묶는다.
      // 콜백 안에서는 반드시 manager.getRepository를 쓴다 — 주입된 Repository는 트랜잭션 밖 커넥션이다.
      user = await this.dataSource.transaction(async (manager) => {
        const userRepo = manager.getRepository(User);
        const saved = await userRepo.save(
          userRepo.create({
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

        if (dto.favoriteCategories?.length) {
          const favCategoryRepo = manager.getRepository(UserFavoriteCategory);
          await favCategoryRepo.save(
            dto.favoriteCategories.map((category) =>
              favCategoryRepo.create({ userId: saved.id, category }),
            ),
          );
        }

        return saved;
      });
    } catch (err) {
      // check-email과 register 사이 race: 이메일 유니크 위반은 409로 변환
      if (this.isDuplicateError(err)) {
        throw new ConflictException('이미 사용 중인 이메일입니다.');
      }
      throw err;
    }

    this.logger.log(`회원가입 완료: userId=${user.id}`);
    return TokenResponse.from(this.issueToken(user));
  }

  // 일반 로그인
  async login(dto: LoginDto): Promise<TokenResponse> {
    const user = await this.userRepository.findOneBy({ email: dto.email });
    // 소셜 가입 계정은 password가 null이라 비밀번호 로그인을 허용하지 않는다
    if (!user || !user.password) {
      this.logger.warn(
        `로그인 실패(계정 없음 또는 소셜 계정): email=${maskEmail(dto.email)}`,
      );
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 올바르지 않습니다.',
      );
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      this.logger.warn(`로그인 실패(비밀번호 불일치): userId=${user.id}`);
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 올바르지 않습니다.',
      );
    }

    return TokenResponse.from(this.issueToken(user));
  }

  // 관리자 로그인 — 이메일+비밀번호 검증은 일반 로그인과 동일하되, role이 admin인 계정만 허용
  async adminLogin(dto: LoginDto): Promise<TokenResponse> {
    const user = await this.userRepository.findOneBy({ email: dto.email });
    if (!user || !user.password) {
      this.logger.warn(
        `관리자 로그인 실패(계정 없음): email=${maskEmail(dto.email)}`,
      );
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 올바르지 않습니다.',
      );
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      this.logger.warn(
        `관리자 로그인 실패(비밀번호 불일치): userId=${user.id}`,
      );
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 올바르지 않습니다.',
      );
    }

    if (user.role !== 'admin') {
      this.logger.warn(`관리자 로그인 거부(권한 없음): userId=${user.id}`);
      throw new UnauthorizedException('관리자 권한이 없습니다.');
    }

    return TokenResponse.from(this.issueToken(user));
  }

  // 모든 로그인 경로(일반·관리자·소셜)의 토큰 발급 전 정지 여부를 일괄 차단
  issueToken(user: AuthUser): string {
    if (user.isBanned) {
      this.logger.warn(`정지 계정 토큰 발급 차단: userId=${user.id}`);
      throw new UnauthorizedException('정지된 계정입니다.');
    }
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
