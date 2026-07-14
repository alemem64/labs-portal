// Contract 01(2026-07-14 개정): /api/* 한정 Worker.
// 그 외 모든 경로는 정적 자산이 Worker 없이 서빙된다 (무료 경로 유지).
// /api/collect — 방문 분석 이벤트를 D1에 기록한다. 쿠키 없음, 실패해도 항상 204.

const ALLOWED_EVENTS = new Set(["pageview", "card_click"]);
const MAX_STR = 512;

const str = (v) => (typeof v === "string" && v.length > 0 ? v.slice(0, MAX_STR) : null);
const num = (v, max) => (Number.isFinite(v) ? Math.min(Math.max(Math.round(v), 0), max) : null);

async function handleCollect(request, env) {
  try {
    // 같은 사이트에서 온 요청만 (sendBeacon/fetch는 Origin을 싣는다)
    const origin = request.headers.get("origin");
    const url = new URL(request.url);
    if (origin && origin !== url.origin) return new Response(null, { status: 204 });

    // 봇 UA는 기록하지 않는다
    const ua = request.headers.get("user-agent") || "";
    if (/bot|crawl|spider|preview|monitor|curl|wget|python|headless/i.test(ua)) {
      return new Response(null, { status: 204 });
    }

    const data = await request.json();
    if (!ALLOWED_EVENTS.has(data.event)) return new Response(null, { status: 400 });

    await env.DB.prepare(
      `INSERT INTO events
        (ts, session_id, event, card_id, elapsed_ms, referrer,
         utm_source, utm_medium, utm_campaign, lang, viewport_w, country)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        new Date().toISOString(),
        str(data.session_id),
        data.event,
        str(data.card_id),
        num(data.elapsed_ms, 86_400_000), // 최대 24시간
        str(data.referrer),
        str(data.utm_source),
        str(data.utm_medium),
        str(data.utm_campaign),
        str(data.lang),
        num(data.viewport_w, 20_000),
        request.cf?.country ?? null
      )
      .run();

    return new Response(null, { status: 204 });
  } catch {
    // 수집 실패가 사용자 경험에 영향을 주면 안 된다
    return new Response(null, { status: 204 });
  }
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === "/api/collect" && request.method === "POST") {
      return handleCollect(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};
