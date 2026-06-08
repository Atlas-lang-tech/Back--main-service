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
  async createInfo(
    @Param('id', ParseIntPipe) id: number,
    @Body() DTO: CreateInfoDto,
  ) {
    const newInfo = await this.lessonInfoBlokService.create(DTO, id);
    return newInfo;
  }

  @Get('/info/:id')
  async getInfo(@Param('id', ParseIntPipe) id: number) {
    const info = await this.lessonInfoBlokService.findAll(id);
    return info;
  }

  @Get('/info/id/:id')
  async getInfoById(@Param('id', ParseIntPipe) id: number) {
    const category = await this.lessonInfoBlokService.findOneById(id);
    return category;
  }

  @Put('info/:lessonid/id/:id')
  async updateInfo(
    @Param('lessonid', ParseIntPipe) lessonId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() DTO: CreateInfoDto,
  ) {
    const updatedCategory = await this.lessonInfoBlokService.update(
      id,
      lessonId,
      DTO,
    );
    return updatedCategory;
  }

  @Delete('/info/:id')
  async deleteInfo(@Param('id', ParseIntPipe) id: number) {
    await this.lessonInfoBlokService.delete(id);
    return { message: 'Block info deleted successfully' };
  }

  @Post('/quiz/:id')
  async createQuiz(
    @Param('id', ParseIntPipe) id: number,
    @Body() DTO: CreateInfoDto,
  ) {
    const newQuiz = await this.lessonQuizBlokService.create(DTO, id);
    return newQuiz;
  }

  @Get('/quiz/:id')
  async getQuiz(@Param('id', ParseIntPipe) id: number) {
    const quiz = await this.lessonQuizBlokService.findAll(id);
    return quiz;
  }

  @Get('/quiz/id/:id')
  async getQuizById(@Param('id', ParseIntPipe) id: number) {
    const quiz = await this.lessonQuizBlokService.findOneById(id);
    return quiz;
  }

  @Put('quiz/:lessonid/id/:id')
  async updateQuiz(
    @Param('lessonid', ParseIntPipe) lessonId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() DTO: CreateInfoDto,
  ) {
    const updatedQuiz = await this.lessonQuizBlokService.update(
      id,
      lessonId,
      DTO,
    );
    return updatedQuiz;
  }

  @Delete('/quiz/:id')
  async deleteQuiz(@Param('id', ParseIntPipe) id: number) {
    await this.lessonQuizBlokService.delete(id);
    return { message: 'Quiz deleted successfully' };
  }

  @Get(':LessonId')
  async getBlocsByLessonId(@Param('LessonId', ParseIntPipe) LessonId: number) {
    const info = await this.lessonInfoBlokService.findAll(LessonId);
    const quiz = await this.lessonQuizBlokService.findAll(LessonId);

    const sortDataByOrder = (data: CreateInfoDto[]) => {
      return data.sort((a, b) => a.order - b.order);
    };

    const sortedData = sortDataByOrder([...info, ...quiz]);
    return sortedData;
  }
}
