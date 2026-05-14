import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from '../../application/auth.service';
import { RegisterDto, RegisterResponseDto } from '../../application/dto/register.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register or login user' })
  async register(@Body() dto: RegisterDto): Promise<RegisterResponseDto> {
    const user = await this.authService.findOrCreate(dto.name);
    return { id: user.id, name: user.name, isOnline: user.isOnline };
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all users' })
  async getUsers() {
    return this.authService.findOrCreate('test');
  }
}