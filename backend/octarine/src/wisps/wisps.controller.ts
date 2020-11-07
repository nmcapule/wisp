import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Crud, CrudController } from '@nestjsx/crud';
import { Wisp } from './wisps.entity';
import { WispsService } from './wisps.service';

@Crud({
  model: { type: Wisp },
})
@ApiTags('api/wisps')
@Controller('api/wisps')
export class WispsController implements CrudController<Wisp> {
  constructor(public service: WispsService) {}
}
