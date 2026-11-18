import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LeaveBalancesModule } from './leave-balances/leave-balances.module';

@Module({
  imports: [LeaveBalancesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
