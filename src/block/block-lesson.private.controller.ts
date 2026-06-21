import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { BlockService } from './block.service.js';
import { CreateBlockDto } from './dto/create-block.dto.js';
import { SyncBlocksDto } from './dto/sync-blocks.dto.js';
import { UserContextGuard } from '../common/auth/user-context.guard.js';
import { RolesGuard } from '../common/auth/roles.guard.js';
import { Roles } from '../common/auth/roles.decorator.js';
import { Role } from '../common/auth/roles.js';

@Controller('private/lesson')
@UseGuards(UserContextGuard, RolesGuard)
@Roles([Role.ADMIN])
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
