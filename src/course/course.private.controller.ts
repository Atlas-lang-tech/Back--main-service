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
import { CourseService } from './course.service.js';
import { CreateCourseDto } from './dto/create.dto.js';

@Controller('private/course')
export class CoursePrivateController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  async createCourse(@Body() DTO: CreateCourseDto) {
    const createCourse = await this.courseService.create(DTO);
    return createCourse;
  }

  @Get(':id')
  async getCourseById(@Param('id', ParseIntPipe) id: number) {
    const course = await this.courseService.findOneById(id);
    return course;
  }

  @Put(':id')
  async updateCourse(
    @Param('id', ParseIntPipe) id: number,
    @Body() DTO: CreateCourseDto,
  ) {
    const updatedCourse = await this.courseService.update(id, DTO);
    return updatedCourse;
  }

  @Delete(':id')
  async deleteCourse(@Param('id', ParseIntPipe) id: number) {
    await this.courseService.delete(id);
    return { message: 'Course deleted successfully' };
  }
}
