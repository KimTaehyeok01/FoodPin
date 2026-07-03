// 식당 메뉴 항목 엔티티
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Restaurant } from './restaurant.entity';

@Entity('restaurant_menu')
export class RestaurantMenu {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  restaurantId: number;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'int' })
  price: number;

  @Column({ type: 'boolean', default: false })
  isPopular: boolean;

  @Column({ type: 'varchar', length: 8, nullable: true })
  emoji: string | null;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.menus, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'restaurantId' })
  restaurant: Restaurant;
}
