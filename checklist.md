# 식당 상세 페이지 체크리스트

## 백엔드
- [x] GET /pins/restaurant/:restaurantId — 식당별 핀 목록 (작성자 닉네임 포함, 비밀번호 등 민감정보 제외)

## 프론트엔드
- [x] pinsApi.getForRestaurant + RestaurantPin 타입 추가
- [x] RestaurantDetailPage.tsx / .css 생성 (모바일 퍼스트)
- [x] App.tsx에 /restaurants/:id 라우트 추가
- [x] 사진 헤더 + 이름/카테고리/주소 + 평균 별점/핀 수
- [x] 미니 지도 (MapView 재사용) + 카카오맵 길찾기 링크
- [x] 내 핀 영역 — 핀하기/수정/해제 (PinForm 재사용)
- [x] 다른 유저 핀 목록 (닉네임 + 별점 + 메모)
- [x] 홈 식당 카드 / HOT 카드 클릭 → 상세 이동
- [x] 태블릿/PC 반응형 (960px, 1280px)

## 검증
- [x] frontend tsc 통과
- [x] backend tsc 통과
- [ ] 브라우저 실제 동작 확인 (사용자)
