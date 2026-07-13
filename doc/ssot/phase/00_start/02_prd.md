# Leap Signal Labs 포털 (leapsignal.net) — PRD & 구현 계획

> 작성일: 2026-07-13
> 입력 문서: [00_prompt.md](00_prompt.md), [01_platform_guide.md](01_platform_guide.md)
> 상태: **승인됨 (i18n 추가 조건부)** — 세부 계약은 [doc/ssot/contract/](../../contract/00_overview.md)에 고정되어 있으며, 계약이 본 문서보다 우선한다.

---

## 0. 결론 요약 (TL;DR)

| 항목 | 결정 | 이유 |
|---|---|---|
| 배포 플랫폼 | **Cloudflare Workers Static Assets** | 플랫폼 가이드 1순위. 정적 요청 무료·무제한, 서버 연산 0 |
| 렌더링 방식 | **SSG (순수 정적 빌드, 서버 없음)** | 링크 허브는 모든 방문자에게 동일한 내용 → 가이드 2절의 분류표상 SSG |
| 프레임워크 | **Vite + React + TypeScript** | Lightfall이 React 컴포넌트(reactbits)라 React 필수. Next.js는 과잉 — 페이지 1개, 라우팅 불필요 |
| 예상 월 비용 | **$0** (도메인 비용 제외) | Workers 무료 플랜으로 충분. 정적 자산은 무료 플랜에서도 무제한 |
| 배포 방식 | GitHub push → Workers Builds 자동 배포 | 유지보수 작업 0. `main` merge = 배포 |
| DB / API / 서버 | **없음** | 링크 데이터는 빌드에 포함되는 TS 파일 1개 |

**왜 Workers Paid($5)도 필요 없는가**: 이 사이트는 동적 요청(Worker 실행)이 단 1건도 없다. HTML/JS/CSS/이미지 전부 정적 자산으로 서빙되며, Cloudflare는 정적 자산 요청을 무료 플랜에서도 과금하지 않는다. 봇이 아무리 몰려와도 비용이 발생하지 않는다 — 플랫폼 가이드 1.3절의 "비싼 경로" 자체가 존재하지 않는 구조다.

---

## 1. 제품 정의

### 1.1 무엇을 만드는가

`leapsignal.net` — Leap Signal Labs 브랜드 산하 서비스로 이동하는 **원페이지 링크 허브**.

- 상단: "Leap / Signal / Labs" 3줄 로고 (Playwrite IE 폰트, 최강 glow)
- 본문: 서비스 카드 목록 (썸네일 + 제목 + 설명 + 링크)
- 배경: 활성 카드 썸네일 blur 확대 + 역석양 그라디언트 + 역방향 Lightfall
- 분위기: 어두운 바탕 위에 카드와 로고가 빛나는 **다크 네온**

### 1.2 링크 목록 (초기 데이터)

노출 순서 그대로:

| 순서 | card_id | URL |
|---|---|---|
| 1 | `ypjr` | https://ypjr.leapsignal.net |
| 2 | `jzahnny` | https://jzahnny.leapsignal.net |
| 3 | `eclipse` | https://eclipse.leapsignal.net/ |
| 4 | `focusroyale` | https://focusroyale.leapsignal.net |

title / desc / thumbnail은 구현 시 placeholder로 채우고, 실제 값은 데이터 파일 1개만 수정하면 되는 구조로 만든다.

### 1.3 명시적 비목표 (Non-goals)

- 로그인, 방문 통계 수집, CMS, 다국어 — 없음
- 페이지 추가 라우팅 — 없음 (해시 `#card_id`만 사용)
- SEO 최적화는 메타 태그·OG 태그 수준까지만 (원페이지라 그 이상 불필요)

---

## 2. 기술 스택 결정 상세

### 2.1 프레임워크: Vite + React + TypeScript

**검토한 선택지**

| 선택지 | 판단 |
|---|---|
| 순수 HTML/CSS/JS | Lightfall(React + WebGL)을 못 쓰거나 직접 포팅해야 함. 탈락 |
| Next.js static export | 가능하지만 페이지 1개에 라우터·프레임워크 오버헤드가 과잉. 탈락 |
| Astro + React island | 정적 부분이 거의 없고 페이지 전체가 인터랙티브(스크롤 감지, glow, 해시)라 island 이점이 없음. 탈락 |
| **Vite + React SPA** | 빌드 결과가 순수 정적 파일. 번들 최소. Lightfall 그대로 사용. **채택** |

