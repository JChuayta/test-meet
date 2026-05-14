import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from './domain/entities/room.entity';
import { RoomParticipant } from './domain/entities/room-participant.entity';
import { RoomRequest } from './domain/entities/room-request.entity';
import { RoomsController } from './infrastructure/controllers/rooms.controller';
import { RoomsGateway } from './infrastructure/gateways/rooms.gateway';
import { RoomsService } from './application/rooms.service';

@Module({
  imports: [TypeOrmModule.forFeature([Room, RoomParticipant, RoomRequest])],
  controllers: [RoomsController],
  providers: [RoomsGateway, RoomsService],
  exports: [RoomsService, TypeOrmModule],
})
export class RoomsModule {}