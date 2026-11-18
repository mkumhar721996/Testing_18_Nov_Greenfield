import { BadRequestException, Injectable } from '@nestjs/common';
import { BET_SIZES, drawReels, evaluateSpin, isBetSize, type SpinOutcome } from './spin-engine';

@Injectable()
export class SpinsService {
  spin(bet: unknown): SpinOutcome {
    if (!isBetSize(bet)) {
      throw new BadRequestException(`bet must be one of ${BET_SIZES.join(', ')}`);
    }
    return evaluateSpin(bet, drawReels());
  }
}
