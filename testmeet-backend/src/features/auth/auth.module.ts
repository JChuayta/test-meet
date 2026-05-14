import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './domain/entities/user.entity';
import { AuthController } from './infrastructure/controllers/auth.controller';
import { AuthGateway } from './infrastructure/gateways/auth.gateway';
import { AuthService } from './application/auth.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [AuthController],
  providers: [AuthService, AuthGateway],
  exports: [AuthGateway, TypeOrmModule],
})
export class AuthModule {}