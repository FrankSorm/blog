#!/bin/sh
# POSIX varianta – bez Bash specifik (pipefail, [[ ]], local, atd.)
set -eu

PROJECT="nest-blog-mongo"

# helper: zapíše STDIN do souboru (vytvoří složky)
write() {
  path="$1"
  mkdir -p "$(dirname "$path")"
  # shellcheck disable=SC2094
  cat > "$path"
}

# čistý start
rm -rf "$PROJECT"
mkdir -p "$PROJECT"
cd "$PROJECT"
mkdir -p uploads

# ---------- root ----------
write .gitignore <<'EOF'
node_modules/
dist/
coverage/
uploads/
.env
.npmrc
.DS_Store
EOF

write package.json <<'EOF'
{
  "name": "nest-blog-mongo",
  "version": "1.0.0",
  "private": true,
  "description": "Modern blog backend (NestJS + MongoDB Atlas) with JWT auth, roles, Swagger, validation, and image uploads",
  "license": "MIT",
  "scripts": {
    "build": "nest build",
    "start": "node dist/main.js",
    "start:dev": "nest start --watch",
    "start:prod": "node dist/main.js",
    "format": "prettier --write \"src/**/*.ts\"",
    "lint": "eslint \"{src,tests}/**/*.ts\" --max-warnings=0",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:e2e": "jest --config tests/jest-e2e.json",
    "seed": "ts-node -r tsconfig-paths/register src/seed/seed-admin.ts"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/config": "^3.1.1",
    "@nestjs/core": "^10.0.0",
    "@nestjs/jwt": "^10.2.0",
    "@nestjs/mapped-types": "^2.0.2",
    "@nestjs/mongoose": "^10.0.6",
    "@nestjs/passport": "^10.0.3",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/swagger": "^7.3.0",
    "@nestjs/throttler": "^6.2.1",
    "bcrypt": "^5.1.1",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.0",
    "helmet": "^8.0.0",
    "mongoose": "^8.5.0",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.2",
    "reflect-metadata": "^0.2.1",
    "rimraf": "^6.0.1",
    "slugify": "^1.6.6",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.4.2",
    "@nestjs/schematics": "^10.1.1",
    "@nestjs/testing": "^10.0.0",
    "@types/bcrypt": "^5.0.0",
    "@types/express": "^4.17.21",
    "@types/jest": "^29.5.5",
    "@types/multer": "^1.4.11",
    "@types/node": "^20.10.6",
    "@types/passport-jwt": "^3.0.12",
    "@types/supertest": "^2.0.15",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "eslint": "^8.57.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-import": "^2.29.1",
    "jest": "^29.7.0",
    "prettier": "^3.2.5",
    "supertest": "^6.3.3",
    "ts-jest": "^29.1.1",
    "ts-node": "^10.9.2",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.5.4"
  }
}
EOF

write tsconfig.json <<'EOF'
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "strict": true,
    "skipLibCheck": true,
    "noImplicitOverride": true,
    "noUncheckedIndexedAccess": true,
    "moduleResolution": "node",
    "paths": { "*": ["node_modules/*"] }
  },
  "exclude": ["node_modules", "dist", "uploads", "coverage"]
}
EOF

write tsconfig.build.json <<'EOF'
{ "extends": "./tsconfig.json", "exclude": ["node_modules", "dist", "tests", "uploads"] }
EOF

write nest-cli.json <<'EOF'
{ "collection": "@nestjs/schematics", "sourceRoot": "src" }
EOF

write .eslintrc.js <<'EOF'
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: { project: ['./tsconfig.json'] },
  plugins: ['@typescript-eslint', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier'
  ],
  rules: {
    'import/order': ['error', { 'newlines-between': 'always', alphabetize: { order: 'asc' } }],
    '@typescript-eslint/consistent-type-imports': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
  },
  ignorePatterns: ['dist/**','uploads/**']
};
EOF

