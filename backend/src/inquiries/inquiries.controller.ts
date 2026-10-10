// 1:1 문의 API 엔드포인트 — 전 핸들러 인증 필요
import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InquiriesService } from './inquiries.service';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { InquiryResponse } from './dto/inquiry.response.dto';
import { AuthRequest } from '../common/types/auth-request';
import { ApiErrorResponses } from '../common/swagger/api-error-responses.decorator';

@ApiTags('6.문의')
@ApiBearerAuth()
@Controller('inquiries')
@UseGuards(JwtAuthGuard)
export class InquiriesController {
  constructor(private readonly inquiriesService: InquiriesService) {}

  @Get()
  @ApiOperation({ summary: '내 문의 목록 조회' })
  @ApiOkResponse({ type: [InquiryResponse] })
  @ApiErrorResponses(401)
  getMyInquiries(@Req() req: AuthRequest): Promise<InquiryResponse[]> {
    return this.inquiriesService.getMyInquiries(req.user.id);
  }

  @Post()
  @ApiOperation({ summary: '1:1 문의 등록' })
  @ApiCreatedResponse({ type: InquiryResponse })
  @ApiErrorResponses(400, 401)
  createInquiry(
    @Req() req: AuthRequest,
    @Body() dto: CreateInquiryDto,
  ): Promise<InquiryResponse> {
    return this.inquiriesService.createInquiry(req.user.id, dto);
  }
}
