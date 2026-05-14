import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
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
      console.log(`Signaling: User ${userId} connected with socket ${client.id}`);
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.handshake.auth.userId as string;
    if (userId) {
      this.userSocketMap.delete(userId);
      console.log(`Signaling: User ${userId} disconnected`);
    }
  }

  @SubscribeMessage('call:initiate')
  handleInitiateCall(
    @MessageBody() data: { participantId: string; offerSdp: string },
    @ConnectedSocket() client: Socket
  ) {
    const callerId = Array.from(this.userSocketMap.entries()).find(([_, socketId]) => socketId === client.id)?.[0];
    const targetSocket = this.findSocketByUserId(data.participantId);
    
    console.log(`[call:initiate] From ${callerId} to ${data.participantId}`);
    
    if (targetSocket) {
      console.log(`Sending call:received to ${data.participantId}`);
      targetSocket.emit('call:received', { 
        fromUserId: callerId, 
        offerSdp: data.offerSdp 
      });
    } else {
      console.log(`Target socket not found for ${data.participantId}`);
    }
  }

  @SubscribeMessage('call:answer')
  handleAnswerCall(
    @MessageBody() data: { participantId: string; answerSdp: string },
    @ConnectedSocket() client: Socket
  ) {
    const answererId = Array.from(this.userSocketMap.entries()).find(([_, socketId]) => socketId === client.id)?.[0];
    const targetSocket = this.findSocketByUserId(data.participantId);
    
    console.log(`[call:answer] From ${answererId} to ${data.participantId}`);
    
    if (targetSocket) {
      console.log(`Sending call:answered to ${data.participantId}`);
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
      targetSocket.emit('ice:received', { 
        participantId: senderId,
        candidate: data.candidate 
      });
    }
  }

  private findSocketByUserId(userId: string): Socket | undefined {
    if (!this.server.sockets || !this.server.sockets.sockets) {
      return undefined;
    }
    const socketId = this.userSocketMap.get(userId);
    if (!socketId) return undefined;
    return this.server.sockets.sockets.get(socketId) as Socket;
  }
}