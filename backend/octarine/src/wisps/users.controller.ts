import { Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Crud, CrudController } from '@nestjsx/crud';
import { User } from './users.entity';
import { UsersService } from './users.service';

@Crud({
  model: { type: User },
  routes: { only: ['getManyBase', 'getOneBase'] },
})
@ApiTags('api/wisps/users')
@Controller('api/wisps/users')
export class UsersController implements CrudController<User> {
  constructor(public service: UsersService) {}
}
