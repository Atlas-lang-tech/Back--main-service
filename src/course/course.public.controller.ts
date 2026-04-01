import { BadRequestException, Controller, Get, Param } from '@nestjs/common';
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
}
