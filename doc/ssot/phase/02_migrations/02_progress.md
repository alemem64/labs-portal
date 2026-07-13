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

## 2026-07-13 — M1 착수: API 토큰 권한 부족으로 일시 중단 (BLOCKED)

- M1(봇 차단·캐시 규칙·rate limit)과 이후 DNS 전환은 Cloudflare **zone 권한**이 필요.
- 현재 토큰("Edit Cloudflare Workers" 템플릿)은 Workers 배포 권한만 있음 — `dns_records` 조회부터 Authentication error 확인.
- **사용자 조치 요청**: 기존 토큰 편집(또는 재발급)으로 아래 권한 추가, Zone Resources = `leapsignal.net`:
  - Zone → **DNS: Edit** (M2~ DNS 전환)
  - Zone → **Cache Rules: Edit** (M1)
  - Zone → **Zone WAF: Edit** (M1 rate limit)
  - Zone → **Bot Management: Edit** (M1 Bot Fight Mode)
  - Zone → **Zone Settings: Edit** (SSL Full strict 확인용)
- 토큰 값이 바뀌면 GitHub `alemem64/labs-portal`의 `CLOUDFLARE_API_TOKEN` secret도 갱신 필요 (기존 값 유지한 채 권한만 추가하는 "Edit" 방식이면 갱신 불필요).
