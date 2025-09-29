// import { NestFactory, Reflector } from '@nestjs/core';
// import { AppModule } from './app.module';
// import helmet from 'helmet';
// import { ValidationPipe, VersioningType } from '@nestjs/common';
// import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
// import { json, urlencoded } from 'express';
// import { ClassSerializerInterceptor } from '@nestjs/common';

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule, { cors: false });
//   app.enableCors({ origin: process.env.CORS_ORIGIN?.split(',') ?? '*', credentials: false });
//   app.use(helmet());
//   app.use(json({ limit: '5mb' }));
//   app.use(urlencoded({ extended: true }));
//   app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
//   app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
//   app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
//   app.setGlobalPrefix('api');

//   const config = new DocumentBuilder().setTitle('Blog API').setDescription('Simple blog').setVersion('1.0').addBearerAuth().build();
//   const document = SwaggerModule.createDocument(app, config);
//   SwaggerModule.setup('docs', app, document);

//   const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
//   await app.listen(port);
// }
// bootstrap();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });
  const logger = new Logger('HTTP');

  // Dev request logging (každý request)
  app.use((req: any, res: any, next: any) => {
    const start = Date.now();
    res.on('finish', () => {
      const ms = Date.now() - start;
      logger.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`);
    });
    next();
  });

  app.enableCors({ origin: process.env.CORS_ORIGIN?.split(',') ?? '*', credentials: false });
  app.use(helmet());
  app.use(json({ limit: '5mb' }));
  app.use(urlencoded({ extended: true }));
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('Blog API')
    .setDescription('NestJS + Mongo/SQL SaaS blog backend')
    .setVersion('2.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = parseInt(process.env.PORT || '3000', 10);
  await app.listen(port);
}
bootstrap();
