import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Crud, CrudController } from '@nestjsx/crud';
import { User } from './users.entity';
import { UsersService } from './users.service';

@Crud({
  model: { type: User },
  routes: { only: ['getManyBase', 'getOneBase'] },
})
@ApiTags('api/users')
@Controller('api/users')
export class UsersController implements CrudController<User> {
  constructor(public service: UsersService) {}
}
