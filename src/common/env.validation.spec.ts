import { validate } from './env.validation.js';

describe('env.validation validate()', () => {
  const validConfig = {
    DATABASE_URL: 'postgresql://postgres:admin@localhost:5432/base',
    REDIS_HOST: 'localhost',
    REDIS_PORT: '6379',
    REDIS_DB: '0',
  };

  it('returns the validated config for a valid environment', () => {
    const result = validate(validConfig);
    expect(result.DATABASE_URL).toBe(validConfig.DATABASE_URL);
    expect(result.REDIS_HOST).toBe('localhost');
    // enableImplicitConversion turns the numeric strings into numbers.
    expect(result.REDIS_PORT).toBe(6379);
    expect(result.REDIS_DB).toBe(0);
  });

  it('accepts an optional REDIS_PASSWORD', () => {
    const result = validate({ ...validConfig, REDIS_PASSWORD: 'secret' });
    expect(result.REDIS_PASSWORD).toBe('secret');
  });

  it('throws when DATABASE_URL is missing', () => {
    const rest: Record<string, unknown> = { ...validConfig };
    delete rest.DATABASE_URL;
    expect(() => validate(rest)).toThrow();
  });

  it('throws when REDIS_HOST is missing', () => {
    const rest: Record<string, unknown> = { ...validConfig };
    delete rest.REDIS_HOST;
    expect(() => validate(rest)).toThrow();
  });

  it('throws when REDIS_PORT is out of range', () => {
    expect(() => validate({ ...validConfig, REDIS_PORT: '70000' })).toThrow();
    expect(() => validate({ ...validConfig, REDIS_PORT: '0' })).toThrow();
  });

  it('throws when REDIS_DB is negative', () => {
    expect(() => validate({ ...validConfig, REDIS_DB: '-1' })).toThrow();
  });
});
