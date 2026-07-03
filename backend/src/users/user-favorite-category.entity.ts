import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { FoodCategory } from './food-category.constants';

@Entity('user_favorite_category')
export class UserFavoriteCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({ type: 'varchar', length: 50 })
  category: FoodCategory;

  @ManyToOne(() => User, (user) => user.favoriteCategories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
