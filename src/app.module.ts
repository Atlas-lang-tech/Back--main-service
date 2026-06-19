import { Module } from '@nestjs/common';
import { RedisModule } from './modules/redis/redis.module.js';
import { RabbitModule } from './modules/rabbit/rabbit.module.js';
import { LanguageModule } from './language/language.module.js';
import { ConfigModule } from '@nestjs/config';
import { CategoryModule } from './category/category.module.js';
import { CourseModule } from './course/course.module.js';
import { LessonModule } from './lesson/lesson.module.js';
import { BlockModule } from './block/block.module.js';
import { AuthModule } from './auth/auth.module.js';
import { validate } from './common/env.validation.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    RedisModule,
    RabbitModule,
    AuthModule,
    LanguageModule,
    CategoryModule,
    CourseModule,
    LessonModule,
    BlockModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