SPA지만 페이지가 1개뿐이므로 "SPA의 SEO 문제"는 없다 — 메타 태그는 `index.html`에 정적으로 존재한다.

### 2.2 주요 의존성

```
react, react-dom          # UI
ogl                       # Lightfall이 요구하는 WebGL 라이브러리 (reactbits 의존성)
vite, typescript          # 빌드
wrangler                  # Cloudflare 배포 CLI (devDependency)
```

- **CSS 프레임워크 없음.** 순수 CSS + CSS 변수(디자인 토큰)로 충분하며, Tailwind 등을 넣으면 "모든 스타일 값을 한 파일이 관할"이라는 요구와 충돌한다.
- 애니메이션 라이브러리 없음. CSS transition + `IntersectionObserver` + `scrollIntoView`로 전부 구현 가능.
- Lightfall은 npm 패키지가 아니라 reactbits에서 **소스 복사** 방식(jsrepo) → `src/vendor/Lightfall/`에 넣고 우리가 직접 수정(역방향화)한다.

### 2.3 배포: Cloudflare Workers Static Assets

```
GitHub repo (labs-portal)
   └─ main push
        └─ Cloudflare Workers Builds (무료 월 3,000분)
             └─ vite build → dist/ 를 Static Assets로 업로드
                  └─ leapsignal.net (Cloudflare DNS, proxy ON, Full strict)
```

- `wrangler.jsonc`에 `assets` 설정만 존재, Worker 스크립트 코드 없음 → 100% 정적 서빙.
- `run_worker_first` 사용 금지 (가이드 9.2절 — 정적 무료 서빙 이점 상실 방지).
- PR 생성 시 preview URL 자동 발급 (Workers Builds 기본 기능).

---

## 3. 저장소 구조

```
labs-portal/
├── doc/ssot/...                  # 본 문서 포함 SSOT (현재 위치)
├── index.html                    # 메타태그, 폰트 preconnect/link, 로딩 폴백
├── wrangler.jsonc                # Cloudflare Static Assets 설정
├── vite.config.ts
├── tsconfig.json
├── package.json
├── public/
│   ├── thumbs/                   # 카드 썸네일 (1:1) — {card_id}.webp / {card_id}.mp4
│   │   ├── ypjr.webp
│   │   ├── jzahnny.webp
│   │   ├── eclipse.webp
│   │   └── focusroyale.webp
│   ├── favicon.svg
│   └── og.png                    # 소셜 미리보기 (1200×630)
└── src/
    ├── main.tsx
    ├── App.tsx                   # 레이어 조립 + 전역 상태(activeCardId)
    ├── data/
    │   └── services.ts           # ★ 링크/카드 데이터 단일 파일 (요구사항 #1)
    ├── styles/
    │   ├── tokens.css            # ★ 모든 디자인 값 단일 파일 (요구사항)
    │   └── global.css            # reset, body 기본, 폰트 적용
    ├── components/
    │   ├── Logo.tsx              # Leap/Signal/Labs 3줄 + 최강 glow
    │   ├── CardList.tsx          # 카드 나열 + 활성 카드 판정 로직 소유
    │   ├── Card.tsx              # 확장/축소/glow 3상태 렌더링
    │   ├── Thumbnail.tsx         # image/video 분기 + lazy + poster
    │   └── background/
    │       ├── BackgroundStage.tsx   # 아래 3개 레이어 조립
    │       ├── ThumbBackdrop.tsx     # 활성 썸네일 cover+blur+black
    │       ├── SunsetGradient.tsx    # 역석양 그라디언트 오버레이
    │       └── LightfallLayer.tsx    # lazy 로딩 래퍼 (React.lazy)
    ├── vendor/
    │   └── Lightfall/            # reactbits 소스 복사 + 역방향 수정
    ├── hooks/
    │   ├── useIsDesktop.ts       # matchMedia(--breakpoint-desktop)
    │   ├── useActiveCard.ts      # 모바일: 화면 중앙 카드 판정 (IntersectionObserver)
    │   └── useHashTarget.ts      # #card_id 파싱 + hashchange 구독
    └── lib/
        └── introSequence.ts      # 모바일 접속 인트로 시퀀스 로직
```

