import { Inject, Injectable } from '@nestjs/common';
import { TOWNS_DATA, Town } from './towns.data';

@Injectable()
export class TownsService {
  constructor(@Inject(TOWNS_DATA) private readonly towns: Town[]) {}

  list(): { towns: Town[] } {
    return { towns: this.towns.map(({ id, name }) => ({ id, name })) };
  }
}
