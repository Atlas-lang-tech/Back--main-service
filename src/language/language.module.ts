import { Module } from '@nestjs/common';
import { LanguageService } from './language.service.js';
import { LanguagePrivateController } from './language.private.controller.js';
import { PrismaModule } from '../modules/Prisma/prisma.module.js';
import { LanguageLvlService } from './languageLvl.service.js';
import { LanguagePublicController } from './language.public.controller.js';

@Module({
  imports: [PrismaModule],
  controllers: [LanguagePrivateController, LanguagePublicController],
  providers: [LanguageService, LanguageLvlService],
})
export class LanguageModule {}
