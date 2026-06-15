import { jest } from '@jest/globals';
import {
  ArgumentsHost,
  BadRequestException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter.js';

describe('HttpExceptionFilter', () => {
  const filter = new HttpExceptionFilter();

  function run(exception: unknown) {
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const host = {
      switchToHttp: () => ({ getResponse: () => ({ status }) }),
    } as unknown as ArgumentsHost;

    filter.catch(exception, host);

    return { status, json };
  }

  it('maps HttpException to its own status and message', () => {
    const { status, json } = run(new NotFoundException('Course not found'));

    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(json).toHaveBeenCalledWith({
      code: HttpStatus.NOT_FOUND,
      message: 'Course not found',
      data: {},
    });
  });

  it('takes the first message when an HttpException carries an array', () => {
    const { json } = run(new BadRequestException(['a', 'b']));

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'a', data: {} }),
    );
  });

  it('maps Prisma P2002 to 409 Conflict', () => {
    const { status, json } = run({
      code: 'P2002',
      clientVersion: '7.0.0',
      meta: { target: ['cid'] },
    });

    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: HttpStatus.CONFLICT,
        message: expect.stringContaining('cid'),
      }),
    );
  });

  it('maps Prisma P2025 to 404 Not Found', () => {
    const { status } = run({ code: 'P2025', clientVersion: '7.0.0' });

    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
  });

  it('maps other Prisma codes to 400 Bad Request', () => {
    const { status } = run({
      code: 'P2003',
      clientVersion: '7.0.0',
      message: 'Foreign key constraint failed',
    });

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
  });

  it('maps a plain Error to 500 with its message', () => {
    const { status, json } = run(new Error('boom'));

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'boom' }),
    );
  });
});
