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
import { LessonService } from './lesson.service.js';
import { CreateLessonDto } from './dto/create.dto.js';

@Controller('private/lesson')
export class LessonController {
  constructor(private readonly lessonService: LessonService) {}

  @Post()
  async createCourse(@Body() DTO: CreateLessonDto) {
    const CreateLesson = await this.lessonService.create(DTO);
    return CreateLesson;
  }

  @Get(':id')
  async getLessons(@Param('id', ParseIntPipe) id: number) {
    const lesson = await this.lessonService.findAll(id);
    return lesson;
  }

  @Get('/id/:id')
  async getLessonsById(@Param('id', ParseIntPipe) id: number) {
    const lesson = await this.lessonService.findOneById(id);
    return lesson;
  }

  @Get('/cid/:cid')
  async getLessonByCid(@Param('cid') cid: string) {
    const lesson = await this.lessonService.findOneByCid(cid);
    return lesson;
  }

  @Put(':id')
  async updateCourse(
    @Param('id', ParseIntPipe) id: number,
    @Body() DTO: CreateLessonDto,
  ) {
    const updatedLesson = await this.lessonService.update(id, DTO);
    return updatedLesson;
  }

  @Delete(':id')
  async deleteLesson(@Param('id', ParseIntPipe) id: number) {
    await this.lessonService.delete(id);
    return { message: 'Lesson deleted successfully' };
  }
}
