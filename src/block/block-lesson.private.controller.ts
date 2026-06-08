import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { BlockService } from './block.service.js';
import { CreateBlockDto } from './dto/create-block.dto.js';
import { SyncBlocksDto } from './dto/sync-blocks.dto.js';

@Controller('private/lesson')
export class BlockLessonPrivateController {
  constructor(private readonly blockService: BlockService) {}

  @Get(':lessonId/blocks')
  async getBlocks(@Param('lessonId', ParseIntPipe) lessonId: number) {
    const blocks = await this.blockService.findAllByLesson(lessonId);
    return blocks;
  }

  @Put(':lessonId/blocks')
  async syncBlocks(
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @Body() DTO: SyncBlocksDto,
  ) {
    const blocks = await this.blockService.syncLesson(lessonId, DTO.blocks);
    return blocks;
  }

  @Post(':lessonId/blocks')
  async createBlock(
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @Body() DTO: CreateBlockDto,
  ) {
    const block = await this.blockService.create(lessonId, DTO);
    return block;
  }
}
