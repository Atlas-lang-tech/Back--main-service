import { IsOptional, IsNumber, IsString } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  cid: string;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  icons: string;

  @IsNumber()
  languageId: number;

  @IsNumber()
  languageLvlId: number;

  @IsOptional()
  @IsNumber()
  categoryId?: number;
}
