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
├── {domain}.service.spec.ts    ← Service 단위 테스트 (Repository는 mock)
├── {domain}.entity.ts          ← 단수형 (restaurant, pin, user)
└── dto/
    ├── create-{domain}.dto.ts
    ├── update-{domain}.dto.ts
    ├── {domain}.response.dto.ts    ← 응답 DTO 전체를 한 파일에
    └── {domain}.response.spec.ts   ← 응답 계약 회귀 테스트
```

보조 파일: `{domain}-{role}.entity.ts` (예: `restaurant-menu.entity.ts`)

여러 도메인이 공유하는 것은 `src/common/`에 둔다.

```
common/
├── types/auth-request.ts                     ← AuthUser, AuthRequest
├── utils/mask.util.ts                        ← maskEmail, maskName
├── dto/error.response.dto.ts                 ← Swagger 문서화 전용
└── swagger/api-error-responses.decorator.ts  ← @ApiErrorResponses(400, 404, ...)
```

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
| `issue{Noun}` / `generate{Noun}` | `issueToken(user)` | 생성 계산 |

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

**요청 DTO** — `class-validator` 검증 + `@ApiProperty` 문서화를 함께 단다.

```typescript
// create-pin.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreatePinDto {
  @ApiProperty({ description: '별점 (1~5)', example: 4, minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ description: '메모', example: '국물이 진하다' })
  @IsOptional()
  @IsString()
  memo?: string;
}

// update-pin.dto.ts — PartialType은 @nestjs/swagger에서 import한다.
// mapped-types 판은 @ApiProperty 메타데이터를 상속하지 않아 스키마가 빈 객체가 된다.
import { PartialType } from '@nestjs/swagger';
import { CreatePinDto } from './create-pin.dto';

export class UpdatePinDto extends PartialType(CreatePinDto) {}
```

**응답 DTO** — 도메인당 `dto/{domain}.response.dto.ts` 한 파일에 모으고, 변환은 `static from()` 한 곳에서만 한다.

```typescript
// pin.response.dto.ts
export class PinResponse {
  @ApiProperty({ description: '핀 ID', example: 42 })
  id: number;
  // ...

  // 값을 가공하지 않고 그대로 대입만 한다.
  static from(pin: Pin): PinResponse {
    return { id: pin.id, userId: pin.userId, memo: pin.memo /* ... */ };
  }

  static fromList(pins: Pin[]): PinResponse[] {
    return pins.map((pin) => PinResponse.from(pin));
  }
}
```

`from()` 작성 시 지켜야 할 3가지. 어기면 기존 응답 계약이 깨진다.

1. **`?? null`·`?? ''` 같은 기본값 보정 금지.** 생성 응답의 미입력 컬럼은 TypeORM `repo.create()`가 이미 `null`(또는 컬럼 `default` 값)로 채워두므로 보정이 애초에 불필요하고, 보정하면 `null`이 `''` 등으로 바뀌어 응답 계약이 깨진다. 키가 실제로 생략되는 곳은 서비스가 `select`로 제외한 필드뿐이며, 이 경우는 보정 대신 3번 규칙(조건부 스프레드)으로 다룬다.
2. **타입 변환 금지.** `Number()`·`parseFloat()`·`toFixed()` 금지. `latitude`는 조회 시 문자열(`DECIMAL`), 생성 시 숫자로 나가며 그대로 통과시켜야 한다.
3. **응답 shape이 다르면 DTO도 분리한다.** 관계를 로드하지 않는 엔드포인트에 로드하는 쪽 DTO를 재사용하면 안 된다. 관계가 optional이면 타입도 `?`로 두고 조건부 스프레드로 키 자체를 만들지 않는다.

```typescript
// 관계 미로드 시 키를 만들지 않는다
restaurant?: RestaurantResponse;

static from(pin: Pin): MyPinResponse {
  return {
    ...PinResponse.from(pin),
    ...(pin.restaurant ? { restaurant: RestaurantResponse.from(pin.restaurant) } : {}),
  };
}
```

---

### 컨트롤러 패턴

`@Req()`는 `any`가 아니라 공용 `AuthRequest` 타입을 쓴다. 반환 타입도 Response DTO로 명시한다.

```typescript
import { AuthRequest } from '../common/types/auth-request';
import { ApiErrorResponses } from '../common/swagger/api-error-responses.decorator';

@ApiTags('4.핀')
@ApiBearerAuth()          // 전 핸들러 인증 필요 → 클래스 레벨
@Controller('pins')
@UseGuards(JwtAuthGuard)
export class PinsController {
  constructor(private readonly pinsService: PinsService) {}

