# Contract 06 — 성능·로딩 단계

핵심 원칙: **어느 단계에서 로딩이 멈춰도 빈 화면은 없다.**

## 로딩 단계 (MUST)

| 단계 | 시점 | 보이는 것 | 수단 |
|---|---|---|---|
| 0 | HTML 도착 즉시 | 어두운 배경 + 역석양 그라디언트 + 로고 | `index.html` 인라인 critical CSS + 정적 부트 로고 마크업. 외부 요청 의존 금지 |
| 1 | JS 번들 로드 | 카드 목록 | 카드 데이터는 번들 내장(`services.ts`) — 추가 fetch 금지 |
| 2 | 이미지 로드 | 썸네일 + 배경 backdrop | 첫 카드만 eager+`fetchpriority=high`, 나머지 `loading="lazy"` |
| 3 | 브라우저 유휴 | Lightfall | `React.lazy` + `requestIdleCallback`(폴백 setTimeout). 실패해도 사이트 정상 |

## 고정 규칙

- Lightfall(WebGL) 코드는 초기 번들에 포함 금지 — 별도 청크 (MUST).
- video 썸네일: `preload="none"` + poster 필수, 활성 상태에서만 `play()` (MUST).
- 폰트: `display=swap` — 로딩 전 폴백 폰트로 로고 즉시 표시 (MUST).
- 배경 backdrop은 카드 썸네일 파일 재사용 — blur되므로 고해상도 불필요 (MUST).
- `<noscript>`에 플레인 링크 목록 제공 (02_data.md의 빌드 생성 방식) (MUST).

## 예산 (SHOULD)

- 초기 JS(gzip, lightfall 청크 제외) < 150KB
- 썸네일 1장 ≤ 60KB (실사 이미지는 WebP 512×512 기준)
- Lighthouse 모바일: LCP < 2.5s, CLS < 0.1
