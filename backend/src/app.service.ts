// 루트(헬스체크) 엔드포인트의 응답 문자열을 제공하는 서비스
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}
