// 문의 응답 DTO의 키 집합·등록 직후 기본값·관계 차단을 고정하는 응답 계약 회귀 테스트
import { Inquiry } from '../inquiry.entity';
import { User } from '../../users/user.entity';
import { InquiryResponse } from './inquiry.response.dto';

// 목록·등록·관리자 답변 응답에 공통으로 쓰이는 키 8개
const INQUIRY_KEYS = [
  'id',
  'userId',
  'title',
  'content',
  'status',
  'answer',
  'answeredAt',
  'createdAt',
];

// 전체 컬럼이 하이드레이션된 User — 관계로 실려 들어와도 응답에 새면 안 된다
const mockUser = (): User =>
  ({
    id: 3,
    provider: null,
    providerId: null,
    email: 'hong@foodpin.com',
    password: '$2b$10$hashedpassword',
    name: '홍길동',
    nickname: '길동이',
    profileImage: null,
    address: '서울특별시 강남구 테헤란로 1',
    age: 28,
    gender: 'male',
    role: 'user',
    isBanned: false,
    createdAt: new Date('2026-01-15T09:30:00.000Z'),
  }) as User;

// GET /inquiries/me 조회 상태 (답변 완료 문의)
const mockInquiry = (): Inquiry =>
  ({
    id: 7,
    userId: 3,
    title: '핀이 지도에 안 보여요',
    content: '어제 등록한 핀이 지도에 표시되지 않습니다.',
    status: 'answered',
    answer: '캐시 문제였습니다. 새로고침 후 확인 부탁드립니다.',
    answeredAt: new Date('2026-07-20T02:00:00.000Z'),
    createdAt: new Date('2026-07-19T11:30:00.000Z'),
  }) as Inquiry;

// POST /inquiries 직후 상태를 재현한다.
// TypeORM repo.create()가 default 컬럼은 기본값으로, nullable 컬럼은 null로 채우므로 프로퍼티가 모두 존재한다.
const mockCreatedInquiry = (): Inquiry =>
  ({
    id: 8,
    userId: 3,
    title: '식당 정보가 틀려요',
    content: '영업시간이 실제와 다릅니다.',
    status: 'pending',
    answer: null,
    answeredAt: null,
    createdAt: new Date('2026-08-01T05:00:00.000Z'),
  }) as Inquiry;

describe('InquiryResponse', () => {
  it('현행 응답 키 8개를 그대로 반환한다', () => {
    // Given & When
    const keys = Object.keys(InquiryResponse.from(mockInquiry())).sort();

    // Then
    expect(keys).toEqual([...INQUIRY_KEYS].sort());
  });

  it('값을 가공 없이 그대로 통과시킨다', () => {
    // Given & When
    const response = InquiryResponse.from(mockInquiry());

    // Then
    expect(response).toEqual({
      id: 7,
      userId: 3,
      title: '핀이 지도에 안 보여요',
      content: '어제 등록한 핀이 지도에 표시되지 않습니다.',
      status: 'answered',
      answer: '캐시 문제였습니다. 새로고침 후 확인 부탁드립니다.',
      answeredAt: new Date('2026-07-20T02:00:00.000Z'),
      createdAt: new Date('2026-07-19T11:30:00.000Z'),
    });
  });

  it('등록 직후에도 키 8개를 유지하며 status는 pending, answer·answeredAt는 null이다', () => {
    // Given & When — TypeORM repo.create()가 default 컬럼을 기본값으로 채우므로 undefined가 발생하지 않는다
    const json: unknown = JSON.parse(
      JSON.stringify(InquiryResponse.from(mockCreatedInquiry())),
    );

    // Then
    expect(Object.keys(json as object).sort()).toEqual(
      [...INQUIRY_KEYS].sort(),
    );
    expect(json).toHaveProperty('status', 'pending');
    expect(json).toHaveProperty('answer', null);
    expect(json).toHaveProperty('answeredAt', null);
  });

  it('user 관계가 로드돼도 응답에 새지 않는다', () => {
    // Given — 관리자 답변 응답이 이 DTO를 재사용하므로 user가 생기면 계약이 깨진다
    const inquiry = mockInquiry();
    inquiry.user = mockUser();

    // When
    const json: unknown = JSON.parse(
      JSON.stringify(InquiryResponse.from(inquiry)),
    );

    // Then
    expect(json).not.toHaveProperty('user');
    expect(Object.keys(json as object)).toHaveLength(8);
  });

  it('미답변 문의의 null 필드를 기본값으로 보정하지 않는다', () => {
    // Given
    const inquiry = mockInquiry();
    inquiry.status = 'pending';
    inquiry.answer = null;
    inquiry.answeredAt = null;

    // When
    const response = InquiryResponse.from(inquiry);

    // Then
    expect(response.status).toBe('pending');
    expect(response.answer).toBeNull();
    expect(response.answeredAt).toBeNull();
  });

  it('fromList는 순서를 유지하며 전 항목을 변환한다', () => {
    // Given
    const second = mockInquiry();
    second.id = 9;

    // When
    const responses = InquiryResponse.fromList([mockInquiry(), second]);

    // Then
    expect(responses.map((i) => i.id)).toEqual([7, 9]);
  });
});