---

## 4. 데이터 스키마 — `src/data/services.ts`

링크 수정이 필요하면 **이 파일만** 고친다.

```ts
export type ServiceCard = {
  card_id: string;              // 해시 딥링크 키. URL-safe 소문자
  title: string;
  desc: string;
  link: string;                 // 절대 URL
  thumbnail: {
    type: "image" | "video";
    src: string;                // /thumbs/{card_id}.webp | .mp4
    poster?: string;            // video일 때 첫 프레임 이미지 (필수로 강제)
  };
};

export const services: ServiceCard[] = [
  { card_id: "ypjr",        title: "...", desc: "...", link: "https://ypjr.leapsignal.net",        thumbnail: { type: "image", src: "/thumbs/ypjr.webp" } },
  { card_id: "jzahnny",     title: "...", desc: "...", link: "https://jzahnny.leapsignal.net",     thumbnail: { type: "image", src: "/thumbs/jzahnny.webp" } },
  { card_id: "eclipse",     title: "...", desc: "...", link: "https://eclipse.leapsignal.net/",    thumbnail: { type: "image", src: "/thumbs/eclipse.webp" } },
  { card_id: "focusroyale", title: "...", desc: "...", link: "https://focusroyale.leapsignal.net", thumbnail: { type: "image", src: "/thumbs/focusroyale.webp" } },
];
```

- 배열 순서 = 화면 노출 순서.
- `card_id` 중복은 빌드 시 assert로 차단(간단한 런타임 체크를 모듈 로드 시 수행).

---

## 5. 디자인 토큰 — `src/styles/tokens.css`

색상·blur·border·radius·glow·간격·타이포·z-index·breakpoint **전부** 이 파일의 CSS 변수로만 정의한다. 컴포넌트 CSS에는 리터럴 값 금지(`var(--...)`만 사용).

```css
:root {
  /* ── color ── */
  --color-bg-base: #0a0710;               /* 최하단 폴백 배경 (아무것도 안 떠도 보이는 색) */
  --color-sunset-bottom: rgba(255, 61, 40, 0.55);   /* 역석양: 아래(붉음) */
  --color-sunset-top: rgba(72, 160, 255, 0.35);     /* 역석양: 위(청량한 하늘) */
  --color-card-bg: rgba(20, 14, 28, 0.55);
  --color-card-bg-glow: rgba(64, 18, 24, 0.65);     /* glow 시 더 붉은 카드 배경 */
  --color-card-border: rgba(255, 255, 255, 0.12);
  --color-text-title: #f5f0ff;
  --color-text-desc: rgba(235, 225, 250, 0.65);
  --color-neon: #ff4d3a;                   /* glow 주조색 (네온 레드) */
  --color-logo-neon: #ffe9d6;

  /* ── glow (박스/텍스트 그림자 프리셋) ── */
  --glow-card: 0 0 24px rgba(255, 77, 58, 0.45), 0 0 64px rgba(255, 77, 58, 0.20);
  --glow-logo: 0 0 8px #fff, 0 0 24px var(--color-neon), 0 0 72px var(--color-neon); /* 최강 */

  /* ── blur / overlay ── */
  --blur-backdrop: 48px;                   /* 배경 썸네일 blur */
  --blur-card: 16px;                       /* 카드 유리(backdrop-filter) */
  --overlay-black: rgba(0, 0, 0, 0.55);    /* 배경 썸네일 위 black opacity */

  /* ── border / radius ── */
  --border-card: 1px solid var(--color-card-border);
  --radius-card: 20px;
  --radius-thumb: 14px;

  /* ── layout ── */
  --card-max-width: 720px;
  --gap-card: 24px;
  --breakpoint-desktop: 768px;             /* JS의 matchMedia도 이 값 사용 */

  /* ── motion ── */
  --dur-state: 350ms;                      /* 확장↔축소 */
  --dur-glow: 250ms;
  --ease-card: cubic-bezier(0.22, 1, 0.36, 1);
  --intro-step: 420ms;                     /* 모바일 인트로 카드당 간격 */

  /* ── z-index (요구사항의 레이어 순서 그대로) ── */
  --z-thumb-backdrop: 0;    /* 썸네일 배경 */
  --z-sunset: 1;            /* 오버레이 그라디언트 */
  --z-lightfall: 2;         /* lightfall */
  --z-logo: 3;              /* 로고 */
  --z-card: 4;              /* 카드 */
}
```

