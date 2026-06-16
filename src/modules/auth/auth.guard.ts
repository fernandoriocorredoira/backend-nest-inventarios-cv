import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import { jwtConstants } from './constants'

@Injectable()
export class AuthGuard implements CanActivate {

  constructor(private jwtService: JwtService){}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean>{

    const request = context.switchToHttp().getRequest();
    // Authorization: Bearer 435cdv6fb7gn8b675vc43xc5vd6fb7gn8
    
    const [type, token] = request.headers.authorization?.split(' ')??[]

    if(!token){
      throw new UnauthorizedException();
    }

    try {
        const payload = await this.jwtService.verifyAsync(token, {secret: jwtConstants.secret});
        request['user'] = payload;
    } catch (error) {
      throw new UnauthorizedException();
    }
    return true;
  }
}
