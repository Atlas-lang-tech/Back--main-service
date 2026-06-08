import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsString,
  ValidateNested,
} from 'class-validator';

// Payload shapes stored in `block.content`, one DTO per BlockType.
// These are validated explicitly in BlockService (see block-content.validator.ts),
// because the global ValidationPipe cannot resolve a discriminated `content`.

export class MarkdownContentDto {
  @IsString()
  text: string;
}

export class OneTrueChoiceContentDto {
  @IsString()
  question: string;

  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  options: string[];

  @IsString()
  correctAnswer: string;
}

export class FillInBlankContentDto {
  @IsString()
  text: string;

  @IsString()
  correctAnswer: string;
}

export class ManualAnswerContentDto {
  @IsString()
  text: string;

  @IsString()
  correctAnswer: string;
}

export class BuildSentenceContentDto {
  @IsArray()
  @IsString({ each: true })
  words: string[];

  @IsArray()
  @IsInt({ each: true })
  correctOrder: number[];
}

export class TranslationContentDto {
  @IsString()
  text: string;

  @IsString()
  translateTo: string;

  @IsString()
  correctAnswer: string;
}

export class PairDto {
  @IsString()
  left: string;

  @IsString()
  right: string;
}

export class MatchingContentDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PairDto)
  pairs: PairDto[];
}

export class DialogueQuestionDto {
  @IsString()
  question: string;

  @IsString()
  correctAnswer: string;
}

export class DialogueContentDto {
  @IsArray()
  dialogue: unknown[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DialogueQuestionDto)
  questions: DialogueQuestionDto[];
}

export class RephrasingContentDto {
  @IsString()
  text: string;

  @IsString()
  correctAnswer: string;
}

export class ErrorCorrectionContentDto {
  @IsString()
  text: string;

  @IsString()
  errorText: string;

  @IsString()
  correctAnswer: string;
}
