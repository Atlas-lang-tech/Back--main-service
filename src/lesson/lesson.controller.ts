import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { LessonService } from './lesson.service.js';
import { CreateLessonDto } from './dto/create.dto.js';
import { ReorderLessonsDto } from './dto/reorder.dto.js';
import { UserContextGuard } from '../common/auth/user-context.guard.js';
import { RolesGuard } from '../common/auth/roles.guard.js';
import { Roles } from '../common/auth/roles.decorator.js';
import { Role } from '../common/auth/roles.js';

@Controller('private/lesson')
@UseGuards(UserContextGuard, RolesGuard)
@Roles([Role.ADMIN])
export class LessonController {
  constructor(private readonly lessonService: LessonService) {}

  @Post()
  async createCourse(@Body() DTO: CreateLessonDto) {
    const CreateLesson = await this.lessonService.create(DTO);
    return CreateLesson;
  }

  @Patch('reorder/:courseId')
  async reorderLessons(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() DTO: ReorderLessonsDto,
  ) {
    const lessons = await this.lessonService.reorder(courseId, DTO.lessonIds);
    return lessons;
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
