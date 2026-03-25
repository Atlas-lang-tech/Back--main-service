import { Module } from '@nestjs/common';
import { RedisModule } from './modules/redis/redis.module.js';
import { LanguageModule } from './language/language.module.js';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    RedisModule,
    LanguageModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
