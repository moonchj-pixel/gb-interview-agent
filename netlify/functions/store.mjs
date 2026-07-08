/* GB 채용 면접 에이전트 — 팀 공유 저장소 (Netlify Function + Blobs)
   면접 대상자·평가 보관함을 팀 전체가 공유합니다.
   접속 코드는 환경변수 TEAM_CODE 로 설정합니다. */
import { getStore } from '@netlify/blobs';

export default async (req) => {
  const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'Content-Type': 'application/json' } });
  const code = process.env.TEAM_CODE || '';
  if (code && req.headers.get('x-team-code') !== code) return json({ error: 'unauthorized' }, 401);

  const store = getStore({ name: 'gb-interview', consistency: 'strong' });
  const url = new URL(req.url);

  if (url.searchParams.get('op') === 'ping') return json({ ok: true });

  if (req.method === 'GET' && url.searchParams.has('prefix')) {
    const l = await store.list({ prefix: url.searchParams.get('prefix') });
    return json({ keys: (l.blobs || []).map(b => b.key) });
  }
  const key = url.searchParams.get('key');
  if (req.method === 'GET') {
    if (!key) return json({ error: 'key required' }, 400);
    const v = await store.get(key);
    if (v === null) return json({ error: 'not found' }, 404);
    return json({ key, value: v });
  }
  if (req.method === 'POST' || req.method === 'PUT') {
    const b = await req.json();
    if (!b.key) return json({ error: 'key required' }, 400);
    await store.set(b.key, String(b.value ?? ''));
    return json({ ok: true, key: b.key });
  }
  if (req.method === 'DELETE') {
    if (!key) return json({ error: 'key required' }, 400);
    await store.delete(key);
    return json({ ok: true, deleted: key });
  }
  return json({ error: 'bad request' }, 400);
};
export const config = { path: '/api/store' };
