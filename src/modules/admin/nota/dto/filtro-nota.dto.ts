import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Min } from "class-validator";

export class FiltroNotaDto{

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    tipo_nota?: string; // compra, venta

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    estado_nota?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    desde?: string;


    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    hasta?: string;


    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    user_id?: string;


    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    clienteproveedor_id?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() =>Number)
    @IsInt()
    @Min(1)
    limit?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() =>Number)
    @IsInt()
    @Min(1)
    page?: number;
}