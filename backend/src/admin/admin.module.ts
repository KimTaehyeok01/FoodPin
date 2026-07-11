// 관리자 모듈
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Restaurant } from '../restaurants/restaurant.entity';
import { Pin } from '../pins/pin.entity';
import { Inquiry } from '../inquiries/inquiry.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Restaurant, Pin, Inquiry])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
