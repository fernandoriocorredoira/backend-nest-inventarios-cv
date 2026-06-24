import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { NotaService } from './nota.service';
import { CreateNotaDto } from './dto/create-nota.dto';
import { UpdateNotaDto } from './dto/update-nota.dto';
import { FiltroNotaDto } from './dto/filtro-nota.dto';

@Controller('nota')
export class NotaController {
  constructor(private readonly notaService: NotaService) {}

  @Post()
  create(@Body() createNotaDto: CreateNotaDto) {
    return this.notaService.create(createNotaDto);
  }

  @Get()
  findAll(@Query() filtroDto: FiltroNotaDto) {
    return this.notaService.findAll(filtroDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.notaService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateNotaDto: UpdateNotaDto) {
    return this.notaService.update(+id, updateNotaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.notaService.remove(+id);
  }
}
