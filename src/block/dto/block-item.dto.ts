import { IsInt, IsOptional } from 'class-validator';
import { CreateBlockDto } from './create-block.dto.js';

export class BlockItemDto extends CreateBlockDto {
  // Present for existing blocks (update in place), absent for new blocks (create).
  @IsInt()
  @IsOptional()
  id?: number;
}
