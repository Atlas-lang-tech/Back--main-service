import { BadRequestException } from '@nestjs/common';
import { plainToInstance, type ClassConstructor } from 'class-transformer';
import { validateSync, type ValidationError } from 'class-validator';
import { BlockType } from '../../../generated/prisma/client.js';
import {
  BuildSentenceContentDto,
  DialogueContentDto,
  ErrorCorrectionContentDto,
  FillInBlankContentDto,
  ManualAnswerContentDto,
  MarkdownContentDto,
  MatchingContentDto,
  OneTrueChoiceContentDto,
  RephrasingContentDto,
  TranslationContentDto,
} from './content.dto.js';

const CONTENT_DTO: Record<BlockType, ClassConstructor<object>> = {
  [BlockType.MARKDOWN]: MarkdownContentDto,
  [BlockType.ONE_TRUE_CHOICE]: OneTrueChoiceContentDto,
  [BlockType.FILL_IN_BLANK]: FillInBlankContentDto,
  [BlockType.MANUAL_ANSWER]: ManualAnswerContentDto,
  [BlockType.BUILD_SENTENCE]: BuildSentenceContentDto,
  [BlockType.TRANSLATION]: TranslationContentDto,
  [BlockType.MATCHING]: MatchingContentDto,
  [BlockType.DIALOGUE]: DialogueContentDto,
  [BlockType.REPHRASING]: RephrasingContentDto,
  [BlockType.ERROR_CORRECTION]: ErrorCorrectionContentDto,
};

function flatten(errors: ValidationError[]): string[] {
  return errors.flatMap((err) => {
    const own = Object.values(err.constraints ?? {});
    const nested = err.children?.length ? flatten(err.children) : [];
    return [...own, ...nested];
  });
}

/**
 * Validates a block's JSON `content` against the DTO for its `type`.
 * Throws BadRequestException (400) on mismatch, mirroring the manual
 * plainToInstance + validateSync pattern in src/common/env.validation.ts.
 */
export function validateBlockContent(type: BlockType, content: unknown): void {
  const dto = CONTENT_DTO[type];
  if (!dto) {
    throw new BadRequestException(`Unknown block type: ${String(type)}`);
  }

  if (
    content === null ||
    typeof content !== 'object' ||
    Array.isArray(content)
  ) {
    throw new BadRequestException('content must be an object');
  }

  const instance = plainToInstance(dto, content);
  const errors = validateSync(instance, {
    whitelist: true,
    forbidUnknownValues: true,
  });

  if (errors.length > 0) {
    throw new BadRequestException(flatten(errors));
  }
}
