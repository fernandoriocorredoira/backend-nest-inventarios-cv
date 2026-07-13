import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Permission } from './entities/permission.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PermissionsService {
  
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
  ) {}

 async create(createPermissionDto: CreatePermissionDto) {

    const existe = await this.permissionRepo.findOne({
      where: {
        action: createPermissionDto.action,
        subject: createPermissionDto.subject,
      },
    });

    if (existe) {
      throw new BadRequestException(
        'El permiso ya existe',
      );
    }

    const permission = this.permissionRepo.create(createPermissionDto);

    return await this.permissionRepo.save(permission);
  }

  async findAll() {
    return await this.permissionRepo.find({
      order: {
        subject: 'ASC',
        action: 'ASC',
      },
    });
  }

  async findOne(id: number) {
    const permission = await this.permissionRepo.findOne({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException(
        'Permiso no encontrado',
      );
    }

    return permission;
  }

  async update(
    id: number,
    updatePermissionDto: UpdatePermissionDto,
  ) {
    const permission = await this.findOne(id);

    Object.assign(permission, updatePermissionDto);

    return await this.permissionRepo.save(permission);
  }

  async remove(id: number) {
    const permission = await this.findOne(id);

    await this.permissionRepo.remove(permission);

    return {
      message: 'Permiso eliminado correctamente',
    };
  }

}
