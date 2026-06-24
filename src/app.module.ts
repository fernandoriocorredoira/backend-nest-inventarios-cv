import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './modules/admin/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { InventarioModule } from './modules/admin/inventario/inventario.module';
import { ClienteProveedorModule } from './modules/admin/cliente-proveedor/cliente-proveedor.module';
import { NotaModule } from './modules/admin/nota/nota.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.BD_HOST,
      port: Number(process.env.BD_PORT) || 5432,
      username: process.env.BD_USERNAME,
      password: process.env.BD_PASSWORD,
      database: process.env.BD_DATABASE,
      entities: [
        __dirname + '/../**/*.entity{.ts,.js}'
      ],
      synchronize: false
    }),
    UsersModule,
    AuthModule,
    InventarioModule,
    ClienteProveedorModule,
    NotaModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
