import type { EntraUser } from '../sync/plan-sync.js';

export interface EntraConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
}

export class GraphError extends Error {
  constructor(
    message: string,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = 'GraphError';
  }
}

interface GraphUser {
  id?: string;
  displayName?: string | null;
  mail?: string | null;
  jobTitle?: string | null;
  department?: string | null;
  accountEnabled?: boolean;
  manager?: { id?: string } | null;
}

const USERS_URL =
  'https://graph.microsoft.com/v1.0/users?$select=id,displayName,mail,jobTitle,department,accountEnabled&$expand=manager($select=id)&$top=999';

function assertOk(res: Response, what: string): void {
  if (res.ok) return;
  const retryable = res.status === 429 || res.status >= 500;
  throw new GraphError(`${what} failed with status ${res.status}`, retryable);
}

async function fetchToken(config: EntraConfig, fetchImpl: typeof fetch): Promise<string> {
  const res = await fetchImpl(`https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: config.clientId,
      client_secret: config.clientSecret,
      scope: 'https://graph.microsoft.com/.default',
    }),
  });
  assertOk(res, 'Entra token request');
  const body = (await res.json()) as { access_token?: string };
  if (!body.access_token) throw new GraphError('Entra token response had no access token', false);
  return body.access_token;
}

export async function fetchEntraUsers(config: EntraConfig, fetchImpl: typeof fetch = fetch): Promise<EntraUser[]> {
  const token = await fetchToken(config, fetchImpl);
  const users: EntraUser[] = [];
  let url: string | undefined = USERS_URL;
  while (url) {
    const res = await fetchImpl(url, { headers: { authorization: `Bearer ${token}` } });
    assertOk(res, 'Graph users request');
    const page = (await res.json()) as { value?: GraphUser[]; '@odata.nextLink'?: string };
    for (const u of page.value ?? []) {
      users.push({
        id: u.id ?? '',
        displayName: u.displayName ?? null,
        email: u.mail ?? null,
        jobTitle: u.jobTitle ?? null,
        department: u.department ?? null,
        accountEnabled: u.accountEnabled ?? false,
        managerId: u.manager?.id ?? null,
      });
    }
    url = page['@odata.nextLink'];
  }
  return users;
}
