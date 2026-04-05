import { Module } from '@nestjs/common';
import { CourseService } from './course.service.js';
import { CoursePrivateController } from './course.private.controller.js';
import { PrismaModule } from '../modules/Prisma/prisma.module.js';
import { CoursePublicController } from './course.public.controller.js';

@Module({
  imports: [PrismaModule],
  controllers: [CoursePrivateController, CoursePublicController],
  providers: [CourseService],
})
export class CourseModule {}