값은 구현하면서 시각 확인 후 미세 조정하되, **조정 위치는 항상 이 파일**이다.

---

## 6. 컴포넌트 명세

### 6.1 Card — 상태 매트릭스

카드는 독립 축 2개를 가진다: `expanded: boolean`, `glowing: boolean`.

**축소 상태 (collapsed)** — 수평 3분할:

```
┌──────────┬──────────────────────────┬──────┐
│ 썸네일    │ title                    │  →   │
│ (1:1)    │ desc                     │ icon │
└──────────┴──────────────────────────┴──────┘
```

- 좌: 썸네일(1:1, `--radius-thumb`), 고정폭 (예: 72px)
- 중: title 위 / desc 아래, 넘치면 말줄임
- 우: 오른쪽 화살표 아이콘 (인라인 SVG — 외부 아이콘 라이브러리 불필요)

**확장 상태 (expanded)** — 수직 2분할:

```
┌──────────────────────────┐
│        썸네일 (1:1)       │
├──────────────────────────┤
│ title                    │
│ desc                     │
└──────────────────────────┘
```

**glow 상태**: 카드 배경을 `--color-card-bg-glow`(더 붉게)로, `box-shadow: var(--glow-card)` 적용. transition `--dur-glow`.

**공통**: 카드 전체가 `<a href={link}>` (새 탭). `backdrop-filter: blur(var(--blur-card))`의 유리 질감. 각 카드 루트에 `id={card_id}` 부여 → 해시 스크롤 타깃.

확장↔축소는 CSS grid template 전환 + `--dur-state` transition으로 부드럽게 처리한다.

### 6.2 Logo

- `index.html` `<head>`에 프롬프트 명시대로 삽입:
  ```html
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playwrite+IE:wght@100..400&display=swap" rel="stylesheet">
  ```
- `Leap` / `Signal` / `Labs` 3줄, 수평 중앙 정렬, 카드 목록 최상단.
- `text-shadow: var(--glow-logo)` — 사이트 내 최강 glow.
- 폰트 로딩 전 레이아웃 흔들림 방지: `display=swap` + 시스템 폰트 폴백 지정.

### 6.3 배경 3레이어 — BackgroundStage

전부 `position: fixed; inset: 0`, z-index는 토큰 사용.

1. **ThumbBackdrop** (`--z-thumb-backdrop`)
   - 활성 카드(`activeCardId`)의 썸네일을 `object-fit: cover`로 화면을 가득 채울 때까지 확대.
   - `filter: blur(var(--blur-backdrop))` + 그 위에 `--overlay-black` 단색 레이어.
   - 활성 카드 변경 시 crossfade: 이전/현재 2장을 겹쳐 opacity transition (video면 활성일 때만 재생, 비활성 즉시 pause).
   - blur된 이미지는 원본 해상도가 필요 없으므로 **썸네일과 같은 파일 재사용** (추가 다운로드 0).
2. **SunsetGradient** (`--z-sunset`)
   - `linear-gradient(to top, var(--color-sunset-bottom), var(--color-sunset-top))`
   - 역석양: 아래 붉고 위로 갈수록 맑은 파랑. 반투명 오버레이로 얹음.
3. **LightfallLayer** (`--z-lightfall`)
   - reactbits Lightfall을 `src/vendor/`로 복사.
   - **역방향(상승) 처리**: 1차로 셰이더/애니메이션 파라미터에서 진행 방향 부호를 반전. 셰이더 수정이 과하게 복잡하면 컨테이너에 `transform: scaleY(-1)` 적용으로 대체 (시각 결과 동일).
   - `React.lazy` + 첫 페인트 이후 로딩 (7절 참조). WebGL 미지원/`prefers-reduced-motion` 환경에서는 렌더링 생략.

### 6.4 로고·카드 레이어

