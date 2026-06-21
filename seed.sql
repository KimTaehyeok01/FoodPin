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
('광화문 국밥', 37.5720, 126.9769, '서울 종로구 세종대로 175', NULL, '한식', NOW(), NOW()),
('을지로 노가리골목', 37.5658, 126.9833, '서울 중구 을지로 119', NULL, '술집/포차', NOW(), NOW()),
('신사동 가로수길 파스타', 37.5227, 127.0226, '서울 강남구 압구정로 12길 18', NULL, '양식', NOW(), NOW()),
('합정 돼지갈비', 37.5494, 126.9137, '서울 마포구 양화로 61', NULL, '고기/구이', NOW(), NOW()),
('홍대 떡볶이 천국', 37.5573, 126.9245, '서울 마포구 와우산로 29길 5', NULL, '분식', NOW(), NOW()),
('이태원 수제버거', 37.5345, 126.9940, '서울 용산구 이태원로 177', NULL, '패스트푸드', NOW(), NOW()),
('강남 스시 오마카세', 37.4979, 127.0276, '서울 강남구 테헤란로 152', NULL, '일식', NOW(), NOW()),
('삼청동 수제비', 37.5823, 126.9811, '서울 종로구 삼청로 78', NULL, '한식', NOW(), NOW()),
('연남동 베이글', 37.5627, 126.9248, '서울 마포구 연남로 42', NULL, '카페/디저트', NOW(), NOW()),
('성수동 카페 어니언', 37.5444, 127.0556, '서울 성동구 아차산로9길 8', NULL, '카페/디저트', NOW(), NOW()),
('부암동 자하손만두', 37.5947, 126.9617, '서울 종로구 창의문로 5길 2', NULL, '한식', NOW(), NOW()),
('망원동 쭈꾸미볶음', 37.5553, 126.9073, '서울 마포구 망원로 68', NULL, '한식', NOW(), NOW()),
('북촌 바지락 칼국수', 37.5816, 126.9791, '서울 종로구 북촌로 24', NULL, '한식', NOW(), NOW()),
('압구정 돈코츠라멘', 37.5273, 127.0290, '서울 강남구 압구정로 46길 55', NULL, '일식', NOW(), NOW()),
('서촌 경양식', 37.5786, 126.9699, '서울 종로구 자하문로 10', NULL, '양식', NOW(), NOW()),
('마포 양꼬치', 37.5442, 126.9511, '서울 마포구 마포대로 51', NULL, '중식', NOW(), NOW()),
('건대 치킨집', 37.5401, 127.0695, '서울 광진구 능동로 209', NULL, '치킨/피자', NOW(), NOW()),
('종각 한식 점심 맛집', 37.5700, 126.9825, '서울 종로구 종로 19', NULL, '한식', NOW(), NOW()),
('한남동 수제맥주', 37.5365, 126.9994, '서울 용산구 이태원로 55나길 11', NULL, '술집/포차', NOW(), NOW()),
('익선동 한옥카페', 37.5744, 126.9937, '서울 종로구 수표로 28길 17', NULL, '카페/디저트', NOW(), NOW()),
('을지로 대창구이', 37.5660, 126.9857, '서울 중구 을지로 130', NULL, '고기/구이', NOW(), NOW()),
('신림 순대타운', 37.4847, 126.9290, '서울 관악구 신림로 309', NULL, '한식', NOW(), NOW()),
('상수동 화덕피자', 37.5489, 126.9221, '서울 마포구 와우산로 17길 9', NULL, '치킨/피자', NOW(), NOW()),
('충무로 짬뽕 중화요리', 37.5613, 126.9934, '서울 중구 충무로 29', NULL, '중식', NOW(), NOW()),
('낙원동 콩나물해장국', 37.5744, 126.9893, '서울 종로구 낙원동 283', NULL, '한식', NOW(), NOW()),
('연희동 이탈리안', 37.5714, 126.9300, '서울 서대문구 연희로 91', NULL, '양식', NOW(), NOW()),
('서래마을 브런치카페', 37.5040, 126.9966, '서울 서초구 반포대로 59', NULL, '카페/디저트', NOW(), NOW()),
('강동 삼겹살 마당', 37.5304, 127.1238, '서울 강동구 천호대로 175', NULL, '고기/구이', NOW(), NOW()),
('노량진 해산물', 37.5138, 126.9420, '서울 동작구 노량진로 7', NULL, '해산물', NOW(), NOW()),
('광장시장 빈대떡', 37.5699, 126.9993, '서울 종로구 창경궁로 88', NULL, '한식', NOW(), NOW());
