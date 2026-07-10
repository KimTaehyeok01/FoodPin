// 1:1 문의 엔티티
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export const INQUIRY_STATUSES = ['pending', 'answered'] as const;
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];

@Entity('inquiry')
export class Inquiry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({ length: 100 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: InquiryStatus;

  @Column({ type: 'text', nullable: true })
  answer: string | null;

  @Column({ type: 'datetime', nullable: true })
  answeredAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
