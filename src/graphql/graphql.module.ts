import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true, // code-first
      playground: process.env.GRAPHQL_PLAYGROUND === 'true',
      subscriptions: { 'graphql-ws': true },
      sortSchema: true,
    }),
  ],
})
export class GqlModule {}
