# Contract 03 — 디자인 토큰

## 관할 규칙

- 모든 시각 값(색, blur, border, radius, glow, 간격, 폰트, 모션 시간, z-index)은 `src/styles/tokens.css`의 CSS 변수로만 정의한다 (MUST).
- 컴포넌트 CSS(`global.css`)에는 리터럴 값 금지, `var(--...)`만 사용한다 (MUST).
- JS에서 시각 값이 필요하면 `getComputedStyle`로 토큰을 읽는다 (MUST). 예: 인트로 step 시간, lightfall 색.

## 허용된 예외 (정확히 2곳)

1. **뷰포트 분기점 `768px`** — CSS 변수는 media query에서 동작하지 않는다.
   - `src/lib/viewport.ts`의 `DESKTOP_MEDIA_QUERY` (JS 단일 소스)
   - `global.css`의 `@media` 리터럴
   - 두 곳의 값은 항상 일치해야 하며(MUST), tokens.css의 `--breakpoint-desktop` 주석이 원본이다.
2. **`index.html` 인라인 critical CSS** — 0단계 화면(06_performance.md)은 외부 요청 없이 렌더돼야 하므로 배경색·석양 그라디언트·로고 glow 값을 tokens.css에서 **복사**해 인라인한다. tokens.css에서 해당 값을 바꾸면 index.html도 함께 갱신한다 (MUST).

## z-index 레이어 (프롬프트 명세 고정)

낮음 → 높음:

```
--z-thumb-backdrop: 0   썸네일 배경 (cover + blur + black overlay)
--z-sunset:         1   역석양 그라디언트 오버레이
--z-lightfall:      2   상승 lightfall
--z-logo:           3   Leap/Signal/Labs 로고
--z-card:           4   카드, 언어 토글
```

## 무드 고정값

- 전체 분위기: 어두운 바탕 + 네온 glow. 주조 네온색 `--color-neon`(레드 계열).
- glow 상태의 카드 배경은 기본보다 **더 붉은** `--color-card-bg-glow` (MUST).
- 로고 glow(`--glow-logo`)는 사이트에서 가장 강한 glow다 (MUST).
- 역석양: `linear-gradient(to top, --color-sunset-bottom(붉음), --color-sunset-top(하늘색))` (MUST).
- 로고 폰트: Google Fonts `Playwrite IE` (index.html에서 preconnect + stylesheet 로드, `display=swap`).
