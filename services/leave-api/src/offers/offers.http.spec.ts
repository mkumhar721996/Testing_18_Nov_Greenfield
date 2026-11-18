import { Controller, INestApplication, Inject, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { OffersController } from './offers.controller';
import { OffersService } from './offers.service';
import { OfferEligibilityRepository } from './offers.types';

const repository: OfferEligibilityRepository = {
  findEligibleOffers: async (customerId) =>
    customerId === 'eligible-customer'
      ? [{ type: 'card-upgrade' }, { type: 'personal-loan', headline: 'Pre-approved' }]
      : [],
};

// Stands in for the real sign-in guard (not built yet): sets request.user from a test header.
function fakeSignIn(req: { headers: Record<string, string>; user?: { id: string } }, _res: unknown, next: () => void) {
  const id = req.headers['x-test-customer'];
  if (id) req.user = { id };
  next();
}

// vitest (esbuild) does not emit constructor design:paramtypes, so inject the service explicitly.
@Controller()
class TestOffersController extends OffersController {
  constructor(@Inject(OffersService) offers: OffersService) {
    super(offers);
  }
}

@Module({
  controllers: [TestOffersController],
  providers: [
    { provide: OffersService, useFactory: () => new OffersService(repository) },
  ],
})
class TestOffersModule {}

describe('GET /offers over HTTP', () => {
  let app: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
    app = await NestFactory.create(TestOffersModule, { logger: false });
    app.use(fakeSignIn);
    await app.listen(0);
    baseUrl = await app.getUrl();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns the eligible offers, in display order, for the signed-in customer', async () => {
    const res = await fetch(`${baseUrl}/offers`, { headers: { 'x-test-customer': 'eligible-customer' } });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      offers: [{ type: 'personal-loan', headline: 'Pre-approved' }, { type: 'card-upgrade' }],
    });
  });

  it('returns no offers for an ineligible customer', async () => {
    const res = await fetch(`${baseUrl}/offers`, { headers: { 'x-test-customer': 'other' } });
    expect(await res.json()).toEqual({ offers: [] });
  });

  it('ignores a customerId in the query and rejects an unauthenticated request', async () => {
    const res = await fetch(`${baseUrl}/offers?customerId=eligible-customer`);
    expect(res.status).toBe(401);
  });
});
