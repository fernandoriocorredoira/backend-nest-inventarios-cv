import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { In, Repository } from 'typeorm';
import { Permission } from '../permissions/entities/permission.entity';

@Injectable()
export class RolesService {

  constructor(@InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,

    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,){

  }
 async create(createRoleDto: CreateRoleDto) {
    const { permissions, ...data } = createRoleDto;

    const existe = await this.roleRepo.findOne({
      where: {
        name: data.name,
      },
    });

    if (existe) {
      throw new BadRequestException('El rol ya existe');
    }

    const permisos = await this.permissionRepo.find({
      where: {
        id: In(permissions || []),
      },
    });

    if (permissions && permisos.length !== permissions.length) {
      throw new NotFoundException(
        'Uno o más permisos no existen',
      );
    }

    const role = this.roleRepo.create({
      ...data,
      permissions: permisos,
    });

    return await this.roleRepo.save(role);
  }

  async findAll() {
    return await this.roleRepo.find({
      order: {
        id: 'ASC',
      },
    });
  }

  async findOne(id: number) {
    const role = await this.roleRepo.findOne({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException('Rol no encontrado');
    }

    return role;
  }

  async update(id: number, updateRoleDto: UpdateRoleDto) {
    const role = await this.findOne(id);

    const { permissions, ...data } = updateRoleDto;

    Object.assign(role, data);

    if (permissions) {
      const permisos = await this.permissionRepo.find({
        where: {
          id: In(permissions),
        },
      });

      role.permissions = permisos;
    }

    return await this.roleRepo.save(role);
  }

  async remove(id: number) {
    const role = await this.findOne(id);

    await this.roleRepo.remove(role);

    return {
      message: 'Rol eliminado correctamente',
    };
  }
}
