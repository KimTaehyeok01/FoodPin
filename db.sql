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
