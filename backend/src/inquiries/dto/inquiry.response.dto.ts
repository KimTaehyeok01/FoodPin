// 1:1 문의 도메인의 응답 계약을 고정하는 Response DTO
import { ApiProperty } from '@nestjs/swagger';
import { Inquiry, InquiryStatus } from '../inquiry.entity';

/**
 * 문의 단건 응답. 목록·등록·관리자 답변 응답에 공통으로 쓰인다.
 *
 * 주의 1. 등록 응답에도 키 8개가 모두 존재한다 — TypeORM `repo.create()`가 DB default와
 * nullable 컬럼을 채우므로 `status`는 `'pending'`, `answer`·`answeredAt`는 `null`로 내려간다.
 * 값 보정(`?? ''` 등)을 넣으면 `null`이 다른 값으로 바뀌어 응답 계약이 깨진다.
 * 주의 2. 이 DTO는 `user` 관계를 담지 않는다. 관리자 답변 응답도 같은 형태다.
 */
export class InquiryResponse {
  @ApiProperty({ description: '문의 ID', example: 7 })
  id: number;

  @ApiProperty({ description: '작성자 유저 ID', example: 3 })
  userId: number;

  @ApiProperty({ description: '문의 제목', example: '핀이 지도에 안 보여요' })
  title: string;

  @ApiProperty({
    description: '문의 내용',
    example: '어제 등록한 핀이 지도에 표시되지 않습니다.',
  })
  content: string;

  @ApiProperty({
    description: '처리 상태',
    example: 'pending',
    enum: ['pending', 'answered'],
  })
  status: InquiryStatus;

  @ApiProperty({
    description: '관리자 답변',
    example: '캐시 문제였습니다. 새로고침 후 확인 부탁드립니다.',
    type: String,
    nullable: true,
  })
  answer: string | null;

  @ApiProperty({ description: '답변 일시', type: Date, nullable: true })
  answeredAt: Date | null;

  @ApiProperty({ description: '등록 일시', type: Date })
  createdAt: Date;

  // 값을 가공하지 않고 그대로 대입만 한다 (타입 변환·기본값 보정 금지).
  static from(inquiry: Inquiry): InquiryResponse {
    return {
      id: inquiry.id,
      userId: inquiry.userId,
      title: inquiry.title,
      content: inquiry.content,
      status: inquiry.status,
      answer: inquiry.answer,
      answeredAt: inquiry.answeredAt,
      createdAt: inquiry.createdAt,
    };
  }

  static fromList(inquiries: Inquiry[]): InquiryResponse[] {
    return inquiries.map((inquiry) => InquiryResponse.from(inquiry));
  }
}
