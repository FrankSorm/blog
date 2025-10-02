import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  Req,
  Body,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ArticlesService } from './articles.service';
import { User } from '../domain/users/user.types';
import { ListArticlesDto } from './dto/list-articles.dto';

@ApiTags('articles-admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'admin/articles', version: '1' })
export class ArticlesAdminController {
  constructor(private readonly service: ArticlesService) {}

  @Get() list(@Query() query: ListArticlesDto, @Req() req: any) {
    return this.service.adminFindAll(query, req.tenantKey);
  }

  @Post() create(@Body() dto: CreateArticleDto, @Req() req: any) {
    const user = req.user as User;
    return this.service.create(dto, user, req.tenantKey);
  }

  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateArticleDto, @Req() req: any) {
    const user = req.user as User;
    return this.service.update(id, dto, user, req.tenantKey);
  }

  @Delete(':id') remove(@Param('id') id: string, @Req() req: any) {
    const user = req.user as User;
    return this.service.softDelete(id, user, req.tenantKey);
  }

  // This has to be changed to upload file to cloud (google storage, S3, not on disc)
  @Post(':id/images')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('images', 20, {
      storage: diskStorage({
        destination: (req, _file, cb) => {
          const t = (req as any).tenantKey || 'default';
          const dir = `./uploads/${t}`;
          cb(null, dir);
        },
        filename: (_req, file, cb) => cb(null, `${randomUUID()}${extname(file.originalname)}`),
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const ok = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'].includes(
          file.mimetype,
        );
        cb(null, ok);
      },
    }),
  )
  upload(@Param('id') id: string, @UploadedFiles() files: Express.Multer.File[], @Req() req: any) {
    const tenant = (req as any).tenantKey || 'default';
    return this.service.addImages(id, files, tenant);
  }

  @Delete(':id/images/:imageId')
  removeImage(@Param('id') id: string, @Param('imageId') imageId: string, @Req() req: any) {
    return this.service.removeImage(id, imageId, req.tenantKey);
  }
}
