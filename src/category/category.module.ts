import { Module } from '@nestjs/common';
import { CategoryService } from './category.service.js';
import { CategoryPrivateController } from './category.private.controller.js';
import { CategoryPublicController } from './category.public.controller.js';

import { PrismaModule } from '../modules/Prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [CategoryPrivateController, CategoryPublicController],
  providers: [CategoryService],
})
export class CategoryModule {}
