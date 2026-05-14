import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from '../domain/entities/room.entity';
import { RoomParticipant } from '../domain/entities/room-participant.entity';
import { RoomRequest, RequestStatus } from '../domain/entities/room-request.entity';
import { v4 as uuidv4 } from 'uuid';

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
    return this.roomRepository.save(room);
  }

  async findByInviteLink(inviteLink: string): Promise<Room | null> {
    return this.roomRepository.findOne({ where: { inviteLink }, relations: ['participants', 'requests'] });
  }

  async findById(id: string): Promise<Room | null> {
    return this.roomRepository.findOne({ where: { id }, relations: ['participants', 'requests'] });
  }

  async joinRequest(roomId: string, userId: string, userName: string): Promise<RoomRequest> {
    const existing = await this.requestRepository.findOne({ where: { roomId, userId, status: RequestStatus.PENDING } });
    if (existing) return existing;
    const request = this.requestRepository.create({ roomId, userId, userName, status: RequestStatus.PENDING });
    return this.requestRepository.save(request);
  }

  async approveUser(roomId: string, userId: string): Promise<void> {
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

  async getParticipants(roomId: string): Promise<string[]> {
    const participants = await this.participantRepository.find({ where: { roomId } });
    return participants.map((p) => p.userId);
  }

  async getPendingRequests(roomId: string): Promise<RoomRequest[]> {
    return this.requestRepository.find({ where: { roomId, status: RequestStatus.PENDING } });
  }

  private generateLink(): string {
    return uuidv4().split('-')[0];
  }
}