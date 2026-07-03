# 식당 상세 페이지 — 컨텍스트 노트

- 식당별 핀 조회 API는 PinsController에 배치 (`GET /pins/restaurant/:restaurantId`).
  RestaurantsController에 두면 모듈 간 서비스 의존이 생겨서 핀 도메인에 유지.
- 앱 전체가 로그인 뒤에 있으므로(PrivateRoute) 이 API도 JWT 가드 유지.
- 응답에서 user는 id/nickname/profileImage만 select — password 등 유출 방지.
- 상세 페이지 미니 지도는 기존 MapView(KakaoMap.tsx) 재사용, 클릭 핸들러 없이 표시 전용.
- 길찾기는 카카오맵 URL 스킴(https://map.kakao.com/link/to/이름,위도,경도) 사용 — API 불필요.
- 내 핀 편집은 기존 PinForm(바텀시트) 재사용. MapPage와 동일한 핸들러 패턴.
- 내 핀 판별은 pinsApi.getMyPins()와 restaurantId 매칭으로 처리 (별도 me API 불필요).
