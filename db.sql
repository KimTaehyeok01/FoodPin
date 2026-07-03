SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS foodpin
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE foodpin;

CREATE TABLE IF NOT EXISTS `user` (
  `id`           INT              NOT NULL AUTO_INCREMENT,
  `provider`     VARCHAR(20)      NULL,
  `providerId`   VARCHAR(100)     NULL,
  `email`        VARCHAR(255)     NULL UNIQUE,
  `password`     VARCHAR(255)     NULL,
  `nickname`     VARCHAR(50)      NOT NULL,
  `profileImage` VARCHAR(255)     NULL,
  `address`      VARCHAR(255)     NULL,
  `age`          TINYINT UNSIGNED NULL,
  `createdAt`    DATETIME(6)      NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `restaurant` (
  `id`        INT            NOT NULL AUTO_INCREMENT,
  `userId`    INT            NULL,
  `name`      VARCHAR(100)   NOT NULL,
  `latitude`  DECIMAL(10,7)  NOT NULL,
  `longitude` DECIMAL(10,7)  NOT NULL,
  `address`   VARCHAR(255)   NULL,
  `photoUrl`  VARCHAR(500)   NULL,
  `category`  VARCHAR(50)    NULL,
  `createdAt` DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `pin` (
  `id`           INT              NOT NULL AUTO_INCREMENT,
  `userId`       INT              NOT NULL,
  `restaurantId` INT              NOT NULL,
  `rating`       TINYINT UNSIGNED NOT NULL DEFAULT 3,
  `memo`         TEXT             NULL,
  `createdAt`    DATETIME(6)      NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt`    DATETIME(6)      NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_pin_user_restaurant` (`userId`, `restaurantId`),
  CONSTRAINT `FK_pin_user`       FOREIGN KEY (`userId`)       REFERENCES `user`       (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_pin_restaurant` FOREIGN KEY (`restaurantId`) REFERENCES `restaurant` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_favorite_category` (
  `id`       INT         NOT NULL AUTO_INCREMENT,
  `userId`   INT         NOT NULL,
  `category` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `FK_ufc_user` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 기존 데이터 초기화 ──
TRUNCATE TABLE pin;
DELETE FROM restaurant;
ALTER TABLE restaurant AUTO_INCREMENT = 1;

-- ── 식당 샘플 데이터 ──
INSERT INTO restaurant (name, latitude, longitude, address, photoUrl, category, createdAt, updatedAt) VALUES
('광화문 국밥', 37.5720, 126.9769, '서울 종로구 세종대로 175', 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80', '한식', NOW(), NOW()),
('을지로 노가리골목', 37.5658, 126.9833, '서울 중구 을지로 119', 'https://images.unsplash.com/photo-1436076863939-06870fe779c2?w=800&q=80', '술집/포차', NOW(), NOW()),
('신사동 가로수길 파스타', 37.5227, 127.0226, '서울 강남구 압구정로 12길 18', 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800&q=80', '양식', NOW(), NOW()),
('합정 돼지갈비', 37.5494, 126.9137, '서울 마포구 양화로 61', 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80', '고기/구이', NOW(), NOW()),
('홍대 떡볶이 천국', 37.5573, 126.9245, '서울 마포구 와우산로 29길 5', 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800&q=80', '분식', NOW(), NOW()),
('이태원 수제버거', 37.5345, 126.9940, '서울 용산구 이태원로 177', 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&q=80', '패스트푸드', NOW(), NOW()),
('강남 스시 오마카세', 37.4979, 127.0276, '서울 강남구 테헤란로 152', 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80', '일식', NOW(), NOW()),
('삼청동 수제비', 37.5823, 126.9811, '서울 종로구 삼청로 78', 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=800&q=80', '한식', NOW(), NOW()),
('연남동 베이글', 37.5627, 126.9248, '서울 마포구 연남로 42', 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&q=80', '카페/디저트', NOW(), NOW()),
('성수동 카페 어니언', 37.5444, 127.0556, '서울 성동구 아차산로9길 8', 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80', '카페/디저트', NOW(), NOW()),
('부암동 자하손만두', 37.5947, 126.9617, '서울 종로구 창의문로 5길 2', 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&q=80', '한식', NOW(), NOW()),
('망원동 쭈꾸미볶음', 37.5553, 126.9073, '서울 마포구 망원로 68', 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80', '한식', NOW(), NOW()),
('북촌 바지락 칼국수', 37.5816, 126.9791, '서울 종로구 북촌로 24', 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&q=80', '한식', NOW(), NOW()),
('압구정 돈코츠라멘', 37.5273, 127.0290, '서울 강남구 압구정로 46길 55', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80', '일식', NOW(), NOW()),
('서촌 경양식', 37.5786, 126.9699, '서울 종로구 자하문로 10', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80', '양식', NOW(), NOW()),
('마포 양꼬치', 37.5442, 126.9511, '서울 마포구 마포대로 51', 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800&q=80', '중식', NOW(), NOW()),
('건대 치킨집', 37.5401, 127.0695, '서울 광진구 능동로 209', 'https://images.unsplash.com/photo-1562967914-608f82629710?w=800&q=80', '치킨/피자', NOW(), NOW()),
('종각 한식 점심 맛집', 37.5700, 126.9825, '서울 종로구 종로 19', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80', '한식', NOW(), NOW()),
('한남동 수제맥주', 37.5365, 126.9994, '서울 용산구 이태원로 55나길 11', 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=800&q=80', '술집/포차', NOW(), NOW()),
('익선동 한옥카페', 37.5744, 126.9937, '서울 종로구 수표로 28길 17', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80', '카페/디저트', NOW(), NOW()),
('을지로 대창구이', 37.5660, 126.9857, '서울 중구 을지로 130', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80', '고기/구이', NOW(), NOW()),
('신림 순대타운', 37.4847, 126.9290, '서울 관악구 신림로 309', 'https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=800&q=80', '한식', NOW(), NOW()),
('상수동 화덕피자', 37.5489, 126.9221, '서울 마포구 와우산로 17길 9', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80', '치킨/피자', NOW(), NOW()),
('충무로 짬뽕 중화요리', 37.5613, 126.9934, '서울 중구 충무로 29', 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=800&q=80', '중식', NOW(), NOW()),
('낙원동 콩나물해장국', 37.5744, 126.9893, '서울 종로구 낙원동 283', 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=800&q=80', '한식', NOW(), NOW()),
('연희동 이탈리안', 37.5714, 126.9300, '서울 서대문구 연희로 91', 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=800&q=80', '양식', NOW(), NOW()),
('서래마을 브런치카페', 37.5040, 126.9966, '서울 서초구 반포대로 59', 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=800&q=80', '카페/디저트', NOW(), NOW()),
('강동 삼겹살 마당', 37.5304, 127.1238, '서울 강동구 천호대로 175', 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&q=80', '고기/구이', NOW(), NOW()),
('노량진 해산물', 37.5138, 126.9420, '서울 동작구 노량진로 7', 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=800&q=80', '해산물', NOW(), NOW()),
('광장시장 빈대떡', 37.5699, 126.9993, '서울 종로구 창경궁로 88', 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80', '한식', NOW(), NOW());

-- ── 전국 맛집 샘플 데이터 ──
INSERT INTO restaurant (name, latitude, longitude, address, photoUrl, category, createdAt, updatedAt) VALUES
('해운대 밀면', 35.1631, 129.1635, '부산 해운대구 구남로 21', 'https://images.unsplash.com/photo-1526318472351-c75fcf070305?w=800&q=80', '한식', NOW(), NOW()),
('광안리 조개구이', 35.1532, 129.1183, '부산 수영구 광안해변로 219', 'https://images.unsplash.com/photo-1547928576-b822bc410bdf?w=800&q=80', '해산물', NOW(), NOW()),
('서면 돼지국밥', 35.1579, 129.0594, '부산 부산진구 서면로 39', 'https://images.unsplash.com/photo-1590330297626-d7aff25a0431?w=800&q=80', '한식', NOW(), NOW()),
('자갈치 회센터', 35.0966, 129.0306, '부산 중구 자갈치해안로 52', 'https://images.unsplash.com/photo-1554679665-f5537f187268?w=800&q=80', '해산물', NOW(), NOW()),
('동성로 막창골목', 35.8690, 128.5936, '대구 중구 동성로 30', 'https://images.unsplash.com/photo-1550317138-10000687a72b?w=800&q=80', '고기/구이', NOW(), NOW()),
('서문시장 납작만두', 35.8686, 128.5828, '대구 중구 큰장로26길 45', 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=800&q=80', '분식', NOW(), NOW()),
('차이나타운 짜장면', 37.4738, 126.6176, '인천 중구 차이나타운로 43', 'https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=800&q=80', '중식', NOW(), NOW()),
('송도 브런치카페', 37.3891, 126.6392, '인천 연수구 송도과학로 32', 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=800&q=80', '카페/디저트', NOW(), NOW()),
('송정 떡갈비', 35.1380, 126.7935, '광주 광산구 광산로29번길 1', 'https://images.unsplash.com/photo-1583835746434-cf1534674b41?w=800&q=80', '고기/구이', NOW(), NOW()),
('충장로 상추튀김', 35.1468, 126.9182, '광주 동구 충장로 94', 'https://images.unsplash.com/photo-1532636875304-0c89119d9b4d?w=800&q=80', '분식', NOW(), NOW()),
('은행동 베이커리', 36.3277, 127.4272, '대전 중구 대종로480번길 15', 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80', '카페/디저트', NOW(), NOW()),
('유성 손칼국수', 36.3541, 127.3413, '대전 유성구 온천로 45', 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800&q=80', '한식', NOW(), NOW()),
('언양 불고기', 35.5665, 129.1244, '울산 울주군 언양읍 헌양길 1', 'https://images.unsplash.com/photo-1567337710282-00832b415979?w=800&q=80', '고기/구이', NOW(), NOW()),
('제주 흑돼지 명가', 33.5141, 126.5253, '제주 제주시 관덕로15길 25', 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=800&q=80', '고기/구이', NOW(), NOW()),
('애월 바다뷰 카페', 33.4630, 126.3109, '제주 제주시 애월읍 애월로 27', 'https://images.unsplash.com/photo-1541014741259-de529411b96a?w=800&q=80', '카페/디저트', NOW(), NOW()),
('성산 해물뚝배기', 33.4587, 126.9425, '제주 서귀포시 성산읍 일출로 74', 'https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?w=800&q=80', '해산물', NOW(), NOW()),
('제주 고기국수', 33.4996, 126.5312, '제주 제주시 중앙로 63', 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=800&q=80', '한식', NOW(), NOW()),
('초당 순두부', 37.7910, 128.9179, '강원 강릉시 초당순두부길 77', 'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=800&q=80', '한식', NOW(), NOW()),
('안목해변 커피거리', 37.7719, 128.9470, '강원 강릉시 창해로14번길 20-1', 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=800&q=80', '카페/디저트', NOW(), NOW()),
('속초 닭강정', 38.2070, 128.5918, '강원 속초시 중앙로147번길 16', 'https://images.unsplash.com/photo-1615887023544-3a566f29d822?w=800&q=80', '치킨/피자', NOW(), NOW()),
('대포항 물회', 38.1911, 128.6015, '강원 속초시 대포항길 24', 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80', '해산물', NOW(), NOW()),
('춘천 닭갈비 골목', 37.8813, 127.7300, '강원 춘천시 금강로62번길 6', 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=800&q=80', '한식', NOW(), NOW()),
('한옥마을 비빔밥', 35.8150, 127.1530, '전북 전주시 완산구 태조로 44', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80', '한식', NOW(), NOW()),
('남부시장 콩나물국밥', 35.8123, 127.1470, '전북 전주시 완산구 풍남문2길 63', 'https://images.unsplash.com/photo-1493770348161-369560ae357d?w=800&q=80', '한식', NOW(), NOW()),
('군산 중화짬뽕', 35.9678, 126.7366, '전북 군산시 대학로 86', 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=800&q=80', '중식', NOW(), NOW()),
('여수 게장백반', 34.7365, 127.7460, '전남 여수시 봉산남3길 17', 'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=800&q=80', '한식', NOW(), NOW()),
('목포 낙지초무침', 34.7936, 126.3886, '전남 목포시 해안로 249', 'https://images.unsplash.com/photo-1553163147-622ab57be1c7?w=800&q=80', '해산물', NOW(), NOW()),
('담양 떡갈비 정식', 35.3213, 126.9880, '전남 담양군 담양읍 죽향대로 1121', 'https://images.unsplash.com/photo-1544510808-91bcbee1df55?w=800&q=80', '고기/구이', NOW(), NOW()),
('황리단길 파스타', 35.8375, 129.2100, '경북 경주시 포석로 1080', 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&q=80', '양식', NOW(), NOW()),
('황남 김밥', 35.8384, 129.2115, '경북 경주시 탑리3길 2', 'https://images.unsplash.com/photo-1580651214613-f4692d6d138f?w=800&q=80', '분식', NOW(), NOW()),
('안동 찜닭 골목', 36.5684, 128.7294, '경북 안동시 번영1길 47', 'https://images.unsplash.com/photo-1598866594230-a7c12756260f?w=800&q=80', '한식', NOW(), NOW()),
('죽도시장 물회', 36.0190, 129.3435, '경북 포항시 북구 죽도시장13길 13-1', 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800&q=80', '해산물', NOW(), NOW()),
('통영 굴 전문점', 34.8544, 128.4331, '경남 통영시 통영해안로 205', 'https://images.unsplash.com/photo-1484980972926-edee96e0960d?w=800&q=80', '해산물', NOW(), NOW()),
('마산 아구찜 거리', 35.2281, 128.6811, '경남 창원시 마산합포구 오동동10길 6', 'https://images.unsplash.com/photo-1506354666786-959d6d497f1a?w=800&q=80', '해산물', NOW(), NOW()),
('수원 왕갈비', 37.2812, 127.0139, '경기 수원시 팔달구 정조로 800', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80', '고기/구이', NOW(), NOW()),
('의정부 부대찌개 거리', 37.7381, 127.0337, '경기 의정부시 태평로73번길 20', 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80', '한식', NOW(), NOW()),
('판교 수제버거', 37.3947, 127.1112, '경기 성남시 분당구 판교역로146번길 20', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80', '패스트푸드', NOW(), NOW()),
('일산 화덕피자', 37.6584, 126.7699, '경기 고양시 일산동구 중앙로1275번길 38-10', 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=800&q=80', '치킨/피자', NOW(), NOW()),
('천안 호두과자 명가', 36.8151, 127.1139, '충남 천안시 동남구 중앙로 92', 'https://images.unsplash.com/photo-1543826173-70651703c5a4?w=800&q=80', '카페/디저트', NOW(), NOW()),
('청주 삼겹살 거리', 36.6424, 127.4890, '충북 청주시 상당구 서문시장길 20', 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=800&q=80', '고기/구이', NOW(), NOW());
