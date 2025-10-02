import { Injectable } from '@nestjs/common';
import { ConnectionRegistry } from './connection.registry';
import { TenantsStore } from './tenants.store';
import { MongoUsersRepo } from '../infra/repos/users.repo.mongo';
import { SqlUsersRepo } from '../infra/repos/users.repo.sql';
import { MongoArticlesRepo } from '../infra/repos/articles.repo.mongo';
import { SqlArticlesRepo } from '../infra/repos/articles.repo.sql';
import { MongoCommentsRepo } from '../infra/repos/comments.repo.mongo';
import { SqlCommentsRepo } from '../infra/repos/comments.repo.sql';

@Injectable()
export class TenantRepoFactory {
  private mongoModels = new Map<string, any>();
  constructor(
    private readonly registry: ConnectionRegistry,
    private readonly tenants: TenantsStore,
  ) {}
  // Users
  async users(tenantKey: string) {
    const t = this.tenants.get(tenantKey);
    if (t.dbKind === 'mongo') {
      const conn = await this.registry.getMongo(tenantKey, t.mongo);
      const key = `${tenantKey}:User`;
      if (!this.mongoModels.has(key)) {
        const schema = require('../infra/mongo/user.schema').UserSchema;
        this.mongoModels.set(key, conn.model('User', schema));
      }
      return new MongoUsersRepo(this.mongoModels.get(key));
    }
    const ds = await this.registry.getSql(tenantKey, t.sql);
    return new SqlUsersRepo(ds);
  }
  // Articles
  async articles(tenantKey: string) {
    const t = this.tenants.get(tenantKey);
    if (t.dbKind === 'mongo') {
      const conn = await this.registry.getMongo(tenantKey, t.mongo);
      const key = `${tenantKey}:Article`;
      if (!this.mongoModels.has(key)) {
        const schema = require('../infra/mongo/article.schema').ArticleSchema;
        this.mongoModels.set(key, conn.model('Article', schema));
      }
      return new MongoArticlesRepo(this.mongoModels.get(key));
    }
    const ds = await this.registry.getSql(tenantKey, t.sql);
    return new SqlArticlesRepo(ds);
  }
  // Comments
  async comments(tenantKey: string) {
    const t = this.tenants.get(tenantKey);
    if (t.dbKind === 'mongo') {
      const conn = await this.registry.getMongo(tenantKey, t.mongo);
      const cKey = `${tenantKey}:Comment`,
        vKey = `${tenantKey}:Vote`;
      if (!this.mongoModels.has(cKey) || !this.mongoModels.has(vKey)) {
        const s = require('../infra/mongo/comment.schema');
        this.mongoModels.set(cKey, conn.model('Comment', s.CommentSchema));
        this.mongoModels.set(vKey, conn.model('Vote', s.VoteSchema));
      }
      return new MongoCommentsRepo(this.mongoModels.get(cKey), this.mongoModels.get(vKey));
    }
    const ds = await this.registry.getSql(tenantKey, t.sql);
    return new SqlCommentsRepo(ds);
  }
}
