# Feature: Upload (이미지 업로드)

---

## 개요

식당 사진을 서버에 업로드하고 정적 파일로 서빙한다.
multer를 사용하여 `backend/uploads/` 디렉토리에 저장한다.

---

## 관련 파일

| 파일 | 역할 |
| ---- | ---- |
| `backend/src/upload/upload.controller.ts` | POST /upload/image 엔드포인트 |
| `backend/src/upload/upload.module.ts` | multer 설정 |
| `backend/src/main.ts` | 정적 파일 서빙 설정 |
| `frontend/src/api/restaurants.ts` | `uploadImage()` 함수 |

---

## 백엔드

### 업로드 설정

```typescript
// upload.module.ts
MulterModule.register({
  storage: diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
      const name = `${Date.now()}-${Math.round(Math.random() * 1e6)}${extname(file.originalname)}`;
      cb(null, name);
    },
  }),
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.match(/^image\//)) {
      return cb(new BadRequestException('이미지 파일만 업로드 가능합니다.'), false);
    }
    cb(null, true);
  },
  limits: { fileSize: 10 * 1024 * 1024 },  // 10MB
})
```

### 엔드포인트

```typescript
@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    return { url: `/uploads/${file.filename}` };
  }
}
```

- 필드명: `file`
- 반환: `{ url: '/uploads/{filename}' }`

### 정적 파일 서빙

```typescript
// main.ts
app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/uploads/' });
```

- 접근 URL: `GET /uploads/{filename}`
- 인증 불필요

---

## 프론트엔드

### uploadImage 함수

```typescript
// api/restaurants.ts
export async function uploadImage(file: File): Promise<string> {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${BASE_URL}/upload/image`, {
    method: 'POST',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: formData,
    // Content-Type 헤더 미지정 → fetch가 자동으로 multipart/form-data 설정
  });
  if (!res.ok) throw new Error('이미지 업로드 실패');
  const data = await res.json();
  return data.url;  // '/uploads/abc.jpg'
}
```

**주의:** Content-Type을 직접 지정하면 안 됨. fetch가 FormData를 감지하여 boundary 포함 자동 설정.

### 이미지 URL 표시

```typescript
// photoUrl이 /uploads/...이면 API 서버 URL 앞에 붙임
export function photoSrc(photoUrl: string): string {
  return photoUrl.startsWith('http') ? photoUrl : `${BASE_URL}${photoUrl}`;
}
```

---

## 제약사항

| 항목 | 제한 |
| ---- | ---- |
| 허용 형식 | 이미지 전체 (`image/*`) |
| 최대 크기 | 10MB |
| 저장 위치 | `backend/uploads/` (서버 로컬 디스크) |
| 파일명 | 난수화 (`{timestamp}-{random}{ext}`) |
| 인증 | 업로드는 JWT 필요, 조회는 불필요 |

---

## 갱신 트리거

이 파일을 갱신해야 하는 경우.
- S3 등 외부 스토리지로 전환 시
- 허용 파일 형식/크기 제한 변경 시
- 여러 파일 동시 업로드 기능 추가 시
