import { BadRequestException } from '@nestjs/common';
import { BlockType } from '../../../generated/prisma/client.js';
import { validateBlockContent } from './block-content.validator.js';

describe('validateBlockContent', () => {
  it('passes for valid MARKDOWN content', () => {
    expect(() =>
      validateBlockContent(BlockType.MARKDOWN, { text: '# Hello' }),
    ).not.toThrow();
  });

  it('passes for valid ONE_TRUE_CHOICE content', () => {
    expect(() =>
      validateBlockContent(BlockType.ONE_TRUE_CHOICE, {
        question: 'Pick one',
        options: ['a', 'b', 'c'],
        correctAnswer: 'b',
      }),
    ).not.toThrow();
  });

  it('throws for an unknown block type', () => {
    expect(() =>
      validateBlockContent('NOPE' as BlockType, { text: 'x' }),
    ).toThrow(BadRequestException);
  });

  it('throws when content is not an object', () => {
    expect(() => validateBlockContent(BlockType.MARKDOWN, null)).toThrow(
      BadRequestException,
    );
    expect(() => validateBlockContent(BlockType.MARKDOWN, 'string')).toThrow(
      BadRequestException,
    );
    expect(() => validateBlockContent(BlockType.MARKDOWN, [1, 2])).toThrow(
      BadRequestException,
    );
  });

  it('throws with flattened messages when content fails DTO validation', () => {
    // MARKDOWN requires a string `text` field — wrong type should fail.
    expect(() =>
      validateBlockContent(BlockType.MARKDOWN, { text: 123 }),
    ).toThrow(BadRequestException);
  });
});