write .prettierrc <<'EOF'
{ "singleQuote": true, "semi": true, "printWidth": 100, "trailingComma": "all" }
EOF

write .env.example <<'EOF'
NODE_ENV=development
PORT=3000
CORS_ORIGIN=*
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster-url>/blog?retryWrites=true&w=majority
JWT_SECRET=change-me-please
JWT_EXPIRES_IN=1d
THROTTLE_TTL=60
THROTTLE_LIMIT=100
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=ChangeMe123!
EOF

write Dockerfile <<'EOF'
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY ./.env ./.env
COPY ./uploads ./uploads
EXPOSE 3000
CMD ["node","dist/main.js"]
EOF

write docker-compose.yml <<'EOF'
version: '3.9'
services:
  app:
    build: .
    ports: ['3000:3000']
    env_file: [.env]
    volumes: ['./uploads:/app/uploads']
    healthcheck:
      test: ["CMD","node","-e","fetch('http://localhost:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
      interval: 30s
      timeout: 5s
      retries: 5
EOF

write README.md <<'EOF'
# Nest Blog (MongoDB Atlas)
Moderní, bezpečné API pro blog: NestJS + Mongoose, JWT, role, validace, Swagger, upload až 20 obrázků/článek.

## Start
1) `cp .env.example .env` a doplň `MONGODB_URI` (MongoDB Atlas).
2) `npm ci && npm run start:dev`
3) Swagger: `http://localhost:3000/docs`
4) Seed admina: `npm run seed`
EOF

# ---------- src ----------
write src/main.ts <<'EOF'
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import { ClassSerializerInterceptor, Reflector } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });
  app.enableCors({ origin: process.env.CORS_ORIGIN?.split(',') ?? '*', credentials: false });
  app.use(helmet());
  app.use(json({ limit: '5mb' }));
  app.use(urlencoded({ extended: true }));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.setGlobalPrefix('api');

  const config = new DocumentBuilder().setTitle('Blog API').setDescription('NestJS + MongoDB blog backend').setVersion('1.0').addBearerAuth().build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  await app.listen(port);
}
bootstrap();
EOF

write src/app.module.ts <<'EOF'
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { validateEnv } from './config/validation';
import configuration from './config/configuration';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ArticlesModule } from './articles/articles.module';
import { CommonModule } from './common/common.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration], validate: validateEnv }),
    MongooseModule.forRoot(process.env.MONGODB_URI as string),
    ThrottlerModule.forRoot([{ ttl: parseInt(process.env.THROTTLE_TTL || '60', 10), limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10) }]),
    CommonModule,
    AuthModule,
    UsersModule,
    ArticlesModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
EOF

write src/health.controller.ts <<'EOF'
import { Controller, Get } from '@nestjs/common';
@Controller('health')
export class HealthController { @Get() health() { return { ok: true }; } }
EOF

# config
write src/config/configuration.ts <<'EOF'
export default () => ({ env: process.env.NODE_ENV || 'development', port: parseInt(process.env.PORT || '3000', 10), jwt: { secret: process.env.JWT_SECRET, expiresIn: process.env.JWT_EXPIRES_IN || '1d' } });
EOF

write src/config/validation.ts <<'EOF'
import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, validateSync } from 'class-validator';
class EnvironmentVariables {
  @IsEnum(['development','test','production'] as any) NODE_ENV!: 'development'|'test'|'production';
  @IsString() MONGODB_URI!: string;
  @IsString() JWT_SECRET!: string;
  @IsOptional() @IsString() JWT_EXPIRES_IN?: string;
  @IsOptional() @IsNumber() PORT?: number;
}
export function validateEnv(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, { enableImplicitConversion: true });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length) throw new Error(errors.toString());
  return validated;
}
EOF

