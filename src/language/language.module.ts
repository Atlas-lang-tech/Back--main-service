import { Module } from '@nestjs/common';
import { LanguageService } from './language.service.js';
import { LanguageController } from './language.controller.js';
import { PrismaModule } from '../modules/Prisma/prisma.module.js';
import { LanguageLvlService } from './languageLvl.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [LanguageController],
  providers: [LanguageService, LanguageLvlService],
})
export class LanguageModule {}
