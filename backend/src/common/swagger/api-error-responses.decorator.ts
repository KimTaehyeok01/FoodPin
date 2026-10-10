// 핸들러가 실제로 던지는 에러 상태만 골라 Swagger 응답 문서를 일괄 부착하는 커스텀 데코레이터
import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { ErrorResponse } from '../dto/error.response.dto';

const ERROR_DESCRIPTIONS: Record<number, string> = {
  400: '요청 값이 올바르지 않습니다.',
  401: '인증에 실패했습니다. (토큰 없음·만료·정지 계정)',
  403: '해당 리소스에 대한 권한이 없습니다.',
  404: '대상을 찾을 수 없습니다.',
  409: '이미 존재하여 처리할 수 없습니다.',
};

/**
 * 사용 예: `@ApiErrorResponses(401, 404)`
 * 지원 상태는 400/401/403/404/409이며, 핸들러가 던지지 않는 상태는 넘기지 않는다(문서가 거짓이 된다).
 */
export const ApiErrorResponses = (...statuses: number[]) =>
  applyDecorators(
    ...statuses.map((status) =>
      ApiResponse({
        status,
        type: ErrorResponse,
        description: ERROR_DESCRIPTIONS[status],
      }),
    ),
  );
