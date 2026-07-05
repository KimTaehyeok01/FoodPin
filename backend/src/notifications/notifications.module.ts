// 알림 모듈
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from '../restaurants/restaurant.entity';
import { Pin } from '../pins/pin.entity';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [TypeOrmModule.forFeature([Restaurant, Pin])],
  controllers: [NotificationsController],
  providers: [NotificationsService],
})
export class NotificationsModule {}
