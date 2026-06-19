import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { UserContext } from './user.types.js';

/**
 * Resolves the `UserContext` that UserContextGuard attached to the request, or
 * `undefined` for anonymous callers. Use together with `@UseGuards(UserContextGuard)`.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserContext | undefined => {
    const req = ctx
      .switchToHttp()
      .getRequest<Request & { user?: UserContext }>();
    return req.user;
  },
);
