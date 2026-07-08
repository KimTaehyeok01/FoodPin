# ERD (Entity Relationship Diagram)

---

## 관계 다이어그램

```
user 1 ──────── N user_favorite_category
user 1 ──────── N pin
restaurant 1 ── N pin
restaurant 1 ── N restaurant_menu

pin: (userId, restaurantId) UNIQUE
```

---

## 테이블 상세

### user

유저 정보. 일반 로그인(email+password)과 소셜 로그인(provider+providerId) 혼용.

| 컬럼          | 타입                     | 제약             | 설명                          |
| ------------- | ------------------------ | ---------------- | ----------------------------- |
| id            | INT (PK, AI)             | NOT NULL         | 고유 ID                       |
| provider      | VARCHAR(20)              | nullable         | `kakao` / `naver` (소셜만)    |
| providerId    | VARCHAR(100)             | nullable         | 소셜 고유 ID                  |
| email         | VARCHAR(255)             | UNIQUE, nullable | 이메일 (일반 로그인만)        |
| password      | VARCHAR(255)             | nullable         | bcrypt 해시 (일반 로그인만)   |
| nickname      | VARCHAR(50)              | NOT NULL         | 닉네임                        |
| profileImage  | VARCHAR(255)             | nullable         | 프로필 이미지 URL             |
| address       | VARCHAR(255)             | nullable         | 주소                          |
| age           | TINYINT UNSIGNED         | nullable         | 나이                          |
| createdAt     | DATETIME                 | NOT NULL         | 가입일 (@CreateDateColumn)    |

**관계**
- `@OneToMany` → `pin` (userId)
- `@OneToMany` → `user_favorite_category` (userId)

---

### user_favorite_category

즐겨찾는 음식 카테고리. user와 1:N (정규화).

| 컬럼     | 타입         | 제약     | 설명                          |
| -------- | ------------ | -------- | ----------------------------- |
| id       | INT (PK, AI) | NOT NULL | 고유 ID                       |
| userId   | INT (FK)     | NOT NULL | user.id (onDelete: CASCADE)   |
| category | VARCHAR(50)  | NOT NULL | 카테고리명                    |

**카테고리 목록** (`food-category.constants.ts`)
```
한식, 중식, 일식, 양식, 분식, 카페/디저트, 치킨/피자, 고기/구이, 해산물, 기타
```

---

### restaurant

식당 정보. 지도 핀의 기준 데이터.

| 컬럼         | 타입                       | 제약           | 설명                            |
| ------------ | -------------------------- | -------------- | ------------------------------- |
| id           | INT (PK, AI)               | NOT NULL       | 고유 ID                         |
| userId       | INT                        | nullable       | 등록한 유저 (시드 데이터는 NULL)|
| name         | VARCHAR(100)               | NOT NULL       | 식당 이름                       |
| latitude     | DECIMAL(10,7)              | NOT NULL       | 위도                            |
| longitude    | DECIMAL(10,7)              | NOT NULL       | 경도                            |
| address      | VARCHAR(255)               | nullable       | 주소                            |
| photoUrl     | VARCHAR(500)               | nullable       | 사진 URL                        |
| category     | VARCHAR(50)                | nullable       | 카테고리                        |
| phone        | VARCHAR(20)                | nullable       | 전화번호                        |
| description  | TEXT                       | nullable       | 소개글                          |
| hoursWeekday | VARCHAR(50)                | nullable       | 평일 영업시간                   |
| hoursWeekend | VARCHAR(50)                | nullable       | 주말 영업시간                   |
| breakTime    | VARCHAR(50)                | nullable       | 브레이크타임                    |
| createdAt    | DATETIME                   | NOT NULL       | 등록일 (@CreateDateColumn)      |
| updatedAt    | DATETIME                   | NOT NULL       | 수정일 (@UpdateDateColumn)      |

**관계**
- `@OneToMany` → `pin` (restaurantId)
- `@OneToMany` → `restaurant_menu` (restaurantId)

