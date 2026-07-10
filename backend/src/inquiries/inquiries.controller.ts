// 1:1 문의 엔드포인트
import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InquiriesService } from './inquiries.service';
import { CreateInquiryDto } from './dto/create-inquiry.dto';

@Controller('inquiries')
@UseGuards(JwtAuthGuard)
export class InquiriesController {
  constructor(private readonly inquiriesService: InquiriesService) {}

  @Get()
  getMyInquiries(@Req() req: any) {
    return this.inquiriesService.getMyInquiries(req.user.id);
  }

  @Post()
  createInquiry(@Req() req: any, @Body() dto: CreateInquiryDto) {
    return this.inquiriesService.createInquiry(req.user.id, dto);
  }
}
