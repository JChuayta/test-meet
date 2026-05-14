import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './domain/entities/message.entity';
import { ChatGateway } from './infrastructure/gateways/chat.gateway';
import { ChatController } from './infrastructure/controllers/chat.controller';
import { ChatService } from './application/chat.service';

@Module({
  imports: [TypeOrmModule.forFeature([Message])],
  controllers: [ChatController],
  providers: [ChatGateway, ChatService],
  exports: [ChatService, TypeOrmModule],
})
export class ChatModule {}