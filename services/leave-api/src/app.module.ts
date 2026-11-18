import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SpinsModule } from './spins/spins.module';

@Module({
  imports: [SpinsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
