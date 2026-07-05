// 알림 데이터를 조회 시점에 계산하는 서비스 (근처 새 맛집 + 내 핀 식당의 새 리뷰)
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, MoreThanOrEqual, Not, Repository } from 'typeorm';
import { Restaurant } from '../restaurants/restaurant.entity';
import { Pin } from '../pins/pin.entity';

const NEARBY_RADIUS_KM = 5;
const NEARBY_DAYS = 3; // 최근 3일 이내 등록된 식당만 새 맛집 알림
const NEARBY_LIMIT = 5;
const REVIEW_LIMIT = 20;

export interface NotificationItem {
  type: 'new_restaurant' | 'new_review';
  restaurantId: number;
  restaurantName: string;
  message: string;
  createdAt: Date;
}

// 두 좌표 사이 거리(km) — 하버사인
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurantRepo: Repository<Restaurant>,
    @InjectRepository(Pin)
    private readonly pinRepo: Repository<Pin>,
  ) {}

  async getNotifications(
    userId: number,
    lat?: number,
    lng?: number,
  ): Promise<NotificationItem[]> {
    const items: NotificationItem[] = [];

    // 1. 내가 핀한 식당에 남겨진 다른 사람의 리뷰
    const myPins = await this.pinRepo.find({ where: { userId } });
    const myRestaurantIds = myPins.map((p) => p.restaurantId);

    if (myRestaurantIds.length > 0) {
      const reviews = await this.pinRepo.find({
        where: { restaurantId: In(myRestaurantIds), userId: Not(userId) },
        relations: { user: true, restaurant: true },
        order: { createdAt: 'DESC' },
        take: REVIEW_LIMIT,
      });
      for (const r of reviews) {
        items.push({
          type: 'new_review',
          restaurantId: r.restaurantId,
          restaurantName: r.restaurant.name,
          message: `${r.user.nickname}님이 '${r.restaurant.name}'에 리뷰를 남겼어요`,
          createdAt: r.createdAt,
        });
      }
    }

    // 2. 근처(20km) 최근 등록된 새 맛집
    if (lat != null && lng != null) {
      const since = new Date(Date.now() - NEARBY_DAYS * 24 * 60 * 60 * 1000);
      const recent = await this.restaurantRepo.find({
        where: { createdAt: MoreThanOrEqual(since) },
        order: { createdAt: 'DESC' },
        take: 100,
      });
      const nearby = recent
        .filter(
          (r) =>
            haversineKm(lat, lng, Number(r.latitude), Number(r.longitude)) <=
            NEARBY_RADIUS_KM,
        )
        .slice(0, NEARBY_LIMIT);
      for (const r of nearby) {
        items.push({
          type: 'new_restaurant',
          restaurantId: r.id,
          restaurantName: r.name,
          message: `근처에 새 맛집 '${r.name}'이(가) 등록되었어요`,
          createdAt: r.createdAt,
        });
      }
    }

    // 최신순 정렬
    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return items;
  }
}
