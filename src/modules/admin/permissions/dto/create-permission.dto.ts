import { IsOptional, IsString } from 'class-validator';

export class CreatePermissionDto {

  @IsOptional()
  @IsString()
  label?: string;

  @IsString()
  action?: string;

  @IsString()
  subject?: string;

}