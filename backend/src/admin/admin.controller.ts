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
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AdminService } from './admin.service';
import { BanUserDto } from './dto/ban-user.dto';
import { AnswerInquiryDto } from './dto/answer-inquiry.dto';
import {
  AdminInquiryListResponse,
  AdminPinResponse,
  AdminStatsResponse,
  AdminUserResponse,
} from './dto/admin.response.dto';
import { RestaurantResponse } from '../restaurants/dto/restaurant.response.dto';
import { InquiryResponse } from '../inquiries/dto/inquiry.response.dto';
import { ApiErrorResponses } from '../common/swagger/api-error-responses.decorator';

@ApiTags('8.관리자')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: '대시보드 집계 조회' })
  @ApiOkResponse({ type: AdminStatsResponse })
  @ApiErrorResponses(401, 403)
  getStats(): Promise<AdminStatsResponse> {
    return this.adminService.getStats();
  }

  @Get('users')
  @ApiOperation({ summary: '회원 목록 조회 (닉네임·이메일 검색)' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: '닉네임 또는 이메일 부분 일치',
    example: '길동',
  })
  @ApiOkResponse({ type: [AdminUserResponse] })
  @ApiErrorResponses(401, 403)
  getUsers(@Query('search') search?: string): Promise<AdminUserResponse[]> {
    return this.adminService.getUsers(search);
  }

  @Patch('users/:id/ban')
  @ApiOperation({ summary: '회원 정지·해제' })
  @ApiOkResponse({ description: '변경 성공 (본문 없음)' })
  @ApiErrorResponses(400, 401, 403, 404)
  setUserBanned(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: BanUserDto,
  ): Promise<void> {
    return this.adminService.setUserBanned(id, dto.banned);
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '회원 삭제' })
  @ApiNoContentResponse({ description: '삭제 성공 (본문 없음)' })
  @ApiErrorResponses(401, 403, 404)
  deleteUser(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.adminService.deleteUser(id);
  }

  @Get('restaurants')
  @ApiOperation({ summary: '식당 목록 조회 (이름 검색)' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: '식당 이름 부분 일치',
    example: '순대',
  })
  @ApiOkResponse({ type: [RestaurantResponse] })
  @ApiErrorResponses(401, 403)
  getRestaurants(
    @Query('search') search?: string,
  ): Promise<RestaurantResponse[]> {
    return this.adminService.getRestaurants(search);
  }

  @Delete('restaurants/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '식당 삭제' })
  @ApiNoContentResponse({ description: '삭제 성공 (본문 없음)' })
  @ApiErrorResponses(401, 403, 404)
  deleteRestaurant(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.adminService.deleteRestaurant(id);
  }

  @Get('pins')
  @ApiOperation({ summary: '리뷰(핀) 목록 조회' })
  @ApiOkResponse({ type: [AdminPinResponse] })
  @ApiErrorResponses(401, 403)
  getPins(): Promise<AdminPinResponse[]> {
    return this.adminService.getPins();
  }

  @Delete('pins/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '리뷰(핀) 삭제' })
  @ApiNoContentResponse({ description: '삭제 성공 (본문 없음)' })
  @ApiErrorResponses(401, 403, 404)
  deletePin(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.adminService.deletePin(id);
  }

  @Get('inquiries')
  @ApiOperation({ summary: '전체 문의 목록 조회 (작성자 포함)' })
  @ApiOkResponse({ type: [AdminInquiryListResponse] })
  @ApiErrorResponses(401, 403)
  getInquiries(): Promise<AdminInquiryListResponse[]> {
    return this.adminService.getInquiries();
  }

  @Patch('inquiries/:id/answer')
  @ApiOperation({ summary: '문의 답변 등록' })
  @ApiOkResponse({ type: InquiryResponse })
  @ApiErrorResponses(400, 401, 403, 404)
  answerInquiry(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AnswerInquiryDto,
  ): Promise<InquiryResponse> {
    return this.adminService.answerInquiry(id, dto.answer);
  }
}
