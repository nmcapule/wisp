import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import config from './config';
import * as compression from 'compression';

async function bootstrap() {
  console.log(JSON.stringify(config));

  const app = await NestFactory.create(AppModule);

  if (config.api.useSwagger) {
    const options = new DocumentBuilder()
      .setTitle('HeyWisp! API')
      .setDescription('Hey WISP API description')
      .setVersion('1.0')
      .addTag('heywisp')
      .build();
    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup('swagger', app, document);
  }

  if (config.api.useCompression) {
    app.use(compression());
  }

  await app.listen(config.api.port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();
