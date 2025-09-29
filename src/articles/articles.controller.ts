import {
  Body,
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
} from '@nestjs/common';
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
  adminList(@Query() query: any) {
    return this.service.adminFindAll(query);
  }

  @Post()
  create(@Body() dto: CreateArticleDto, @Req() req: Request) {
    const user = req.user as any;
    return this.service.create(dto, user.sub);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateArticleDto, @Req() req: Request) {
    const user = req.user as any;
    return this.service.update(id, dto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as any;
    return this.service.softDelete(id, user);
  }

  @Post(':id/images')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('images', 20, {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) => cb(null, uuidv4() + extname(file.originalname)),
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
        cb(null, allowed.indexOf(file.mimetype) !== -1);
      },
    }),
  )
  uploadImages(@Param('id') id: string, @UploadedFiles() files: Express.Multer.File[]) {
    return this.service.addImages(id, files);
  }

  @Delete(':id/images/:imageId')
  deleteImage(@Param('id') id: string, @Param('imageId') imageId: string) {
    return this.service.removeImage(id, imageId);
  }
}
