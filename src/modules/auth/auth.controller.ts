import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginAuthDto } from './dto/login-auth.dto';
import { AuthGuard } from './auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

//  /v1/auth/login
@Controller()
export class AuthController {
    constructor(private authService: AuthService){}

    @Post("/v1/auth/login")
    funIngresar(@Body() datos: LoginAuthDto){

        return this.authService.funLogin(datos.email, datos.password);
    }


    @ApiBearerAuth()
    @UseGuards(AuthGuard)
    @Get('/v1/auth/profile')
    funProfile(@Request() req){
        return this.authService.funGetPerfil(req.user.email)
    }
}
