# 서비스별 이전 분석 & 계획

> 작성일: 2026-07-13
> 상태: **승인 대기** — 승인 시 §6 순서대로 실행
> 근거 문서: [00_start/01_platform_guide.md](../00_start/01_platform_guide.md) (이하 "가이드")
> 분석 방법: `code/project/` 하위 5개 프로젝트의 실제 소스를 직접 읽고 확인함

---

## 0. 결론 요약

| 서비스 | 현재 | 이전 목표 | 코드 변경 | 월비용 | 우선순위 |
|---|---|---|---|---|---|
| personal-blog (jzahnny.leapsignal.net) | Vercel ① **중단** | Cloudflare Workers + OpenNext (ISR 유지) | 어댑터 설정 추가 수준 | $5 (계정 공통) | **1 (긴급)** |
| ypjr (ypjr.leapsignal.net) | Vercel ① **중단** | Cloudflare 정적 자산 + 초소형 Worker (`/api/og`) | route.ts 1개 이동 | $0 | **2 (긴급)** |
| noxionite (noxionite.vercel.app) | Vercel ① **중단** | personal-blog과 동일 방식, workers.dev 도메인 | 동일 | $0 추가 | 3 |
| eclipse (eclipse.leapsignal.net) | Vercel ② 작동 중 | Cloudflare 정적 자산 (완전 정적) | 0 | $0 | 4 |
| focus-royale/web (focusroyale.leapsignal.net) | Vercel ② 작동 중 | Cloudflare Workers + OpenNext | 어댑터 설정 추가 수준 | $5에 포함 | 5 |

- 총 고정비: **Cloudflare Workers Paid $5/월** 하나. 나머지는 전부 무료 범위.
- 모든 도메인 주소 불변 (단, noxionite는 `*.vercel.app` 도메인이라 이전 시 `*.workers.dev`로 변경 불가피 — §4.3).
- Vercel ① 계정은 이전 완료 후 프로젝트 정리, ② 계정은 5번까지 끝난 뒤 정리.

---

## 1. 사고 원인 진단 — 코드에서 확인한 사실

가이드 1장의 가설을 실제 코드로 확인했다. **personal-blog(=noxionite 코드)의 구조적 특성 3가지가 봇 트래픽과 결합해 폭주**했다.

### 1.1 ISR Writes 2.1M의 직접 원인: `fallback: 'blocking'` + 무한한 URL 공간

```
pages/post/[...slug].tsx:97   fallback: 'blocking'
pages/category/[slug].tsx:116 fallback: 'blocking'
pages/tag/[tag].tsx:64        fallback: 'blocking'
```

`fallback: 'blocking'`은 **빌드에 없던 어떤 URL이든** 요청이 오면 서버가 그 자리에서 페이지를 생성하고 **ISR 캐시에 기록(=ISR Write)** 한다. `post/[...slug]`는 catch-all이라 URL 공간이 무한하다. 봇이 존재하지 않는 slug·tag·category 조합을 수십만 개 긁으면 **그 하나하나가 전부 ISR Write**가 된다. 여기에 `revalidate: 3600`(site.config.ts:315)으로 기존 페이지들도 매시간 재생성 Write를 더한다. 200K 한도에서 2.1M이 나온 메커니즘이 정확히 이것이다.

### 1.2 Fluid CPU 5h 12m: 요청마다 도는 Notion 렌더링 + Chromium

- 페이지 생성마다 Notion API 호출 + react-notion-x 렌더링이 서버 CPU를 사용 — 1.1의 대량 생성이 곧 대량 CPU.
- `chrome-aws-lambda`, `@sparticuz/chromium` 의존성 확인 (`lib/og-images-manager.ts`, `pages/api/generate-social-image.ts`) — **서버리스 함수 안에서 Chromium 브라우저를 띄워** 소셜 이미지를 만든다. 호출당 CPU 소모가 매우 크다.

