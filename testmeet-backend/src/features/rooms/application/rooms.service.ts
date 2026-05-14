import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { RoomParticipant } from '../domain/entities/room-participant.entity';
import { RequestStatus, RoomRequest } from '../domain/entities/room-request.entity';
import { Room } from '../domain/entities/room.entity';

@Injectable()
export class RoomsService {
  private userSocketMap: Map<string, string> = new Map();

  constructor(
    @InjectRepository(Room) private roomRepository: Repository<Room>,
    @InjectRepository(RoomParticipant) private participantRepository: Repository<RoomParticipant>,
    @InjectRepository(RoomRequest) private requestRepository: Repository<RoomRequest>,
  ) {}

  async registerUser(userId: string, socketId: string): Promise<void> {
    this.userSocketMap.set(userId, socketId);
  }

  async unregisterUser(userId: string): Promise<void> {
    this.userSocketMap.delete(userId);
  }

  async getSocketIdByUserId(userId: string): Promise<string | undefined> {
    return this.userSocketMap.get(userId);
  }

  async createRoom(ownerId: string, name: string): Promise<Room> {
    const inviteLink = this.generateLink();
    const room = this.roomRepository.create({ name, inviteLink, ownerId });
    const savedRoom = await this.roomRepository.save(room);
    
    const participant = this.participantRepository.create({ roomId: savedRoom.id, userId: ownerId });
    await this.participantRepository.save(participant);
    
    return savedRoom;
  }

  async findByInviteLink(inviteLink: string): Promise<any> {
    const room = await this.roomRepository.findOne({ 
      where: { inviteLink }, 
      relations: ['participants', 'participants.user', 'requests'] 
    });
    if (!room) return null;
    return {
      ...room,
      participants: room.participants.map(p => ({ userId: p.userId, userName: p.user?.name || 'Unknown' }))
    };
  }

  async findById(id: string): Promise<any> {
    const room = await this.roomRepository.findOne({ 
      where: { id }, 
      relations: ['participants', 'participants.user', 'requests'] 
    });
    if (!room) return null;
    return {
      ...room,
      participants: room.participants.map(p => ({ userId: p.userId, userName: p.user?.name || 'Unknown' }))
    };
  }

  async joinRequest(roomId: string, userId: string, userName: string): Promise<RoomRequest> {
    const existing = await this.requestRepository.findOne({ where: { roomId, userId, status: RequestStatus.PENDING } });
    if (existing) return existing;
    const request = this.requestRepository.create({ roomId, userId, userName, status: RequestStatus.PENDING });
    return this.requestRepository.save(request);
  }

  async approveUser(roomId: string, userId: string, userName: string): Promise<void> {
    await this.requestRepository.update({ roomId, userId }, { status: RequestStatus.APPROVED });
    const participant = this.participantRepository.create({ roomId, userId });
    await this.participantRepository.save(participant);
  }

  async rejectUser(roomId: string, userId: string): Promise<void> {
    await this.requestRepository.update({ roomId, userId }, { status: RequestStatus.REJECTED });
  }

  async leaveRoom(roomId: string, userId: string): Promise<void> {
    await this.participantRepository.delete({ roomId, userId });
  }

  async getParticipants(roomId: string): Promise<{ userId: string; userName: string }[]> {
    const participants = await this.participantRepository.find({ 
      where: { roomId },
      relations: ['user']
    });
    return participants.map((p) => ({ userId: p.userId, userName: p.user?.name || 'Unknown' }));
  }

  async getPendingRequests(roomId: string): Promise<RoomRequest[]> {
    return this.requestRepository.find({ where: { roomId, status: RequestStatus.PENDING } });
  }

  private generateLink(): string {
    return uuidv4().split('-')[0];
  }
}