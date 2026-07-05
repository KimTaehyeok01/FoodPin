# 알림 기능 체크리스트

## 백엔드 (notifications 모듈)
- [x] notifications.module / controller / service 생성
- [x] GET /notifications?lat=&lng= (JWT) — 두 종류 통합 반환
  - [x] 근처 새 맛집: 위치 20km 내 최근 등록 식당 (createdAt DESC, 상위 5)
  - [x] 내 핀 식당 새 리뷰: 내가 핀한 식당의 타인 핀 (최근순, 상위 20)
- [x] app.module에 등록

## 프론트
- [x] notificationsApi.get(lat, lng) + NotificationItem 타입
- [x] NotificationsPage + CSS (모바일 퍼스트)
- [x] App.tsx 라우트 /notifications
- [x] HomePage 벨 아이콘 → /notifications 이동 + 안읽음 빨간 점
- [x] 알림 클릭 → 해당 식당 상세로 이동
- [x] 태블릿/PC 반응형

## 검증
- [x] frontend/backend tsc 통과
- [ ] 브라우저 실동작 확인 (사용자)
