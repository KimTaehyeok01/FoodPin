// 알림 응답 계약을 고정하는 Response DTO (조회 시점에 계산되는 가상 리소스)
import { ApiProperty } from '@nestjs/swagger';

export const NOTIFICATION_TYPES = ['new_restaurant', 'new_review'] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/**
 * 알림 단건 응답. 저장된 엔티티가 없고 서비스가 조회 시점에 조립하므로
 * 정적 팩토리 대신 서비스가 이 타입으로 직접 항목을 만든다.
 */
export class NotificationResponse {
  @ApiProperty({
    description: '알림 종류',
    example: 'new_review',
    enum: NOTIFICATION_TYPES,
  })
  type: NotificationType;

  @ApiProperty({ description: '대상 식당 ID', example: 111 })
  restaurantId: number;

  @ApiProperty({ description: '대상 식당 이름', example: '성남 정자동 순대국' })
  restaurantName: string;

  @ApiProperty({
    description: '알림 문구',
    example: "길동이님이 '성남 정자동 순대국'에 리뷰를 남겼어요",
  })
  message: string;

  @ApiProperty({ description: '알림 기준 일시', type: Date })
  createdAt: Date;
}
