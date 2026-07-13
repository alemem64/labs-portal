# Phase 02 — Vercel 사용량 초과로 인한 전 서비스 이전

> 작성일: 2026-07-13

## 상황

Vercel 계정(1번 계정)이 personal_blog 사용량 폭주로 **Paused** 상태가 되어, 같은 계정의 모든 서비스(personal_blog, noxionite, ypjr)가 중단됨.

측정된 사용량 (한도 대비):

| 항목 | 사용량 | 무료 한도 |
|---|---:|---:|
| ISR Writes | **2.1M** | 200K |
| Fast Origin Transfer | **30.1 GB** | 10 GB |
| Fluid Active CPU | **5h 12m** | 4h |
| ISR Reads | 867K | 1M |
| Image Optimization Transformations | 1.6K | 5K |

## 요구사항

1. 돈을 내고 다음 달을 기다리는 선택지는 없음 — 즉시 이전으로 해결.
2. 각 서비스 기능에 따라 **요금이 거의 안 나가면서, 손대지 않아도 안정적으로 유지**되는 배포 구조.
3. **현 구조를 크게 바꾸지 않고**, 동일 주소 접속 시 동일 기능 유지.
4. 서비스 현황:
   - 1번 Vercel 계정(중단됨): personal_blog(jzahnny.leapsignal.net), noxionite, ypjr(ypjr.leapsignal.net)
   - 2번 Vercel 계정(작동 중): focus-royale/web(focusroyale.leapsignal.net), eclipse(eclipse.leapsignal.net)
   - personal_blog은 noxionite 코드를 그대로 쓰되 데이터/Notion DB 주소만 다름.

## 산출물

[01_migration_plan.md](01_migration_plan.md) — 서비스별 분석과 이전 계획. 사용자 승인 후 실행.
