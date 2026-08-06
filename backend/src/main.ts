import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors();
  
  // Serve the extracted CAD images from excel
  app.useStaticAssets(join(__dirname, '..', '..', 'xlsx_images'), {
    prefix: '/images/',
  });

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`NestJS backend listening on port ${port}`);
}
bootstrap();
