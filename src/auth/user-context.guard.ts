import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import {
  HEADER_USER_ID,
  HEADER_USER_PLAN,
  HEADER_USER_ROLE,
  type UserContext,
} from './user.types.js';

/**
 * Populates `request.user` from the ForwardAuth headers and always allows the
 * request through. Anonymous requests (no `X-User-Id`) leave `request.user`
 * undefined — access enforcement happens downstream in AccessService, since
 * free content is intentionally reachable without a login.
 */
@Injectable()
export class UserContextGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const id = req.header(HEADER_USER_ID);

    if (id) {
      const user: UserContext = {
        id,
        role: req.header(HEADER_USER_ROLE) ?? '',
        plan: req.header(HEADER_USER_PLAN) ?? '',
      };
      (req as Request & { user?: UserContext }).user = user;
    }

    return true;
  }
}
