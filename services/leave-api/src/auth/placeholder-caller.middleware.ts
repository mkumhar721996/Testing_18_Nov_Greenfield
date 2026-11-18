// TEMPORARY until the sign-in story lands: outside production every request is treated as an
// employee so the spin flow works end to end. In production nothing is set, so RolesGuard refuses
// (ADR-0010). Replace with real caller resolution from the sign-in session.
export function placeholderCaller(nodeEnv: string | undefined) {
  return (request: { caller?: { role: string } }, _response: unknown, next: () => void) => {
    if (nodeEnv !== 'production') request.caller = { role: 'employee' };
    next();
  };
}
