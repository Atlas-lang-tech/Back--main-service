import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ProgressService } from './progress.service.js';
import { AccessService } from '../auth/access.service.js';
import { UserContextGuard } from '../common/auth/user-context.guard.js';
import { CurrentUser } from '../common/auth/current-user.decorator.js';
import type { UserContext } from '../common/auth/user-context.guard.js';

@Controller('public/progress')
@UseGuards(UserContextGuard)
export class ProgressController {
  constructor(
    private readonly progressService: ProgressService,
    private readonly accessService: AccessService,
  ) {}

  @Post('lesson/:lessonId/complete')
  async completeLesson(
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @CurrentUser() user: UserContext,
  ) {
    // Can't complete a lesson you can't read: free for everyone, paid requires
    // admin role or an entitlement for the caller.
    await this.accessService.canAccessLesson(user, lessonId);
    return this.progressService.markComplete(user.id, lessonId);
  }

  @Get('course/:courseId')
  async getCourseProgress(
    @Param('courseId', ParseIntPipe) courseId: number,
    @CurrentUser() user: UserContext,
  ) {
    return this.progressService.getCourseProgress(user.id, courseId);
  }
}