### 1.3 Fast Origin Transfer 30GB: 캐시 방어선 없이 원본이 직접 서빙

동적 생성된 HTML과 이미지가 CDN 캐시 히트 없이 Vercel 원본에서 반복 전송됨. 가이드 1.3절의 "비용이 발생하는 요청 앞에 방어선이 없었다" 그대로다.

### 1.4 구조적 교훈

한 계정의 사용량 풀을 3개 서비스가 공유해 blog 하나의 폭주가 ypjr(사실상 정적인 사이트)까지 중단시켰다 — 가이드 1.4절. 이전 후에는 **정적 요청에 과금 자체가 없는 구조**(Cloudflare 정적 자산)로 가므로 이 유형의 연쇄 중단이 원리적으로 불가능해진다.

---

## 2. 서비스 관계 정리 (noxionite ↔ personal-blog)

코드를 diff한 결과로 관계를 확정한다:

- **noxionite** = 블로그 "엔진"의 원본(upstream) 저장소. `github.com/alemem64/Noxionite`. 데모가 noxionite.vercel.app에 배포됨.
- **personal-blog** = noxionite를 fork한 "인스턴스". git remote로 upstream(Noxionite)을 두고 코드를 당겨 쓰며, 실질 차이는 `site.config.ts`(도메인 jzahnny.leapsignal.net, Notion root page ID, 저자 정보)와 소수 파일의 소폭 수정뿐.
- 의존성 목록, 페이지 구조, ISR 설정 완전 동일 (`package.json` name조차 둘 다 `noxionite`).

**따라서 이전 작업은 한 번 설계해서 두 저장소에 같은 방식으로 적용한다.** 엔진(upstream)에 어댑터를 넣고 personal-blog이 pull 받는 흐름이 이상적이다.

---

## 3. 이전 대상 플랫폼 결정

가이드 14장의 결론(Cloudflare Workers Paid + Static Assets + 필요시 Cloud Run)을 그대로 따른다. 이번 5개 서비스에는 DB·Docker가 없으므로 Cloud Run·Neon은 불필요하고, **Cloudflare 하나로 전부 해결된다**:

