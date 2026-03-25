import { Module } from '@nestjs/common';
import { RedisModule } from './modules/redis/redis.module.js';
import { LanguageModule } from './language/language.module.js';
import { ConfigModule } from '@nestjs/config';
import { CategoryModule } from './category/category.module.js';
import { CourseModule } from './course/course.module.js';

@Module({
  imports: [
    RedisModule,
    LanguageModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CategoryModule,
    CourseModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
