import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import type { UserContext } from './user-context.guard.js';

/**
 * Injects the `UserContext` attached by `UserContextGuard`. On routes guarded by
 * the permissive `OptionalUserContextGuard` this may be `undefined` (anonymous).
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): UserContext | undefined => {
    const request = context.switchToHttp().getRequest<Request>();
    return request.user;
  },
);
