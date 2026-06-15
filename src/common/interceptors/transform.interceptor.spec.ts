import { CallHandler, ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
import { TransformInterceptor } from './transform.interceptor.js';

function makeContext(statusCode = 200): ExecutionContext {
  return {
    switchToHttp: () => ({
      getResponse: () => ({ statusCode }),
    }),
  } as unknown as ExecutionContext;
}

function makeHandler(value: unknown): CallHandler {
  return { handle: () => of(value) };
}

describe('TransformInterceptor', () => {
  const interceptor = new TransformInterceptor();

  it('wraps raw data into the { code, message, data } envelope', async () => {
    const result = await lastValueFrom(
      interceptor.intercept(makeContext(201), makeHandler({ id: 1 })),
    );

    expect(result).toEqual({
      code: 201,
      message: 'Success',
      data: { id: 1 },
    });
  });

  it('does not double-wrap data already in the envelope shape', async () => {
    const envelope = { code: 200, message: 'X', data: [] };
    const result = await lastValueFrom(
      interceptor.intercept(makeContext(), makeHandler(envelope)),
    );

    expect(result).toBe(envelope);
  });

  it('replaces null/undefined data with an empty object', async () => {
    const result = await lastValueFrom(
      interceptor.intercept(makeContext(), makeHandler(null)),
    );

    expect(result).toEqual({ code: 200, message: 'Success', data: {} });
  });
});
