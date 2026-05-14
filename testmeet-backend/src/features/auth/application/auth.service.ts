import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../domain/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(@InjectRepository(User) private userRepository: Repository<User>) {}

  async findOrCreate(name: string): Promise<User> {
    let user = await this.userRepository.findOne({ where: { name } });
    if (!user) {
      user = this.userRepository.create({ name, isOnline: true });
      user = await this.userRepository.save(user);
    } else {
      user.isOnline = true;
      await this.userRepository.save(user);
    }
    return user;
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async updateSocketId(userId: string, socketId: string): Promise<void> {
    await this.userRepository.update(userId, { socketId: socketId || undefined });
  }

  async setOffline(userId: string): Promise<void> {
    await this.userRepository.update(userId, { isOnline: false, socketId: undefined });
  }
}