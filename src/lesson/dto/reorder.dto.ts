import { ArrayNotEmpty, IsArray, IsInt } from 'class-validator';

export class ReorderLessonsDto {
  // Full ordered list of the course's lesson ids; array index becomes `order`.
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  lessonIds: number[];
}
