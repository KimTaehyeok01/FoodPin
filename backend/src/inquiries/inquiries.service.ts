// 1:1 문의 등록·조회 서비스
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inquiry } from './inquiry.entity';
import { CreateInquiryDto } from './dto/create-inquiry.dto';

@Injectable()
export class InquiriesService {
  constructor(
    @InjectRepository(Inquiry)
    private readonly inquiryRepo: Repository<Inquiry>,
  ) {}

  async createInquiry(userId: number, dto: CreateInquiryDto): Promise<Inquiry> {
    const inquiry = this.inquiryRepo.create({ userId, ...dto });
    return this.inquiryRepo.save(inquiry);
  }

  async getMyInquiries(userId: number): Promise<Inquiry[]> {
    return this.inquiryRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }
}
