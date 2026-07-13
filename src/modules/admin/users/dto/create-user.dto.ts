import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsEmail, IsOptional, IsString, MaxLength, MinLength } from "class-validator"

export class CreateUserDto {

    @ApiProperty()
    @IsString({message: "El nombre de usuario debe ser una cadena de texto"})
    @MinLength(3, {message: "El nombre de usuario debe tener al menos 3 caracteres"})
    @MaxLength(20, {message: "El nombre de usuario no debe exceder los 20 caracteres"})
    name!: string;

    @ApiProperty()
    @IsEmail({}, {message: "El Correo electronico no tiene un formato válido"})
    email!: string;

    @ApiProperty()
    @IsString({message: "La contraseña debe ser una cadena de texto"})
    password!: string;

    @IsOptional()
    @IsArray({message: 'Los Ids de roles deben ser un arregle [].'})
    roleIds?: number[];

}
