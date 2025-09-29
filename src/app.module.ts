// import { Module } from '@nestjs/common';
// import { ConfigModule, ConfigService } from '@nestjs/config';
// import { MongooseModule } from '@nestjs/mongoose';
// import { validateEnv } from './config/validation';
// import configuration from './config/configuration';
// import { ThrottlerModule } from '@nestjs/throttler';
// import { AuthModule } from './auth/auth.module';
// import { UsersModule } from './users/users.module';
// import { ArticlesModule } from './articles/articles.module';
// import { CommonModule } from './common/common.module';
// import { HealthController } from './health.controller';
// import { CommentsModule } from './comments/comments.module';

// @Module({
//   imports: [
//     ConfigModule.forRoot({ isGlobal: true, load: [configuration], validate: validateEnv }),
//     // MongooseModule.forRoot(process.env.MONGODB_URI as string),
//     MongooseModule.forRootAsync({
//       inject: [ConfigService],
//       useFactory: (cfg: ConfigService) => ({
//         uri: cfg.get<string>('MONGODB_URI', { infer: true }),
//       }),
//     }),
//     ThrottlerModule.forRoot([
//       {
//         ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),
//         limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
//       },
//     ]),
//     CommonModule,
//     AuthModule,
//     UsersModule,
//     ArticlesModule,
//     CommentsModule,
//   ],
//   controllers: [HealthController],
// })
// export class AppModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/validation';
import configuration from './config/configuration';
import { ThrottlerModule } from '@nestjs/throttler';

import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ArticlesModule } from './articles/articles.module';

import { TenancyModule } from './tenancy/tenancy.module';
import { DatabaseModule } from './database/database.module';
import { CommentsModule } from './comments/comments.module';
import { GqlModule } from './graphql/graphql.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration], validate: validateEnv }),
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),
        limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
      },
    ]),

    TenancyModule,
    DatabaseModule, // poskytne 'SQL_DATA_SOURCE' pro SQL tenancy
    GqlModule, // GraphQL + Subscriptions (Apollo Sandbox/Playground dle env)
    CommonModule,

    // Původní moduly (Auth/Users/Articles – u Articles můžeš časem udělat SQL repo stejně jako u Comments)
    AuthModule,
    UsersModule,
    ArticlesModule,

    CommentsModule, // nové REST + GraphQL
  ],
})
export class AppModule {}
