import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Pin } from '../pins/pin.entity';

export const FOOD_CATEGORIES = [
  '한식', '중식', '일식', '양식', '분식',
  '카페/디저트', '치킨/피자', '고기/구이', '해산물', '패스트푸드', '술집/포차',
] as const;

export type FoodCategory = typeof FOOD_CATEGORIES[number];

@Entity('user')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  provider: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  providerId: string | null;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password: string | null;

  @Column({ type: 'varchar', length: 50 })
  nickname: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  profileImage: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string | null;

  @Column({ type: 'tinyint', unsigned: true, nullable: true })
  age: number | null;

  @Column({ type: 'simple-json', nullable: true })
  favoriteCategories: FoodCategory[] | null;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Pin, (pin) => pin.user)
  pins: Pin[];
}
