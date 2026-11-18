import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { testPrincipalMiddleware } from './auth/test-principal.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  if (process.env.LEAVE_API_TEST_PRINCIPAL === 'true' && process.env.NODE_ENV !== 'production') {
    app.use(testPrincipalMiddleware);
  }
  const port =Number(process.env.PORT ?? 3000);
  const host = process.env.HOST ?? '0.0.0.0';
  await app.listen(port, host);
}

bootstrap();
