// NestJS 부트스트랩 — CORS·전역 파이프·/v1 프리픽스·정적 파일·Swagger 설정을 담당한다
import { NestFactory } from '@nestjs/core';
import { Logger, RequestMethod, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 전역 프리픽스 /v1.
  // OAuth 콜백 2종은 카카오·네이버 개발자 콘솔에 등록된 Redirect URI 와 일치해야 하므로
  // 제외한다(프리픽스가 붙으면 콘솔 수동 수정 전까지 소셜 로그인이 전면 장애난다).
  // 로그인 개시 URL(/auth/kakao, /auth/naver)은 콘솔 등록 대상이 아니라 /v1 로 이동한다.
  app.setGlobalPrefix('v1', {
    exclude: [
      { path: 'auth/kakao/callback', method: RequestMethod.GET },
      { path: 'auth/naver/callback', method: RequestMethod.GET },
      { path: '/', method: RequestMethod.GET },
    ],
  });

  // uploads 폴더 없으면 자동 생성
  const uploadsDir = join(process.cwd(), 'uploads');
  if (!existsSync(uploadsDir)) mkdirSync(uploadsDir);

  // 정적 파일 서빙. useStaticAssets 는 전역 프리픽스의 영향을 받지 않는데,
  // 프런트가 `${VITE_API_URL}${photoUrl}` 로 URL 을 조립하므로 VITE_API_URL 에 /v1 이
  // 붙는 순간 /v1/uploads/* 를 요청한다. 기존 절대 링크 호환을 위해 양쪽 다 등록한다.
  app.useStaticAssets(uploadsDir, { prefix: '/uploads' });
  app.useStaticAssets(uploadsDir, { prefix: '/v1/uploads' });

  // Swagger 는 개발 환경에서만 노출한다.
  // 운영에서 관리자 API 목록과 DTO 스키마 전체가 공개되면 공격 표면이 넓어진다.
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('FoodPin API')
      .setDescription(
        '가본 식당을 지도에 핀으로 찍고 별점·메모를 남기는 맛집 지도 앱 API. ' +
          '모든 엔드포인트는 `/v1` 프리픽스를 사용합니다 (OAuth 콜백 제외).',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  new Logger('Bootstrap').log(
    `FoodPin API running on http://localhost:${port}`,
  );
}
void bootstrap();
