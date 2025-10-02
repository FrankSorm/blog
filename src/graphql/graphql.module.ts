// import { Module } from '@nestjs/common';
// import { GraphQLModule } from '@nestjs/graphql';
// import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
// import configuration from '../config/configuration';

// @Module({
//   imports: [
//     GraphQLModule.forRoot<ApolloDriverConfig>({
//       driver: ApolloDriver,
//       autoSchemaFile: true,
//       playground: configuration().graphqlPlayground,
//       subscriptions: { 'graphql-ws': true },
//       sortSchema: true,
//     }),
//     //     GraphQLModule.forRoot<ApolloDriverConfig>({
//     //   driver: ApolloDriver,
//     //   autoSchemaFile: true,
//     //   playground: configuration().graphqlPlayground,
//     //   subscriptions: {
//     //     'graphql-ws': {
//     //       onConnect: async (ctx) => {
//     //         // connectionParams může nést { authorization, x-tenant }
//     //         const headers = ctx.extra?.request?.headers as Record<string, string>;
//     //         const tenantKey = headers?.['x-tenant'] || (ctx.connectionParams as any)?.['x-tenant'] || 'default';
//     //         (ctx as any).tenantKey = tenantKey;
//     //       },
//     //       onSubscribe: async (ctx, msg) => {
//     //         // žádné request-scoped DI – jen vložíme tenant do contextu
//     //         return { ...msg, contextValue: { tenantKey: (ctx as any).tenantKey } };
//     //       },
//     //     },
//     //   },
//     //   context: ({ req, extra }) => {
//     //     // HTTP i WS
//     //     const tenantKey = req?.headers?.['x-tenant'] || extra?.tenantKey || 'default';
//     //     const ip = req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() || req?.ip || '';
//     //     return { tenantKey, ip };
//     //   },
//     // })
//   ],
// })
// export class GqlModule {}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// import { Module } from '@nestjs/common';
// import { GraphQLModule } from '@nestjs/graphql';
// import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';

// /**
//  * Bez závislosti na vašem ConfigModule – čte jen z env:
//  * - GRAPHQL_PLAYGROUND=true|false
//  * - TENANT_HEADER (default: X-Tenant)
//  */
// const TENANT_HEADER = (process.env.TENANT_HEADER || 'X-Tenant').toLowerCase();
// const PLAYGROUND =
//   process.env.GRAPHQL_PLAYGROUND === undefined ? true : process.env.GRAPHQL_PLAYGROUND === 'true';

// function headerValue(headers: Record<string, unknown>, key: string): string | undefined {
//   const v = headers?.[key];
//   if (!v) return undefined;
//   return Array.isArray(v) ? String(v[0]) : String(v);
// }

// function extractIpFromHeaders(headers: Record<string, unknown>): string {
//   const xff = headerValue(headers, 'x-forwarded-for');
//   if (xff) return xff.split(',')[0]?.trim() || '';
//   // node/express socket fallback
//   return '';
// }

// @Module({
//   imports: [
//     GraphQLModule.forRoot<ApolloDriverConfig>({
//       driver: ApolloDriver,

//       // Code-first schema generace
//       autoSchemaFile: true,
//       sortSchema: true,

//       // Apollo Sandbox / Playground podle env
//       playground: PLAYGROUND,
//       introspection: true,

//       /**
//        * Subscriptions přes graphql-ws
//        * - žádný request-scoped provider se zde neinjektuje
//        * - tenant a IP neseme v contextu
//        */
//       subscriptions: {
//         'graphql-ws': {
//           path: '/graphql',
//           // WS handshake – přeneseme si tenant do contextu
//           onConnect: async (ctx: any /* GraphQLWSContext */) => {
//             // no-op; tenant doplníme při onSubscribe
//           },
//           onSubscribe: async (ctx: any, msg: any) => {
//             const headers = (ctx.extra?.request?.headers as Record<string, unknown>) || {};
//             const tenantFromHeader = headerValue(headers, TENANT_HEADER);
//             const tenantFromParams =
//               (ctx.connectionParams?.['x-tenant'] as string) ||
//               (ctx.connectionParams?.['tenant'] as string) ||
//               (ctx.connectionParams?.['X-Tenant'] as string);

