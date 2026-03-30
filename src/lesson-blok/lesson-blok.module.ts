import { Module } from '@nestjs/common';
import { LessonInfoBlokService } from './lesson-info-blok.service.js';
import { LessonBlokController } from './lesson-blok.controller.js';
import { LessonQuizBlokService } from './lesson-quiz-blok.service.js';
import { PrismaModule } from '../modules/Prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [LessonBlokController],
  providers: [LessonInfoBlokService, LessonQuizBlokService],
})
export class LessonBlokModule {}
