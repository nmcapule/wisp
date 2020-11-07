import { Module } from '@nestjs/common';
import { RtcChatGateway } from './rtc-chat.gateway';

@Module({
  providers: [RtcChatGateway],
})
export class RtcChatModule {}
