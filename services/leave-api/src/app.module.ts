import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UpcomingPaymentsModule } from './upcoming-payments/upcoming-payments.module';

@Module({
  imports: [UpcomingPaymentsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
