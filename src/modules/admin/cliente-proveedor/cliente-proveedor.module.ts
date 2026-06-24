import { Module } from '@nestjs/common';
import { ClienteProveedorService } from './cliente-proveedor.service';
import { ClienteProveedorController } from './cliente-proveedor.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClienteProveedor } from './entities/cliente-proveedor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ClienteProveedor])],
  controllers: [ClienteProveedorController],
  providers: [ClienteProveedorService],
})
export class ClienteProveedorModule {}
