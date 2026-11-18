import { describe, expect, it, vi } from 'vitest';
import { placeholderCaller } from './placeholder-caller.middleware';

describe('placeholderCaller', () => {
  it('treats the request as an employee outside production', () => {
    const request: { caller?: { role: string } } = {};
    const next = vi.fn();
    placeholderCaller('development')(request, {}, next);
    expect(request.caller).toEqual({ role: 'employee' });
    expect(next).toHaveBeenCalled();
  });

  it('leaves the caller unset in production so the guard refuses', () => {
    const request: { caller?: { role: string } } = {};
    const next = vi.fn();
    placeholderCaller('production')(request, {}, next);
    expect(request.caller).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });
});
