import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Spring의 @PreAuthorize 또는 SecurityFilterChain의 authenticated() 역할
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
