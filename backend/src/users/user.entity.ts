import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Pin } from '../pins/pin.entity';
import { UserFavoriteCategory } from './user-favorite-category.entity';
export { FOOD_CATEGORIES, FoodCategory } from './food-category.constants';
export { GENDERS, Gender } from './gender.constants';
export { ROLES, Role } from './role.constants';

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

  @Column({ type: 'varchar', length: 50, nullable: true })
  name: string | null;

  @Column({ type: 'varchar', length: 50 })
  nickname: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  profileImage: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string | null;

  @Column({ type: 'tinyint', unsigned: true, nullable: true })
  age: number | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  gender: string | null;

  @Column({ type: 'varchar', length: 20, default: 'user' })
  role: string;

  @Column({ type: 'boolean', default: false })
  isBanned: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Pin, (pin) => pin.user)
  pins: Pin[];

  @OneToMany(() => UserFavoriteCategory, (ufc) => ufc.user)
  favoriteCategories: UserFavoriteCategory[];
}
