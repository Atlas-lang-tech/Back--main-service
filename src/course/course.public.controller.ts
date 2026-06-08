import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { CourseService } from './course.service.js';

@Controller('public/course')
export class CoursePublicController {
  constructor(private readonly courseService: CourseService) {}

  @Get()
  async getAllCourses() {
    const courses = await this.courseService.findAll();
    return courses;
  }

  @Get('/cid/:cid')
  async getCourseByCid(@Param('cid') cid: string) {
    const course = await this.courseService.findOneByCid(cid);
    return course;
  }

  @Get('/language/:id')
  async getCourseByLanguage(@Param('id', ParseIntPipe) id: number) {
    const course = await this.courseService.findOneByLanguage(id);
    return course;
  }

  @Get('/category/:id')
  async getCourseByCategory(@Param('id', ParseIntPipe) id: number) {
    const course = await this.courseService.findOneByCategory(id);
    return course;
  }
}
