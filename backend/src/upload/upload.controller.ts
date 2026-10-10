// 이미지 업로드 API 엔드포인트 — 인증 필요
import {
  Controller,
  Post,
  Req,
  UseInterceptors,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadService } from './upload.service';
import { MULTER_IMAGE_OPTIONS } from './upload.options';
import { UploadImageResponse } from './dto/upload.response.dto';
import { AuthRequest } from '../common/types/auth-request';
import { ApiErrorResponses } from '../common/swagger/api-error-responses.decorator';

@ApiTags('7.업로드')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('file', MULTER_IMAGE_OPTIONS))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: '이미지 파일 (jpg·jpeg·png·gif·webp, 최대 10MB)',
        },
      },
    },
  })
  @ApiOperation({ summary: '이미지 업로드' })
  @ApiCreatedResponse({ type: UploadImageResponse })
  @ApiErrorResponses(400, 401)
  uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: AuthRequest,
  ): UploadImageResponse {
    return this.uploadService.buildImageUrl(file, req.user.id);
  }
}
