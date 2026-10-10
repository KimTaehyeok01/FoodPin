// NestJS 기본 예외 필터가 내려주는 에러 응답 형태를 Swagger에 문서화하는 스키마 (런타임 미사용)
import { ApiProperty } from '@nestjs/swagger';

/**
 * 문서화 전용 클래스다. 커스텀 exception filter를 두지 않으므로 런타임에서 인스턴스화되지 않으며,
 * NestJS 기본 필터의 응답 본문을 그대로 서술하기만 한다.
 */
export class ErrorResponse {
  @ApiProperty({ description: 'HTTP 상태 코드', example: 404 })
  statusCode: number;

  @ApiProperty({
    description:
      '에러 메시지. ValidationPipe 실패 시 문자열 배열, 그 외 예외는 문자열이다.',
    example: '식당을 찾을 수 없습니다.',
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
  })
  message: string | string[];

  @ApiProperty({ description: 'HTTP 상태 문구', example: 'Not Found' })
  error: string;
}
