import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  ArrayUnique,
} from 'class-validator';

export class CreateRoleDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  permissions?: number[];
}