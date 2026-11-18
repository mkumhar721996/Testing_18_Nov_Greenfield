import { describe, expect, it, vi } from 'vitest';
import { placeholderCaller } from './placeholder-caller.middleware';

function run(env: { NODE_ENV?: string; ALLOW_PLACEHOLDER_CALLER?: string }) {
  const request: { caller?: { role: string } } = {};
  const next = vi.fn();
  placeholderCaller(env)(request, {}, next);
  expect(next).toHaveBeenCalled();
  return request.caller;
}

describe('placeholderCaller', () => {
  it.each(['development', 'test'])('treats the request as an employee in %s when opted in', (NODE_ENV) => {
    expect(run({ NODE_ENV, ALLOW_PLACEHOLDER_CALLER: 'true' })).toEqual({ role: 'employee' });
  });

  it('does nothing without the explicit opt-in flag', () => {
    expect(run({ NODE_ENV: 'development' })).toBeUndefined();
    expect(run({ NODE_ENV: 'test', ALLOW_PLACEHOLDER_CALLER: 'yes' })).toBeUndefined();
  });

  it.each([undefined, '', 'production', 'prod', 'staging'])(
    'fails closed when NODE_ENV is %s even if opted in',
    (NODE_ENV) => {
      expect(run({ NODE_ENV, ALLOW_PLACEHOLDER_CALLER: 'true' })).toBeUndefined();
    },
  );
});
