import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateClienteProveedorDto } from './dto/create-cliente-proveedor.dto';
import { UpdateClienteProveedorDto } from './dto/update-cliente-proveedor.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClienteProveedor } from './entities/cliente-proveedor.entity';

@Injectable()
export class ClienteProveedorService {

  constructor(
    @InjectRepository(ClienteProveedor)
    private clienteProveedorRepo: Repository<ClienteProveedor>
  ){

  }

  create(createClienteProveedorDto: CreateClienteProveedorDto) {
    const cliente = this.clienteProveedorRepo.create(createClienteProveedorDto);
    return this.clienteProveedorRepo.save(cliente);

  }

  findAll(buscar?: string) {
    const query = this.clienteProveedorRepo.createQueryBuilder('clienteproveedor');

    if(buscar){
      query.andWhere('clienteproveedor.razon_social ILIKE :buscar', {buscar: `%${buscar}%`})
    }

    return query.getMany()
  }

  async findOne(id: number) {
    const clienteproveedor = await this.clienteProveedorRepo.findOneBy({id});
    if(!clienteproveedor) throw new NotFoundException('Cliente no existe');
    return clienteproveedor
    
  }

  async update(id: number, updateClienteProveedorDto: UpdateClienteProveedorDto) {
    const cliente = await this.findOne(id)
    this.clienteProveedorRepo.merge(cliente, updateClienteProveedorDto);
    return this.clienteProveedorRepo.save(cliente)
  }

  remove(id: number) {
    return `This action removes a #${id} clienteProveedor`;
  }
}
