import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WispsGateway } from './wisps.gateway';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './users.entity';
import { BlindIoService } from './blind-io.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [BlindIoService, UsersService, WispsGateway],
  exports: [BlindIoService, UsersService],
})
export class WispsModule {}
