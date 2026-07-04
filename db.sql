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
  `address`      VARCHAR(255)  NULL,
  `photoUrl`     VARCHAR(500)  NULL,
  `category`     VARCHAR(50)   NULL,
  `phone`        VARCHAR(20)   NULL,
  `description`  TEXT          NULL,
  `hoursWeekday` VARCHAR(50)   NULL,
  `hoursWeekend` VARCHAR(50)   NULL,
  `breakTime`    VARCHAR(50)   NULL,
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

CREATE TABLE IF NOT EXISTS `restaurant_menu` (
  `id`           INT          NOT NULL AUTO_INCREMENT,
  `restaurantId` INT          NOT NULL,
  `name`         VARCHAR(100) NOT NULL,
  `price`        INT          NOT NULL,
  `isPopular`    TINYINT(1)   NOT NULL DEFAULT 0,
  `emoji`        VARCHAR(8)   NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `FK_menu_restaurant` FOREIGN KEY (`restaurantId`) REFERENCES `restaurant` (`id`) ON DELETE CASCADE
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

-- ── 전국 시·군 맛집 100개 추가 ──
INSERT INTO restaurant (name, latitude, longitude, address, category, createdAt, updatedAt) VALUES
-- 경기
('성남 정자동 순대국', 37.3670, 127.1080, '경기 성남시 분당구 정자일로 121', '한식', NOW(), NOW()),
('부천 역곡 떡볶이', 37.4840, 126.8110, '경기 부천시 소사로 758', '분식', NOW(), NOW()),
('안양 일번가 파스타', 37.3940, 126.9560, '경기 안양시 만안구 안양로 289', '양식', NOW(), NOW()),
('안산 대부도 조개구이', 37.2620, 126.6180, '경기 안산시 단원구 대부황금로 0', '해산물', NOW(), NOW()),
('평택 국제대 갈비탕', 36.9920, 127.1120, '경기 평택시 평택로 51', '한식', NOW(), NOW()),
('시흥 오이도 회센터', 37.3450, 126.6870, '경기 시흥시 오이도로 175', '해산물', NOW(), NOW()),
('김포 장기동 브런치', 37.6420, 126.6680, '경기 김포시 김포한강8로 111', '카페/디저트', NOW(), NOW()),
('광명 철산 짜장면', 37.4790, 126.8660, '경기 광명시 철산로 20', '중식', NOW(), NOW()),
('남양주 다산 곱창', 37.6110, 127.1560, '경기 남양주시 다산중앙로 20', '고기/구이', NOW(), NOW()),
('파주 장단콩 두부', 37.7600, 126.7800, '경기 파주시 문산읍 방촌로 1364', '한식', NOW(), NOW()),
('화성 궁평항 물회', 37.1150, 126.7050, '경기 화성시 서신면 궁평항로 1049', '해산물', NOW(), NOW()),
('이천 쌀밥 정식', 37.2720, 127.4350, '경기 이천시 경충대로 2993', '한식', NOW(), NOW()),
('양평 옥천 냉면', 37.4920, 127.4880, '경기 양평군 옥천면 경강로 화계길 10', '한식', NOW(), NOW()),
('가평 잣두부 마을', 37.8310, 127.5100, '경기 가평군 가평읍 자라섬로 60', '한식', NOW(), NOW()),
('포천 이동 갈비', 37.8940, 127.2000, '경기 포천시 이동면 화동로 2270', '고기/구이', NOW(), NOW()),
('안성 서일농원 된장', 37.0080, 127.2700, '경기 안성시 일죽면 금일로 332-17', '한식', NOW(), NOW()),
('용인 백암 순대', 37.1620, 127.3480, '경기 용인시 처인구 백암면 백암로 1', '한식', NOW(), NOW()),
('의왕 왕송호수 카페', 37.3210, 126.9420, '경기 의왕시 왕송못동로 209', '카페/디저트', NOW(), NOW()),
-- 인천
('부평 문화의거리 치킨', 37.4930, 126.7230, '인천 부평구 부평문화로 42', '치킨/피자', NOW(), NOW()),
('계양 계산 백반', 37.5420, 126.7380, '인천 계양구 계산새로 88', '한식', NOW(), NOW()),
('강화 젓국갈비', 37.7470, 126.4880, '인천 강화군 강화읍 강화대로 405', '한식', NOW(), NOW()),
('영종도 을왕리 조개', 37.4470, 126.3720, '인천 중구 을왕동 을왕해안로 30', '해산물', NOW(), NOW()),
-- 강원
('원주 미로시장 만두', 37.3420, 127.9200, '강원 원주시 원일로 33', '한식', NOW(), NOW()),
('동해 묵호항 물회', 37.5510, 129.1150, '강원 동해시 일출로 22', '해산물', NOW(), NOW()),
('삼척 곰치국 식당', 37.4450, 129.1700, '강원 삼척시 새천년도로 456', '해산물', NOW(), NOW()),
('태백 물닭갈비', 37.1640, 128.9860, '강원 태백시 시장남1길 5', '한식', NOW(), NOW()),
('정선 곤드레밥', 37.3800, 128.6600, '강원 정선군 정선읍 봉양리 7', '한식', NOW(), NOW()),
('평창 메밀 막국수', 37.3700, 128.3900, '강원 평창군 봉평면 창동리 214', '한식', NOW(), NOW()),
('홍천 화로구이 한우', 37.6970, 127.8890, '강원 홍천군 홍천읍 상오안리 456', '고기/구이', NOW(), NOW()),
('횡성 안흥찐빵 카페', 37.4920, 127.9860, '강원 횡성군 안흥면 안흥로 55', '카페/디저트', NOW(), NOW()),
('양양 송이버섯 백반', 38.0750, 128.6190, '강원 양양군 양양읍 남문로 34', '한식', NOW(), NOW()),
-- 충북
('충주 중앙탑 매운탕', 36.9910, 127.9300, '충북 충주시 중앙탑면 탑평리 12', '해산물', NOW(), NOW()),
('제천 약채락 정식', 37.1320, 128.1900, '충북 제천시 의림대로 242', '한식', NOW(), NOW()),
('단양 마늘 떡갈비', 36.9840, 128.3650, '충북 단양군 단양읍 도전5길 31', '고기/구이', NOW(), NOW()),
('음성 설성 한우', 36.9400, 127.6900, '충북 음성군 음성읍 중앙로 15', '고기/구이', NOW(), NOW()),
('옥천 생선국수', 36.3060, 127.5710, '충북 옥천군 옥천읍 향수길 61', '한식', NOW(), NOW()),
-- 충남
('아산 온양 곰탕', 36.7900, 127.0040, '충남 아산시 온천대로 1440', '한식', NOW(), NOW()),
('서산 게국지 백반', 36.7820, 126.4500, '충남 서산시 호수공원9로 20', '해산물', NOW(), NOW()),
('당진 왜목마을 대하', 36.9350, 126.5340, '충남 당진시 석문면 왜목길 15', '해산물', NOW(), NOW()),
('공주 밤막걸리 포차', 36.4550, 127.1240, '충남 공주시 봉황로 55', '술집/포차', NOW(), NOW()),
('논산 강경 젓갈백반', 36.1560, 127.0130, '충남 논산시 강경읍 옥녀봉로 27', '한식', NOW(), NOW()),
('보령 대천항 회', 36.3200, 126.5100, '충남 보령시 신흑동 대천항중앙길 20', '해산물', NOW(), NOW()),
('홍성 광천 새우젓국밥', 36.6010, 126.6600, '충남 홍성군 광천읍 광천리 555', '한식', NOW(), NOW()),
('예산 국밥거리', 36.6800, 126.8440, '충남 예산군 예산읍 형제고개로 966', '한식', NOW(), NOW()),
('태안 안면도 바지락', 36.5100, 126.3300, '충남 태안군 안면읍 안면대로 5', '해산물', NOW(), NOW()),
-- 세종·대전
('세종 조치원 이탈리안', 36.6010, 127.2960, '세종 조치원읍 새내로 14', '양식', NOW(), NOW()),
('대전 둔산 삼겹살', 36.3510, 127.3780, '대전 서구 둔산로 100', '고기/구이', NOW(), NOW()),
('대전 신탄진 칼국수', 36.4700, 127.4300, '대전 대덕구 신탄진로 800', '한식', NOW(), NOW()),
-- 전북
('익산 황등 비빔밥', 35.9500, 126.9600, '전북 익산시 황등면 황등로 123', '한식', NOW(), NOW()),
('정읍 내장산 산채정식', 35.5700, 126.8600, '전북 정읍시 내장호반로 71', '한식', NOW(), NOW()),
('남원 광한루 추어탕', 35.4160, 127.3900, '전북 남원시 요천로 1379', '한식', NOW(), NOW()),
('김제 지평선 한정식', 35.8030, 126.8800, '전북 김제시 요촌동 성산길 5', '한식', NOW(), NOW()),
('부안 곰소 젓갈백반', 35.6300, 126.6100, '전북 부안군 진서면 곰소염전길 7', '해산물', NOW(), NOW()),
-- 전남
('순천 웃장 국밥', 34.9600, 127.4870, '전남 순천시 북문길 33', '한식', NOW(), NOW()),
('광양 불고기 명가', 34.9400, 127.7000, '전남 광양시 광양읍 서천1길 6', '고기/구이', NOW(), NOW()),
('나주 곰탕 본점', 35.0160, 126.7180, '전남 나주시 금성관길 6', '한식', NOW(), NOW()),
('무안 낙지 골목', 34.9900, 126.4800, '전남 무안군 무안읍 몽탄로 65', '해산물', NOW(), NOW()),
('보성 벌교 꼬막정식', 34.8400, 127.3400, '전남 보성군 벌교읍 채동선로 208', '해산물', NOW(), NOW()),
('해남 땅끝 한정식', 34.5700, 126.6000, '전남 해남군 해남읍 중앙1로 330', '한식', NOW(), NOW()),
('강진 남도 한정식', 34.6420, 126.7670, '전남 강진군 강진읍 탐진로 111', '한식', NOW(), NOW()),
-- 광주
('광주 상무지구 스시', 35.1520, 126.8480, '광주 서구 상무중앙로 100', '일식', NOW(), NOW()),
('광주 백운동 김치찌개', 35.1300, 126.9030, '광주 남구 백운로 200', '한식', NOW(), NOW()),
('광주 첨단 화덕피자', 35.2260, 126.8480, '광주 광산구 첨단중앙로 88', '치킨/피자', NOW(), NOW()),
-- 경북
('구미 인동 돼지국밥', 36.1080, 128.4180, '경북 구미시 인동중앙로 21', '한식', NOW(), NOW()),
('김천 김밥 골목', 36.1400, 128.1130, '경북 김천시 자산로 12', '분식', NOW(), NOW()),
('영주 풍기 인삼갈비', 36.8700, 128.5300, '경북 영주시 풍기읍 인삼로 20', '고기/구이', NOW(), NOW()),
('상주 곶감 카페', 36.4100, 128.1600, '경북 상주시 남성동 왕산로 45', '카페/디저트', NOW(), NOW()),
('문경 약돌돼지 구이', 36.5860, 128.1870, '경북 문경시 문경읍 새재로 555', '고기/구이', NOW(), NOW()),
('경산 하양 곱창', 35.9130, 128.8170, '경북 경산시 하양읍 하양로 108', '고기/구이', NOW(), NOW()),
('영덕 강구항 대게', 36.4050, 129.3700, '경북 영덕군 강구면 강구대게길 5', '해산물', NOW(), NOW()),
('울진 후포 대게', 36.6800, 129.4500, '경북 울진군 후포면 후포리 5', '해산물', NOW(), NOW()),
('청도 추어탕 마을', 35.6470, 128.7340, '경북 청도군 화양읍 청화로 100', '한식', NOW(), NOW()),
-- 경남
('진주 중앙시장 비빔밥', 35.1900, 128.0850, '경남 진주시 진주대로 1214', '한식', NOW(), NOW()),
('김해 내외동 갈비', 35.2340, 128.8790, '경남 김해시 김해대로 2385', '고기/구이', NOW(), NOW()),
('양산 통도사 산채', 35.4870, 129.0650, '경남 양산시 하북면 통도사로 108', '한식', NOW(), NOW()),
('거제 외포 대구탕', 34.9200, 128.7100, '경남 거제시 장목면 외포5길 10', '해산물', NOW(), NOW()),
('사천 삼천포 회', 34.9280, 128.0700, '경남 사천시 어시장길 60', '해산물', NOW(), NOW()),
('밀양 무안 돼지국밥', 35.5030, 128.7460, '경남 밀양시 무안면 무안리 200', '한식', NOW(), NOW()),
('남해 멸치쌈밥', 34.8380, 127.8920, '경남 남해군 남해읍 화전로 78', '해산물', NOW(), NOW()),
('하동 화개장터 재첩국', 35.1600, 127.6100, '경남 하동군 화개면 쌍계로 15', '한식', NOW(), NOW()),
-- 부산
('부산 동래 파전', 35.2040, 129.0840, '부산 동래구 명륜로 94', '한식', NOW(), NOW()),
('부산 기장 대게', 35.2440, 129.2130, '부산 기장군 기장읍 차성로 291', '해산물', NOW(), NOW()),
('부산 대연 밀면', 35.1360, 129.0840, '부산 남구 유엔평화로 45', '한식', NOW(), NOW()),
('부산 하단 곱창', 35.1060, 128.9660, '부산 사하구 낙동남로 1400', '고기/구이', NOW(), NOW()),
-- 대구
('대구 수성못 브런치', 35.8280, 128.6210, '대구 수성구 두산동 512', '카페/디저트', NOW(), NOW()),
('대구 상인동 막창', 35.8180, 128.5320, '대구 달서구 월배로 200', '고기/구이', NOW(), NOW()),
('대구 칠성시장 국수', 35.8830, 128.5960, '대구 북구 칠성시장로 28', '분식', NOW(), NOW()),
-- 울산
('울산 삼산 한우', 35.5390, 129.3350, '울산 남구 삼산로 300', '고기/구이', NOW(), NOW()),
('울산 방어진 회센터', 35.4960, 129.4280, '울산 동구 방어진순환도로 1000', '해산물', NOW(), NOW()),
-- 제주
('서귀포 매일올레시장 회', 33.2500, 126.5620, '제주 서귀포시 중정로 62', '해산물', NOW(), NOW()),
('중문 흑돼지 마을', 33.2440, 126.4200, '제주 서귀포시 중문동 천제연로 100', '고기/구이', NOW(), NOW()),
('한림 옹포 해물칼국수', 33.4100, 126.2700, '제주 제주시 한림읍 한림해안로 20', '해산물', NOW(), NOW()),
-- 서울 추가
('노원 공릉동 경양식', 37.6250, 127.0730, '서울 노원구 공릉로 195', '양식', NOW(), NOW()),
('강서 마곡 파스타', 37.5590, 126.8320, '서울 강서구 마곡중앙로 60', '양식', NOW(), NOW()),
('은평 연신내 닭갈비', 37.6190, 126.9210, '서울 은평구 연서로 200', '한식', NOW(), NOW()),
('성북 성신여대 카페', 37.5920, 127.0160, '서울 성북구 동소문로 100', '카페/디저트', NOW(), NOW()),
('동대문 신설동 곱창', 37.5760, 127.0250, '서울 동대문구 왕산로 100', '고기/구이', NOW(), NOW()),
('영등포 문래동 수제버거', 37.5170, 126.8950, '서울 영등포구 도림로 400', '패스트푸드', NOW(), NOW()),
('강북 수유리 순대국', 37.6380, 127.0250, '서울 강북구 도봉로 300', '한식', NOW(), NOW()),
('구로 신도림 양꼬치', 37.5090, 126.8910, '서울 구로구 새말로 100', '중식', NOW(), NOW()),
('금천 가산 부대찌개', 37.4770, 126.8830, '서울 금천구 가산디지털1로 100', '한식', NOW(), NOW()),
('송파 방이동 먹자골목', 37.5110, 127.1240, '서울 송파구 오금로 250', '술집/포차', NOW(), NOW());
-- ── 식당 부가정보 시드 (전화 / 영업시간 / 소개글) ──
UPDATE restaurant SET
  phone = CONCAT('0507-1234-', LPAD(id, 4, '0')),
  hoursWeekday = CASE
    WHEN category = '술집/포차' THEN '17:00 – 01:00'
    WHEN category = '카페/디저트' THEN '10:00 – 22:00'
    ELSE '11:00 – 21:00'
  END,
  hoursWeekend = CASE
    WHEN category = '술집/포차' THEN '17:00 – 02:00'
    WHEN category = '카페/디저트' THEN '10:00 – 23:00'
    ELSE '11:00 – 22:00'
  END,
  breakTime = CASE
    WHEN category IN ('카페/디저트', '술집/포차') THEN NULL
    ELSE '15:00 – 17:00'
  END,
  description = CASE category
    WHEN '한식' THEN '신선한 재료와 정성스러운 손맛으로 만든 가정식 한식을 선보입니다. 동네 주민들의 오랜 단골집.'
    WHEN '중식' THEN '불맛 가득한 정통 중화요리를 합리적인 가격에 즐길 수 있는 곳입니다.'
    WHEN '일식' THEN '매일 아침 공수한 신선한 재료로 정성껏 준비하는 일식 전문점입니다.'
    WHEN '양식' THEN '엄선한 재료로 만드는 캐주얼 다이닝. 데이트 코스로도 인기가 많습니다.'
    WHEN '분식' THEN '추억의 맛 그대로, 언제 와도 부담 없는 분식 맛집입니다.'
    WHEN '카페/디저트' THEN '직접 로스팅한 원두와 매일 굽는 디저트를 즐길 수 있는 공간입니다.'
    WHEN '치킨/피자' THEN '주문 즉시 조리하는 바삭한 치킨과 화덕 피자 전문점입니다.'
    WHEN '고기/구이' THEN '엄선된 국내산 고기를 합리적인 가격에 즐길 수 있는 구이 전문점입니다.'
    WHEN '해산물' THEN '산지 직송 싱싱한 해산물을 그날그날 들여와 최상의 맛을 냅니다.'
    WHEN '패스트푸드' THEN '수제 패티와 신선한 야채로 만드는 프리미엄 버거 하우스입니다.'
    WHEN '술집/포차' THEN '푸짐한 안주와 시원한 술 한잔, 하루의 피로를 풀기 좋은 곳입니다.'
    ELSE '정성을 다해 준비하는 동네 맛집입니다.'
  END
WHERE description IS NULL;

-- ── 카테고리별 메뉴 시드 ──
DELETE FROM restaurant_menu;

INSERT INTO restaurant_menu (restaurantId, name, price, isPopular, emoji)
SELECT id, '된장찌개 정식', 9500, 1, '🍲' FROM restaurant WHERE category = '한식';
INSERT INTO restaurant_menu (restaurantId, name, price, isPopular, emoji)
SELECT id, '제육볶음 정식', 10000, 0, '🍚' FROM restaurant WHERE category = '한식';
INSERT INTO restaurant_menu (restaurantId, name, price, isPopular, emoji)
SELECT id, '순두부찌개', 8500, 0, '🥘' FROM restaurant WHERE category = '한식';
INSERT INTO restaurant_menu (restaurantId, name, price, isPopular, emoji)
SELECT id, '비빔밥', 9000, 0, '🥗' FROM restaurant WHERE category = '한식';
INSERT INTO restaurant_menu (restaurantId, name, price, isPopular, emoji)
SELECT id, '갈비탕', 14000, 0, '🍖' FROM restaurant WHERE category = '한식';

INSERT INTO restaurant_menu (restaurantId, name, price, isPopular, emoji)
SELECT id, '짜장면', 7000, 1, '🍜' FROM restaurant WHERE category = '중식';
INSERT INTO restaurant_menu (restaurantId, name, price, isPopular, emoji)
SELECT id, '짬뽕', 8000, 0, '🍲' FROM restaurant WHERE category = '중식';
INSERT INTO restaurant_menu (restaurantId, name, price, isPopular, emoji)
SELECT id, '탕수육 (소)', 18000, 0, '🍖' FROM restaurant WHERE category = '중식';
INSERT INTO restaurant_menu (restaurantId, name, price, isPopular, emoji)
SELECT id, '볶음밥', 8000, 0, '🍚' FROM restaurant WHERE category = '중식';

INSERT INTO restaurant_menu (restaurantId, name, price, isPopular, emoji)
SELECT id, '모둠초밥', 16000, 1, '🍣' FROM restaurant WHERE category = '일식';
INSERT INTO restaurant_menu (restaurantId, name, price, isPopular, emoji)
SELECT id, '사케동', 15000, 0, '🍱' FROM restaurant WHERE category = '일식';
INSERT INTO restaurant_menu (restaurantId, name, price, isPopular, emoji)
SELECT id, '우동', 8000, 0, '🍜' FROM restaurant WHERE category = '일식';
INSERT INTO restaurant_menu (restaurantId, name, price, isPopular, emoji)
SELECT id, '가라아게', 12000, 0, '🍗' FROM restaurant WHERE category = '일식';

INSERT INTO restaurant_menu (restaurantId, name, price, isPopular, emoji)
SELECT id, '크림 파스타', 15000, 1, '🍝' FROM restaurant WHERE category = '양식';
INSERT INTO restaurant_menu (restaurantId, name, price, isPopular, emoji)
SELECT id, '토마토 파스타', 14000, 0, '🍝' FROM restaurant WHERE category = '양식';
INSERT INTO restaurant_menu (restaurantId, name, price, isPopular, emoji)
SELECT id, '마르게리타 피자', 16000, 0, '🍕' FROM restaurant WHERE category = '양식';
INSERT INTO restaurant_menu (restaurantId, name, price, isPopular, emoji)
SELECT id, '안심 스테이크', 29000, 0, '🥩' FROM restaurant WHERE category = '양식';

INSERT INTO restaurant_menu (restaurantId, name, price, isPopular, emoji)
SELECT id, '떡볶이', 5000, 1, '🌶️' FROM restaurant WHERE category = '분식';
INSERT INTO restaurant_menu (restaurantId, name, price, isPopular, emoji)
SELECT id, '김밥', 4000, 0, '🍙' FROM restaurant WHERE category = '분식';
INSERT INTO restaurant_menu (restaurantId, name, price, isPopular, emoji)
SELECT id, '순대', 6000, 0, '🥟' FROM restaurant WHERE category = '분식';
INSERT INTO restaurant_menu (restaurantId, name, price, isPopular, emoji)
SELECT id, '모둠튀김', 5000, 0, '🍤' FROM restaurant WHERE category = '분식';
INSERT INTO restaurant_menu (restaurantId, name, price, isPopular, emoji)
SELECT id, '라볶이', 7000, 0, '🍜' FROM restaurant WHERE category = '분식';

INSERT INTO restaurant_menu (restaurantId, name, price, isPopular, emoji)
SELECT id, '아메리카노', 4500, 1, '☕' FROM restaurant WHERE category = '카페/디저트';
INSERT INTO restaurant_menu (restaurantId, name, price, isPopular, emoji)
SELECT id, '카페라떼', 5000, 0, '🥛' FROM restaurant WHERE category = '카페/디저트';
INSERT INTO restaurant_menu (restaurantId, name, price, isPopular, emoji)
SELECT id, '크루아상', 4800, 0, '🥐' FROM restaurant WHERE category = '카페/디저트';
INSERT INTO restaurant_menu (restaurantId, name, price, isPopular, emoji)
SELECT id, '치즈케이크', 6500, 0, '🍰' FROM restaurant WHERE category = '카페/디저트';

INSERT INTO restaurant_menu (restaurantId, name, price, isPopular, emoji)
SELECT id, '후라이드 치킨', 19000, 1, '🍗' FROM restaurant WHERE category = '치킨/피자';
INSERT INTO restaurant_menu (restaurantId, name, price, isPopular, emoji)
SELECT id, '양념치킨', 20000, 0, '🍗' FROM restaurant WHERE category = '치킨/피자';
INSERT INTO restaurant_menu (restaurantId, name, price, isPopular, emoji)
SELECT id, '페퍼로니 피자', 21000, 0, '🍕' FROM restaurant WHERE category = '치킨/피자';
INSERT INTO restaurant_menu (restaurantId, name, price, isPopular, emoji)
SELECT id, '치즈볼', 6000, 0, '🧀' FROM restaurant WHERE category = '치킨/피자';

INSERT INTO restaurant_menu (restaurantId, name, price, isPopular, emoji)
SELECT id, '삼겹살 (150g)', 15000, 1, '🥓' FROM restaurant WHERE category = '고기/구이';
INSERT INTO restaurant_menu (restaurantId, name, price, isPopular, emoji)
SELECT id, '목살 (150g)', 14000, 0, '🥩' FROM restaurant WHERE category = '고기/구이';
INSERT INTO restaurant_menu (restaurantId, name, price, isPopular, emoji)
SELECT id, '양념갈비 (200g)', 22000, 0, '🍖' FROM restaurant WHERE category = '고기/구이';
INSERT INTO restaurant_menu (restaurantId, name, price, isPopular, emoji)
SELECT id, '된장찌개', 7000, 0, '🍲' FROM restaurant WHERE category = '고기/구이';
INSERT INTO restaurant_menu (restaurantId, name, price, isPopular, emoji)
SELECT id, '물냉면', 9000, 0, '🍜' FROM restaurant WHERE category = '고기/구이';

INSERT INTO restaurant_menu (restaurantId, name, price, isPopular, emoji)
SELECT id, '모둠회 (소)', 35000, 1, '🐟' FROM restaurant WHERE category = '해산물';
INSERT INTO restaurant_menu (restaurantId, name, price, isPopular, emoji)
SELECT id, '물회', 15000, 0, '🥣' FROM restaurant WHERE category = '해산물';
INSERT INTO restaurant_menu (restaurantId, name, price, isPopular, emoji)
SELECT id, '해물탕 (중)', 40000, 0, '🦐' FROM restaurant WHERE category = '해산물';
INSERT INTO restaurant_menu (restaurantId, name, price, isPopular, emoji)
SELECT id, '새우구이', 25000, 0, '🦞' FROM restaurant WHERE category = '해산물';

INSERT INTO restaurant_menu (restaurantId, name, price, isPopular, emoji)
SELECT id, '치즈버거 세트', 9500, 1, '🍔' FROM restaurant WHERE category = '패스트푸드';
INSERT INTO restaurant_menu (restaurantId, name, price, isPopular, emoji)
SELECT id, '더블버거 세트', 11500, 0, '🍔' FROM restaurant WHERE category = '패스트푸드';
INSERT INTO restaurant_menu (restaurantId, name, price, isPopular, emoji)
SELECT id, '감자튀김', 4000, 0, '🍟' FROM restaurant WHERE category = '패스트푸드';
INSERT INTO restaurant_menu (restaurantId, name, price, isPopular, emoji)
SELECT id, '콜라', 2500, 0, '🥤' FROM restaurant WHERE category = '패스트푸드';

INSERT INTO restaurant_menu (restaurantId, name, price, isPopular, emoji)
SELECT id, '노가리', 8000, 1, '🐟' FROM restaurant WHERE category = '술집/포차';
INSERT INTO restaurant_menu (restaurantId, name, price, isPopular, emoji)
SELECT id, '골뱅이무침', 15000, 0, '🐚' FROM restaurant WHERE category = '술집/포차';
INSERT INTO restaurant_menu (restaurantId, name, price, isPopular, emoji)
SELECT id, '계란말이', 10000, 0, '🥚' FROM restaurant WHERE category = '술집/포차';
INSERT INTO restaurant_menu (restaurantId, name, price, isPopular, emoji)
SELECT id, '생맥주 (500cc)', 4500, 0, '🍺' FROM restaurant WHERE category = '술집/포차';

-- 카테고리별 이미지 4~5종을 id 기준으로 순환 배정 (전체 식당 통일)
UPDATE restaurant SET photoUrl = CASE category
  WHEN '한식' THEN ELT((id % 5) + 1,
    'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80',
    'https://images.unsplash.com/photo-1590330297626-d7aff25a0431?w=800&q=80',
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
    'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=800&q=80',
    'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=800&q=80')
  WHEN '중식' THEN ELT((id % 4) + 1,
    'https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=800&q=80',
    'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800&q=80',
    'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=800&q=80',
    'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=800&q=80')
  WHEN '일식' THEN ELT((id % 5) + 1,
    'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80',
    'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
    'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=800&q=80',
    'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=800&q=80',
    'https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?w=800&q=80')
  WHEN '양식' THEN ELT((id % 5) + 1,
    'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800&q=80',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
    'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=800&q=80',
    'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=800&q=80',
    'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&q=80')
  WHEN '분식' THEN ELT((id % 5) + 1,
    'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800&q=80',
    'https://images.unsplash.com/photo-1559847844-5315695dadae?w=800&q=80',
    'https://images.unsplash.com/photo-1532636875304-0c89119d9b4d?w=800&q=80',
    'https://images.unsplash.com/photo-1580651214613-f4692d6d138f?w=800&q=80',
    'https://images.unsplash.com/photo-1635363638580-c2809d049eee?w=800&q=80')
  WHEN '카페/디저트' THEN ELT((id % 5) + 1,
    'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&q=80',
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80',
    'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80',
    'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=800&q=80')
  WHEN '치킨/피자' THEN ELT((id % 5) + 1,
    'https://images.unsplash.com/photo-1562967914-608f82629710?w=800&q=80',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
    'https://images.unsplash.com/photo-1615887023544-3a566f29d822?w=800&q=80',
    'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=800&q=80',
    'https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=800&q=80')
  WHEN '고기/구이' THEN ELT((id % 5) + 1,
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
    'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&q=80',
    'https://images.unsplash.com/photo-1550317138-10000687a72b?w=800&q=80',
    'https://images.unsplash.com/photo-1567337710282-00832b415979?w=800&q=80')
  WHEN '해산물' THEN ELT((id % 5) + 1,
    'https://images.unsplash.com/photo-1553621042-f6e147245754?w=800&q=80',
    'https://images.unsplash.com/photo-1547928576-b822bc410bdf?w=800&q=80',
    'https://images.unsplash.com/photo-1554679665-f5537f187268?w=800&q=80',
    'https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?w=800&q=80',
    'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80')
  WHEN '패스트푸드' THEN ELT((id % 4) + 1,
    'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&q=80',
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
    'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80',
    'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=800&q=80')
  WHEN '술집/포차' THEN ELT((id % 5) + 1,
    'https://images.unsplash.com/photo-1436076863939-06870fe779c2?w=800&q=80',
    'https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=800&q=80',
    'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80',
    'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&q=80',
    'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800&q=80')
END
WHERE category IS NOT NULL;
