# Contract 00 — 개요와 운영 규칙

> 이 폴더(`doc/ssot/contract/`)는 leapsignal.net 포털의 **기능별 계약(SSOT)** 이다.
> 코드와 계약이 어긋나면 **계약이 정답**이다. 동작을 바꾸려면 계약을 먼저 수정하고 코드를 따라가게 한다.

## 문서 지도

| 파일 | 관할 영역 |
|---|---|
| [01_stack.md](01_stack.md) | 프레임워크, 의존성, 빌드, 배포 대상 |
| [02_data.md](02_data.md) | 카드/링크 데이터 스키마와 단일 소스 규칙 |
| [03_design_tokens.md](03_design_tokens.md) | 디자인 토큰, z-index, 스타일 값 관할 규칙 |
| [04_interaction.md](04_interaction.md) | 카드 상태, 반응형 동작, 인트로 시퀀스, 해시 딥링크 |
| [05_i18n.md](05_i18n.md) | 한국어/영어 locale 규칙 |
| [06_performance.md](06_performance.md) | 로딩 단계, 성능 예산, lazy 규칙 |
| [07_ci_cd.md](07_ci_cd.md) | GitHub Actions, 배포 파이프라인, 시크릿 |

## 용어

- **MUST**: 위반 시 버그로 취급한다.
- **SHOULD**: 예외가 필요하면 해당 계약 문서에 예외 사유를 기록한 뒤에만 허용한다.

## 변경 절차

1. 계약 문서를 먼저 수정한다 (같은 커밋 내 선행 diff 포함 가능).
2. 코드를 계약에 맞춘다.
3. PRD([../phase/00_start/02_prd.md](../phase/00_start/02_prd.md))와 충돌이 생기면 PRD를 갱신한다. 계약 > PRD 순으로 우선한다.
