import { IsBoolean, IsOptional, IsNumber, IsString } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  cid: string;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  icon: string;

  @IsNumber()
  languageId: number;

  @IsNumber()
  languageLvlId: number;

  @IsOptional()
  @IsNumber()
  nativeLanguageId?: number;

  @IsOptional()
  @IsNumber()
  categoryId?: number;

  @IsOptional()
  @IsBoolean()
  isFree?: boolean;
}