  @Get('me')
  @ApiOperation({ summary: '내가 핀한 식당 목록 조회' })
  @ApiOkResponse({ type: [MyPinResponse] })
  @ApiErrorResponses(401)
  getMyPins(@Req() req: AuthRequest): Promise<MyPinResponse[]> {
    return this.pinsService.getMyPins(req.user.id);
  }

  @Delete(':restaurantId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '내 핀 삭제' })
  @ApiNoContentResponse({ description: '삭제 성공 (본문 없음)' })
  @ApiErrorResponses(401, 404)
  unpin(
    @Req() req: AuthRequest,
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
  ): Promise<void> {
    return this.pinsService.unpin(req.user.id, restaurantId);
  }
}
```

`@ApiErrorResponses(...)`에는 **해당 핸들러가 실제로 던지는 상태만** 넘긴다. 전부 나열하면 문서가 거짓이 된다.

**혼합 인증 (일부만 필요):**
```typescript
@ApiTags('3.식당')
@Controller('restaurants')
export class RestaurantsController {
  @Get()           // 인증 불필요 — 비로그인도 지도를 봐야 한다
  findAll() { ... }

  @Post()
  @UseGuards(JwtAuthGuard)  // 메서드 레벨
  @ApiBearerAuth()          // 문서도 메서드 레벨
  create(...) { ... }
}
```

> ⚠️ `RestaurantsController`의 `findAll`/`findOne`은 **공개 엔드포인트**다. Guard나 `@ApiBearerAuth()`를 클래스 레벨로 올리면 두 엔드포인트가 401이 되어 지도가 비로그인 상태에서 깨진다.

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

Response DTO를 직접 반환한다 (래퍼 클래스 없음).

```typescript
// 목록·단건 — Repository 결과를 DTO로 변환해 반환
const restaurants = await this.restaurantRepo.find({ order: { createdAt: 'DESC' } });
return RestaurantResponse.fromList(restaurants);

// 토큰 반환
return TokenResponse.from(this.issueToken(user));

// URL 반환
return UploadImageResponse.from(file.filename);
```

**Entity를 그대로 반환하지 않는다.** `select` 목록에 의존한 민감정보 방어는 누가 한 줄만 지워도 무너지지만, DTO에 없는 필드는 구조적으로 나갈 수 없다.

---

### 트랜잭션 패턴

다중 쓰기가 있는 메서드에만 `DataSource.transaction()`을 연다. 단건 `save`/`remove`는 TypeORM autocommit으로 원자적이라 선언하지 않는다.

```typescript
constructor(
  @InjectRepository(User) private readonly userRepo: Repository<User>,
  @InjectDataSource() private readonly dataSource: DataSource,
) {}

async updateProfile(userId: number, dto: UpdateProfileDto) {
  const user = await this.userRepo.findOneBy({ id: userId });   // 트랜잭션 밖
  if (!user) throw new NotFoundException('유저를 찾을 수 없습니다.');

  await this.dataSource.transaction(async (manager) => {
    // 반드시 manager.getRepository — 주입 Repository는 트랜잭션 밖 커넥션이다
    await manager.getRepository(User).save(user);
    if (favoriteCategories) {
      const repo = manager.getRepository(UserFavoriteCategory);
      await repo.delete({ userId });
      if (favoriteCategories.length) await repo.save(rows);
    }
  });

  return this.getMe(userId);   // 반드시 커밋 이후 — 콜백 안이면 미커밋 데이터를 못 읽는다
}
```

주의할 함정 3가지.

1. **콜백 안에서 주입 Repository 사용 금지** — 트랜잭션 밖 커넥션이라 원자성이 사라진다.
2. **재조회는 커밋 이후** — 콜백 안에서 부르면 별도 커넥션이 미커밋 데이터를 못 읽는다.
3. **느린 연산(`bcrypt.hash` 등)은 트랜잭션 밖** — CPU 100ms급 작업이 DB 커넥션을 점유한다.

---

### 로깅 패턴

```typescript
private readonly logger = new Logger(UsersService.name);

this.logger.log(`프로필 수정 완료: userId=${userId}`);              // INFO — 상태 변경
this.logger.warn(`로그인 실패: email=${maskEmail(dto.email)}`);      // WARN — 인증 거부
```

- `key=value` 형식. **조회 경로에는 로그를 넣지 않는다** (트래픽 대비 가치 없음).
- 가능하면 `userId`만 남기고, PII가 꼭 필요하면 `maskEmail`/`maskName`(`common/utils/mask.util.ts`)을 거친다.
- **절대 금지**: `password`(평문·해시), JWT `token`, `providerId`, OAuth 시크릿, `address`.
- `console.*` 금지 — `Logger`를 쓴다.

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
