import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CourseService } from './course.service.js';
import { CreateCourseDto } from './dto/create.dto.js';
import { UserContextGuard } from '../common/auth/user-context.guard.js';
import { RolesGuard } from '../common/auth/roles.guard.js';
import { Roles } from '../common/auth/roles.decorator.js';
import { Role } from '../common/auth/roles.js';

@Controller('private/course')
@UseGuards(UserContextGuard, RolesGuard)
@Roles([Role.ADMIN])
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
