// 알림 조회 컨트롤러
import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  getNotifications(
    @Req() req: any,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('radius') radius?: string,
  ) {
    return this.notificationsService.getNotifications(
      req.user.id,
      lat != null ? Number(lat) : undefined,
      lng != null ? Number(lng) : undefined,
      radius != null ? Number(radius) : undefined,
    );
  }
}
