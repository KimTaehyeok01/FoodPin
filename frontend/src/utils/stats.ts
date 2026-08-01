// 방문 이력(핀) 기반으로 마이페이지 통계를 계산하는 유틸 — 서버 없이 클라이언트에서 집계
import type { Pin } from '../api/restaurants';

export interface CategoryCount {
  category: string;
  count: number;
}

// 카테고리별 방문 개수 — null 카테고리는 "기타"로 묶고 개수 내림차순 정렬
export function getCategoryCounts(pins: Pin[]): CategoryCount[] {
  const counts = new Map<string, number>();
  for (const pin of pins) {
    const category = pin.restaurant.category ?? '기타';
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

export interface RatingCount {
  rating: number;
  count: number;
}

// 별점(1~5) 분포 — 핀이 없는 점수도 0으로 채워 5개 항목을 모두 반환
export function getRatingDistribution(pins: Pin[]): RatingCount[] {
  const counts: RatingCount[] = [1, 2, 3, 4, 5].map((rating) => ({ rating, count: 0 }));
  for (const pin of pins) {
    const entry = counts.find((c) => c.rating === pin.rating);
    if (entry) entry.count += 1;
  }
  return counts;
}

export interface MonthlyVisit {
  month: string;
  count: number;
}

// 최근 6개월 방문 추이 — 핀이 없는 달도 0으로 채워 시간순으로 반환
export function getMonthlyVisits(pins: Pin[]): MonthlyVisit[] {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: `${d.getMonth() + 1}월`,
    };
  });

  const counts = new Map(months.map((m) => [m.key, 0]));
  for (const pin of pins) {
    const created = new Date(pin.createdAt);
    const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`;
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return months.map((m) => ({ month: m.label, count: counts.get(m.key) ?? 0 }));
}

// 평균 별점 — 소수 첫째자리 반올림, 핀이 없으면 0
export function getAverageRating(pins: Pin[]): number {
  if (pins.length === 0) return 0;
  const sum = pins.reduce((acc, p) => acc + p.rating, 0);
  return Math.round((sum / pins.length) * 10) / 10;
}
