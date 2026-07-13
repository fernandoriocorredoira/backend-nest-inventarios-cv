import { HttpException, Injectable } from '@nestjs/common';
import { UsersService } from '../admin/users/users.service';
import { hash, compare } from "bcrypt"
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(private readonly userService: UsersService, private jwtService: JwtService){}

    async funLogin(email: string, pass_entrante: string){
        // buscar user por email
        const user = await this.userService.findOneByEmail(email);
        if(!user){
            return new HttpException('Usuario no encontrado', 404);
        }

        // verificar la contraseña
        const verificarPass = await compare(pass_entrante, user.password);
        if(!verificarPass) throw new HttpException('Contraseña Incorrecta', 401);

        // JWT (Json Web Token)
        const payload = {
            sub: user.id,
            email: user.email
        }

        const access_token = await this.jwtService.signAsync(payload);

        // return
        return {
            access_token
        };

    }

    async funGetPerfil(email){
        const {password, ...resto}= await this.userService.findOneByEmail(email);
        return resto;
    }
}
