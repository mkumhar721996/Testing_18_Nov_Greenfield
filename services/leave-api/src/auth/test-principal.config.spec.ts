import { describe, expect, it } from 'vitest';
import { shouldInstallTestPrincipal } from './test-principal.config';

describe('shouldInstallTestPrincipal', () => {
  it('is off when the flag is unset', () => {
    expect(shouldInstallTestPrincipal({})).toBe(false);
    expect(shouldInstallTestPrincipal({ NODE_ENV: 'production' })).toBe(false);
  });

  it('is on when the flag is true in test or development', () => {
    expect(shouldInstallTestPrincipal({ LEAVE_API_TEST_PRINCIPAL: 'true', NODE_ENV: 'test' })).toBe(true);
    expect(shouldInstallTestPrincipal({ LEAVE_API_TEST_PRINCIPAL: 'true', NODE_ENV: 'development' })).toBe(true);
  });

  it.each([undefined, '', 'production', 'staging'])('refuses to start when the flag is true and NODE_ENV is %p', (nodeEnv) => {
    expect(() => shouldInstallTestPrincipal({ LEAVE_API_TEST_PRINCIPAL: 'true', NODE_ENV: nodeEnv })).toThrow(
      /LEAVE_API_TEST_PRINCIPAL/,
    );
  });
});
