import { Module } from '@nestjs/common';
import { DUE_PAYMENTS_REPOSITORY, NoDuePaymentsRepository } from './due-payments.repository';
import { UpcomingPaymentsController } from './upcoming-payments.controller';
import { UpcomingPaymentsService } from './upcoming-payments.service';

@Module({
  controllers: [UpcomingPaymentsController],
  providers: [UpcomingPaymentsService, { provide: DUE_PAYMENTS_REPOSITORY, useClass: NoDuePaymentsRepository }],
})
export class UpcomingPaymentsModule {}
