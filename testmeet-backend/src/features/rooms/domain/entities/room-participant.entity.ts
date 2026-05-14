import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Room } from './room.entity';
import { User } from '../../../auth/domain/entities/user.entity';

@Entity('room_participants')
export class RoomParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  roomId: string;

  @Column()
  userId: string;

  @CreateDateColumn()
  joinedAt: Date;

  @ManyToOne(() => Room, () => {})
  @JoinColumn({ name: 'roomId' })
  room: Room;

  @ManyToOne(() => User, () => {})
  @JoinColumn({ name: 'userId' })
  user: User;
}