import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { LanguageService } from './language.service.js';
import { LanguageLvlService } from './languageLvl.service.js';

@Controller('public/language')
export class LanguagePublicController {
  constructor(
    private readonly languageService: LanguageService,
    private readonly languageLvlService: LanguageLvlService,
  ) {}

  @Get()
  async getAllLanguages() {
    const languages = await this.languageService.findAll();
    return languages;
  }

  @Get('/level/:id')
  async getAllLanguagesLvl(@Param('id', ParseIntPipe) id: number) {
    const languagesLvl = await this.languageLvlService.findAllByLanguageId(id);
    return languagesLvl;
  }

  @Get('/level/id/:id')
  async getLanguageLvlById(@Param('id', ParseIntPipe) id: number) {
    const languageLvl = await this.languageLvlService.findOneById(id);
    return languageLvl;
  }
}
