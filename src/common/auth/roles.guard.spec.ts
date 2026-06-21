import { jest } from '@jest/globals';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard.js';
import { Role } from './roles.js';

describe('RolesGuard', () => {
  let reflector: { getAllAndOverride: jest.Mock };
  let guard: RolesGuard;

  const ctxWith = (user: unknown, roles: string[] | undefined) => {
    reflector.getAllAndOverride.mockReturnValue(roles);
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  it('allows the route when no @Roles metadata is set', () => {
    expect(guard.canActivate(ctxWith(undefined, undefined))).toBe(true);
  });

  it('allows the route when @Roles is an empty list', () => {
    expect(guard.canActivate(ctxWith({ role: 'USER' }, []))).toBe(true);
  });

  it('allows a user whose role is permitted', () => {
    expect(guard.canActivate(ctxWith({ role: Role.ADMIN }, [Role.ADMIN]))).toBe(
      true,
    );
  });

  it('forbids a user whose role is not permitted', () => {
    expect(() =>
      guard.canActivate(ctxWith({ role: Role.USER }, [Role.ADMIN])),
    ).toThrow(ForbiddenException);
  });

  it('forbids when there is no user context', () => {
    expect(() => guard.canActivate(ctxWith(undefined, [Role.ADMIN]))).toThrow(
      ForbiddenException,
    );
  });
});
