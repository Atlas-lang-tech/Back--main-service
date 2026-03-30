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
import { CategoryService } from './category.service.js';
import { CreateCategoryDto } from './dto/create.dto.js';

@Controller('private/category')
export class CategoryPrivateController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  async createCategory(@Body() DTO: CreateCategoryDto) {
    if (!DTO.name) {
      throw new BadRequestException('All fields are required');
    }

    const createCategory = await this.categoryService.create(DTO);
    return createCategory;
  }

  @Get(':id')
  async getCategoryById(@Param('id') id: number) {
    if (!id) {
      throw new BadRequestException('Invalid category ID');
    }

    if (isNaN(id)) {
      throw new BadRequestException('Invalid category ID');
    }

    const category = await this.categoryService.findOneById(Number(id));
    return category;
  }

  @Put(':id')
  async updateCategory(
    @Param('id') id: number,
    @Body() DTO: CreateCategoryDto,
  ) {
    if (!id) {
      throw new BadRequestException('Invalid category ID');
    }

    if (isNaN(id)) {
      throw new BadRequestException('Invalid category ID');
    }

    if (!DTO.name) {
      throw new BadRequestException('All fields are required');
    }

    const updatedCategory = await this.categoryService.update(Number(id), DTO);
    return updatedCategory;
  }

  @Delete(':id')
  async deleteCategory(@Param('id') id: number) {
    if (!id) {
      throw new BadRequestException('Invalid category ID');
    }

    if (isNaN(id)) {
      throw new BadRequestException('Invalid category ID');
    }

    await this.categoryService.delete(Number(id));
    return { message: 'Category deleted successfully' };
  }
}
