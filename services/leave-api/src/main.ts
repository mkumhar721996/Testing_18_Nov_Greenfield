import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { shouldInstallTestPrincipal } from './auth/test-principal.config';
import { testPrincipalMiddleware } from './auth/test-principal.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  if (shouldInstallTestPrincipal(process.env)) {
    app.use(testPrincipalMiddleware);
  }
  const port =Number(process.env.PORT ?? 3000);
  const host = process.env.HOST ?? '0.0.0.0';
  await app.listen(port, host);
}

bootstrap();