**소유권 주의:** `userId`가 `null`이면 공용 레코드로 간주하여 누구나 수정 가능. 추후 정책 재검토 필요.

---

### restaurant_menu

식당 메뉴. restaurant와 1:N.

| 컬럼         | 타입         | 제약     | 설명                                |
| ------------ | ------------ | -------- | ----------------------------------- |
| id           | INT (PK, AI) | NOT NULL | 고유 ID                             |
| restaurantId | INT (FK)     | NOT NULL | restaurant.id (onDelete: CASCADE)   |
| name         | VARCHAR(100) | NOT NULL | 메뉴명                              |
| price        | INT          | NOT NULL | 가격 (원)                           |
| isPopular    | BOOLEAN      | DEFAULT false | 인기 메뉴 여부                 |
| emoji        | VARCHAR(8)   | nullable | 이모지                              |

---

### pin

유저가 식당에 남긴 별점·메모. `(userId, restaurantId)` 복합 UNIQUE.

| 컬럼         | 타입         | 제약                    | 설명                              |
| ------------ | ------------ | ----------------------- | --------------------------------- |
| id           | INT (PK, AI) | NOT NULL                | 고유 ID                           |
| userId       | INT (FK)     | NOT NULL                | user.id (onDelete: CASCADE)       |
| restaurantId | INT (FK)     | NOT NULL                | restaurant.id (onDelete: CASCADE) |
| rating       | TINYINT UNSIGNED | DEFAULT 3           | 별점 (1~5)                        |
| memo         | TEXT         | nullable                | 메모                              |
| createdAt    | DATETIME     | NOT NULL                | 등록일 (@CreateDateColumn)        |
| updatedAt    | DATETIME     | NOT NULL                | 수정일 (@UpdateDateColumn)        |

**제약**
- `@Unique(['userId', 'restaurantId'])` — 한 유저가 한 식당에 핀 1개만 등록 가능

---

## TypeORM 컬럼 타입 패턴

| 의미            | 코드 패턴                                                      |
| --------------- | -------------------------------------------------------------- |
| 필수 문자열     | `@Column({ length: 100 })`                                    |
| 선택 문자열     | `@Column({ type: 'varchar', length: 255, nullable: true })`   |
| 좌표            | `@Column('decimal', { precision: 10, scale: 7 })`            |
| 장문 텍스트     | `@Column({ type: 'text', nullable: true })`                   |
| 작은 양수 정수  | `@Column({ type: 'tinyint', unsigned: true })`                |
| 불리언          | `@Column({ type: 'boolean', default: false })`                |
| 생성 시각       | `@CreateDateColumn()`                                         |
| 수정 시각       | `@UpdateDateColumn()`                                         |
| PK              | `@PrimaryGeneratedColumn()`                                   |

## TypeORM 관계 정의 패턴

```typescript
// ManyToOne (항상 onDelete: 'CASCADE' + @JoinColumn 명시)
@ManyToOne(() => User, (user) => user.pins, { onDelete: 'CASCADE' })
@JoinColumn({ name: 'userId' })
user: User;

@Column()
userId: number;  // 관계 객체와 ID 둘 다 접근 가능하도록 별도 정의

// OneToMany
@OneToMany(() => Pin, (pin) => pin.restaurant)
pins: Pin[];

// relations 로딩 (TypeORM v0.3+ 객체 형태)
this.repo.find({ relations: { menus: true } })
this.repo.findOne({ where: { id }, relations: { user: true, restaurant: true } })

// select로 로딩 필드 제한
this.repo.find({
  relations: { user: true },
  select: { user: { id: true, nickname: true, profileImage: true } },
})
```

---

## 갱신 트리거

이 파일을 갱신해야 하는 경우.
- 새 엔티티 추가 시
- 기존 엔티티에 컬럼 추가/변경 시
- 테이블 간 관계 변경 시
