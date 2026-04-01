import { Module } from '@nestjs/common';
import { RedisModule } from './modules/redis/redis.module.js';
import { LanguageModule } from './language/language.module.js';
import { ConfigModule } from '@nestjs/config';
import { CategoryModule } from './category/category.module.js';
import { CourseModule } from './course/course.module.js';
import { LessonModule } from './lesson/lesson.module.js';
import { LessonBlokModule } from './lesson-blok/lesson-blok.module.js';
import { validate } from './common/env.validation.js';

@Module({
  imports: [
    RedisModule,
    LanguageModule,
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    CategoryModule,
    CourseModule,
    LessonModule,
    LessonBlokModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
