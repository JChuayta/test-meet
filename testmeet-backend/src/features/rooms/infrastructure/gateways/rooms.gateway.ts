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
import { RoomsService } from '../../application/rooms.service';

@WebSocketGateway({ namespace: '/rooms', cors: { origin: '*' } })
export class RoomsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly roomsService: RoomsService) {}

  async handleConnection(client: Socket) {
    const userId = client.handshake.auth.userId as string;
    if (userId) {
      await this.roomsService.registerUser(userId, client.id);
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.handshake.auth.userId as string;
    if (userId) {
      await this.roomsService.unregisterUser(userId);
    }
  }

  @SubscribeMessage('room:join')
  async handleJoinRoom(@MessageBody() data: { roomId: string }, @ConnectedSocket() client: Socket) {
    client.join(data.roomId);
    return { success: true };
  }

  @SubscribeMessage('room:create')
  async handleCreateRoom(@MessageBody() data: { ownerId: string; name: string }, @ConnectedSocket() client: Socket) {
    const room = await this.roomsService.createRoom(data.ownerId, data.name);
    const participants = await this.roomsService.getParticipants(room.id);
    client.join(room.id);
    client.emit('room:created', { room, participants });
    return { success: true, room, participants };
  }

  @SubscribeMessage('room:join-request')
  async handleJoinRequest(@MessageBody() data: { inviteLink: string; userId: string; userName: string }, @ConnectedSocket() client: Socket) {
    const room = await this.roomsService.findByInviteLink(data.inviteLink);
    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    const request = await this.roomsService.joinRequest(room.id, data.userId, data.userName);

    client.emit('room:request-received', { roomId: room.id, request });

    const ownerSocketId = await this.roomsService.getSocketIdByUserId(room.ownerId);

    if (ownerSocketId) {
      this.server.to(ownerSocketId).emit('room:pending-request', { roomId: room.id, request });
    } else {
      this.server.to(room.id).emit('room:pending-request', { roomId: room.id, request });
    }

    return { success: true, roomId: room.id };
  }

  @SubscribeMessage('room:approve')
  async handleApproveUser(@MessageBody() data: { roomId: string; userId: string }) {
    await this.roomsService.approveUser(data.roomId, data.userId);
    const participants = await this.roomsService.getParticipants(data.roomId);
    const userSocketId = await this.roomsService.getSocketIdByUserId(data.userId);
    if (userSocketId) {
      this.server.to(userSocketId).emit('room:join-approved', { roomId: data.roomId });
    }
    this.server.to(data.roomId).emit('room:user-joined', { roomId: data.roomId, userId: data.userId });
    return { success: true };
  }

  @SubscribeMessage('room:reject')
  async handleRejectUser(@MessageBody() data: { roomId: string; userId: string }) {
    await this.roomsService.rejectUser(data.roomId, data.userId);
    const userSocketId = await this.roomsService.getSocketIdByUserId(data.userId);
    if (userSocketId) {
      this.server.to(userSocketId).emit('room:join-rejected', { roomId: data.roomId });
    }
    return { success: true };
  }

  @SubscribeMessage('room:leave')
  async handleLeaveRoom(@MessageBody() data: { roomId: string; userId: string }, @ConnectedSocket() client: Socket) {
    await this.roomsService.leaveRoom(data.roomId, data.userId);
    const participants = await this.roomsService.getParticipants(data.roomId);
    client.leave(data.roomId);
    this.server.to(data.roomId).emit('room:user-left', { roomId: data.roomId, userId: data.userId });
    return { success: true };
  }

  @SubscribeMessage('room:get-participants')
  async handleGetParticipants(@MessageBody() data: { roomId: string }) {
    const participants = await this.roomsService.getParticipants(data.roomId);
    return participants;
  }
}