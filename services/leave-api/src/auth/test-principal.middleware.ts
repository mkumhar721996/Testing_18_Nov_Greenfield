import { PrincipalRequest } from './authenticated.guard';

interface HeaderRequest extends PrincipalRequest {
  header(name: string): string | undefined;
}

/**
 * Test-only stand-in for the Entra ID middleware (Sign-in & Access Control): takes the
 * principal from the `x-test-employee-id` header. Installed only when
 * LEAVE_API_TEST_PRINCIPAL=true, never in production.
 */
export function testPrincipalMiddleware(req: HeaderRequest, _res: unknown, next: () => void): void {
  const employeeId = req.header('x-test-employee-id');
  if (employeeId) {
    req.principal = { employeeId };
  }
  next();
}
