// 알림 조회 API 엔드포인트 — 인증 필요
import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { NotificationResponse } from './dto/notification.response.dto';
import { AuthRequest } from '../common/types/auth-request';
import { ApiErrorResponses } from '../common/swagger/api-error-responses.decorator';

@ApiTags('5.알림')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({
    summary: '알림 목록 조회 (내 핀 식당의 새 리뷰 + 근처 새 맛집)',
  })
  @ApiQuery({
    name: 'lat',
    required: false,
    description: '현재 위치 위도. 생략하면 근처 새 맛집 알림이 빠진다.',
    example: '37.3670',
  })
  @ApiQuery({
    name: 'lng',
    required: false,
    description: '현재 위치 경도',
    example: '127.1080',
  })
  @ApiQuery({
    name: 'radius',
    required: false,
    description: '반경 (km). 생략 시 5km',
    example: '5',
  })
  @ApiOkResponse({ type: [NotificationResponse] })
  @ApiErrorResponses(401)
  getNotifications(
    @Req() req: AuthRequest,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('radius') radius?: string,
  ): Promise<NotificationResponse[]> {
    return this.notificationsService.getNotifications(
      req.user.id,
      lat != null ? Number(lat) : undefined,
      lng != null ? Number(lng) : undefined,
      radius != null ? Number(radius) : undefined,
    );
  }
}
