import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { RoomParticipant } from './room-participant.entity';
import { RoomRequest } from './room-request.entity';

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  inviteLink: string;

  @Column()
  ownerId: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => RoomParticipant, (p) => p.room)
  participants: RoomParticipant[];

  @OneToMany(() => RoomRequest, (r) => r.room)
  requests: RoomRequest[];
}