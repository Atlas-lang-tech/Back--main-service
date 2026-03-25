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
import { CourseService } from './course.service.js';
import { CreateCourseDto } from './dto/create.dto.js';

@Controller('course')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  async createCourse(@Body() DTO: CreateCourseDto) {
    if (!DTO.title) {
      throw new BadRequestException('All fields are required');
    }

    const createCourse = await this.courseService.create(DTO);
    return createCourse;
  }

  @Get()
  async getAllCourses() {
    const courses = await this.courseService.findAll();
    return courses;
  }

  @Get(':id')
  async getCourseById(@Param('id') id: number) {
    if (!id) {
      throw new BadRequestException('Invalid course ID');
    }

    if (isNaN(id)) {
      throw new BadRequestException('Invalid course ID');
    }

    const course = await this.courseService.findOneById(Number(id));
    return course;
  }

  @Get('/cid/:cid')
  async getCourseByCid(@Param('cid') cid: string) {
    if (!cid) {
      throw new BadRequestException('Invalid course cid');
    }

    const course = await this.courseService.findOneByCid(cid);
    return course;
  }

  @Get('/language/:id')
  async getCourseByLanguage(@Param('id') id: number) {
    if (!id) {
      throw new BadRequestException('Invalid language ID');
    }

    const course = await this.courseService.findOneByLanguage(Number(id));
    return course;
  }

  @Get('/category/:id')
  async getCourseByCategory(@Param('id') id: number) {
    if (!id) {
      throw new BadRequestException('Invalid category ID');
    }

    const course = await this.courseService.findOneByCategory(Number(id));
    return course;
  }

  @Put(':id')
  async updateCourse(@Param('id') id: number, @Body() DTO: CreateCourseDto) {
    if (!id) {
      throw new BadRequestException('Invalid course ID');
    }

    if (isNaN(id)) {
      throw new BadRequestException('Invalid course ID');
    }

    if (
      !DTO.categoryId ||
      !DTO.languageId ||
      !DTO.languageLvlId ||
      !DTO.title
    ) {
      throw new BadRequestException('All fields are required');
    }

    const updatedCourse = await this.courseService.update(Number(id), {
      ...DTO,
    });
    return updatedCourse;
  }

  @Delete(':id')
  async deleteCourse(@Param('id') id: number) {
    if (!id) {
      throw new BadRequestException('Invalid course ID');
    }

    if (isNaN(id)) {
      throw new BadRequestException('Invalid course ID');
    }

    await this.courseService.delete(Number(id));
    return { message: 'Course deleted successfully' };
  }
}
