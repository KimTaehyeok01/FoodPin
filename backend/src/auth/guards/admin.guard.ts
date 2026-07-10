// JwtAuthGuard 통과 후 role이 admin인지 검사하는 가드
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { User } from '../../users/user.entity';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ user: User }>();
    if (req.user?.role !== 'admin') {
      throw new ForbiddenException('관리자 권한이 없습니다.');
    }
    return true;
  }
}
