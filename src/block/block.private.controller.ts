import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Put,
} from '@nestjs/common';
import { BlockService } from './block.service.js';
import { CreateBlockDto } from './dto/create-block.dto.js';

@Controller('private/block')
export class BlockPrivateController {
  constructor(private readonly blockService: BlockService) {}

  @Get(':id')
  async getBlockById(@Param('id', ParseIntPipe) id: number) {
    const block = await this.blockService.findOneById(id);
    return block;
  }

  @Put(':id')
  async updateBlock(
    @Param('id', ParseIntPipe) id: number,
    @Body() DTO: CreateBlockDto,
  ) {
    const block = await this.blockService.update(id, DTO);
    return block;
  }

  @Delete(':id')
  async deleteBlock(@Param('id', ParseIntPipe) id: number) {
    await this.blockService.delete(id);
    return { message: 'Block deleted successfully' };
  }
}
