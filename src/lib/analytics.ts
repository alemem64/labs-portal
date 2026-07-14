// 방문 분석 수집 (phase/03_analytics). 쿠키 없음 — session_id는 페이지 로드당 난수.
// 전송 실패는 조용히 무시한다: 분석이 사용자 경험을 방해하면 안 된다.

const API = "/api/collect";
const sessionId =
  typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Math.random());
const loadedAt = typeof performance !== "undefined" ? performance.now() : 0;

function send(payload: Record<string, unknown>) {
  try {
    const body = JSON.stringify({ session_id: sessionId, ...payload });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(API, new Blob([body], { type: "application/json" }));
    } else {
      void fetch(API, {
        method: "POST",
        body,
        keepalive: true,
        headers: { "content-type": "application/json" },
      });
    }
  } catch {
    // 무시
  }
}

export function trackPageview() {
  const params = new URLSearchParams(window.location.search);
  send({
    event: "pageview",
    referrer: document.referrer || null,
    utm_source: params.get("utm_source"),
    utm_medium: params.get("utm_medium"),
    utm_campaign: params.get("utm_campaign"),
    lang: document.documentElement.lang || null,
    viewport_w: window.innerWidth,
  });
}

export function trackCardClick(cardId: string) {
  send({
    event: "card_click",
    card_id: cardId,
    elapsed_ms: Math.round(performance.now() - loadedAt),
    lang: document.documentElement.lang || null,
    viewport_w: window.innerWidth,
  });
}
