import { describe, expect, it, vi } from 'vitest';
import { fetchEntraUsers, GraphError } from './graph-client.js';

const config = { tenantId: 't', clientId: 'c', clientSecret: 'fake-secret' };

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

describe('fetchEntraUsers', () => {
  it('follows @odata.nextLink and maps manager.id to managerId', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(json({ access_token: 'tok' }))
      .mockResolvedValueOnce(
        json({
          value: [{ id: 'm1', displayName: 'M', mail: 'm@x.test', accountEnabled: true }],
          '@odata.nextLink': 'https://graph.microsoft.com/next',
        }),
      )
      .mockResolvedValueOnce(
        json({ value: [{ id: 'e1', displayName: 'E', accountEnabled: false, manager: { id: 'm1' } }] }),
      );

    const users = await fetchEntraUsers(config, fetchImpl as unknown as typeof fetch);

    expect(users.map((u) => [u.id, u.managerId, u.accountEnabled, u.email])).toEqual([
      ['m1', null, true, 'm@x.test'],
      ['e1', 'm1', false, null],
    ]);
    expect(fetchImpl.mock.calls[2][0]).toBe('https://graph.microsoft.com/next');
    expect(fetchImpl.mock.calls[2][1].headers.authorization).toBe('Bearer tok');
  });

  it.each([429, 503])('throws a retryable error on status %i', async (status) => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(json({ access_token: 'tok' }))
      .mockResolvedValueOnce(json({}, status));
    await expect(fetchEntraUsers(config, fetchImpl as unknown as typeof fetch)).rejects.toMatchObject({
      retryable: true,
    });
  });

  it('throws a non-retryable error on 403', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(json({ access_token: 'tok' }))
      .mockResolvedValueOnce(json({}, 403));
    const err = await fetchEntraUsers(config, fetchImpl as unknown as typeof fetch).catch((e) => e);
    expect(err).toBeInstanceOf(GraphError);
    expect(err.retryable).toBe(false);
  });
});
