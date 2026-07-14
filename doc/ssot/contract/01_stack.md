# Contract 01 — 스택·빌드·배포

## 스택

| 항목 | 고정 값 |
|---|---|
| 언어 | TypeScript (strict) |
| UI | React 18+ |
| 빌드 | Vite |
| 스타일 | 순수 CSS + CSS 변수. CSS 프레임워크/전처리기 **금지** |
| 서버 | **없음.** 빌드 산출물은 100% 정적 파일 |
| 배포 | Cloudflare Workers Static Assets (`wrangler deploy`, assets-only) |
| 도메인 | `leapsignal.net` (Cloudflare DNS proxy ON, SSL Full strict) |

## 의존성 규칙

- 런타임 의존성은 `react`, `react-dom` **만** 허용한다 (MUST).
  - Lightfall 배경은 외부 패키지 없이 `src/vendor/lightfall/`의 자체 WebGL 구현을 사용한다.
- 아이콘/애니메이션/i18n/상태관리 라이브러리 추가 금지 (MUST). 필요해지면 이 계약을 먼저 개정한다.
- devDependencies는 빌드·타입체크·배포 도구로 한정한다: `vite`, `typescript`, `@vitejs/plugin-react`, `@types/*`, `wrangler`.

## 빌드·산출물

- `npm run build` = `tsc --noEmit`(타입 게이트) + `vite build` → `dist/` (MUST).
- Worker 스크립트(`main`)는 **`/api/*` 경로 처리에 한정**해 허용한다 (2026-07-14 개정 — 방문 분석 수집용).
  - 정적 자산이 존재하는 경로는 Worker를 거치지 않고 서빙되는 기본 동작을 유지해야 한다 (MUST) — 원 계약의 취지(정적 무료 서빙, 봇 비용 0)는 불변.
  - `run_worker_first` 사용 금지 (MUST).
  - Worker가 페이지 HTML을 생성/변조하는 것 금지 (MUST) — 렌더링은 여전히 100% 정적.
- 방문 분석(Contract 예외 승인 근거): [phase/03_analytics](../phase/03_analytics/00_options.md). 수집은 쿠키 없이, D1 무료 한도 내에서만 (MUST).

## 저장소

- 이 repo 하나가 포털의 전부다: 소스 + `doc/ssot/` 문서 + CI 워크플로.
- 기본 브랜치 `main`. `main` = production.
