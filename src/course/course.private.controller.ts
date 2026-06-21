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
import { Roles } from '../common/auth/roles.decorator.js';
import { RolesGuard } from '../common/auth/roles.guard.js';
import { Role } from '../common/auth/roles.js';
import { UserContextGuard } from '../common/auth/user-context.guard.js';
import { CourseService } from './course.service.js';
import { CreateCourseDto } from './dto/create.dto.js';

@Controller('private/course')
@UseGuards(UserContextGuard, RolesGuard)
export class CoursePrivateController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  @Roles([Role.ADMIN, Role.MODERATOR])
  async createCourse(@Body() DTO: CreateCourseDto) {
    const createCourse = await this.courseService.create(DTO);
    return createCourse;
  }

  @Get(':id')
  @Roles([Role.ADMIN, Role.MODERATOR, Role.USER])
  async getCourseById(@Param('id', ParseIntPipe) id: number) {
    const course = await this.courseService.findOneById(id);
    return course;
  }

  @Put(':id')
  @Roles([Role.ADMIN, Role.MODERATOR])
  async updateCourse(
    @Param('id', ParseIntPipe) id: number,
    @Body() DTO: CreateCourseDto,
  ) {
    const updatedCourse = await this.courseService.update(id, DTO);
    return updatedCourse;
  }

  @Delete(':id')
  @Roles([Role.ADMIN, Role.MODERATOR])
  async deleteCourse(@Param('id', ParseIntPipe) id: number) {
    await this.courseService.delete(id);
    return { message: 'Course deleted successfully' };
  }
}
