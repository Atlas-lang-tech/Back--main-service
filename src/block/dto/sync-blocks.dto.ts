import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { BlockItemDto } from './block-item.dto.js';

export class SyncBlocksDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BlockItemDto)
  blocks: BlockItemDto[];
}
