// 방문 이력(핀) 기반으로 뱃지 달성 여부를 계산하는 유틸 — 서버 없이 클라이언트에서 판정
import type { Pin } from '../api/restaurants';

export interface BadgeDef {
  id: string;
  emoji: string;
  label: string;
  description: string;
  target: number;
  getProgress: (pins: Pin[]) => number;
}

export const BADGE_DEFS: BadgeDef[] = [
  {
    id: 'first-visit',
    emoji: '🎉',
    label: '첫 방문',
    description: '첫 식당을 핀하면 획득',
    target: 1,
    getProgress: (pins) => pins.length,
  },
  {
    id: 'visit-10',
    emoji: '🍽️',
    label: '10곳 달성',
    description: '식당 10곳을 핀하면 획득',
    target: 10,
    getProgress: (pins) => pins.length,
  },
  {
    id: 'visit-30',
    emoji: '🗺️',
    label: '30곳 달성',
    description: '식당 30곳을 핀하면 획득',
    target: 30,
    getProgress: (pins) => pins.length,
  },
  {
    id: 'visit-50',
    emoji: '🏆',
    label: '50곳 달성',
    description: '식당 50곳을 핀하면 획득',
    target: 50,
    getProgress: (pins) => pins.length,
  },
  {
    id: 'korean-lover',
    emoji: '🥢',
    label: '한식러버',
    description: '한식 카테고리 식당 3곳 이상 핀',
    target: 3,
    getProgress: (pins) => pins.filter((p) => p.restaurant.category === '한식').length,
  },
  {
    id: 'cafe-tourer',
    emoji: '☕',
    label: '카페투어러',
    description: '카페/디저트 카테고리 식당 3곳 이상 핀',
    target: 3,
    getProgress: (pins) => pins.filter((p) => p.restaurant.category === '카페/디저트').length,
  },
  {
    id: 'meat-lover',
    emoji: '🍖',
    label: '고기러버',
    description: '고기/구이 카테고리 식당 3곳 이상 핀',
    target: 3,
    getProgress: (pins) => pins.filter((p) => p.restaurant.category === '고기/구이').length,
  },
  {
    id: 'ramen-master',
    emoji: '🍜',
    label: '라멘마스터',
    description: '일식 카테고리 식당 3곳 이상 핀',
    target: 3,
    getProgress: (pins) => pins.filter((p) => p.restaurant.category === '일식').length,
  },
  {
    id: 'reviewer',
    emoji: '✍️',
    label: '리뷰어',
    description: '메모가 있는 리뷰 5개 이상 작성',
    target: 5,
    getProgress: (pins) => pins.filter((p) => p.memo).length,
  },
  {
    id: 'gourmet',
    emoji: '👑',
    label: '미식가',
    description: '별점 5점을 준 식당 5곳 이상',
    target: 5,
    getProgress: (pins) => pins.filter((p) => p.rating === 5).length,
  },
];

export function isBadgeEarned(badge: BadgeDef, pins: Pin[]): boolean {
  return badge.getProgress(pins) >= badge.target;
}
