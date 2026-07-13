# Contract 04 — 레이아웃·인터랙션

## 카드 상태 (독립 축 2개)

- `expanded: boolean`, `glowing: boolean`. DOM에는 `data-expanded`, `data-glow` 속성으로 표현한다 (MUST).
- **축소**: 수평 3분할 — 좌 썸네일(1:1, `--thumb-w-collapsed`) / 중 title+desc(말줄임) / 우 오른쪽 화살표(인라인 SVG).
- **확장**: 수직 2분할 — 상 썸네일(1:1, 전체 폭) / 하 title+desc. 화살표 숨김.
- **glow**: 배경 `--color-card-bg-glow`(더 붉게) + `box-shadow: --glow-card`.
- 카드 루트는 `<a href={link} target="_blank">`이고 `id={card_id}`를 가진다 (MUST) — 해시 스크롤 타깃.

## 데스크톱 (`DESKTOP_MEDIA_QUERY` 충족, ≥768px)

- 모든 카드 항상 **확장** 상태, 2열 그리드 (MUST).
- hover 카드에 glow ON, 벗어나면 OFF.
- 배경(ThumbBackdrop)은 마지막으로 hover한 카드의 썸네일 유지. 초기값: 해시 타깃 카드, 없으면 첫 카드.
- 해시 진입 시: 해당 카드로 smooth 센터 스크롤 + glow 1회 점등(~1.6s) + 배경 반영.

## 모바일 (<768px)

- 기본 전 카드 축소. **뷰포트 세로 중앙에 가장 가까운 카드 1개만** 확장 + glow + 배경 반영 (MUST).
- 판정: scroll 이벤트(rAF 스로틀)에서 각 카드 중심 ↔ 뷰포트 중심 거리 최솟값.

## 모바일 접속 인트로 시퀀스

1. 타깃 = 해시 card_id, 없으면 첫(최상단) 카드.
2. 페이지를 즉시 맨 아래로 이동 후, **맨 아래 카드부터 위로 한 카드씩** 순차 활성화(확장+glow+센터 스크롤), 간격 `--intro-step`.
3. 타깃 카드 도달 시 정지, 그 카드 활성 유지.
4. 시퀀스 중 사용자 입력(wheel/touchstart/pointerdown/keydown) 발생 시 **즉시 중단**하고 일반 스크롤 모드로 전환 (MUST).
5. 시퀀스 중에는 스크롤 기반 활성 판정을 끈다 (MUST).
6. `prefers-reduced-motion: reduce`면 시퀀스 생략, 타깃으로 즉시 점프 (MUST).

## 해시 딥링크 (PC·모바일 공통)

- 형식: `https://leapsignal.net/#<card_id>` (MUST — 쿼리스트링 방식 금지).
- 최초 로드 1회 + `hashchange` 구독. 존재하지 않는 id는 무시.

## 배경 3레이어

- **ThumbBackdrop**: 활성 카드 썸네일을 화면 cover까지 확대 + `--blur-backdrop` blur + `--overlay-black` 단색 오버레이. 활성 변경 시 crossfade(`--dur-bg`). 썸네일 파일을 그대로 재사용한다(추가 다운로드 금지, MUST). video 썸네일은 활성 레이어만 재생.
- **SunsetGradient**: 03_design_tokens.md의 역석양 그라디언트.
- **Lightfall**: 자체 WebGL 구현, 광선 진행 방향은 **아래→위(상승)** (MUST). `prefers-reduced-motion` 또는 WebGL 불가 시 렌더 생략 — 기능 손실 없어야 한다 (MUST).

## 접근성

- 카드 `:focus-visible`에 glow 스타일 재사용.
- 언어 토글은 버튼이며 `aria-label` 제공.