# common
write src/common/common.module.ts <<'EOF'
import { Module } from '@nestjs/common';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { HttpExceptionFilter } from './filters/http-exception.filter';
@Module({ providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }, { provide: APP_FILTER, useClass: HttpExceptionFilter }] })
export class CommonModule {}
EOF

write src/common/filters/http-exception.filter.ts <<'EOF'
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp(); const res = ctx.getResponse(); const req = ctx.getRequest();
    const isHttp = exception instanceof HttpException;
    const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = isHttp ? exception.getResponse() : 'Internal server error';
    res.status(status).json({ statusCode: status, path: req.url, timestamp: new Date().toISOString(), error: message });
  }
}
EOF

write src/common/decorators/roles.decorator.ts <<'EOF'
import { SetMetadata } from '@nestjs/common'; export const ROLES_KEY='roles'; export type Role='user'|'admin'; export const Roles=(...roles:Role[])=>SetMetadata(ROLES_KEY,roles);
EOF

write src/common/guards/roles.guard.ts <<'EOF'
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, Role } from '../decorators/roles.decorator';
@Injectable() export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride(ROLES_KEY, [ctx.getHandler(), ctx.getClass()]);
    if (!required || required.length= =0) return true;
    const req = ctx.switchToHttp().getRequest();
    return required.indexOf(req.user && req.user.role) !== -1;
  }
}
EOF

write src/common/pipes/mongo-id.pipe.ts <<'EOF'
import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { isValidObjectId } from 'mongoose';
@Injectable() export class MongoIdPipe implements PipeTransform<string> {
  transform(value: string) { if (!isValidObjectId(value)) throw new BadRequestException('Invalid id'); return value; }
}
EOF

write src/common/utils/slugify.ts <<'EOF'
import slugifyLib from 'slugify'; export const slugify=(text:string)=>slugifyLib(text,{lower:true,strict:true,trim:true});
EOF

# users + auth
write src/users/schemas/user.schema.ts <<'EOF'
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Exclude } from 'class-transformer';
export type UserDocument = HydratedDocument<User>;
@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true }) email!: string;
  @Prop({ required: true }) name!: string;
  @Prop({ required: true }) @Exclude() password!: string;
  @Prop({ type: String, enum: ['user','admin'], default: 'user' }) role!: 'user'|'admin';
}
export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.set('toJSON',{virtuals:true}); UserSchema.set('toObject',{virtuals:true});
EOF

write src/users/users.service.ts <<'EOF'
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { UpdateUserDto } from './dto/update-user.dto';
@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}
  async findAll() { return this.userModel.find().select('-password').exec(); }
  async findById(id: string) { const user = await this.userModel.findById(id).exec(); if (!user) throw new NotFoundException('User not found'); return user; }
  async update(id: string, dto: UpdateUserDto) {
    const user = await this.findById(id);
    if (dto.password) user.password = await bcrypt.hash(dto.password, 10);
    if (dto.name) user.name = dto.name;
    if (dto.role) user.role = dto.role;
    await user.save(); (user as any).password = undefined; return user;
  }
  async remove(id: string) { await this.userModel.findByIdAndDelete(id).exec(); return { deleted: true }; }
}
EOF

write src/users/dto/update-user.dto.ts <<'EOF'
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
export class UpdateUserDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() name?: string;
  @ApiProperty({ required: false, enum: ['user','admin'] }) @IsOptional() @IsEnum(['user','admin'] as any) role?: 'user'|'admin';
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MinLength(8) password?: string;
}
EOF

write src/users/users.module.ts <<'EOF'
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, UserSchema } from './schemas/user.schema';
@Module({ imports:[MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])], providers:[UsersService], controllers:[UsersController], exports:[UsersService] })
export class UsersModule {}
EOF

write src/users/users.controller.ts <<'EOF'
import { Controller, Get, Param, Patch, Body, Delete, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UpdateUserDto } from './dto/update-user.dto';
@ApiTags('users') @ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard) @Roles('admin')
@Controller({ path: 'admin/users', version: '1' })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @Get() findAll() { return this.usersService.findAll(); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateUserDto) { return this.usersService.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.usersService.remove(id); }
}
EOF

