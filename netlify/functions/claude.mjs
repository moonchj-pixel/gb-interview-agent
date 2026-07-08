/* GB 채용 면접 에이전트 — AI 프록시 (Netlify Function)
   API 키는 Netlify 환경변수 ANTHROPIC_API_KEY 에만 보관됩니다. */
export default async (req) => {
  if (req.method !== 'POST')
    return new Response(JSON.stringify({ error: { message: 'POST only' } }),
      { status: 405, headers: { 'Content-Type': 'application/json' } });
  if (!process.env.ANTHROPIC_API_KEY)
    return new Response(JSON.stringify({ error: { message: 'ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다' } }),
      { status: 500, headers: { 'Content-Type': 'application/json' } });

  let body;
  try { body = await req.json(); }
  catch (e) { return new Response(JSON.stringify({ error: { message: 'invalid JSON' } }), { status: 400 }); }

  // 비용 통제: 모델·토큰 상한을 서버에서 강제
  body.model = 'claude-sonnet-4-6';
  body.max_tokens = Math.min(body.max_tokens || 1000, 2000);

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });
  return new Response(await r.text(), { status: r.status, headers: { 'Content-Type': 'application/json' } });
};
export const config = { path: '/api/claude' };
