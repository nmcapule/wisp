import { Module } from '@nestjs/common';
import { RtcChatModule } from './rtc-chat/rtc-chat.module';

@Module({
  imports: [RtcChatModule],
})
export class AppModule {}
