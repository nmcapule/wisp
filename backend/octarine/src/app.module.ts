import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from 'nestjs-redis';
import { join } from 'path';

import config from './config';
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
    RedisModule.register(config.redis),
    WispsModule,
  ],
})
export class AppModule {}
