import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RoomsService } from '../../application/rooms.service';

@ApiTags('Rooms')
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get(':inviteLink')
  @ApiOperation({ summary: 'Get room by invite link' })
  async getRoomByInviteLink(@Param('inviteLink') inviteLink: string) {
    return this.roomsService.findByInviteLink(inviteLink);
  }

  @Get('session/:roomId')
  @ApiOperation({ summary: 'Get room by ID' })
  async getRoomById(@Param('roomId') roomId: string) {
    return this.roomsService.findById(roomId);
  }
}