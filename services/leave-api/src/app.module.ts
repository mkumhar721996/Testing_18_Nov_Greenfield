import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { placeholderCaller } from './auth/placeholder-caller.middleware';
import { SpinsModule } from './spins/spins.module';

@Module({
  imports: [SpinsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(placeholderCaller(process.env.NODE_ENV)).forRoutes('*');
  }
}
