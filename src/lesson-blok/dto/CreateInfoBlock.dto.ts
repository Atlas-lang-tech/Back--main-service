import { IsNumber, IsString } from 'class-validator';

export class CreateInfoDto {
  @IsNumber()
  order: number;

  @IsString()
  title: string;

  @IsString()
  text: string;
}
