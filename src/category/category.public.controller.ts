import { Controller, Get } from '@nestjs/common';
import { CategoryService } from './category.service.js';

@Controller('public/category')
export class CategoryPublicController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  async getAllCategories() {
    const categories = await this.categoryService.findAll();
    return categories;
  }
}
