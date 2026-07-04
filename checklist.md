# 전국 식당 데이터 100개 추가 체크리스트

## 데이터 작성
- [x] 전국 시·군 단위 102개 식당 (지역명 + 대표메뉴, 실제 중심 좌표)
- [x] 이미지는 검증 완료된 카테고리별 Unsplash URL 재사용 (id 홀짝 2종 로테이션)
- [x] 카테고리 균형 배분

## 라이브 DB 패치 (기존 핀 유지)
- [x] 새 식당 102개 INSERT (cmd 리다이렉트, UTF-8)
- [x] photoUrl UPDATE (photoUrl IS NULL → 새 식당만)
- [x] 부가정보 UPDATE (description IS NULL → 새 식당만)
- [x] 메뉴 INSERT (메뉴 없는 식당에만 JOIN 일괄)

## db.sql 반영
- [x] INSERT + photoUrl UPDATE 블록을 db.sql에 추가 (부가정보/메뉴는 기존 블록이 자동 커버)

## 검증
- [x] 라이브: 총 172개, 메뉴 783개, 사진/소개 누락 0, 한글 정상
- [x] db.sql: 임시 DB 재현 시 172개/783개 동일 (검증 후 DROP)
