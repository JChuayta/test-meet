import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './features/auth/auth.module';
import { RoomsModule } from './features/rooms/rooms.module';
import { SignalingModule } from './features/signaling/signaling.module';
import { ChatModule } from './features/chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || 'rootpassword',
      database: process.env.DB_DATABASE || 'testmeet',
      autoLoadEntities: true,
      synchronize: true,
    }),
    AuthModule,
    RoomsModule,
    SignalingModule,
    ChatModule,
  ],
})
export class AppModule {}