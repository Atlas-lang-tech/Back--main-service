import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { LanguageService } from './language.service.js';
import { CreateLanguageDto } from './dto/create.dto.js';
import { AddLanguageLvlDto } from './dto/addLvl.dto.js';
import { LanguageLvlService } from './languageLvl.service.js';
@Controller('private/language')
export class LanguagePrivateController {
  constructor(
    private readonly languageService: LanguageService,
    private readonly languageLvlService: LanguageLvlService,
  ) {}

  @Post()
  async createLanguage(@Body() DTO: CreateLanguageDto) {
    const createLanguage = await this.languageService.create(DTO);
    return createLanguage;
  }

  @Get(':id')
  async getLanguageById(@Param('id', ParseIntPipe) id: number) {
    const language = await this.languageService.findOneById(id);
    return language;
  }

  @Put(':id')
  async updateLanguage(
    @Param('id', ParseIntPipe) id: number,
    @Body() DTO: CreateLanguageDto,
  ) {
    const updatedLanguage = await this.languageService.update(id, DTO);
    return updatedLanguage;
  }

  @Delete(':id')
  async deleteLanguage(@Param('id', ParseIntPipe) id: number) {
    await this.languageService.delete(id);
    return { message: 'Language deleted successfully' };
  }

  @Post('/level/:id')
  async createLanguageLvl(
    @Body() DTO: AddLanguageLvlDto,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const createLanguage = await this.languageLvlService.create(DTO, id);
    return createLanguage;
  }

  @Get('/level/all')
  async getAllLanguageLvl() {
    const languagesLvl = await this.languageLvlService.getAll();
    return languagesLvl;
  }

  @Put('/level/:id')
  async updateLanguageLvl(
    @Param('id', ParseIntPipe) id: number,
    @Body() DTO: AddLanguageLvlDto,
  ) {
    const updatedLanguageLvl = await this.languageLvlService.update(id, DTO);
    return updatedLanguageLvl;
  }

  @Delete('/level/:id')
  async deleteLanguageLvl(@Param('id', ParseIntPipe) id: number) {
    await this.languageLvlService.delete(id);
    return { message: 'Language level deleted successfully' };
  }
}
