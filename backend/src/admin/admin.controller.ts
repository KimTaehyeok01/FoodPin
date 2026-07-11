// 관리자 전용 엔드포인트 — 회원·식당·리뷰·문의 관리
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AdminService } from './admin.service';
import { BanUserDto } from './dto/ban-user.dto';
import { AnswerInquiryDto } from './dto/answer-inquiry.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Get('users')
  getUsers(@Query('search') search?: string) {
    return this.adminService.getUsers(search);
  }

  @Patch('users/:id/ban')
  setUserBanned(@Param('id', ParseIntPipe) id: number, @Body() dto: BanUserDto) {
    return this.adminService.setUserBanned(id, dto.banned);
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteUser(id);
  }

  @Get('restaurants')
  getRestaurants(@Query('search') search?: string) {
    return this.adminService.getRestaurants(search);
  }

  @Delete('restaurants/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteRestaurant(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteRestaurant(id);
  }

  @Get('pins')
  getPins() {
    return this.adminService.getPins();
  }

  @Delete('pins/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deletePin(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deletePin(id);
  }

  @Get('inquiries')
  getInquiries() {
    return this.adminService.getInquiries();
  }

  @Patch('inquiries/:id/answer')
  answerInquiry(@Param('id', ParseIntPipe) id: number, @Body() dto: AnswerInquiryDto) {
    return this.adminService.answerInquiry(id, dto.answer);
  }
}
