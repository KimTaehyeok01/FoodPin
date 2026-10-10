// 업로드된 파일을 응답 계약(url)으로 변환하는 서비스
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { UploadImageResponse } from './dto/upload.response.dto';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  // multer가 파일을 걸러내면 file이 undefined로 들어온다.
  buildImageUrl(
    file: Express.Multer.File | undefined,
    actorId: number,
  ): UploadImageResponse {
    if (!file) throw new BadRequestException('파일이 없습니다.');
    this.logger.log(
      `이미지 업로드: filename=${file.filename}, actorId=${actorId}`,
    );
    return UploadImageResponse.from(file.filename);
  }
}
