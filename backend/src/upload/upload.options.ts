// 이미지 업로드 정책(허용 확장자·파일명 규칙·용량 제한)을 담는 multer 옵션 모음
import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { diskStorage } from 'multer';
import { extname } from 'path';

export const UPLOAD_DESTINATION = './uploads';
export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/** 원본 파일명을 버리고 충돌하지 않는 이름을 만든다 (경로 조작·한글 파일명 문제 회피). */
export function buildStoredFilename(originalName: string): string {
  const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
  return `${unique}${extname(originalName)}`;
}

/** 확장자와 MIME 타입을 함께 검사한다 — 둘 중 하나만 통과하는 위장 업로드를 막는다. */
export function isAllowedImage(
  originalName: string,
  mimetype: string,
): boolean {
  const ext = extname(originalName).toLowerCase();
  return /^image\//.test(mimetype) && ALLOWED_EXTENSIONS.includes(ext);
}

export const MULTER_IMAGE_OPTIONS: MulterOptions = {
  storage: diskStorage({
    destination: UPLOAD_DESTINATION,
    filename: (_req, file, cb) => {
      cb(null, buildStoredFilename(file.originalname));
    },
  }),
  fileFilter: (_req, file, cb) => {
    if (!isAllowedImage(file.originalname, file.mimetype)) {
      return cb(
        new BadRequestException('이미지 파일만 업로드 가능합니다.'),
        false,
      );
    }
    cb(null, true);
  },
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
};