write src/auth/auth.service.ts <<'EOF'
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../users/schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
@Injectable()
export class AuthService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>, private jwtService: JwtService) {}
  async register(dto: RegisterDto) {
    const exists = await this.userModel.exists({ email: dto.email.toLowerCase() });
    if (exists) throw new ConflictException('Email already registered');
    const hash = await bcrypt.hash(dto.password, 10);
    const created = await this.userModel.create({ email: dto.email.toLowerCase(), name: dto.name, password: hash, role: dto.role ?? 'user' });
    return this.sign(created);
  }
  async validateUser(email: string, password: string) {
    const user = await this.userModel.findOne({ email: email.toLowerCase() }).exec();
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    return user;
  }
  async login(email: string, password: string) { const user = await this.validateUser(email, password); return this.sign(user); }
  private sign(user: UserDocument) {
    const payload = { sub: user._id.toString(), email: user.email, role: user.role, name: user.name };
    return { access_token: this.jwtService.sign(payload), user: { id: user._id, email: user.email, name: user.name, role: user.role } };
  }
}
EOF

write src/auth/dto/login.dto.ts <<'EOF'
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';
export class LoginDto { @ApiProperty() @IsEmail() email!: string; @ApiProperty() @IsString() @MinLength(8) password!: string; }
EOF

write src/auth/dto/register.dto.ts <<'EOF'
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
export class RegisterDto {
  @ApiProperty() @IsEmail() email!: string;
  @ApiProperty() @IsString() name!: string;
  @ApiProperty() @IsString() @MinLength(8) password!: string;
  @ApiProperty({ required: false, enum: ['user','admin'] }) @IsOptional() role?: 'user'|'admin';
}
EOF

write src/auth/jwt.strategy.ts <<'EOF'
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() { super({ jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), ignoreExpiration: false, secretOrKey: process.env.JWT_SECRET }); }
  async validate(payload: any) { return { sub: payload.sub, email: payload.email, role: payload.role, name: payload.name }; }
}
EOF

write src/auth/jwt-auth.guard.ts <<'EOF'
import { Injectable } from '@nestjs/common'; import { AuthGuard } from '@nestjs/passport'; @Injectable() export class JwtAuthGuard extends AuthGuard('jwt') {}
EOF

write src/auth/auth.module.ts <<'EOF'
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User, UserSchema } from '../users/schemas/user.schema';
import { JwtStrategy } from './jwt.strategy';
@Module({
  imports: [ MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    JwtModule.registerAsync({ useFactory: () => ({ secret: process.env.JWT_SECRET, signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '1d' } }) }) ],
  providers: [AuthService, JwtStrategy], controllers: [AuthController], exports: [AuthService]
})
export class AuthModule {}
EOF

write src/auth/auth.controller.ts <<'EOF'
import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Request } from 'express';
@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('register') async register(@Body() dto: RegisterDto) { return this.authService.register(dto); }
  @HttpCode(HttpStatus.OK) @Post('login') async login(@Body() dto: LoginDto) { return this.authService.login(dto.email, dto.password); }
  @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Get('me') me(@Req() req: Request) { return req.user; }
}
EOF

