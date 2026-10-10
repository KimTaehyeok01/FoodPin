// 1:1 문의 등록·조회 서비스
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inquiry } from './inquiry.entity';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { InquiryResponse } from './dto/inquiry.response.dto';

@Injectable()
export class InquiriesService {
  private readonly logger = new Logger(InquiriesService.name);

  constructor(
    @InjectRepository(Inquiry)
    private readonly inquiryRepo: Repository<Inquiry>,
  ) {}

  // 단일 INSERT라 트랜잭션을 열지 않는다 (TypeORM autocommit으로 원자적).
  async createInquiry(
    userId: number,
    dto: CreateInquiryDto,
  ): Promise<InquiryResponse> {
    const inquiry = this.inquiryRepo.create({ userId, ...dto });
    const saved = await this.inquiryRepo.save(inquiry);
    this.logger.log(`문의 등록: inquiryId=${saved.id}, userId=${userId}`);
    return InquiryResponse.from(saved);
  }

  async getMyInquiries(userId: number): Promise<InquiryResponse[]> {
    const inquiries = await this.inquiryRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return InquiryResponse.fromList(inquiries);
  }
}
