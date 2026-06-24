import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';


export class MovimientoDto {
  @ApiProperty({
    example: 10,
  })
  @IsInt()
  producto_id!: number;

  @ApiProperty({
    example: 1,
  })
  @IsInt()
  almacen_id!: number;

  @ApiProperty({
    example: 5,
  })
  @IsNumber()
  cantidad!: number;

  @ApiProperty({
    enum: ['ingreso', 'salida', 'devolucion'],
    example: 'ingreso',
  })
  @IsEnum(['ingreso', 'salida', 'devolucion'])
  tipo_movimiento!: 'ingreso' | 'salida' | 'devolucion';

  @ApiPropertyOptional({
    example: 25.5,
  })
  @IsOptional()
  @IsNumber()
  precio_compra?: number;

  @ApiPropertyOptional({
    example: 35.5,
  })
  @IsOptional()
  @IsNumber()
  precio_venta?: number;

  @ApiPropertyOptional({
    example: 'Movimiento generado por compra',
  })
  @IsOptional()
  @IsString()
  observaciones?: string;
}


export class CreateNotaDto {
  @ApiProperty({
    example: '2026-06-23',
  })
  @IsString()
  fecha!: string;

  @ApiProperty({
    example: 'compra',
  })
  @IsString()
  tipo_nota!: 'compra' | 'venta';

  @ApiProperty({
    example: 1,
  })
  @IsNumber()
  clienteproveedor_id!: number;

 @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'UUID del usuario',
  })
  @IsUUID()
  user_id!: string;

  @ApiPropertyOptional({
    example: 'pendiente',
  })
  @IsOptional()
  @IsString()
  estado_nota?: string;

  @ApiPropertyOptional({
    example: 'Observaciones generales de la nota',
  })
  @IsOptional()
  @IsString()
  observaciones?: string;

  @ApiProperty({
    type: [MovimientoDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MovimientoDto)
  movimientos!: MovimientoDto[];
}

