import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Pin } from '../pins/pin.entity';

@Entity('restaurant')
export class Restaurant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  userId: number | null;

  @Column({ length: 100 })
  name: string;

  @Column('decimal', { precision: 10, scale: 7 })
  latitude: number;

  @Column('decimal', { precision: 10, scale: 7 })
  longitude: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  photoUrl: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  category: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Pin, (pin) => pin.restaurant)
  pins: Pin[];
}
