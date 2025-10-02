# SaaS Blog (NestJS 10)
- Multi-tenant (per-tenant DB: Mongo **nebo** SQL/TypeORM (Postgres/MariaDB))
- REST (Swagger) + GraphQL (Apollo) + Subscriptions (comments)
- JWT Auth (user/admin), admin může spravovat usery v rámci tenanta
- Komentáře (thread), hlasování per-IP (+/-), score
- Uploady obrázků per-tenant (`/uploads/<tenant>/<uuid>.<ext>`)
- Per-tenant rate-limit a request logging, 500 chyby se logují vždy

## Start
1) `cp .env.example .env` a uprav `TENANTS_CONFIG` a DB přístupy v `tenants.json`  
2) `npm ci && npm run start:dev`  
3) Swagger: `http://localhost:3000/docs`, GraphQL: `http://localhost:3000/graphql`  
