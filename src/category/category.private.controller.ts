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
import { CategoryService } from './category.service.js';
import { CreateCategoryDto } from './dto/create.dto.js';

@Controller('private/category')
export class CategoryPrivateController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  async createCategory(@Body() DTO: CreateCategoryDto) {
    const createCategory = await this.categoryService.create(DTO);
    return createCategory;
  }

  @Get(':id')
  async getCategoryById(@Param('id', ParseIntPipe) id: number) {
    const category = await this.categoryService.findOneById(id);
    return category;
  }

  @Put(':id')
  async updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() DTO: CreateCategoryDto,
  ) {
    const updatedCategory = await this.categoryService.update(id, DTO);
    return updatedCategory;
  }

  @Delete(':id')
  async deleteCategory(@Param('id', ParseIntPipe) id: number) {
    await this.categoryService.delete(id);
    return { message: 'Category deleted successfully' };
  }
}
