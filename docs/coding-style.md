# Coding Style Guide

실제 코드베이스에서 추출한 패턴. 새 코드는 이 패턴을 따른다.

---

## 백엔드 (NestJS)

### 파일 구조 패턴

```
{domain}/
├── {domain}.module.ts
├── {domain}.controller.ts
├── {domain}.service.ts
├── {domain}.entity.ts          ← 단수형 (restaurant, pin, user)
└── dto/
    ├── create-{domain}.dto.ts
    └── update-{domain}.dto.ts
```

보조 파일: `{domain}-{role}.entity.ts` (예: `restaurant-menu.entity.ts`)

---

### 파일명 규칙

| 종류 | 패턴 | 예시 |
| ---- | ---- | ---- |
| 모듈 | `{domain}.module.ts` | `pins.module.ts` |
| 컨트롤러 | `{domain}.controller.ts` | `pins.controller.ts` |
| 서비스 | `{domain}.service.ts` | `pins.service.ts` |
| 엔티티 | `{domain}.entity.ts` | `pin.entity.ts` |
| Guard | `{role}-auth.guard.ts` | `jwt-auth.guard.ts` |
| Strategy | `{provider}.strategy.ts` | `kakao.strategy.ts` |
| DTO | `{action}-{domain}.dto.ts` | `create-pin.dto.ts` |
| 상수 | `{domain}.constants.ts` | `food-category.constants.ts` |

모두 **kebab-case**.

---

### 클래스명 규칙

| 종류 | 패턴 | 예시 |
| ---- | ---- | ---- |
| 모듈 | `{Domain}Module` | `PinsModule` |
| 컨트롤러 | `{Domain}Controller` | `PinsController` |
| 서비스 | `{Domain}Service` | `PinsService` |
| 엔티티 | `{Domain}` (단수) | `Pin`, `Restaurant` |
| Guard | `{Name}Guard` | `JwtAuthGuard` |
| Strategy | `{Provider}Strategy` | `KakaoStrategy`, `JwtStrategy` |
| DTO | `{Action}{Domain}Dto` | `CreatePinDto`, `UpdateRestaurantDto` |

모두 **PascalCase**.

---

### 서비스 메서드명 패턴

기존 메서드를 참고하여 일관성 유지.

| 패턴 | 예시 | 설명 |
| ---- | ---- | ---- |
| `findAll` | `findAll()` | 목록 전체 조회 |
| `findOne(id)` | `findOne(id: number)` | 단건 조회 |
| `get{Noun}` | `getMyPins()`, `getRestaurantPins()` | 특정 조건 조회 |
| `findOrCreate` | `findOrCreate(profile)` | 없으면 생성 |
| `create(dto, userId)` | | 생성 |
| `update(id, userId, dto)` | | 수정 |
| `remove(id, userId)` | | 삭제 |
| 단독 동사 | `pin()`, `unpin()`, `isPinned()` | 도메인 특화 동작 |
| `generate{Noun}` | `generateToken(user)` | 생성 계산 |

---

### 변수명 규칙

```typescript
// 상수 — UPPER_SNAKE_CASE
const NEARBY_RADIUS_KM = 5;
const NEARBY_DAYS = 3;
const NOTI_KEYS = { ... };

// Repository 주입 — xxxRepo 약칭 권장
@InjectRepository(Restaurant)
private readonly restaurantRepo: Repository<Restaurant>

// 일반 변수 — camelCase
const myPins = await this.pinRepo.find(...);
const pinnedIds = new Set(pins.map(p => p.restaurantId));
```

---

### DTO 패턴

```typescript
// create-pin.dto.ts
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreatePinDto {
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  memo?: string;
}

// update-pin.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreatePinDto } from './create-pin.dto';

export class UpdatePinDto extends PartialType(CreatePinDto) {}
```

---

### 컨트롤러 패턴

```typescript
@Controller('pins')
@UseGuards(JwtAuthGuard)  // 모든 엔드포인트 인증 필요 → 클래스 레벨
export class PinsController {
  constructor(private readonly pinsService: PinsService) {}

  @Get('me')
  getMyPins(@Req() req: any) {
    return this.pinsService.getMyPins(req.user.id);
  }

  @Post(':restaurantId')
  pin(
    @Req() req: any,
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @Body() dto: CreatePinDto,
  ) {
    return this.pinsService.pin(req.user.id, restaurantId, dto);
  }

  @Delete(':restaurantId')
  @HttpCode(HttpStatus.NO_CONTENT)
  unpin(
    @Req() req: any,
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
  ) {
    return this.pinsService.unpin(req.user.id, restaurantId);
  }
}
```

**혼합 인증 (일부만 필요):**
```typescript
@Controller('restaurants')
export class RestaurantsController {
  @Get()           // 인증 불필요
  findAll() { ... }

  @Post()
  @UseGuards(JwtAuthGuard)  // 메서드 레벨
  create(...) { ... }
}
```

---

### 서비스 예외 처리 패턴

```typescript
// 없는 리소스
const restaurant = await this.restaurantRepo.findOneBy({ id });
if (!restaurant) throw new NotFoundException('식당을 찾을 수 없습니다.');

// 중복
const existing = await this.pinRepo.findOneBy({ userId, restaurantId });
if (existing) throw new ConflictException('이미 핀한 식당입니다.');

// 권한 없음
if (restaurant.userId !== null && restaurant.userId !== userId) {
  throw new ForbiddenException('수정 권한이 없습니다.');
}
```

