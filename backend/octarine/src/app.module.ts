import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import config from './config';
import { RtcChatModule } from './rtc-chat/rtc-chat.module';
import { WispsModule } from './wisps/wisps.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: config.db.url,
      keepConnectionAlive: true,
      entities: [join(__dirname, '**', '*.entity.{ts,js}')],
      synchronize: true,
    }),
    RtcChatModule,
    WispsModule,
  ],
})
export class AppModule {}
