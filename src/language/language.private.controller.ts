import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
    if (!DTO.name || !DTO.code || !DTO.icon) {
      throw new BadRequestException('All fields are required');
    }

    const createLanguage = await this.languageService.create(DTO);
    return createLanguage;
  }

  @Get(':id')
  async getLanguageById(@Param('id') id: number) {
    if (!id) {
      throw new BadRequestException('Invalid language ID');
    }

    if (isNaN(id)) {
      throw new BadRequestException('Invalid language ID');
    }

    const language = await this.languageService.findOneById(Number(id));
    return language;
  }

  @Put(':id')
  async updateLanguage(
    @Param('id') id: number,
    @Body() DTO: CreateLanguageDto,
  ) {
    if (!id) {
      throw new BadRequestException('Invalid language ID');
    }

    if (isNaN(id)) {
      throw new BadRequestException('Invalid language ID');
    }

    if (!DTO.name || !DTO.code || !DTO.icon) {
      throw new BadRequestException('All fields are required');
    }

    const updatedLanguage = await this.languageService.update(Number(id), DTO);
    return updatedLanguage;
  }

  @Delete(':id')
  async deleteLanguage(@Param('id') id: number) {
    if (!id) {
      throw new BadRequestException('Invalid language ID');
    }

    if (isNaN(id)) {
      throw new BadRequestException('Invalid language ID');
    }

    await this.languageService.delete(Number(id));
    return { message: 'Language deleted successfully' };
  }

  @Post('/LanguageLvl/:id')
  async createLanguageLvl(
    @Body() DTO: AddLanguageLvlDto,
    @Param('id') id: number,
  ) {
    if (!id) {
      throw new BadRequestException('Invalid language ID');
    }

    if (isNaN(id)) {
      throw new BadRequestException('Invalid language ID');
    }

    if (!DTO.name) {
      throw new BadRequestException('All fields are required');
    }

    const createLanguage = await this.languageLvlService.create(
      DTO,
      Number(id),
    );
    return createLanguage;
  }

  @Put('/languageLvl/:id')
  async updateLanguageLvl(
    @Param('id') id: number,
    @Body() DTO: AddLanguageLvlDto,
  ) {
    if (!id) {
      throw new BadRequestException('Invalid language ID');
    }

    if (isNaN(id)) {
      throw new BadRequestException('Invalid language ID');
    }

    if (!DTO.name) {
      throw new BadRequestException('Name is required');
    }

    const updatedLanguageLvl = await this.languageLvlService.update(
      Number(id),
      DTO,
    );
    return updatedLanguageLvl;
  }

  @Delete('/languageLvl/:id')
  async deleteLanguageLvl(@Param('id') id: number) {
    if (!id) {
      throw new BadRequestException('Invalid language level ID');
    }

    if (isNaN(id)) {
      throw new BadRequestException('Invalid language level ID');
    }

    await this.languageLvlService.delete(Number(id));
    return { message: 'Language level deleted successfully' };
  }
}
