import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../../application/auth.service';

@WebSocketGateway({ namespace: '/auth', cors: { origin: '*' } })
export class AuthGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly authService: AuthService) {}

  async handleConnection(client: Socket) {
    const { userId } = client.handshake.auth;
    if (userId) {
      await this.authService.updateSocketId(userId, client.id);
    }
  }

  async handleDisconnect(client: Socket) {
    const { userId } = client.handshake.auth;
    if (userId) {
      await this.authService.setOffline(userId);
    }
  }
}