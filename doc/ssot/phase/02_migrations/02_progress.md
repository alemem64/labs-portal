# 이전 작업 진행 기록

> 단계 번호는 [01_migration_plan.md](01_migration_plan.md) §6 기준. 최신이 아래.

## 2026-07-13 — 착수 전 확정 사항 (사용자 답변)

- **noxionite 데모 주소**: `noxionite.leapsignal.net`으로 확정 (GitHub: https://github.com/alemem64/Noxionite).
- **2번 Vercel 계정 접근**: 당장 불필요 (한도 여유 있음). 필요 시 사용자가 인증 페이지에서 로그인해 주기로 함.
- **계획서 정정 — eclipse는 1번 계정이었음**: 실측 결과 `eclipse.leapsignal.net` → HTTP **402** (Vercel paused). 계획서의 "② 작동 중" 분류는 오류. → **긴급 그룹으로 상향** (M6을 앞당김).

## 2026-07-13 — 전 도메인 상태 실측 (M1 사전 점검)

| 도메인 | HTTP | 상태 |
|---|---|---|
| jzahnny.leapsignal.net | 402 | 중단 (Vercel ① paused) |
| ypjr.leapsignal.net | 402 | 중단 (〃) |
| eclipse.leapsignal.net | **402** | **중단 (〃) — 1번 계정 확정** |
| focusroyale.leapsignal.net | 307 | 정상 (Vercel ②, locale redirect) |
| noxionite.vercel.app | 402 | 중단 (〃) |

→ 중단 서비스는 4개 (blog, ypjr, eclipse, noxionite 데모). 실행 순서 조정: eclipse는 완전 정적이라 작업량이 가장 적으므로 **ypjr과 함께 최우선 복구**.

## 2026-07-13 — M1 완료 ✅ (공통 방어선 적용)

토큰 권한 보강(아래 항목) 후 재개, 전 항목 적용·검증 완료.

**적용한 규칙 (zone: leapsignal.net)**

| # | 규칙 | 내용 | 검증 |
|---|---|---|---|
| 1 | Cache Rule | GET & `/api` 제외 → 캐시 대상, Edge TTL **respect origin** (origin이 private/no-cache면 캐시 안 함 → 로그인 페이지 안전) | 동적 페이지: 캐시 안 됨 ✓ / 정적 자산: `cf-cache-status: HIT` ✓ |
| 2 | Rate Limit | 페이지성 경로(`/_next/` 및 확장자 있는 파일 제외) IP당 60req/10s 초과 시 10s 차단 | 규칙 생성 OK |
| 3 | Bot Fight Mode | `fight_mode: true` + JS detection + AI bots block + crawler protection | API로 활성 확인 ✓ |
| 4 | focusroyale 프록시 ON | 유일하게 살아있는 서비스를 오렌지 클라우드로 전환 — 위 규칙들이 실제 적용되기 시작 | cf-ray 확인, `/en` 200 + 타이틀 정상, 자산 edge HIT ✓. 문제 시 proxied=false로 즉시 롤백 가능 |

**추가 발견 (조치 필요할 수 있음)**

- 전 Vercel 서브도메인이 **DNS-only(회색 구름)** 상태였음 — 사고 당시 Cloudflare 방어선이 전무했던 원인. 이전(M2~) 시 Workers custom domain은 자동 프록시됨.
- `noxionite.leapsignal.net` CNAME이 이미 존재 (Vercel향, 402) — M5에서 Workers로 교체하면 됨.
- **미분류 서비스 2개 발견**: `nanomanana.leapsignal.net`, `yaeya.leapsignal.net` (Vercel향 CNAME, 현재 접속 불가 000). 이전 대상인지 사용자 확인 필요.
- ⚠️ **focusroyale-api.leapsignal.net(게임 API, EC2 직결)이 접속 불가(000)** — 이번 작업과 무관하게 원래 그런 상태(방화벽 IP 제한이면 정상일 수 있음). 게임이 라이브라면 확인 권장.
- SSL mode는 이미 Full(strict) ✓. 터널 엔드포인트 2개(-mac/-win)는 530(터널 다운, 개발용 추정)이라 BFM 영향 없음.

## 2026-07-13 — M2 완료 ✅ (eclipse + ypjr 복구, 사용자 확정 반영)

사용자 확정: nanomanana/yaeya는 미사용 서비스(이전 제외), focusroyale-api 000은 웹용 API로 사용자 인지 상태(조치 불요).

**eclipse.leapsignal.net — 복구 완료 (402 → 200)**
- `wrangler.jsonc`(assets=dist) + `main/public/_headers`(og-image immutable 캐시) 추가. 코드 무변경.
- 기존 Vercel CNAME 삭제(롤백값: `90733195fac0b419.vercel-dns-017.com`) → Worker custom domain 연결.
- 검증: `/` 200 + 타이틀 "Eclipse Voyager", `/privacy` cleanURL 200, og-image 캐시 헤더 ✓.
- GitHub Actions Deploy 추가 (secrets 등록, main push 자동 배포) — success 확인.
- ⚠️ **사고 및 회복**: eclipse repo에는 `.githooks/pre-push`가 있어 `main/` 하위 변경을 main에 push하면 **App Store/Play 업로드까지 자동 실행**된다. 첫 push에서 iOS 빌드가 발동됐고, 업로드 0%(준비) 단계에서 중단시킴 — 스토어에 올라간 것 없음, Android는 미시작. **이후 이 repo push는 항상 `SKIP_RELEASE=1 git push`** (앱 릴리스 의도가 있을 때만 생략).

**ypjr.leapsignal.net — 복구 완료 (402 → 200)**
- `next.config.ts`: `output: 'export'` + `images.unoptimized`(원본이 이미 R2라 체감 무손실).
- `app/api/og/route.ts`(cheerio) → `worker/index.js`(HTMLRewriter, 의존성 0)로 동일 JSON 계약 이식. `run_worker_first: ["/api/*"]`로 정적 경로는 무료 서빙 유지.
- 검증: 페이지 200 + 실제 타이틀, `/api/og` 프로덕션 동작(OG 태그 있는 페이지로 추출 확인), 에러 케이스 400 ✓.
- 참고: 대상 페이지(focusroyale `/ko/ypjr`)의 원본 HTML에 OG 태그가 없어 빈 값 반환 — **구 cheerio 버전과 동일한 결과**(파서 문제 아님). focusroyale 쪽 메타데이터 문제로 별도 기록.
- 기존 CNAME 롤백값: `24addebb0d279476.vercel-dns-017.com`.
- GitHub Actions Deploy 추가 — success 확인.

**CI 교훈**: `cloudflare/wrangler-action@v3` 기본 wrangler가 3.90이라 `wrangler.jsonc`를 못 읽음("Missing entry-point") → `wranglerVersion: "4.110.0"` 고정으로 해결. 새 repo에 워크플로 추가 시 필수.

**보안 메모**: ypjr git remote URL에 GitHub PAT(ghp_…)가 평문으로 박혀 있음 — `git remote set-url origin https://github.com/alemem64/ypjr.git` + credential helper 사용 권장. 해당 PAT 폐기 권장.

**남은 단계**: M4(personal-blog SSG 전환) → M5(noxionite) → M7(focus-royale/web) → M8(관찰·정리).

## 2026-07-13 — M4·M5 CI 파이프라인 완성 ✅ (4/4 green)

personal-blog·Noxionite 모두 **CI(lint/prettier) + Deploy(빌드→populateCache→wrangler) 전부 통과**. CI가 배포한 프로덕션 재검증: blog·noxionite 홈/ko/포스트 전부 200. 이제 push(또는 cron)만으로 자동 재빌드·배포된다.

CI에서만 터진 문제와 해결 (로컬은 npm/pnpm 혼합 설치라 통과했었음):
- pnpm 격리 레이아웃에서 OpenNext 번들이 `styled-jsx`/`ofetch`를 못 찾음 → `.npmrc`에 `node-linker=hoisted`.
- blog만 `ofetch`가 caret(^1.4.1→1.5.1)로 풀려 notion-client의 1.4.1과 중첩 분리 → 정확히 1.4.1 고정.
- tsconfig `moduleResolution: node`가 어댑터 서브패스 타입을 못 찾음 → ts-ignore + eslint ignore 처리.
- eslint가 `.open-next`/어댑터 타입까지 스캔해 CI에서 OOM → eslint ignores 추가.
- `git add -A`가 빌드 산출물(.open-next/.wrangler)을 커밋했던 것 → .gitignore + `git rm --cached`로 정리.
- 실수로 커밋한 산출물·prettier 불일치로 기존 Test 워크플로가 깨졌던 것도 함께 복구 (양 repo test 통과).

## 2026-07-13 — M4·M5 완료 ✅ (personal-blog + noxionite → Cloudflare Workers, $0)

**결과**: `jzahnny.leapsignal.net` 복구 (402 → 200, 697페이지 전체 SSG), `noxionite.leapsignal.net` 신규 서빙. 실측 검증: 홈/ko/전체태그/포스트/OG 이미지 200, 없는 slug 404.

**적용 방식** (플랜 개정 — 사전 계획 대비 달라진 점 포함):
- `output: 'export'`는 Pages Router i18n(en/ko)을 지원하지 않아 **OpenNext(무료 플랜) + 완전 SSG** 조합으로 진행. 전 페이지 프리렌더 + static-assets incremental cache(읽기 전용)라 런타임 재렌더 없음 → 무료 10ms CPU 한도 내. 비용 $0 유지.
- **핵심 발견**: 기존 getStaticPaths가 subpage를 제외하고 있어 대부분의 포스트(695/697)가 fallback:'blocking'(=ISR)으로만 서빙되고 있었음 — ISR Write 폭주의 실체. subpage 포함 전체 생성으로 수정.
- OG 이미지: edge runtime `/api/og`는 OpenNext가 거부 → **빌드 시 satori 사전 생성**(556장, Noto Sans KR, 디자인 동일). 빌드된 HTML에서 og 메타를 역추출하는 방식이라 PageHead 로직과 항상 일치.
- Workers 호환 조치: puppeteer 런타임 사슬 절단, `lqip-modern`(sharp) lazy import, `ofetch` workerd 엔트리 트레이싱 포함.
- Notion 429 대응: 생성 동시성 4→2, 재시도 env(10회/3s~30s) — CI에도 적용.
- CI: `opennextjs-cloudflare deploy`(populateCache 포함)로 배포. blog는 매시 cron 재빌드(구 revalidate 3600과 동일 신선도), noxionite는 6시간.

**미해결 1건 — 검색 API**: `/api/search-notion`이 Notion 비공식 검색 호출 시 400 (Node 로컬에서도 동일 → 이전과 무관). `NOTION_TOKEN_V2` 환경변수가 Vercel에만 있었던 것으로 추정. **사용자에게 토큰 요청 후** Cloudflare secret(`wrangler secret put NOTION_TOKEN_V2`) 등록 필요.

**남은 뒷정리**: 구 CNAME 롤백값 — jzahnny: `ddefc7dbd481d0d9.vercel-dns-017.com`, noxionite: `d462746f52867eb2.vercel-dns-017.com`.

**작업 사고 기록**: 진단 명령에 실수로 섞인 `git stash`가 personal-blog의 미커밋 변경(사용자 WIP 포함)을 stash로 밀어냄 → 즉시 `git stash pop`으로 전량 복구, 손실 없음. 이후 빌드는 처음부터 재실행해 오염 가능성 제거.

## 2026-07-13 — M1 중단 이력: API 토큰 권한 부족 (해결됨)

- M1(봇 차단·캐시 규칙·rate limit)과 이후 DNS 전환은 Cloudflare **zone 권한**이 필요.
- 현재 토큰("Edit Cloudflare Workers" 템플릿)은 Workers 배포 권한만 있음 — `dns_records` 조회부터 Authentication error 확인.
- **사용자 조치 요청**: 기존 토큰 편집(또는 재발급)으로 아래 권한 추가, Zone Resources = `leapsignal.net`:
  - Zone → **DNS: Edit** (M2~ DNS 전환)
  - Zone → **Cache Rules: Edit** (M1)
  - Zone → **Zone WAF: Edit** (M1 rate limit)
  - Zone → **Bot Management: Edit** (M1 Bot Fight Mode)
  - Zone → **Zone Settings: Edit** (SSL Full strict 확인용)
- 토큰 값이 바뀌면 GitHub `alemem64/labs-portal`의 `CLOUDFLARE_API_TOKEN` secret도 갱신 필요 (기존 값 유지한 채 권한만 추가하는 "Edit" 방식이면 갱신 불필요).
