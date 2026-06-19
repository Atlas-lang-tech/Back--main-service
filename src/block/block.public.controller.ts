import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { BlockService } from './block.service.js';
import { AccessService } from '../auth/access.service.js';
import { UserContextGuard } from '../auth/user-context.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { UserContext } from '../auth/user.types.js';

@Controller('public/lesson')
@UseGuards(UserContextGuard)
export class BlockPublicController {
  constructor(
    private readonly blockService: BlockService,
    private readonly accessService: AccessService,
  ) {}

  @Get(':lessonId/blocks')
  async getBlocks(
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @CurrentUser() user: UserContext | undefined,
  ) {
    // Gate lesson content: free courses are open to everyone (incl. anonymous);
    // paid courses require admin role or an entitlement for the caller.
    await this.accessService.canAccessLesson(user, lessonId);
    const blocks = await this.blockService.findAllByLesson(lessonId);
    return blocks;
  }
}