- 스크롤 컨테이너는 body 자체. 로고(`--z-logo`)와 카드(`--z-card`)는 일반 문서 흐름으로 배경 위에 얹힘.

---

## 7. 인터랙션 명세

### 7.1 데스크톱 (뷰포트 ≥ `--breakpoint-desktop`)

- 모든 카드 **항상 확장 상태**. 그리드 배치 (2열, `--card-max-width` 내).
- `mouseenter` → 해당 카드 glow ON + 배경 ThumbBackdrop을 그 카드 썸네일로 교체. `mouseleave` → glow OFF.
- 아무 카드도 hover 아닐 때: 배경은 마지막 hover 카드 유지 (초기값: 첫 카드 또는 해시 타깃 카드).
- 해시 접속(`leapsignal.net/#eclipse`): 해당 카드로 `scrollIntoView({ block: "center", behavior: "smooth" })` + glow 1회 점등.

### 7.2 모바일 (뷰포트 < breakpoint)

- 기본: 모든 카드 축소. **화면 세로 중앙에 가장 가까운 카드 1개만** 확장 + glow + 배경 썸네일 반영.
- 판정: `IntersectionObserver`(rootMargin으로 중앙 밴드 형성) 또는 scroll 이벤트(rAF 스로틀)에서 각 카드 중심과 뷰포트 중심 거리 최소값. → `useActiveCard`.
- 스크롤에 따라 활성 카드가 바뀌면: 이전 카드 축소, 새 카드 확장 (transition `--dur-state`).

### 7.3 모바일 접속 인트로 시퀀스 — `introSequence.ts`

접속(최초 로드) 시:

1. 타깃 결정: 해시가 있으면 그 `card_id`, 없으면 **최상단 카드**.
2. 페이지를 **맨 아래로** 세팅한 뒤, **맨 아래 카드부터 위 방향으로 한 카드씩** 순차 확장(각 `--intro-step` 간격, 직전 카드는 다시 축소).
3. 스크롤도 카드 진행에 맞춰 위로 따라 올라감 (`scrollIntoView` smooth).
4. 타깃 카드에 도달하면 그 카드에서 정지: 확장 + glow 유지.
5. 시퀀스 중 사용자가 스크롤/터치하면 **즉시 중단**하고 일반 스크롤 모드(7.2)로 전환.
6. `prefers-reduced-motion: reduce`면 시퀀스 생략, 타깃 카드로 즉시 점프.

### 7.4 해시 딥링크 (PC·모바일 공통)

- 형식: `https://leapsignal.net/#<card_id>` (예: `#focusroyale`).
- 로드 시 1회 + `hashchange` 이벤트 구독 (`useHashTarget`).
- 존재하지 않는 card_id면 무시하고 기본 동작.
- 서버가 없어도 동작하는 것이 해시(`#`)를 선택한 이유 — 쿼리(`?card=`) 방식은 정적 호스팅에서 불필요한 복잡도만 추가.

---

## 8. 성능·로딩 전략 (프롬프트의 "느리면 아무것도 안 보이는 문제" 답변)

핵심 원칙: **의존성이 없는 것부터 즉시 보이게 하고, 무거운 것은 화면을 잡지 않게 뒤로 뺀다.** 어떤 단계에서 멈춰도 "빈 화면"은 없다.

### 8.1 단계별 로딩 우선순위

| 단계 | 보이는 것 | 수단 |
|---|---|---|
| 0. HTML 도착 즉시 | 어두운 배경색 + 역석양 그라디언트 + 로고 텍스트 | `index.html` 인라인 critical CSS (배경색·그라디언트·로고 영역). JS 불필요 |
| 1. JS 번들 로드 | 카드 목록 (썸네일 자리는 placeholder) | 카드 데이터는 번들에 포함 → 추가 네트워크 왕복 없음 |
| 2. 썸네일 로드 | 카드 썸네일 + 배경 backdrop | 첫 화면 카드만 `loading="eager"` + `fetchpriority="high"`, 나머지 `loading="lazy"` |
| 3. 유휴 시점 | Lightfall | `React.lazy` + `requestIdleCallback` 후 mount. 실패해도 사이트는 완전 동작 |

### 8.2 세부 수단

