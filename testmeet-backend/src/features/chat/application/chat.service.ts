import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '../domain/entities/message.entity';

@Injectable()
export class ChatService {
  constructor(@InjectRepository(Message) private messageRepository: Repository<Message>) {}

  async createMessage(roomId: string, senderId: string, content: string): Promise<Message> {
    const message = this.messageRepository.create({ roomId, senderId, content });
    return this.messageRepository.save(message);
  }

  async getMessagesByRoom(roomId: string): Promise<Message[]> {
    return this.messageRepository.find({
      where: { roomId },
      order: { createdAt: 'ASC' },
    });
  }
}