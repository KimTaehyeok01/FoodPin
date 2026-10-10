// 이미지 업로드 응답 계약을 고정하는 Response DTO
import { ApiProperty } from '@nestjs/swagger';

export class UploadImageResponse {
  @ApiProperty({
    description:
      '저장된 이미지 경로. 프런트가 VITE_API_URL과 이어 붙이므로 /v1 접두어를 붙이지 않는다.',
    example: '/uploads/1710000000000-123456.jpg',
  })
  url: string;

  static from(filename: string): UploadImageResponse {
    return { url: `/uploads/${filename}` };
  }
}
