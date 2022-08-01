import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
 //app.useStaticAssets(join(__dirname, '..', 'avatars'));
  app.useStaticAssets(join(__dirname, '..', 'public'), {
    prefix: '/public',
  });
  await app.listen(3000);
}
bootstrap();
