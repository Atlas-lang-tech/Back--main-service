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
import { LessonService } from './lesson.service.js';
import { CreateLessonDto } from './dto/create.dto.js';

@Controller('lesson')
export class LessonController {
  constructor(private readonly lessonService: LessonService) {}

  @Post()
  async createCourse(@Body() DTO: CreateLessonDto) {
    if (!DTO.title) {
      throw new BadRequestException('All fields are required');
    }

    const CreateLesson = await this.lessonService.create(DTO);
    return CreateLesson;
  }

  @Get(':id')
  async getLessons(@Param('id') id: number) {
    if (!id) {
      throw new BadRequestException('Invalid course ID');
    }

    if (isNaN(id)) {
      throw new BadRequestException('Invalid course ID');
    }

    const lesson = await this.lessonService.findAll(Number(id));
    return lesson;
  }

  @Get('/id/:id')
  async getLessonsById(@Param('id') id: number) {
    if (!id) {
      throw new BadRequestException('Invalid lesson ID');
    }

    if (isNaN(id)) {
      throw new BadRequestException('Invalid lesson ID');
    }

    const lesson = await this.lessonService.findOneById(Number(id));
    return lesson;
  }

  @Get('/cid/:cid')
  async getLessonByCid(@Param('cid') cid: string) {
    if (!cid) {
      throw new BadRequestException('Invalid lesson cid');
    }

    const lesson = await this.lessonService.findOneByCid(cid);
    return lesson;
  }

  @Put(':id')
  async updateCourse(@Param('id') id: number, @Body() DTO: CreateLessonDto) {
    if (!id) {
      throw new BadRequestException('Invalid lesson ID');
    }

    if (isNaN(id)) {
      throw new BadRequestException('Invalid lesson ID');
    }

    if (
      !DTO.cid ||
      !DTO.title ||
      !DTO.description ||
      !DTO.icon ||
      !DTO.courseId
    ) {
      throw new BadRequestException('All fields are required');
    }

    const updatedLesson = await this.lessonService.update(Number(id), {
      ...DTO,
    });
    return updatedLesson;
  }

  @Delete(':id')
  async deleteLesson(@Param('id') id: number) {
    if (!id) {
      throw new BadRequestException('Invalid lesson ID');
    }

    if (isNaN(id)) {
      throw new BadRequestException('Invalid lesson ID');
    }

    await this.lessonService.delete(Number(id));
    return { message: 'Lesson deleted successfully' };
  }
}
