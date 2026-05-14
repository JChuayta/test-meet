import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Room } from './room.entity';

export enum RequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('room_requests')
export class RoomRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  roomId: string;

  @Column()
  userId: string;

  @Column()
  userName: string;

  @Column({ type: 'enum', enum: RequestStatus, default: RequestStatus.PENDING })
  status: RequestStatus;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Room, (r) => r.requests)
  @JoinColumn({ name: 'roomId' })
  room: Room;
}