//             const tenantKey = (tenantFromHeader || tenantFromParams || 'default').toString().trim();

//             const ipHdr = extractIpFromHeaders(headers);
//             const ip = ipHdr || (ctx.extra?.request?.socket?.remoteAddress as string) || '';

//             // contextValue je dostupné v @Context() resolverů
//             return {
//               ...msg,
//               contextValue: {
//                 tenantKey,
//                 ip,
//                 connectionParams: ctx.connectionParams,
//               },
//             };
//           },
//         } as any, // typový workaround pro jednodušší kompilaci
//       },

//       /**
//        * HTTP + (fallback pro WS) context
//        * - do GraphQL resolverů se předává { tenantKey, ip, authorization }
//        */
//       context: ({ req, extra, connectionParams }: any) => {
//         const headers: Record<string, unknown> =
//           (req?.headers as any) || (extra?.request?.headers as any) || (Object.create(null) as any);

//         const tenantHeaderVal = headerValue(headers, TENANT_HEADER);
//         const tenantParamVal =
//           (connectionParams?.['x-tenant'] as string) ||
//           (connectionParams?.['tenant'] as string) ||
//           (connectionParams?.['X-Tenant'] as string);

//         const tenantKey = (tenantHeaderVal || tenantParamVal || 'default').toString().trim();

//         const ipHdr = extractIpFromHeaders(headers);
//         const ip =
//           ipHdr ||
//           (req?.ip as string) ||
//           (req?.socket?.remoteAddress as string) ||
//           (extra?.request?.socket?.remoteAddress as string) ||
//           '';

//         const authorization =
//           (headers['authorization'] as string) ||
//           (connectionParams?.['authorization'] as string) ||
//           (connectionParams?.['Authorization'] as string) ||
//           '';

//         return { tenantKey, ip, authorization };
//       },
//     }),
//   ],
// })
// export class GqlModule {}

////////////////////////////////////////////////////////////////////////////////////////////////

import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      sortSchema: true,

      // místo 'playground: true' použij ofiko landing page plugin (lokální, bez jsdelivr)
      playground: false,
      plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })],

      // subscriptions přes graphql-ws (beze změny)
      subscriptions: {
        'graphql-ws': {
          path: '/graphql',
          onSubscribe: async (ctx: any, msg: any) => {
            const hdrs = (ctx.extra?.request?.headers ?? {}) as Record<string, string>;
            const tenantKey =
              hdrs['x-tenant'] || (ctx.connectionParams as any)?.['x-tenant'] || 'default';
            const xff = (hdrs['x-forwarded-for'] as string) || '';
            const ip =
              xff?.split(',')[0]?.trim() ||
              (ctx.extra?.request?.socket?.remoteAddress as string) ||
              '';
            return {
              ...msg,
              contextValue: { tenantKey, ip, connectionParams: ctx.connectionParams },
            };
          },
        } as any,
      },

      // HTTP/WS context
      context: ({ req, extra, connectionParams }: any) => {
        const hdrs = (req?.headers ?? extra?.request?.headers ?? {}) as Record<string, string>;
        const tenantKey =
          hdrs['x-tenant'] || (connectionParams?.['x-tenant'] as string) || 'default';
        const xff = (hdrs['x-forwarded-for'] as string) || '';
        const ip =
          xff?.split(',')[0]?.trim() ||
          (req?.ip as string) ||
          (req?.socket?.remoteAddress as string) ||
          (extra?.request?.socket?.remoteAddress as string) ||
          '';
        const authorization =
          (hdrs['authorization'] as string) ||
          (connectionParams?.['authorization'] as string) ||
          '';
        return { tenantKey, ip, authorization };
      },
    }),
  ],
})
export class GqlModule {}
