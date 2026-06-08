import { Module } from '@nestjs/common';
import { BlockService } from './block.service.js';
import { PrismaModule } from '../modules/Prisma/prisma.module.js';
import { BlockLessonPrivateController } from './block-lesson.private.controller.js';
import { BlockPrivateController } from './block.private.controller.js';
import { BlockPublicController } from './block.public.controller.js';

@Module({
  imports: [PrismaModule],
  controllers: [
    BlockLessonPrivateController,
    BlockPrivateController,
    BlockPublicController,
  ],
  providers: [BlockService],
})
export class BlockModule {}
