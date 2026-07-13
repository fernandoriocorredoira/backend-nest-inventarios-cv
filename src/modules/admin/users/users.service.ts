import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { In, Repository } from 'typeorm';
// import * as bcrypt from 'bcrypt'
import bcrypt from "bcrypt"
import { Role } from '../roles/entities/role.entity';

@Injectable()
export class UsersService {

 //  estado: boolean
 //  userRepository = inject(Repository<User>)

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>
  ){
    // this.estado = true;
  }

  async create(createUserDto: CreateUserDto) {
    const { email, name, roleIds, ...restData } = createUserDto;

    // verificar si ya existe el correo
    const existeEmail = await this.userRepository.findOne({
      where: {email: email}
    });

    if(existeEmail){
      throw new BadRequestException(`El correo "${email}" ya está en uso`)
    }

    // asignar roles a usuario
    let roles: Role[] = [];
    if(roleIds?.length){
      roles = await this.rolesRepository.find({where: {id: In(roleIds)}});
      if(roles.length !== roleIds.length){
        throw new BadRequestException('Uno o más rolesIds no son válidos');
      }
    }

    // encriptar con bcrypt
     const hashPassword = await bcrypt.hash(restData.password, 12);
     console.log(hashPassword);
     const nuevoUser = this.userRepository.create({
      name,
      email,
      password:hashPassword,
      roles
     });

     const registradoUser = await this.userRepository.save(nuevoUser);
     const {password, ...resto_datos} = registradoUser;
    return resto_datos;
  }

  findAll() {
    return this.userRepository.find(); // select * from users
  }

  async findOne(id: string) {
    const usuario = await this.userRepository.findOneBy({id: id})
    if(!usuario){
      throw new NotFoundException("El usuario no se encuentra en la BD");
    }
    return usuario;
  }

  async findOneByEmail(email: string) {
    const usuario = await this.userRepository.findOneBy({email: email})
    if(!usuario){
      throw new NotFoundException("El usuario no se encuentra en la BD");
    }
    return usuario;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
