import { Module } from '@nestjs/common';

import { WispsGateway } from './wisps.gateway';
import { WispsController } from './wisps.controller';
import { WispsService } from './wisps.service';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Wisp } from './wisps.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Wisp])],
  controllers: [WispsController],
  providers: [WispsService, WispsGateway],
  exports: [WispsService],
})
export class WispsModule {}
