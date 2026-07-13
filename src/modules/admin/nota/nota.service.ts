import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateNotaDto } from './dto/create-nota.dto';
import { UpdateNotaDto } from './dto/update-nota.dto';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { ClienteProveedor } from '../cliente-proveedor/entities/cliente-proveedor.entity';
import { Nota } from './entities/nota.entity';
import { Producto } from '../inventario/producto/entities/producto.entity';
import { Almacen } from '../inventario/almacen/entities/almacen.entity';
import { Movimiento } from './entities/movimiento.entity';
import { AlmacenProducto } from '../inventario/almacen/entities/almacen_producto.entity';
import { FiltroNotaDto } from './dto/filtro-nota.dto';
import PDFDocument from 'pdfkit';
import dayjs from 'dayjs';
import { Response } from 'express';

@Injectable()
export class NotaService {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
    @InjectRepository(Nota)
    private notaRepo: Repository<Nota>,
  ) {}

  async create(createNotaDto: CreateNotaDto) {
    // transacciones
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const userRepo = queryRunner.manager.getRepository(User);
      const clieProvRepo = queryRunner.manager.getRepository(ClienteProveedor);
      const notaRepo = queryRunner.manager.getRepository(Nota);
      const productoRepo = queryRunner.manager.getRepository(Producto);
      const almacenRepo = queryRunner.manager.getRepository(Almacen);
      const movimientoRepo = queryRunner.manager.getRepository(Movimiento);

      const user = await userRepo.findOneBy({ id: createNotaDto.user_id });
      if (!user) throw new NotFoundException('Usuario no encontrado');

      const clienteproveedor = await clieProvRepo.findOneBy({
        id: createNotaDto.clienteproveedor_id,
      });
      if (!clienteproveedor)
        throw new NotFoundException('Cliente/Proveedor no encontrado');

      // crear nota
      const nota = await notaRepo.create({
        ...createNotaDto,
        clienteproveedor: clienteproveedor,
        user: user,
      });

      await notaRepo.save(nota);

      const movimientosGuardados: Movimiento[] = [];

      for (const m of createNotaDto.movimientos) {
        const producto = await productoRepo.findOneBy({ id: m.producto_id });
        if (!producto) throw new NotFoundException('Producto no encontrado');

        const almacen = await almacenRepo.findOneBy({ id: m.almacen_id });
        if (!almacen) throw new NotFoundException('almacen no encontrado');

        const movimiento = movimientoRepo.create({
          ...m,
          nota: nota,
          producto,
          almacen,
        });

        // actualizar stock inventarios
        await this.actualizarStockQueryRunner(
          queryRunner,
          almacen,
          producto,
          m.cantidad,
          m.tipo_movimiento,
        );

        const movGuardado = await movimientoRepo.save(movimiento);
        movimientosGuardados.push(movGuardado);
      }

      nota.movimientos = movimientosGuardados;

      await queryRunner.commitTransaction();
      return nota;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async actualizarStockQueryRunner(
    queryRunner: QueryRunner,
    almacen: Almacen,
    producto: Producto,
    cantidad: number,
    tipo_movimiento: 'ingreso' | 'salida' | 'devolucion',
  ) {
    const almacenProductoRepo =
      queryRunner.manager.getRepository(AlmacenProducto);

    let ap = await almacenProductoRepo.findOne({
      where: {
        almacen: { id: almacen.id },
        producto: { id: producto.id },
      },
      //relations: ['almacen', 'producto']
    });

    if (!ap) {
      if (tipo_movimiento === 'salida') {
        throw new BadRequestException(
          'No hay stock registrado para este producto en este almacen',
        );
      }

      ap = almacenProductoRepo.create({
        almacen,
        producto,
        cantidad_actual: cantidad,
        fecha_actualizacion: new Date(),
      });
    } else {
      if (tipo_movimiento === 'ingreso' || tipo_movimiento === 'devolucion') {
        ap.cantidad_actual = ap.cantidad_actual + cantidad;
      } else if (tipo_movimiento === 'salida') {
        if (ap.cantidad_actual < cantidad) {
          throw new BadRequestException('Stock insuficiente para la salida');
        }
        ap.cantidad_actual = ap.cantidad_actual - cantidad;
      }
      ap.fecha_actualizacion = new Date();
    }

    await almacenProductoRepo.save(ap);
  }

  async findAll(filtro: FiltroNotaDto) {
    const query = this.notaRepo
      .createQueryBuilder('nota')
      .leftJoinAndSelect('nota.user', 'user')
      .leftJoinAndSelect('nota.clienteproveedor', 'clienteproveedor')
      .leftJoinAndSelect('nota.movimientos', 'movimientos')
      .leftJoinAndSelect('movimientos.producto', 'producto');

    if (filtro.tipo_nota) {
      query.andWhere('nota.tipo_nota = :tipo_nota', {
        tipo_nota: filtro.tipo_nota,
      });
    }

    if (filtro.estado_nota) {
      query.andWhere('nota.estado_nota = :estado_nota', {
        estado_nota: filtro.estado_nota,
      });
    }

    if (filtro.desde) {
      query.andWhere('nota.fecha = :desde', { desde: filtro.desde });
    }

    if (filtro.hasta) {
      query.andWhere('nota.fecha = :hasta', { hasta: filtro.hasta });
    }

    if (filtro.user_id) {
      query.andWhere('nota.user_id = :user_id', { user_id: filtro.user_id });
    }

    if (filtro.clienteproveedor_id) {
      query.andWhere('nota.clienteproveedor_id = :clienteproveedor_id', {
        clienteproveedor_id: filtro.clienteproveedor_id,
      });
    }

    query.orderBy('nota.fecha', 'DESC');

    // paginacion
    const limit = filtro.limit || 10;
    const page = filtro.page || 1;

    query.skip((page - 1) * limit).take(limit);

    const [data, total] = await query.getManyAndCount();

    return { data, total };
  }

  async funGeneraReportePDF(filtro: FiltroNotaDto, res: Response) {
    const query = this.notaRepo
      .createQueryBuilder('nota')
      .leftJoinAndSelect('nota.user', 'user')
      .leftJoinAndSelect('nota.clienteproveedor', 'clienteproveedor')
      .leftJoinAndSelect('nota.movimientos', 'movimientos')
      .leftJoinAndSelect('movimientos.producto', 'producto');

    if (filtro.tipo_nota) {
      query.andWhere('nota.tipo_nota = :tipo_nota', {
        tipo_nota: filtro.tipo_nota,
      });
    }

    if (filtro.estado_nota) {
      query.andWhere('nota.estado_nota = :estado_nota', {
        estado_nota: filtro.estado_nota,
      });
    }

    if (filtro.desde) {
      query.andWhere('nota.fecha = :desde', { desde: filtro.desde });
    }

    if (filtro.hasta) {
      query.andWhere('nota.fecha = :hasta', { hasta: filtro.hasta });
    }

    if (filtro.user_id) {
      query.andWhere('nota.user_id = :user_id', { user_id: filtro.user_id });
    }

    if (filtro.clienteproveedor_id) {
      query.andWhere('nota.clienteproveedor_id = :clienteproveedor_id', {
        clienteproveedor_id: filtro.clienteproveedor_id,
      });
    }

    query.orderBy('nota.fecha', 'DESC');

    // paginacion
    const limit = filtro.limit || 10;
    const page = filtro.page || 1;

    query.skip((page - 1) * limit).take(limit);

    const [data, total] = await query.getManyAndCount();

    console.log(JSON.stringify(data));

    // GENERAR PDF
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=reporte_notas.pdf',
    );

    doc.pipe(res);

    //////////////////////////////////////////////////////////////
    // ENCABEZADO
    //////////////////////////////////////////////////////////////

    doc.fontSize(22).fillColor('#0B5394').text('SISTEMA DE INVENTARIO', {
      align: 'center',
    });

    doc.moveDown(0.2).fontSize(16).fillColor('black').text('REPORTE DE NOTAS', {
      align: 'center',
    });

    doc.moveDown();

    doc
      .fontSize(10)
      .text(`Fecha reporte: ${dayjs().format('DD/MM/YYYY HH:mm')}`);

    doc.text(`Total registros: ${total}`);

    doc.moveDown();

    //////////////////////////////////////////////////////////////
    // RECORRER NOTAS
    //////////////////////////////////////////////////////////////

    data.forEach((nota: any, index) => {
      doc
        .moveDown()
        .lineWidth(1)
        .strokeColor('#CCCCCC')
        .moveTo(40, doc.y)
        .lineTo(555, doc.y)
        .stroke();

      doc.moveDown();

      doc.fontSize(14).fillColor('#0B5394').text(`NOTA #${nota.id}`);

      doc.fillColor('black');

      doc.fontSize(11);

      doc.text(`Fecha: ${dayjs(nota.fecha).format('DD/MM/YYYY')}`);

      doc.text(`Tipo: ${nota.tipo_nota.toUpperCase()}`);

      doc.text(`Estado: ${nota.estado_nota}`);

      doc.text(`Usuario: ${nota.user.name}`);

      doc.moveDown(0.5);

      doc.font('Helvetica-Bold');
      doc.text('Cliente / Proveedor');
      doc.font('Helvetica');

      doc.text(nota.clienteproveedor.razon_social);
      doc.text(`Identificación: ${nota.clienteproveedor.identificacion}`);
      doc.text(`Teléfono: ${nota.clienteproveedor.telefono}`);

      doc.moveDown();

      ////////////////////////////////////////////////////////
      // TABLA
      ////////////////////////////////////////////////////////

      const inicio = doc.y;

      doc.rect(40, inicio, 515, 20).fill('#0B5394');

      doc
        .fillColor('white')
        .fontSize(10)
        .text('Producto', 45, inicio + 5)
        .text('Cant.', 260, inicio + 5)
        .text('P. Compra', 310, inicio + 5)
        .text('P. Venta', 400, inicio + 5)
        .text('Subtotal', 485, inicio + 5);

      doc.fillColor('black');

      let y = inicio + 25;

      let totalNota = 0;

      nota.movimientos.forEach((mov) => {
        const subtotal =
          mov.tipo_movimiento == 'ingreso'
            ? Number(mov.precio_compra) * mov.cantidad
            : Number(mov.precio_venta) * mov.cantidad;

        totalNota += subtotal;

        doc.fontSize(10).text(mov.producto.nombre, 45, y, {
          width: 200,
        });

        doc.text(mov.cantidad.toString(), 260, y);

        doc.text(Number(mov.precio_compra).toFixed(2), 310, y);

        doc.text(Number(mov.precio_venta).toFixed(2), 400, y);

        doc.text(subtotal.toFixed(2), 485, y);

        y += 22;

        if (y > 730) {
          doc.addPage();
          y = 50;
        }
      });

      doc.moveTo(40, y).lineTo(555, y).stroke();

      y += 8;

      doc.font('Helvetica-Bold');

      doc.text(`TOTAL NOTA: Bs ${totalNota.toFixed(2)}`, 350, y);

      doc.font('Helvetica');

      doc.moveDown(3);
    });

    doc.end();
  }

  async funGeneraReportePDFPorID(id: number, res: Response) {

    const nota:any = await this.notaRepo
      .createQueryBuilder('nota')
      .leftJoinAndSelect('nota.user', 'user')
      .leftJoinAndSelect('nota.clienteproveedor', 'clienteproveedor')
      .leftJoinAndSelect('nota.movimientos', 'movimientos')
      .leftJoinAndSelect('movimientos.producto', 'producto')
      .where('nota.id = :id', { id })
      .getOne();

    if (!nota) {
      throw new NotFoundException('La nota no existe');
    }

    console.log(nota);

    // GENERAR PDF
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=recibo_nota.pdf',
    );

    doc.pipe(res);

    //////////////////////////////////////////////////////////////
    // ENCABEZADO
    //////////////////////////////////////////////////////////////

    doc.fontSize(22).fillColor('#0B5394').text('SISTEMA DE INVENTARIO', {
      align: 'center',
    });

    doc.moveDown(0.2).fontSize(16).fillColor('black').text('REPORTE DE NOTAS', {
      align: 'center',
    });

    doc.moveDown();

    doc
      .fontSize(10)
      .text(`Fecha reporte: ${dayjs().format('DD/MM/YYYY HH:mm')}`);


    doc.moveDown();

    //////////////////////////////////////////////////////////////
    // RECORRER NOTAS
    //////////////////////////////////////////////////////////////


      doc
        .moveDown()
        .lineWidth(1)
        .strokeColor('#CCCCCC')
        .moveTo(40, doc.y)
        .lineTo(555, doc.y)
        .stroke();

      doc.moveDown();

      doc.fontSize(14).fillColor('#0B5394').text(`NOTA #${nota.id}`);

      doc.fillColor('black');

      doc.fontSize(11);

      doc.text(`Fecha: ${dayjs(nota.fecha).format('DD/MM/YYYY')}`);

      doc.text(`Tipo: ${nota.tipo_nota.toUpperCase()}`);

      doc.text(`Estado: ${nota.estado_nota}`);

      doc.text(`Usuario: ${nota.user.name}`);

      doc.moveDown(0.5);

      doc.font('Helvetica-Bold');
      doc.text('Cliente / Proveedor');
      doc.font('Helvetica');

      doc.text(nota.clienteproveedor.razon_social);
      doc.text(`Identificación: ${nota.clienteproveedor.identificacion}`);
      doc.text(`Teléfono: ${nota.clienteproveedor.telefono}`);

      doc.moveDown();

      ////////////////////////////////////////////////////////
      // TABLA
      ////////////////////////////////////////////////////////

      const inicio = doc.y;

      doc.rect(40, inicio, 515, 20).fill('#0B5394');

      doc
        .fillColor('white')
        .fontSize(10)
        .text('Producto', 45, inicio + 5)
        .text('Cant.', 260, inicio + 5)
        .text('P. Compra', 310, inicio + 5)
        .text('P. Venta', 400, inicio + 5)
        .text('Subtotal', 485, inicio + 5);

      doc.fillColor('black');

      let y = inicio + 25;

      let totalNota = 0;

      nota.movimientos.forEach((mov) => {
        const subtotal =
          mov.tipo_movimiento == 'ingreso'
            ? Number(mov.precio_compra) * mov.cantidad
            : Number(mov.precio_venta) * mov.cantidad;

        totalNota += subtotal;

        doc.fontSize(10).text(mov.producto.nombre, 45, y, {
          width: 200,
        });

        doc.text(mov.cantidad.toString(), 260, y);

        doc.text(Number(mov.precio_compra).toFixed(2), 310, y);

        doc.text(Number(mov.precio_venta).toFixed(2), 400, y);

        doc.text(subtotal.toFixed(2), 485, y);

        y += 22;

        if (y > 730) {
          doc.addPage();
          y = 50;
        }
      });

      doc.moveTo(40, y).lineTo(555, y).stroke();

      y += 8;

      doc.font('Helvetica-Bold');

      doc.text(`TOTAL NOTA: Bs ${totalNota.toFixed(2)}`, 350, y);

      doc.font('Helvetica');

      doc.moveDown(3);


    doc.end();

  }
  findOne(id: number) {
    return `This action returns a #${id} nota`;
  }

  update(id: number, updateNotaDto: UpdateNotaDto) {
    return `This action updates a #${id} nota`;
  }

  remove(id: number) {
    return `This action removes a #${id} nota`;
  }
}
