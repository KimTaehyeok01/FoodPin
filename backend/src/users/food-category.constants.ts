export const FOOD_CATEGORIES = [
  '한식', '중식', '일식', '양식', '분식',
  '카페/디저트', '치킨/피자', '고기/구이', '해산물', '패스트푸드', '술집/포차',
] as const;

export type FoodCategory = typeof FOOD_CATEGORIES[number];
