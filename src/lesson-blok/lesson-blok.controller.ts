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
import { LessonInfoBlokService } from './lesson-info-blok.service.js';
import { CreateInfoDto } from './dto/CreateInfoBlock.dto.js';
import { LessonQuizBlokService } from './lesson-quiz-blok.service.js';

@Controller('private/lesson-blok')
export class LessonBlokController {
  constructor(
    private readonly lessonInfoBlokService: LessonInfoBlokService,
    private readonly lessonQuizBlokService: LessonQuizBlokService,
  ) {}

  @Post('/info/:id')
  async createInfo(@Param('id') id: number, @Body() DTO: CreateInfoDto) {
    if (!DTO.order || !DTO.title || !DTO.text) {
      throw new Error('Missing required fields');
    }

    const newInfo = await this.lessonInfoBlokService.create(DTO, Number(id));
    return newInfo;
  }

  @Get('/info/:id')
  async getInfo(@Param('id') id: number) {
    const info = await this.lessonInfoBlokService.findAll(id);
    return info;
  }

  @Get('/info/id/:id')
  async getInfoById(@Param('id') id: number) {
    if (!id) {
      throw new BadRequestException('Invalid blok info ID');
    }

    if (isNaN(id)) {
      throw new BadRequestException('Invalid blok info ID');
    }

    const category = await this.lessonInfoBlokService.findOneById(Number(id));
    return category;
  }

  @Put('info/:lessonid/id/:id')
  async updateInfo(
    @Param('lessonid') lessonId: number,
    @Param('id') id: number,
    @Body() DTO: CreateInfoDto,
  ) {
    if (!lessonId) {
      throw new BadRequestException('Invalid lesson ID');
    }

    if (isNaN(id)) {
      throw new BadRequestException('Invalid block info ID');
    }

    if (!DTO.order || !DTO.title || !DTO.text) {
      throw new BadRequestException('All fields are required');
    }

    const updatedCategory = await this.lessonInfoBlokService.update(
      Number(id),
      Number(lessonId),
      DTO,
    );
    return updatedCategory;
  }

  @Delete('/info/:id')
  async deleteInfo(@Param('id') id: number) {
    if (!id) {
      throw new BadRequestException('Invalid block info ID');
    }

    if (isNaN(id)) {
      throw new BadRequestException('Invalid block info ID');
    }

    await this.lessonInfoBlokService.delete(Number(id));
    return { message: 'Block info deleted successfully' };
  }

  @Post('/quiz/:id')
  async createQuiz(@Param('id') id: number, @Body() DTO: CreateInfoDto) {
    if (!DTO.order || !DTO.title || !DTO.text) {
      throw new Error('Missing required fields');
    }

    const newQuiz = await this.lessonQuizBlokService.create(DTO, Number(id));
    return newQuiz;
  }

  @Get('/quiz/:id')
  async getQuiz(@Param('id') id: number) {
    const quiz = await this.lessonQuizBlokService.findAll(id);
    return quiz;
  }

  @Get('/quiz/id/:id')
  async getQuizById(@Param('id') id: number) {
    if (!id) {
      throw new BadRequestException('Invalid quiz ID');
    }

    if (isNaN(id)) {
      throw new BadRequestException('Invalid quiz ID');
    }

    const quiz = await this.lessonQuizBlokService.findOneById(Number(id));
    return quiz;
  }

  @Put('quiz/:lessonid/id/:id')
  async updateQuiz(
    @Param('lessonid') lessonId: number,
    @Param('id') id: number,
    @Body() DTO: CreateInfoDto,
  ) {
    if (!lessonId) {
      throw new BadRequestException('Invalid lesson ID');
    }

    if (isNaN(id)) {
      throw new BadRequestException('Invalid quiz ID');
    }

    if (!DTO.order || !DTO.title || !DTO.text) {
      throw new BadRequestException('All fields are required');
    }

    const updatedQuiz = await this.lessonQuizBlokService.update(
      Number(id),
      Number(lessonId),
      DTO,
    );
    return updatedQuiz;
  }

  @Delete('/quiz/:id')
  async deleteQuiz(@Param('id') id: number) {
    if (!id) {
      throw new BadRequestException('Invalid quiz ID');
    }

    if (isNaN(id)) {
      throw new BadRequestException('Invalid quiz ID');
    }

    await this.lessonQuizBlokService.delete(Number(id));
    return { message: 'Quiz deleted successfully' };
  }

  @Get(':LessonId')
  async getBlocsByLessonId(@Param('LessonId') LessonId: number) {
    if (!LessonId) {
      throw new BadRequestException('Invalid lesson ID');
    }

    if (isNaN(LessonId)) {
      throw new BadRequestException('Invalid lesson ID');
    }

    const info = await this.lessonInfoBlokService.findAll(Number(LessonId));
    const quiz = await this.lessonQuizBlokService.findAll(Number(LessonId));

    const sortDataByOrder = (data: CreateInfoDto[]) => {
      return data.sort((a, b) => a.order - b.order);
    };

    const sortedData = sortDataByOrder([...info, ...quiz]);
    return sortedData;
  }
}
