import { IsNumber, IsString } from 'class-validator';

export class CreateLessonDto {
  @IsString()
  cid: string;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  icon: string;

  @IsNumber()
  courseId: number;
}
