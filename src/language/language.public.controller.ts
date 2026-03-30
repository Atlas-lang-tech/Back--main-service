import { BadRequestException, Controller, Get, Param } from '@nestjs/common';
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

  @Get('/languageLvl/:id')
  async getAllLanguagesLvl(@Param('id') id: number) {
    if (!id) {
      throw new BadRequestException('Invalid language ID');
    }

    if (isNaN(id)) {
      throw new BadRequestException('Invalid language ID');
    }

    const languagesLvl = await this.languageLvlService.findAllByLanguageId(
      Number(id),
    );
    return languagesLvl;
  }

  @Get('/languageLvl/id/:id')
  async getLanguageLvlById(@Param('id') id: number) {
    if (!id) {
      throw new BadRequestException('Invalid language level ID');
    }

    if (isNaN(id)) {
      throw new BadRequestException('Invalid language level ID');
    }

    const languageLvl = await this.languageLvlService.findOneById(Number(id));
    return languageLvl;
  }
}
