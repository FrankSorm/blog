// import { Module, Scope } from '@nestjs/common';
// import { getModelToken, MongooseModule } from '@nestjs/mongoose';
// import { DataSource } from 'typeorm';

// import { TenancyService } from '../tenancy/tenancy.service';
// import { Comment, CommentSchema, Vote, VoteSchema } from './schemas/comment.schema';
// import { MongoCommentsRepo } from './repos/comments.repo.mongo';
// import { SqlCommentsRepo } from './repos/comments.repo.sql';
// import { CommentsService } from './comments.service';
// import { CommentsController } from './comments.controller';
// import { CommentsResolver } from './comments.resolver';

// @Module({
//   imports: [
//     MongooseModule.forFeature([
//       { name: Comment.name, schema: CommentSchema },
//       { name: Vote.name, schema: VoteSchema },
//     ]),
//   ],
//   providers: [
//     CommentsService,
//     {
//       provide: 'CommentsRepo',
//       inject: [
//         TenancyService,
//         getModelToken(Comment.name),
//         getModelToken(Vote.name),
//         'SQL_DATA_SOURCE',
//       ],
//       useFactory: (
//         tenancy: TenancyService,
//         commentModel: any,
//         voteModel: any,
//         sqlDs?: DataSource,
//       ) => {
//         const t = tenancy.getTenant();
//         if (t.dbKind === 'mongo') {
//           return new MongoCommentsRepo(commentModel, voteModel);
//         }
//         return new SqlCommentsRepo(sqlDs!);
//       },
//     },
//     CommentsResolver,
//   ],
//   controllers: [CommentsController],
//   exports: ['CommentsRepo', CommentsService],
// })
// export class CommentsModule {}

import { Module } from '@nestjs/common';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { DataSource } from 'typeorm';
import { TenancyService } from '../tenancy/tenancy.service';
import { Comment, CommentSchema, Vote, VoteSchema } from './schemas/comment.schema';
import { MongoCommentsRepo } from './repos/comments.repo.mongo';
import { SqlCommentsRepo } from './repos/comments.repo.sql';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { CommentsResolver } from './comments.resolver';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Comment.name, schema: CommentSchema },
      { name: Vote.name, schema: VoteSchema },
    ]),
  ],
  providers: [
    CommentsService,
    CommentsResolver,
    {
      provide: 'CommentsRepo',
      inject: [
        TenancyService,
        getModelToken(Comment.name),
        getModelToken(Vote.name),
        'SQL_DATA_SOURCE',
      ],
      useFactory: (
        tenancy: TenancyService,
        commentModel: any,
        voteModel: any,
        sqlDs?: DataSource,
      ) => {
        const t = tenancy.getTenant();
        if (t.dbKind === 'mongo') {
          return new MongoCommentsRepo(commentModel, voteModel);
        }
        if (!sqlDs) throw new Error(`SQL_DATA_SOURCE není inicializovaný pro tenant ${t.key}`);
        return new SqlCommentsRepo(sqlDs);
      },
    },
  ],
  controllers: [CommentsController],
  exports: ['CommentsRepo', CommentsService],
})
export class CommentsModule {}
