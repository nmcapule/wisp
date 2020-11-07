import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';

import { Wisp } from './wisps.entity';

@Injectable()
export class WispsService extends TypeOrmCrudService<Wisp> {
  constructor(@InjectRepository(Wisp) repo) {
    super(repo);
  }
}
