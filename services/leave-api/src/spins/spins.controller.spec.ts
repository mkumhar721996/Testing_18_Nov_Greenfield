import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { SpinsController } from './spins.controller';
import { SpinsService } from './spins.service';

describe('SpinsController', () => {
  const service = new SpinsService();
  const controller = new SpinsController(service);

  it('echoes the bet used and returns a 3x3 grid', () => {
    const spin = controller.spin({ bet: 25 });
    expect(spin.bet).toBe(25);
    expect(spin.reels).toHaveLength(3);
    expect(['win', 'loss']).toContain(spin.outcome);
  });

  it('rejects a bet that is not offered', () => {
    expect(() => service.spin(2)).toThrow(BadRequestException);
    expect(() => service.spin('25')).toThrow(BadRequestException);
    expect(() => controller.spin(undefined as never)).toThrow(BadRequestException);
  });
});
