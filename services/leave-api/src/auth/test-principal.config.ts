const ALLOWED_NODE_ENVS = ['test', 'development'];

/**
 * Decides whether the header-based test principal may be installed. Throws (failing startup) when
 * LEAVE_API_TEST_PRINCIPAL=true outside an explicit test/development NODE_ENV, since NODE_ENV is
 * often unset in containers and the bypass would let any caller impersonate any employee.
 */
export function shouldInstallTestPrincipal(env: Record<string, string | undefined>): boolean {
  if (env.LEAVE_API_TEST_PRINCIPAL !== 'true') {
    return false;
  }
  if (!env.NODE_ENV || !ALLOWED_NODE_ENVS.includes(env.NODE_ENV)) {
    throw new Error(
      "LEAVE_API_TEST_PRINCIPAL=true is only allowed when NODE_ENV is explicitly 'test' or 'development'",
    );
  }
  return true;
}
