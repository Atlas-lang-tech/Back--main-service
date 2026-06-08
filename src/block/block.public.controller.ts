import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { BlockService } from './block.service.js';

@Controller('public/lesson')
export class BlockPublicController {
  constructor(private readonly blockService: BlockService) {}

  @Get(':lessonId/blocks')
  async getBlocks(@Param('lessonId', ParseIntPipe) lessonId: number) {
    const blocks = await this.blockService.findAllByLesson(lessonId);
    return blocks;
  }
}
