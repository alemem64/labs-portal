# leapsignal.net 방문 분석 — 선택지 비교와 결론

> 작성일: 2026-07-14
> 요구사항: ① 유입 경로(referrer/UTM)별 방문 수 ② 페이지 체류시간에 따른 카드 클릭 행동(시간 경과별 card_id 클릭 수) ③ **CSV로 저장** ④ 무료 ⑤ 유지보수 없음
> 상태: 검토 완료, 사용자 결정 대기

---

## 0. 핵심 판단 기준

요구 ②(체류시간 + 카드별 클릭)는 **커스텀 이벤트**(card_id, 로드 후 경과 ms 같은 속성 포함)가 필요하다. 이 기준에서 대부분의 "무료 웹 애널리틱스"가 탈락하거나 반쪽이 된다. 요구 ③(CSV)은 "대시보드에서 보기"와 "원본 데이터 소유"를 가르는 기준이다.

## 1. 선택지 비교

### A. Cloudflare Web Analytics (무료 beacon)
- **장점**: 스크립트 1줄, 쿠키 없음, 무료 무제한, 우리 스택과 동일 콘솔.
- **단점**: **커스텀 이벤트 없음 → 카드 클릭·체류시간 추적 불가.** CSV 내보내기도 대시보드 캡처 수준. 요구사항 ②③ 미충족.
- **판정**: 단독으로는 탈락. (보조용으론 공짜라 켜두면 손해 없음)

### B. Google Analytics 4
- **장점**: 커스텀 이벤트+파라미터 완전 지원, referrer/UTM 자동 수집, BigQuery 무료 export로 SQL→CSV 가능. 업계 표준.
- **단점**: ① 애드블록/브라우저 보호에 **20~40% 수치 유실** (기술 사용자층일수록 심함 — 이 포털의 방문자 성향과 최악의 궁합) ② 쿠키·동의 배너 이슈 ③ 스크립트 ~60KB(포털 초기 JS의 절반 크기) ④ CSV까지 가려면 GA4→BigQuery 연동 설정 등 배보다 배꼽 ⑤ 구글 UI 학습 비용.
- **판정**: 요구는 채우지만 "가볍고 CSV로 그냥 저장"과 정반대 방향.

### C. 서드파티 경량 SaaS (Umami Cloud / GoatCounter 등)
- **장점**: 가볍고 프라이버시 친화, 설치 간단. Umami는 커스텀 이벤트 지원.
- **단점**: 무료 티어 이벤트 한도(Umami Cloud 월 10만)·보존 기간 제한, CSV export가 유료이거나 제한적, **또 하나의 외부 서비스 의존**(이번에 Vercel에서 겪은 것). self-host는 서버가 필요해 우리 "$0·무관리" 원칙 위배.
- **판정**: 차선. 데이터 소유권이 남의 손.

### D. 자체 수집 — 포털 Worker + **D1**(SQLite) ← **추천**
방식: 포털 페이지에 ~40줄 바닐라 JS 추가 → 로드 시 pageview 이벤트(referrer, UTM, 화면 크기), 카드 클릭 시 `navigator.sendBeacon('/api/collect', {card_id, elapsed_ms})` → 같은 도메인의 Worker가 D1 테이블에 INSERT.

- **장점**:
  - 요구사항에 정확히 맞는 스키마: `ts, event(pageview|card_click), card_id, elapsed_ms, referrer, utm_source, lang, viewport` — "체류 N초 구간별 카드 클릭 수" 같은 질문이 SQL 한 줄.
  - **CSV가 1급 시민**: `wrangler d1 export` 또는 SQL 쿼리 → CSV. GitHub Actions 월간 cron으로 repo나 R2에 CSV 자동 적재 가능.
  - **first-party 수집이라 애드블록에 거의 안 막힘** (자기 도메인 `/api/collect`는 차단 리스트에 없음) → 수치가 가장 정확.
  - 무료 한도가 압도적 여유: D1 무료 = 일 10만 write / 500만 read / 5GB 저장. 카드 클릭 이벤트(행당 ~200B)로 5GB면 **수천만 건**. 보존 무제한.
  - 쿠키 없음(동의 배너 불필요), 추가 스크립트 ~1KB.
