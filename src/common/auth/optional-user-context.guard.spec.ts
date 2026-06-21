import { ExecutionContext } from '@nestjs/common';
import { OptionalUserContextGuard } from './optional-user-context.guard.js';

describe('OptionalUserContextGuard', () => {
  const guard = new OptionalUserContextGuard();

  const makeCtx = (headers: Record<string, string>) => {
    const req: { header: (k: string) => string | undefined; user?: unknown } = {
      header: (k: string) => headers[k.toLowerCase()],
    };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => req }),
    } as unknown as ExecutionContext;
    return { ctx, req };
  };

  it('attaches the user context when X-User-Id is present', () => {
    const { ctx, req } = makeCtx({
      'x-user-id': 'u1',
      'x-user-role': 'ADMIN',
      'x-user-plan': 'PRO',
    });

    expect(guard.canActivate(ctx)).toBe(true);
    expect(req.user).toEqual({ id: 'u1', role: 'ADMIN', plan: 'PRO' });
  });

  it('defaults role/plan when only X-User-Id is present', () => {
    const { ctx, req } = makeCtx({ 'x-user-id': 'u2' });

    expect(guard.canActivate(ctx)).toBe(true);
    expect(req.user).toEqual({ id: 'u2', role: 'USER', plan: 'FREE' });
  });

  it('lets anonymous requests through with no user attached', () => {
    const { ctx, req } = makeCtx({});

    expect(guard.canActivate(ctx)).toBe(true);
    expect(req.user).toBeUndefined();
  });
});
