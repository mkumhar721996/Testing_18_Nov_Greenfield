import { describe, expect, it } from 'vitest';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  it('reports health', () => {
    const controller = new AppController(new AppService());
    expect(controller.health()).toEqual({ status: 'ok' });
  });
});
