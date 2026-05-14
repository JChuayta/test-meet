import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ namespace: '/signaling', cors: { origin: '*' } })
export class SignalingGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('call:initiate')
  handleInitiateCall(@MessageBody() data: { callerId: string; calleeId: string; offerSdp: string }, @ConnectedSocket() client: Socket) {
    const targetSocket = this.findSocketByUserId(data.calleeId);
    if (targetSocket) {
      targetSocket.emit('call:incoming', { callerId: data.callerId, offerSdp: data.offerSdp });
    }
  }

  @SubscribeMessage('call:answer')
  handleAnswerCall(@MessageBody() data: { callId: string; answerSdp: string; toUserId: string }) {
    const targetSocket = this.findSocketByUserId(data.toUserId);
    if (targetSocket) {
      targetSocket.emit('call:answered', { answerSdp: data.answerSdp });
    }
  }

  @SubscribeMessage('ice:candidate')
  handleIceCandidate(@MessageBody() data: { candidate: string; toUserId: string }) {
    const targetSocket = this.findSocketByUserId(data.toUserId);
    if (targetSocket) {
      targetSocket.emit('ice:received', { candidate: data.candidate });
    }
  }

  private findSocketByUserId(userId: string): Socket | undefined {
    if (!this.server.sockets || !this.server.sockets.sockets) {
      return undefined;
    }
    const sockets = Array.from(this.server.sockets.sockets.values()) as Socket[];
    return sockets.find((socket) => socket.handshake.auth.userId === userId);
  }
}