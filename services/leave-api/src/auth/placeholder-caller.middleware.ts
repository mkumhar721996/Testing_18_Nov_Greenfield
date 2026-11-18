// TEMPORARY until the sign-in story lands. Fails closed: the caller is set to an employee only when
// ALLOW_PLACEHOLDER_CALLER=true AND NODE_ENV is explicitly 'development' or 'test'. In every other
// case (unset, 'prod', 'staging', ...) nothing is set, so RolesGuard refuses (ADR-0010).
// Replace with real caller resolution from the sign-in session.
type Env = { NODE_ENV?: string; ALLOW_PLACEHOLDER_CALLER?: string };

export function placeholderCaller(env: Env) {
  const enabled =
    env.ALLOW_PLACEHOLDER_CALLER === 'true' && (env.NODE_ENV === 'development' || env.NODE_ENV === 'test');
  return (request: { caller?: { role: string } }, _response: unknown, next: () => void) => {
    if (enabled) request.caller = { role: 'employee' };
    next();
  };
}
