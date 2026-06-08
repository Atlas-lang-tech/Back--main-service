import { IsString } from 'class-validator';

export class AddLanguageLvlDto {
  @IsString()
  name: string;
}
