// 서버 동작 여부를 확인하는 루트(헬스체크) 엔드포인트 컨트롤러
import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('0.기본')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: '서버 상태 확인',
    description: '전역 프리픽스 제외 경로라 `/v1` 없이 `/` 로 호출한다.',
  })
  @ApiOkResponse({
    description: '서버 정상 동작',
    schema: { type: 'string', example: 'Hello World!' },
  })
  getHello(): string {
    return this.appService.getHello();
  }
}
