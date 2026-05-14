import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ namespace: '/signaling', cors: { origin: '*' } })
export class SignalingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSocketMap: Map<string, string> = new Map();

  async handleConnection(client: Socket) {
    const userId = client.handshake.auth.userId as string;
    if (userId) {
      this.userSocketMap.set(userId, client.id);
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.handshake.auth.userId as string;
    if (userId) {
      this.userSocketMap.delete(userId);
    }
  }

  @SubscribeMessage('call:initiate')
  handleInitiateCall(
    @MessageBody() data: { participantId: string; offerSdp: string },
    @ConnectedSocket() client: Socket
  ) {
    const callerId = Array.from(this.userSocketMap.entries()).find(([_, socketId]) => socketId === client.id)?.[0];
    const targetSocket = this.findSocketByUserId(data.participantId);
    
    if (targetSocket) {
      targetSocket.emit('call:received', {
        fromUserId: callerId,
        offerSdp: data.offerSdp
      });
    }
  }

  @SubscribeMessage('call:answer')
  handleAnswerCall(
    @MessageBody() data: { participantId: string; answerSdp: string },
    @ConnectedSocket() client: Socket
  ) {
    const answererId = Array.from(this.userSocketMap.entries()).find(([_, socketId]) => socketId === client.id)?.[0];
    const targetSocket = this.findSocketByUserId(data.participantId);
    
    if (targetSocket) {
      targetSocket.emit('call:answered', { 
        participantId: answererId,
        answerSdp: data.answerSdp 
      });
    }
  }

  @SubscribeMessage('ice:candidate')
  handleIceCandidate(
    @MessageBody() data: { participantId: string; candidate: string },
    @ConnectedSocket() client: Socket
  ) {
    const senderId = Array.from(this.userSocketMap.entries()).find(([_, socketId]) => socketId === client.id)?.[0];
    const targetSocket = this.findSocketByUserId(data.participantId);
    
    if (targetSocket) {
      targetSocket.emit('ice:candidate', { 
        participantId: senderId,
        candidate: data.candidate 
      });
    }
  }

  private findSocketByUserId(userId: string): Socket | undefined {
    if (!this.server.sockets?.sockets) {
      return undefined;
    }
    let foundSocket: Socket | undefined;
    this.server.sockets.sockets.forEach((socket, id) => {
      if (socket.handshake.auth.userId === userId) {
        this.userSocketMap.set(userId, id);
        foundSocket = socket;
      }
    });
    return foundSocket;
  }
}