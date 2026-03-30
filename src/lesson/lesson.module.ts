import { Module } from '@nestjs/common';
import { LessonService } from './lesson.service.js';
import { LessonController } from './lesson.controller.js';
import { PrismaModule } from '../modules/Prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [LessonController],
  providers: [LessonService],
})
export class LessonModule {}