- **인라인 critical CSS**: `--color-bg-base` 배경과 석양 그라디언트, 로고 자리를 `index.html`에 직접 넣는다. JS가 0바이트 로드돼도 브랜드 화면이 보인다.
- **폰트**: `display=swap`이므로 Playwrite IE 로딩 전에도 폴백 폰트로 로고 텍스트가 즉시 보인다.
- **이미지 포맷/크기**: 썸네일은 WebP, 실표시 크기의 2x 이하 (1:1이므로 512×512 기준). 목표: 썸네일 1장 ≤ 60KB.
- **비디오 썸네일**: `poster` 필수, `preload="none"`, 활성(확장/hover) 시에만 `play()`. `muted playsinline loop`.
- **Lightfall 지연**: WebGL 번들(ogl 포함)은 별도 청크. 배경은 그라디언트만으로도 완성도가 있으므로 lightfall은 "나중에 얹히는 장식"으로 취급.
- **번들 목표**: 초기 JS(청크 분리 후) < 150KB gzip. Vite 기본 코드 스플리팅으로 충분.
- **CDN**: Cloudflare 엣지에서 전 파일 서빙 + `Cache-Control: immutable` (Vite 해시 파일명) → 재방문 시 사실상 0 왕복.
- **측정 기준**: Lighthouse (모바일, Slow 4G) LCP < 2.5s, CLS < 0.1. 배포 전 1회 확인.

---

## 9. 접근성·엣지 케이스

- 카드 = `<a>` → 키보드 Tab 이동 가능. `:focus-visible`에 glow 재사용.
- `prefers-reduced-motion`: 인트로 시퀀스 생략, lightfall 미표시, transition 최소화.
- WebGL 미지원 브라우저: lightfall 렌더링 생략 (기능 손실 없음).
- JS 비활성: 0단계 화면(배경+로고)까지 보임. `<noscript>`에 플레인 링크 리스트 제공 — 링크 허브의 본질 기능은 JS 없이도 유지.
- 화면 회전/리사이즈: `matchMedia` 리스너로 데스크톱↔모바일 모드 전환 시 카드 상태 재계산.

---

## 10. 배포·운영 계획

### 10.1 초기 설정 (1회성)

1. GitHub repo 생성 (`labs-portal` — 플랫폼 가이드 7절 명명 준수).
2. `wrangler.jsonc`:
   ```jsonc
   {
     "name": "labs-portal",
     "compatibility_date": "2026-07-13",
     "assets": { "directory": "./dist" }
   }
   ```
3. Cloudflare 대시보드에서 Workers Builds ↔ GitHub repo 연결 (build: `npm run build`, output: `dist`).
4. `leapsignal.net` 커스텀 도메인 연결 (DNS proxy ON, SSL `Full (strict)`).
5. `www.leapsignal.net` → apex 리다이렉트 규칙 1개.

### 10.2 이후 운영 (반복 작업)

- 링크 추가/수정: `src/data/services.ts` 수정 + 썸네일 파일 추가 → push → 자동 배포. **이게 전부다.**
- 디자인 톤 조정: `src/styles/tokens.css`만 수정.
- 서버·DB·인증서·스케일링 관리: 없음.

### 10.3 비용

- Cloudflare 무료 플랜: 정적 자산 무제한, Workers Builds 월 3,000분 (이 프로젝트 빌드 ~1분).
- **월 $0.** 유일한 비용은 도메인 갱신비.

---

## 11. 구현 순서 (마일스톤)

| # | 작업 | 완료 기준 |
|---|---|---|
| M1 | 프로젝트 스캐폴딩: Vite+React+TS, tokens.css, services.ts, index.html(폰트·critical CSS·메타) | `npm run dev` 로 다크 배경+로고 렌더 |
| M2 | Card 컴포넌트: 확장/축소/glow 3상태 + 데스크톱 그리드 + hover glow | 데스크톱에서 4카드 확장 표시, hover 시 glow |
| M3 | 배경 레이어: ThumbBackdrop(cover+blur+black) + SunsetGradient + z-index 조립 | hover 카드 따라 배경 crossfade |
| M4 | 모바일: 축소 목록 + 중앙 카드 활성화(useActiveCard) + 상태 전환 | 스크롤 시 중앙 카드만 확장+glow |
| M5 | 해시 딥링크 + 모바일 인트로 시퀀스 (중단 처리 포함) | `#eclipse` 접속 시 시퀀스 후 해당 카드 정지 |
| M6 | Lightfall 이식 + 역방향화 + lazy 로딩 | 유휴 후 상승 lightfall 표시, reduced-motion 시 생략 |
| M7 | 성능 마감: 이미지 최적화, 청크 분리, noscript, Lighthouse 측정 | LCP<2.5s(모바일 Slow 4G), CLS<0.1 |
| M8 | 배포: wrangler 설정, GitHub 연결, 도메인 전환, 실기기 확인 | leapsignal.net 프로덕션 서빙 + push 자동 배포 확인 |

