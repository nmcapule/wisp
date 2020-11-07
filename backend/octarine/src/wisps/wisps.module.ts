import { Module } from '@nestjs/common';

import { WispsGateway } from './wisps.gateway';
import { BlindIoService } from './blind-io.service';

@Module({
  providers: [BlindIoService, WispsGateway],
  exports: [BlindIoService],
})
export class WispsModule {}
