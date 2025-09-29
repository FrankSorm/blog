import { Global, Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TenancyService } from '../tenancy/tenancy.service';
import { CommentEntity, VoteEntity } from '../comments/entities/comment.entity';

@Global()
@Module({
  providers: [
    {
      provide: 'SQL_DATA_SOURCE',
      inject: [TenancyService],
      useFactory: async (tenancy: TenancyService): Promise<DataSource | undefined> => {
        const t = tenancy.getTenant();
        if (t.dbKind === 'postgres' || t.dbKind === 'mariadb') {
          const ds = new DataSource({
            type: t.sql!.type,
            host: t.sql!.host,
            port: t.sql!.port,
            username: t.sql!.username,
            password: t.sql!.password,
            database: t.sql!.database,
            entities: [CommentEntity, VoteEntity], // + ArticleEntity pokud budeš portovat i články do SQL
            synchronize: true, // DEV only; v produkci raději migrations
          });
          return ds.initialize();
        }
        return undefined;
      },
    },
  ],
  exports: ['SQL_DATA_SOURCE'],
})
export class DatabaseModule {}
