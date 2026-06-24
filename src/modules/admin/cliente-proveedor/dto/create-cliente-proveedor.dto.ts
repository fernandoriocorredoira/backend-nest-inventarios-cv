import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

export class CreateClienteProveedorDto {
  @ApiProperty({
    enum: ['cliente', 'proveedor'],
    example: 'cliente',
    description: 'Tipo de registro',
  })
  @IsEnum(['cliente', 'proveedor'])
  tipo!: 'cliente' | 'proveedor';

  @ApiPropertyOptional({
    example: 'Empresa ABC SRL',
    description: 'Razón social del cliente o proveedor',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  razon_social?: string;

  @ApiPropertyOptional({
    example: '12345678',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  identificacion?: string;

  @ApiPropertyOptional({
    example: 'Av. Mariscal Santa Cruz #123',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  direccion?: string;

  @ApiPropertyOptional({
    example: '+59177777777',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefono?: string;

  @ApiPropertyOptional({
    example: 'contacto@empresa.com',
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(200)
  correo?: string;

  @ApiPropertyOptional({
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  estado?: boolean;
}