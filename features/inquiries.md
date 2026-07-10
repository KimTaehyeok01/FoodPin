# Feature: Inquiries (1:1 문의 · 고객센터)

---

## 개요

유저가 앱 사용 중 궁금한 점·문제를 등록하는 1:1 문의 기능. 마이페이지 "고객센터" 메뉴에 연결.
관리자 답변 UI는 없는 최소 버전 — `answer`/`status`/`answeredAt`는 DB에서 수동으로 채운다.

---

## 관련 파일

### 백엔드
| 파일 | 역할 |
| ---- | ---- |
| `backend/src/inquiries/inquiry.entity.ts` | 문의 엔티티 |
| `backend/src/inquiries/inquiries.service.ts` | 문의 등록·조회 서비스 |
| `backend/src/inquiries/inquiries.controller.ts` | REST 엔드포인트 |
| `backend/src/inquiries/dto/create-inquiry.dto.ts` | 문의 등록 DTO |

### 프론트엔드
| 파일 | 역할 |
| ---- | ---- |
| `frontend/src/pages/my/InquiriesPage.tsx` | 문의 작성 폼 + 내 문의 목록 |
| `frontend/src/pages/my/MyPage.tsx` | "고객센터" 메뉴 → `/inquiries` |
| `frontend/src/api/restaurants.ts` | `inquiriesApi` 클라이언트 |

---

## 엔티티

`Inquiry` — 상세는 [docs/erd.md](../docs/erd.md) 참고.

```typescript
@Entity('inquiry')
export class Inquiry {
  @PrimaryGeneratedColumn() id: number;

  @Column() userId: number;

  @Column({ length: 100 }) title: string;
  @Column({ type: 'text' }) content: string;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: 'pending' | 'answered';

  @Column({ type: 'text', nullable: true }) answer: string | null;
  @Column({ type: 'datetime', nullable: true }) answeredAt: Date | null;

  @CreateDateColumn() createdAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
```

---

## API

| Method | URL | 설명 |
| ------ | --- | ---- |
| GET | /inquiries | 내 문의 목록 (최신순) |
| POST | /inquiries | 문의 등록 |

모두 `JwtAuthGuard` 적용 (컨트롤러 레벨). 상세 요청/응답은 [docs/api.md](../docs/api.md#inquiries) 참고.

---

## 프론트엔드 핵심 패턴

`InquiriesPage`는 다른 오버레이 페이지와 동일한 슬라이드-인 패턴을 쓰되, 목록 위에 작성 폼을 토글로 보여준다.

```tsx
const [writing, setWriting] = useState(false);
// "+ 문의하기" 클릭 → writing=true → 폼 표시
// 등록 성공 시 writing=false + 목록 재조회(load())
```

문의 카드는 `status`에 따라 배지(답변대기/답변완료)를 표시하고, `answer`가 있으면 카드 하단에 답변을 함께 보여준다.

---

## 설계 이유

관리자 답변 기능(별도 관리자 권한·화면)까지 포함하면 스코프가 커져서, 이번엔 유저가 문의를 등록·조회만 할 수 있는 최소 버전으로 구현했다. 답변은 DB에서 수동으로 `answer`/`status`/`answeredAt`를 채우는 방식. 추후 관리자 화면이 필요해지면 `role` 필드와 별도 관리자 인증을 추가하는 걸 고려한다.

---

## 갱신 트리거

이 파일을 갱신해야 하는 경우.
- 관리자 답변 기능 추가 시
- 문의 상태(status) 값 추가/변경 시
- 문의 카테고리 분류 등 필드 추가 시
