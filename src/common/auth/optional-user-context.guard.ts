import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import type { UserContext } from './user-context.guard.js';

/**
 * Like {@link UserContextGuard} but permissive: attaches `request.user` when the
 * `X-User-Id` header is present and otherwise lets the request through as
 * anonymous (no throw). Used on public, personalized routes where free content
 * is reachable without a login and access enforcement happens downstream.
 */
@Injectable()
export class OptionalUserContextGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    const id = request.header('x-user-id');
    if (id) {
      request.user = {
        id,
        role: request.header('x-user-role') ?? 'USER',
        plan: request.header('x-user-plan') ?? 'FREE',
      } satisfies UserContext;
    }

    return true;
  }
}
