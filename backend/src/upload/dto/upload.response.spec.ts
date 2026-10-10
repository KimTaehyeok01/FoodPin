// 업로드 응답 DTO의 키 1개·경로 형식(/v1 미부착)을 고정하는 응답 계약 회귀 테스트
import { UploadImageResponse } from './upload.response.dto';

// multer가 생성하는 파일명 형태 (타임스탬프-난수.확장자)
const FILENAME = '1710000000000-123456789.jpg';

describe('UploadImageResponse', () => {
  it('현행 응답 키 1개(url)만 반환한다', () => {
    // Given & When
    const keys = Object.keys(UploadImageResponse.from(FILENAME));

    // Then
    expect(keys).toEqual(['url']);
  });

  it('/uploads/{filename} 경로를 만든다', () => {
    // Given & When
    const response = UploadImageResponse.from(FILENAME);

    // Then
    expect(response.url).toBe('/uploads/1710000000000-123456789.jpg');
  });

  it('/v1 접두어를 붙이지 않는다', () => {
    // Given & When — 프런트가 VITE_API_URL과 이어 붙이므로 붙이면 경로가 중복된다
    const response = UploadImageResponse.from(FILENAME);

    // Then
    expect(response.url.startsWith('/uploads/')).toBe(true);
    expect(response.url).not.toContain('/v1');
  });

  it('파일명을 인코딩·가공하지 않고 그대로 잇는다', () => {
    // Given & When
    const response = UploadImageResponse.from('한글 이름 (1).png');

    // Then
    expect(response.url).toBe('/uploads/한글 이름 (1).png');
  });
});
