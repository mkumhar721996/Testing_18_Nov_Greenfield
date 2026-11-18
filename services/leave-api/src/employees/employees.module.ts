import { Module } from '@nestjs/common';
import { poolProvider } from '../db/pool.provider';
import { CallerProvider, RejectingCallerProvider } from './caller.provider';
import { EmployeesController } from './employees.controller';
import { EmployeesRepository, PgEmployeesRepository } from './employees.repository';
import { EmployeesService } from './employees.service';

@Module({
  controllers: [EmployeesController],
  providers: [
    poolProvider,
    EmployeesService,
    { provide: EmployeesRepository, useClass: PgEmployeesRepository },
    { provide: CallerProvider, useClass: RejectingCallerProvider },
  ],
})
export class EmployeesModule {}
