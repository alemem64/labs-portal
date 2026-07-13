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