# articles
write src/articles/schemas/article.schema.ts <<'EOF'
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
export type ArticleDocument = HydratedDocument<Article>;
@Schema({ timestamps: true }) export class ArticleImage {
  @Prop({ required: true }) id!: string;
  @Prop({ required: true }) filename!: string;
  @Prop({ required: true }) url!: string;
  @Prop() alt?: string;
}
const ArticleImageSchema = SchemaFactory.createForClass(ArticleImage);
@Schema({ timestamps: true })
export class Article {
  @Prop({ required: true, trim: true }) title!: string;
  @Prop({ required: true, unique: true, index: true }) slug!: string;
  @Prop({ required: true }) content!: string;
  @Prop() excerpt?: string;
  @Prop([String]) tags!: string[];
  @Prop([String]) categories!: string[];
  @Prop({ type: String, enum: ['draft','published','scheduled'], default: 'draft' }) status!: 'draft'|'published'|'scheduled';
  @Prop({ type: Date }) publishAt?: Date;
  @Prop() coverImage?: string;
  @Prop({ type: [ArticleImageSchema], default: [] }) images!: ArticleImage[];
  @Prop({ type: Number, default: 0 }) views!: number;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true }) author!: Types.ObjectId;
  @Prop({ type: Date, default: null }) deletedAt!: Date | null;
}
export const ArticleSchema = SchemaFactory.createForClass(Article);
ArticleSchema.index({ title: 'text', content: 'text', tags: 1, categories: 1 });
EOF

write src/articles/dto/create-article.dto.ts <<'EOF'
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
export class CreateArticleDto {
  @ApiProperty() @IsString() @MaxLength(140) title!: string;
  @ApiProperty() @IsString() content!: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() excerpt?: string;
  @ApiProperty({ type: [String], required: false }) @IsOptional() @IsArray() tags?: string[];
  @ApiProperty({ type: [String], required: false }) @IsOptional() @IsArray() categories?: string[];
  @ApiProperty({ required: false, enum: ['draft','published','scheduled'] }) @IsOptional() @IsEnum(['draft','published','scheduled'] as any) status?: 'draft'|'published'|'scheduled';
  @ApiProperty({ required: false }) @IsOptional() @IsDateString() publishAt?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() coverImage?: string;
}
EOF

write src/articles/dto/update-article.dto.ts <<'EOF'
import { PartialType } from '@nestjs/mapped-types';
import { CreateArticleDto } from './create-article.dto';
export class UpdateArticleDto extends PartialType(CreateArticleDto) {}
EOF