예상 규모: 소스 ~15개 파일. M1–M7은 로컬에서 순차 진행, M8만 Cloudflare 계정 작업 필요.

---

## 12. 검수 체크리스트 (승인 후 완료 판정 기준)

- [ ] 링크 4개가 `services.ts` 한 파일에만 존재하고, 순서 = 프롬프트 순서
- [ ] 카드에 thumbnail(1:1) / title / desc / link / card_id 모두 존재
- [ ] 축소 카드 = 좌 썸네일 · 중 title+desc · 우 화살표
- [ ] 확장 카드 = 상 썸네일 · 하 title+desc
- [ ] glow 시 카드 배경이 더 붉어지고 glow shadow 적용
- [ ] 데스크톱: 전 카드 확장 + hover glow
- [ ] 모바일: 중앙 카드만 확장+glow, 접속 시 맨 아래부터 순차 확장 인트로
- [ ] `#card_id` 해시로 PC/모바일 모두 해당 카드 이동
- [ ] 배경 = 활성 썸네일 cover+blur+black opacity
- [ ] 역석양 그라디언트 (아래 붉음 → 위 파랑)
- [ ] z-index: 썸네일 < 그라디언트 < lightfall < 로고 < 카드
- [ ] Lightfall 상승 방향
- [ ] Playwrite IE 로고 3줄 중앙 정렬 + 최강 glow
- [ ] 모든 스타일 값이 tokens.css 변수 경유
- [ ] 느린 네트워크에서도 단계 0 화면(배경+로고)이 즉시 표시
- [ ] Cloudflare 정적 배포 + push 자동 배포, 월 비용 $0

---

## 12.5 다국어 (i18n) — 승인 시 추가된 요구사항

상세 계약: [contract/05_i18n.md](../../contract/05_i18n.md)

- 지원 언어: **한국어(ko), 영어(en)** 2개. 라이브러리 없이 React Context 자체 구현.
- 카드 title/desc는 `services.ts`에서 `{ ko, en }` 쌍으로 관리 — 데이터 단일 파일 원칙 유지.
- UI 공통 문자열은 `src/i18n/locales.ts` 테이블 한 곳에서 관리, 두 언어 키 누락은 타입으로 차단.
- Locale 결정: localStorage 저장값 → `navigator.language`(ko면 ko, 아니면 en) 순.
- 우상단 고정 토글 버튼으로 즉시 전환 + localStorage 저장 + `<html lang>` 갱신.
- URL은 locale을 싣지 않음 (해시는 card_id 전용).

검수 항목 추가:
- [ ] ko/en 전환 토글 동작 + 새로고침 후 유지
- [ ] 카드 문구·UI 문자열이 언어 전환에 즉시 반응
- [ ] 컴포넌트 내 한/영 문자열 하드코딩 없음

---

## 13. 확인 필요 사항 (구현 전 답변 요망)

1. **title/desc 실제 문구** — 각 서비스의 제목·한 줄 설명. 없으면 placeholder로 진행 후 나중에 `services.ts`만 수정.
2. **썸네일 소스** — 각 서비스의 이미지/영상 파일 제공 여부. 없으면 임시 그라디언트 placeholder로 진행.
3. **데스크톱 카드 배치** — 확장 카드 4장을 2×2 그리드로 가정했는데, 세로 1열(큰 카드 스택)을 원하면 알려줄 것.
4. **Cloudflare 계정/도메인** — `leapsignal.net`이 이미 Cloudflare DNS에 있는지. M8에서 필요.