- **단점**:
  - 구현이 필요하다(Worker + 스크립트 + 스키마, 반나절).
  - 기본 대시보드가 없다 — 대신 CSV/SQL이 원본이므로 원하는 도구(스프레드시트, 파이썬)로 본다. 필요 시 간단 통계 페이지는 나중에 추가 가능.
  - **labs-portal 계약 개정 필요**: `contract/01_stack.md`가 "Worker 스크립트 추가 금지"를 명시. 개정안 — "정적 경로의 무료 서빙을 침해하지 않는 `/api/*` 한정 Worker 허용" (assets 우선 서빙이라 정적 요청은 여전히 worker를 타지 않음 → 원 계약의 취지 유지).
- **비용**: $0 (무료 한도 내), 유지보수 0 (스키마 고정 후 손댈 일 없음).

### D′. 변형 — Workers Analytics Engine
D와 같은 수집 구조인데 저장소만 Analytics Engine(시계열 특화). SQL API가 내장돼 시계열 집계가 편하지만 **보존 90일 제한** + 무료 플랜 write 한도가 D1보다 빡빡. "CSV로 영구 저장" 요구에는 D1이 우위. 탈락.

## 2. 비교표

| | A. CF Web Analytics | B. GA4 | C. Umami 등 | **D. Worker+D1 (추천)** |
|---|---|---|---|---|
| 유입 경로 수치 | ○ | ○ | ○ | ○ |
| 카드 클릭 (커스텀 이벤트) | ✗ | ○ | △(한도) | ○ |
| 체류시간→클릭 분석 | ✗ | △(가공 필요) | △ | ◎ (elapsed_ms 원본) |
| CSV 저장 | ✗ | △(BigQuery 경유) | △ | ◎ (export/cron 자동화) |
| 애드블록 영향 | 중 | **큼** | 중 | **거의 없음** |
| 데이터 소유 | CF | Google | SaaS | **본인 (D1+CSV)** |
| 추가 무게 | ~5KB | ~60KB | ~2KB | **~1KB** |
| 비용/관리 | 0/0 | 0/중 | 0/저 | **0/0 (구현 반나절)** |

## 3. 최종 조언

**D안(포털 Worker + D1 + 월간 CSV 자동 덤프)을 추천한다.** 이유:
1. 세 요구(경로·체류시간별 클릭·CSV)를 유일하게 전부 원형 그대로 충족한다.
2. 이미 쓰는 Cloudflare 안에서 끝나 새 계정·새 의존성이 없고, 이번 이전에서 배운 교훈(외부 서비스 의존 최소화, 데이터 소유)과 일치한다.
3. first-party 수집이라 수치 정확도가 가장 높다 — 방문자가 개발자 성향일수록 GA4와의 격차가 커진다.

구현 범위(승인 시):
- [ ] `contract/01_stack.md` 개정: `/api/*` 한정 Worker 허용 (정적 무료 서빙 불변 조건 명시)
- [ ] D1 스키마: `events(ts, event, card_id, elapsed_ms, referrer, utm_source, utm_medium, lang, viewport_w, session_id?)` — session_id는 쿠키 없이 메모리 내 난수(새로고침마다 새로) 수준으로
- [ ] 포털 `index.html`/main.tsx에 수집 스니펫 (~40줄, sendBeacon, 실패 무시)
- [ ] Worker `/api/collect`: 검증(온 도메인·필드 화이트리스트·행 크기 제한) 후 INSERT, 봇 UA 스킵
- [ ] GitHub Actions 월간 cron: D1 → CSV → repo `analytics/` 커밋 (또는 R2)
- [ ] 검수: 실기기 클릭 → D1 행 확인 → CSV 덤프 확인
