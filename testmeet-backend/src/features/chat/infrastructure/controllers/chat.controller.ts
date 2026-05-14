import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ChatService } from '../../application/chat.service';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get(':roomId/messages')
  @ApiOperation({ summary: 'Get messages for a room' })
  async getMessages(@Param('roomId') roomId: string) {
    return this.chatService.getMessagesByRoom(roomId);
  }
}