write src/articles/articles.service.ts <<'EOF'
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Article, ArticleDocument } from './schemas/article.schema';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { slugify } from '../common/utils/slugify';
@Injectable()
export class ArticlesService {
  constructor(@InjectModel(Article.name) private articleModel: Model<ArticleDocument>) {}
  async create(dto: CreateArticleDto, authorId: string) {
    const slug = await this.generateUniqueSlug(dto.title);
    const article = await this.articleModel.create({ ...dto, slug, author: authorId, publishAt: dto.publishAt ? new Date(dto.publishAt) : undefined });
    return article;
  }
  async generateUniqueSlug(title: string) {
    const base = slugify(title); let slug = base; let i = 1;
    while (await this.articleModel.exists({ slug })) slug = base + '-' + (i++);
    return slug;
  }
  async findPublic(query: { search?: string; tag?: string; category?: string; page?: number; limit?: number; sort?: string; }) {
    var page = query.page ? Number(query.page) : 1;
    var limit = query.limit ? Number(query.limit) : 10;
    var sort = query.sort ? String(query.sort) : '-publishAt -createdAt';
    const filter: FilterQuery<ArticleDocument> = { deletedAt: null, $or: [{ status: 'published' }, { status: 'scheduled', publishAt: { $lte: new Date() } }] };
    if (query.search) (filter as any).$text = { $search: String(query.search) };
    if (query.tag) (filter as any).tags = String(query.tag);
    if (query.category) (filter as any).categories = String(query.category);
    const skip = (page - 1) * limit;
    const items = await this.articleModel.find(filter).sort(sort).skip(skip).limit(limit).select('-images').exec();
    const total = await this.articleModel.countDocuments(filter);
    return { items: items, total: total, page: page, limit: limit };
  }
  async findBySlugPublic(slug: string) {
    const now = new Date();
    const article = await this.articleModel.findOne({ slug: slug, deletedAt: null, $or: [{ status: 'published' }, { status: 'scheduled', publishAt: { $lte: now } }] }).populate('author','name').exec();
    if (!article) throw new NotFoundException('Article not found');
    article.views += 1; await article.save(); return article;
  }
  async adminFindAll(query: { page?: number; limit?: number; sort?: string; author?: string }) {
    var page = query.page ? Number(query.page) : 1;
    var limit = query.limit ? Number(query.limit) : 20;
    var sort = query.sort ? String(query.sort) : '-createdAt';
    const filter: FilterQuery<ArticleDocument> = {};
    if (query.author) (filter as any).author = String(query.author);
    const skip = (page - 1) * limit;
    const items = await this.articleModel.find(filter).sort(sort).skip(skip).limit(limit);
    const total = await this.articleModel.countDocuments(filter);
    return { items: items, total: total, page: page, limit: limit };
  }
  async findById(id: string) { const article = await this.articleModel.findById(id).exec(); if (!article) throw new NotFoundException('Article not found'); return article; }
  async update(id: string, dto: UpdateArticleDto, user: { sub: string; role: string }) {
    const article = await this.findById(id);
    if (user.role !== 'admin' && String(article.author) !== user.sub) throw new ForbiddenException('You can edit only your own articles');
    if (dto.title && dto.title !== article.title) article.slug = await this.generateUniqueSlug(dto.title);
    Object.assign(article, { ...dto, publishAt: dto.publishAt ? new Date(dto.publishAt) : article.publishAt });
    await article.save(); return article;
  }
  async softDelete(id: string, user: { sub: string; role: string }) {
    const article = await this.findById(id);
    if (user.role !== 'admin' && String(article.author) !== user.sub) throw new ForbiddenException('You can delete only your own articles');
    article.deletedAt = new Date(); await article.save(); return { deleted: true };
  }
  async addImages(id: string, files: Express.Multer.File[]) {
    const article = await this.findById(id);
    if ((article.images ? article.images.length : 0) + files.length > 20) throw new ForbiddenException('Max 20 images per article');
    const toAdd = files.map(function (f) { return { id: uuidv4(), filename: f.filename, url: '/uploads/' + f.filename, alt: f.originalname }; });
    article.images = (article.images || []).concat(toAdd); await article.save(); return article.images;
  }
  async removeImage(id: string, imageId: string) {
    const article = await this.findById(id); article.images = (article.images || []).filter(function (img) { return img.id !== imageId; }); await article.save(); return article.images;
  }
}
EOF

write src/articles/articles.controller.ts <<'EOF'
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFiles, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ArticlesService } from './articles.service';
import { Request } from 'express';

@ApiTags('articles-admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'admin/articles', version: '1' })
export class ArticlesAdminController {
  constructor(private readonly service: ArticlesService) {}

  @Get()
  @Roles('admin')
  adminList(@Query() query: any) { return this.service.adminFindAll(query); }

  @Post()
  create(@Body() dto: CreateArticleDto, @Req() req: Request) {
    const user = req.user as any; return this.service.create(dto, user.sub);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateArticleDto, @Req() req: Request) {
    const user = req.user as any; return this.service.update(id, dto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as any; return this.service.softDelete(id, user);
  }

  @Post(':id/images')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('images', 20, {
    storage: diskStorage({ destination: './uploads', filename: (_req, file, cb) => cb(null, uuidv4() + extname(file.originalname)) }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => { const allowed=['image/jpeg','image/png','image/webp','image/gif','image/avif']; cb(null, allowed.indexOf(file.mimetype) !== -1); },
  }))
  uploadImages(@Param('id') id: string, @UploadedFiles() files: Express.Multer.File[]) { return this.service.addImages(id, files); }

  @Delete(':id/images/:imageId')
  deleteImage(@Param('id') id: string, @Param('imageId') imageId: string) { return this.service.removeImage(id, imageId); }
}
EOF

write src/articles/articles.public.controller.ts <<'EOF'
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ArticlesService } from './articles.service';
@ApiTags('articles-public')
@Controller({ path: 'articles', version: '1' })
export class ArticlesPublicController {
  constructor(private readonly service: ArticlesService) {}
  @Get() list(@Query() query: any) { return this.service.findPublic(query); }
  @Get(':slug') detail(@Param('slug') slug: string) { return this.service.findBySlugPublic(slug); }
}
EOF

write src/articles/articles.module.ts <<'EOF'
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Article, ArticleSchema } from './schemas/article.schema';
import { ArticlesService } from './articles.service';
import { ArticlesAdminController } from './articles.controller';
import { ArticlesPublicController } from './articles.public.controller';
@Module({ imports: [MongooseModule.forFeature([{ name: Article.name, schema: ArticleSchema }])], providers: [ArticlesService], controllers: [ArticlesAdminController, ArticlesPublicController], exports: [ArticlesService] })
export class ArticlesModule {}
EOF

