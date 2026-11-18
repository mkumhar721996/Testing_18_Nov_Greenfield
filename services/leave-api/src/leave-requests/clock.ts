import { Injectable } from '@nestjs/common';

export interface Clock {
  /** Today as an ISO YYYY-MM-DD date (UTC calendar date). */
  today(): string;
}

export const CLOCK = Symbol('CLOCK');

@Injectable()
export class SystemClock implements Clock {
  today(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
