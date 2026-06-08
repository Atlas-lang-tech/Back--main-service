import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { BlockType } from '../../../generated/prisma/client.js';

export class CreateBlockDto {
  @IsEnum(BlockType)
  type: BlockType;

  @IsString()
  @IsOptional()
  title?: string;

  // Validated per-type in BlockService via validateBlockContent.
  // Declared @IsObject so the global ValidationPipe (whitelist) keeps it intact.
  @IsObject()
  content: Record<string, unknown>;
}