# seed
write src/seed/seed-admin.ts <<'EOF'
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../users/schemas/user.schema';
import * as bcrypt from 'bcrypt';
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userModel = app.get(getModelToken(User.name));
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const pass = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
  const exists = await userModel.exists({ email });
  if (exists) { console.log('Admin already exists ->', email); }
  else {
    await userModel.create({ email, name: 'Admin', password: await bcrypt.hash(pass, 10), role: 'admin' });
    console.log('Admin created ->', email);
  }
  await app.close();
}
bootstrap();
EOF

# tests
write tests/jest-e2e.json <<'EOF'
{ "moduleFileExtensions": ["js","json","ts"], "rootDir": "../", "testRegex": ".e2e-spec.ts$", "transform": { "^.+\\.(t|j)s$": "ts-jest" }, "testEnvironment": "node" }
EOF

write tests/app.e2e-spec.ts <<'EOF'
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
describe('App e2e', () => {
  let app: INestApplication;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });
  afterAll(async () => { await app.close(); });
  it('/health (GET)', async () => { await request(app.getHttpServer()).get('/health').expect(200); });
});
EOF

write tests/articles.service.spec.ts <<'EOF'
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ArticlesService } from '../src/articles/articles.service';
import { Article } from '../src/articles/schemas/article.schema';
describe('ArticlesService', () => {
  let service: ArticlesService; let model: Model<any>;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ ArticlesService, { provide: getModelToken(Article.name), useValue: Model } ],
    }).compile();
    service = module.get<ArticlesService>(ArticlesService);
    model = module.get<Model<any>>(getModelToken(Article.name));
  });
  it('should be defined', () => { expect(service).toBeDefined(); expect(model).toBeDefined(); });
});
EOF

# ----- volitelný git init & push (POSIX) -----
if [ "${GIT_INIT:-0}" = "1" ]; then
  git init >/dev/null 2>&1
  # přepnout/ vytvořit main
  (git symbolic-ref -q HEAD refs/heads/main >/dev/null 2>&1) || git checkout -b main >/dev/null 2>&1 || true
  git add .
  git commit -m "Init Nest blog (MongoDB Atlas, JWT, roles, Swagger, uploads)" >/dev/null 2>&1 || true
  if [ -n "${GIT_REMOTE:-}" ]; then
    if git remote get-url origin >/dev/null 2>&1; then
      git remote set-url origin "$GIT_REMOTE" || true
    else
      git remote add origin "$GIT_REMOTE" || true
    fi
    git push -u origin main >/dev/null 2>&1 || echo "Git push na $GIT_REMOTE se nepovedl (zkontroluj práva/empty repo)."
  fi
fi

echo
echo "✅ Projekt je připraven ve složce: $(pwd)"
echo "➡ Další kroky:"
echo "   cp .env.example .env   # doplň MONGODB_URI (Atlas), JWT_SECRET, atd."
echo "   npm ci && npm run start:dev"
echo "   # volitelně: npm run seed"
