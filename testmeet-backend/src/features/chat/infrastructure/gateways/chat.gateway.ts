import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from '../../application/chat.service';

@WebSocketGateway({ namespace: '/chat', cors: { origin: '*' } })
export class ChatGateway {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly chatService: ChatService) {}

  @SubscribeMessage('chat:send')
  async handleSendMessage(@MessageBody() data: { roomId: string; senderId: string; content: string }, @ConnectedSocket() client: Socket) {
    const message = await this.chatService.createMessage(data.roomId, data.senderId, data.content);
    this.server.to(data.roomId).emit('chat:message', message);
  }

  @SubscribeMessage('chat:get')
  async handleGetMessages(@MessageBody() data: { roomId: string }, @ConnectedSocket() client: Socket) {
    const messages = await this.chatService.getMessagesByRoom(data.roomId);
    client.emit('chat:history', messages);
  }

  @SubscribeMessage('chat:join-room')
  handleJoinRoom(@MessageBody() data: { roomId: string }, @ConnectedSocket() client: Socket) {
    client.join(data.roomId);
  }

  @SubscribeMessage('chat:leave-room')
  handleLeaveRoom(@MessageBody() data: { roomId: string }, @ConnectedSocket() client: Socket) {
    client.leave(data.roomId);
  }
}