에러 메시지는 **한국어**. 컨트롤러에는 try/catch 없음.

---

### 응답 패턴

```typescript
// 직접 반환 (래퍼 없음)
return this.restaurantRepo.find({ order: { createdAt: 'DESC' } });

// 예외: 토큰 반환
return { token: this.authService.generateToken(user) };

// 예외: URL 반환
return { url: `/uploads/${file.filename}` };
```

---

## 프론트엔드 (React + TypeScript)

### 파일명 규칙

| 종류 | 패턴 | 예시 |
| ---- | ---- | ---- |
| 페이지 컴포넌트 | `PascalCase.tsx` | `HomePage.tsx` |
| 일반 컴포넌트 | `PascalCase.tsx` | `RestaurantCard.tsx` |
| CSS | `PascalCase.css` (동명) | `RestaurantCard.css` |
| 유틸 | `camelCase.ts` | `notiSettings.ts`, `distance.ts` |
| API | `camelCase.ts` | `restaurants.ts` |
| 타입 선언 | `camelCase.d.ts` | `kakao.d.ts` |

---

### 컴포넌트 패턴

```tsx
// Props 인터페이스: 컴포넌트 파일 내 인라인 정의
interface Props {
  restaurant: Restaurant;
  pinned: boolean;
  myPin?: Pin;
  hot?: boolean;
}

export default function RestaurantCard({ restaurant, pinned, myPin, hot }: Props) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handlePin = async () => { ... };

  return (
    <div className="rc" onClick={() => navigate(`/restaurants/${restaurant.id}`)}>
      ...
    </div>
  );
}
```

---

### 이벤트 핸들러 네이밍

```tsx
const handleLogin = async () => { ... };
const handleBack = () => setIsLeaving(true);
const handlePin = async () => { ... };
const handleUnpin = async (id: number, e: React.MouseEvent) => { ... };
const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => { ... };
const handleAddRestaurant = () => { ... };
```

---

### API 호출 패턴

```typescript
// api/restaurants.ts의 request<T>()를 통해서만 API 호출
// axios 사용 금지

// 단일 호출
const restaurants = await restaurantsApi.getAll();

// 병렬 호출
const [restaurants, pins] = await Promise.all([
  restaurantsApi.getAll(),
  pinsApi.getMyPins(),
]);

// 컴포넌트 내 로딩 패턴
const [loading, setLoading] = useState(true);
useEffect(() => {
  restaurantsApi.getAll()
    .then(setRestaurants)
    .catch(console.error)
    .finally(() => setLoading(false));
}, []);
```

---

### CSS 클래스명 규칙

페이지별 고유 prefix + BEM 변형.

```
{prefix}-{block}
{prefix}-{block}__{element}
{prefix}-{block}--{modifier}
```

| 페이지/컴포넌트 | prefix | 예시 |
| --------------- | ------ | ---- |
| HomePage | `home-` | `home-header`, `home-header__left`, `home-noti-dot` |
| RestaurantCard | `rc` | `rc`, `rc__img-wrap`, `rc__pin-btn--active` |
| RestaurantDetailPage | `rdx` | `rdx`, `rdx-hero`, `rdx-tab--active` |
| BottomNav | `bottom-nav` | `bottom-nav`, `bottom-nav__item--active` |
| MyPage | `my-` | `my-page`, `my-badge--locked` |
| FavoritesPage | `fav-` | `fav-page`, `fav-card__img-wrap` |
| NotificationsPage | `noti-` | `noti-page`, `noti-item__icon--new_review` |
| NotificationSettingsPage | `noti-settings-` | `noti-settings-page` |

---

### 반응형 CSS 브레이크포인트

```css
/* 모바일 (기본값, 375px 기준으로 작성) */

/* 태블릿 */
@media (min-width: 600px) { ... }

/* PC */
@media (min-width: 960px) { ... }

/* 대형 PC */
@media (min-width: 1280px) { ... }
```

**원칙:** UI를 수정할 때는 항상 모바일 → 태블릿 → PC 세 화면을 모두 함께 확인하고 수정한다.

---

### 오버레이 페이지 CSS 패턴

```css
/* 기본 (모바일) */
.noti-page {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 68px;   /* 68px = 하단 네비 높이 */
  overflow-y: auto;
  overflow-x: hidden;
  background: #f5f5f7;
  z-index: 10;
  animation: noti-slide-in 0.36s cubic-bezier(0.22, 1, 0.36, 1);
}

@keyframes noti-slide-in {
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
}

.noti-page--leaving {
  animation: noti-slide-out 0.36s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

@keyframes noti-slide-out {
  from { transform: translateX(0); }
  to   { transform: translateX(100%); }
}

/* PC */
@media (min-width: 960px) {
  .noti-header { padding: 28px 40px; }
  .noti-body { max-width: 1080px; margin: -12px auto 0; padding: 28px 40px; }
}
```

---

### 파일 헤더 주석

새 파일 첫 줄에 한국어로 역할 명시.

```typescript
// 핀 CRUD를 처리하는 서비스
// 알림 설정 값을 localStorage에서 읽고 쓰는 헬퍼
// 식당 목록을 카드 형태로 표시하는 컴포넌트
```

---

## 갱신 트리거

이 파일을 갱신해야 하는 경우.
- 새 코딩 패턴이 도입되어 기존과 다른 방식을 쓸 때
- 네이밍 규칙이 변경될 때
- CSS 클래스 prefix 체계가 바뀔 때
- 새 반응형 브레이크포인트 추가 시
