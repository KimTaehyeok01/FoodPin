import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Spring의 @CrossOrigin 또는 WebMvcConfigurer CORS 설정과 동일한 역할
  app.enableCors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  });

  // Spring의 @Valid + BindingResult 역할 — DTO 유효성 검사 전역 적용
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,      // DTO에 없는 필드 자동 제거
      forbidNonWhitelisted: true,
      transform: true,      // 요청 데이터를 DTO 타입으로 자동 변환
    }),
  );

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`FoodPin API running on http://localhost:${port}`);
}
bootstrap();
