import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });
  const logger = new Logger('HTTP');

  // Per-request log (dev)
  app.use((req: any, res: any, next: any) => {
    const start = Date.now();
    logger.log('Request type: ', typeof req);
    res.on('finish', () => {
      const ms = Date.now() - start;
      const tenant = req.tenantKey || 'default';
      logger.log(`[${tenant}] ${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`);
    });
    next();
  });

  app.enableCors({
    origin: (process.env.CORS_ORIGIN || '*').split(',').map((s) => s.trim()),
    credentials: false,
  });
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          defaultSrc: ["'self'"],
          // Apollo Sandbox běží lokálně, ale v iframe si může sáhnout na studio.apollographql.com
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:'],
          connectSrc: [
            "'self'",
            'wss:', // pro graphql-ws
            'https://studio.apollographql.com', // pokud by sis zapnul cloud sandbox
          ],
          frameSrc: ["'self'", 'https://studio.apollographql.com'], // povolit iframe pokud bys ho použil
          fontSrc: ["'self'", 'data:'],
        },
      },
    }),
  );
  app.use(json({ limit: '5mb' }));
  app.use(urlencoded({ extended: true }));
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.setGlobalPrefix('api');

  const cfg = new DocumentBuilder()
    .setTitle('SaaS Blog API')
    .setDescription('REST + GraphQL (NestJS 10) | Multi-tenant')
    .setVersion('2.0')
    .addBearerAuth()
    .build();
  const doc = SwaggerModule.createDocument(app, cfg);
  SwaggerModule.setup('docs', app, doc);

  const port = parseInt(process.env.PORT || '3000', 10);
  await app.listen(port);
}
bootstrap();