- 정적인 것(ypjr, eclipse, 이미 완료된 labs-portal) → **Workers Static Assets** (무료·무제한)
- Next.js SSR/ISR(blog 계열, focus-royale/web) → **Workers + OpenNext** (Workers Paid $5)
- focusroyale-api는 이미 자체 서버(nginx + Let's Encrypt, focusroyale-api.leapsignal.net)로 별도 운영 중 — **이번 이전과 무관, 손대지 않음**.

Workers Paid($5/월)가 필요한 이유: 무료 플랜은 요청당 CPU 10ms 제한이라 Notion 페이지 SSR이 걸릴 수 있다(가이드 §3-A). $5에 월 1,000만 동적 요청 + 30M CPU-ms가 포함되고 **계정 전체가 공유**하므로 blog·noxionite·focus-royale/web이 모두 이 하나로 커버된다.

---

## 4. 서비스별 상세 분석과 이전 방법

### 4.1 personal-blog — jzahnny.leapsignal.net 【우선순위 1, 긴급】

**코드 분석 요약**
- Next.js **15.5.9**, Pages Router, `next.config.mjs`에 i18n(next-i18next) 설정.
- 렌더링: 전 페이지 ISR(`revalidate 3600`, `fallback: 'blocking'`).
- 동적 API 4개: `search-notion`(Notion 검색 프록시), `og.tsx`(`next/og` ImageResponse — satori 기반), `generate-social-image.ts`(**Chromium 구동**), `manifest.ts`.
- 데이터: Notion 비공식 API(`notion-client`), 환경변수 `NOTION_TOKEN_V2`. Redis 캐시는 옵션이며 현재 비활성(`isRedisEnabled` 기본 false).

**이전 방법: `@opennextjs/cloudflare` 어댑터로 Workers에 배포 (구조 무변경)**

1. `@opennextjs/cloudflare` devDependency 추가 + `open-next.config.ts` 생성.
2. **ISR 캐시를 R2에 연결** (OpenNext incremental cache) — Vercel의 ISR와 동일 동작, R2 무료 범위(10GB)로 충분.
3. `wrangler.jsonc` 작성 (worker + assets + R2 바인딩), `NOTION_TOKEN_V2`는 Cloudflare secret으로 등록.
4. GitHub Actions로 main push 자동 배포 (labs-portal과 동일 패턴).
5. DNS: `jzahnny.leapsignal.net` CNAME을 Vercel → Worker custom domain으로 전환.

**폭주 재발 방지 (이전의 핵심 — 같은 구조로 옮기기만 하면 요금 주체만 바뀐다)**

| 방어선 | 설정 |
|---|---|
| HTML edge 캐시 | Cloudflare Cache Rule: 공개 GET HTML `s-maxage=3600, stale-while-revalidate=86400` (가이드 9.2) — 봇 반복 요청이 Worker에 도달하지 않음 |
| 봇 차단 | Bot Fight Mode + 검증된 검색봇만 통과 (가이드 9.3) |
| Rate limit | 경로별(특히 `/api/*`, 존재하지 않는 slug 패턴) IP당 제한 |
| 무한 URL 공간 축소 | `post/[...slug]`의 `fallback`을 `'blocking'` 유지하되, 유효하지 않은 slug는 `notFound: true` + 짧은 캐시로 반환되는지 확인. 필요시 사이트맵에 있는 slug만 허용하는 가드 1개 추가 (소규모 코드 수정, 선택) |
| Chromium 제거 | `generate-social-image`는 Workers에서 실행 불가. 사용처를 확인해 비활성화하거나 빌드 시 사전 생성으로 대체 (CPU 폭주의 주범이므로 오히려 제거가 목적에 부합) |

**검증 필요 항목 (작업 중 확인, 실패 시 플랜 B)**
- OpenNext Cloudflare에서 Pages Router + `i18n` 설정 동작 (공식 지원 목록에 있으나 `workerd` preview에서 실측 — 가이드 9.4)
- `next/og` ImageResponse의 Workers 호환성 — 안 되면 OG 이미지를 빌드 시 생성해 정적 서빙

**플랜 B (OpenNext가 막힐 경우): 완전 SSG + 주기 재빌드**
- `fallback: false` + revalidate 제거 → `next build`가 전 페이지를 정적 생성 → Workers Static Assets($0).
- GitHub Actions cron(1시간)으로 재빌드 — 현재 `revalidate: 3600`과 콘텐츠 신선도가 **동일**하다.
- 검색 API만 초소형 Worker로 유지. 구조 변경이 조금 더 크지만 비용은 $0.

### 4.2 ypjr — ypjr.leapsignal.net 【우선순위 2, 긴급】

**코드 분석 요약**
- Next.js App Router, 페이지 전체가 `'use client'` (서버 렌더링 의존 없음).
- 이미지: **이미 Cloudflare R2 public 버킷** (`pub-….r2.dev`)에서 서빙 — 다만 `next/image`를 거치며 Vercel 이미지 최적화를 사용 중.
- 서버 코드는 단 하나: `/api/og` — **고정된 URL**(`focusroyale.leapsignal.net/ko/ypjr`)의 OG 메타태그를 cheerio로 파싱해 JSON 반환 (CORS 우회용 프록시, `revalidate 3600`).

**이전 방법: 정적 export + `/api/og`만 초소형 Worker로 이동**

1. `next.config.ts`에 `output: 'export'`, `images.unoptimized: true` 추가 → 빌드 결과가 100% 정적 파일. (이미지 원본이 R2라 최적화 제거해도 전송비 0, 화질 동일)
2. `app/api/og/route.ts`를 삭제하고 **동일 로직을 Worker 스크립트(~50줄)로 재작성** — 같은 경로 `/api/og`, 같은 JSON 포맷이므로 페이지 코드는 한 줄도 안 바뀐다. Worker에 `Cache-Control` 1시간 캐시 적용.
3. Workers Static Assets(assets + worker) 배포, `/api/*`만 worker로 라우팅 (`run_worker_first: ["/api/*"]` — 정적 파일은 여전히 무료 경로).
4. GitHub Actions 자동 배포 + DNS 전환.

비용: $0 (무료 플랜 Worker 10만 req/일이면 OG 프록시 하나에 차고 넘침). 소요: 서비스 중 가장 빨리 복구 가능.

### 4.3 noxionite — 데모 사이트 【우선순위 3】

- personal-blog §4.1과 **완전히 같은 작업**을 upstream 저장소에 적용. 사실 순서상으로는 **엔진인 noxionite에 어댑터를 먼저 넣고, personal-blog이 upstream pull로 받는 것**이 코드 관리상 맞다 — 단, 서비스 복구 긴급도는 personal-blog이 높으므로 실행은 personal-blog 먼저, 완료 후 동일 diff를 noxionite에 반영.
- **주소 변경 불가피**: `noxionite.vercel.app`은 Vercel 소유 도메인이라 가져올 수 없다. → `noxionite.<account>.workers.dev` 무료 도메인으로 배포하고, README·포트폴리오의 데모 링크를 갱신한다. (원하면 `noxionite.leapsignal.net` 서브도메인 부여도 가능 — 승인 시 선택)

### 4.4 eclipse — eclipse.leapsignal.net 【우선순위 4, 현재 작동 중】

**코드 분석 요약**
- Capacitor 기반 앱의 **웹 빌드 산출물(`dist/`)을 그대로 서빙하는 완전 정적 사이트**. `vercel.json`은 buildCommand, `cleanUrls`, og-image 캐시 헤더 정도.
- 서버 코드 0줄. 이전 대상 중 가장 단순.

**이전 방법: Workers Static Assets**
1. `wrangler.jsonc` (assets = `dist`) 추가. `cleanUrls`는 Workers assets의 `html_handling: "drop-trailing-slash"` 옵션으로, 캐시 헤더는 `public/_headers` 파일로 대체.
2. GitHub Actions 배포 + DNS 전환. 비용 $0.
- 2번 Vercel 계정에서 작동 중이므로 긴급하지 않지만, 작업량이 30분 수준이라 4순위로 함께 처리해 계정 의존을 없앤다.

### 4.5 focus-royale/web — focusroyale.leapsignal.net 【우선순위 5, 현재 작동 중】

**코드 분석 요약**
- Next.js App Router. `[locale]` 다국어 라우팅, admin 대시보드, 로그인/OAuth, redeem, preregister 등 **실사용 동적 기능 다수**.
- `/api/*` 라우트가 많지만 대부분 자체 백엔드(`focusroyale-api.leapsignal.net`, VPS의 FastAPI+nginx)로의 **프록시** — 무거운 연산은 백엔드에 있고 web은 중계 역할.

**이전 방법: Workers + OpenNext (blog에서 검증된 방식 재사용)**
- blog 이전에서 OpenNext 노하우가 확보된 뒤 진행하는 것이 안전하다. App Router는 OpenNext 지원이 가장 성숙한 경로다.
- API 프록시는 Workers에서 단순 fetch 중계라 CPU 소모 미미 — $5 요금제 풀 안에서 여유.
- 이전 전 임시 방어(지금 즉시 가능): `focusroyale.leapsignal.net`은 이미 Cloudflare DNS 존 안에 있으므로 **proxy ON + 공개 HTML cache rule + Bot Fight Mode**만 켜도 2번 계정의 사용량 폭주 위험을 크게 줄일 수 있다.

---

## 5. 비용 요약

| 항목 | 월비용 | 비고 |
|---|---:|---|
| Cloudflare Workers Paid | $5 | 계정 공통. blog + noxionite + focus-royale/web의 SSR/ISR 커버 |
| 정적 자산 (ypjr, eclipse, labs-portal) | $0 | 무료·무제한 |
| R2 (ISR 캐시 + 기존 ypjr 이미지) | $0 | 무료 범위(10GB/월) 내 |
| Vercel ①·② | $0 | 이전 완료 후 프로젝트 정리 |
| **합계** | **$5/월** | 가이드 11장의 "매우 낮은 트래픽" 추정과 일치 |

---

## 6. 실행 순서

| 단계 | 작업 | 예상 소요 | 완료 기준 |
|---|---|---|---|
| M1 | 공통 방어선: leapsignal.net 존에 Bot Fight Mode, 공개 HTML cache rule, rate limit (focusroyale 포함 즉시 효과) | 짧음 | Cloudflare 규칙 활성 |
| M2 | **ypjr 이전** (§4.2) — export 전환 + og Worker + 배포 + DNS | 반나절 내 | ypjr.leapsignal.net 복구, 기능 동일 |
| M3 | Workers Paid 구독 ($5) | 즉시 | 계정 플랜 전환 |
| M4 | **personal-blog 이전** (§4.1) — OpenNext + R2 + workerd preview 검증 + 배포 + DNS | 반나절~1일 | jzahnny.leapsignal.net 복구, 글/검색/OG 동작 |
| M5 | noxionite에 동일 적용, workers.dev 배포, 데모 링크 갱신 | 짧음 | 데모 접속 가능 |
| M6 | eclipse 이전 (§4.4) + DNS | 짧음 | eclipse.leapsignal.net Cloudflare 서빙 |
| M7 | focus-royale/web OpenNext 이전 (§4.5) + DNS | 1일 | 전 기능 동일 동작 |
| M8 | 72시간 관찰(가이드 12-5단계) 후 Vercel ①·② 프로젝트 정리, `service-catalog` 문서 갱신 | - | Vercel 의존 0 |

각 DNS 전환은 서비스별 개별 진행, 문제 시 CNAME 되돌리기만으로 즉시 롤백(가이드 12장).

---

## 7. 리스크와 대응

| 리스크 | 가능성 | 대응 |
|---|---|---|
| OpenNext에서 Pages Router i18n 또는 `next/og` 미동작 | 중 | M4에서 workerd preview로 먼저 실측. 실패 시 §4.1 플랜 B(완전 SSG + cron 재빌드, $0)로 전환 — 사용자 체감 동일 |
| Notion 비공식 API(`NOTION_TOKEN_V2`) 만료/차단 | 낮음(기존과 동일 조건) | 이전과 무관한 기존 리스크. secret 갱신 절차만 문서화 |
| `generate-social-image`(Chromium) 기능 상실 | 확정 | 사용처 확인 후: 미사용이면 제거, 사용 중이면 빌드 타임 사전 생성으로 대체 |
| workers.dev로 바뀌는 noxionite 데모 링크 | 확정 | 외부에 박힌 링크 목록 확인 후 갱신. 필요시 noxionite.leapsignal.net 부여 |
| focus-royale/web의 OAuth 콜백 URL | 중 | 도메인이 동일하므로 원칙적으로 무변경. 배포 후 로그인 플로우 실측 |

---

## 8. 승인 시 확인해 줄 것 3가지

1. **noxionite 데모 주소**: `noxionite.<account>.workers.dev`로 갈지, `noxionite.leapsignal.net`을 새로 팔지.
2. **Workers Paid $5/월 구독** 진행 동의 (M3).
3. **focus-royale/web과 eclipse의 2번 Vercel 계정 접근** — DNS 전환만으로 이전 가능하므로 계정 접근 없이도 진행 가능하지만, 기존 환경변수(`web/.env.prod` 수준인지) 확인과 프로젝트 정리에는 필요. 없으면 M8에서 직접 정리해 주면 됨.
