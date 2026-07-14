# SEO 진단: 왜 검색에 안 나오는가

> 작성일: 2026-07-14
> 결론 먼저: **코드 문제가 아니다.** 페이지들이 구글 인덱스에 아예 없는 상태이며,
> 원인은 ① 수개월간의 402 다운타임 ② 신규 도메인 ③ 외부 링크가 전부 옛 주소인 것 3가지다.

---

## 1. 기술 SEO 실측 결과 — 전부 정상 ✅

| 항목 | 실측값 | 판정 |
|---|---|---|
| robots.txt | `Allow: /` + sitemap 선언, API만 차단 | ✅ |
| sitemap.xml | 200, 양쪽 사이트 모두 정상 도메인의 절대 URL | ✅ |
| meta robots | `index,follow,max-image-preview:large` | ✅ |
| canonical | 페이지별 정확한 자기 URL | ✅ |
| X-Robots-Tag 헤더 | 없음 (noindex 없음) | ✅ |
| OG/타이틀 | 완비 (07-14 디자인 복원 완료) | ✅ |
| Cloudflare Bot Fight Mode | 검증된 검색봇(Googlebot/Bingbot)은 차단 대상 아님 | ✅ |
| JSON-LD 구조화 데이터 | 없음 | ⚠️ 선택 개선 (인덱싱 차단 요인은 아님) |

## 2. 실제 문제 — 인덱스 부재의 3가지 원인

**실측**: 구글에서 `site:jzahnny.leapsignal.net` → **0건**. 랭킹 문제가 아니라 인덱스 자체가 없다.

1. **수개월의 402 응답**: Vercel 계정 Paused 기간 동안 Googlebot이 올 때마다 402 에러를 받았다. 구글은 지속 에러 페이지를 인덱스에서 제거하고, "죽은 사이트"로 분류해 재방문 주기를 크게 늦춘다. 사이트가 살아난 걸(07-13) 구글은 아직 모른다.
2. **noxionite는 도메인 자체가 신규**: `noxionite.leapsignal.net`은 07-13에 처음 생겼다. 구글이 알고 있는 건 옛 주소 `noxionite.vercel.app`(현재 402로 사망)뿐이며, 실제로 "noxionite" 검색 시 그 죽은 주소가 아직 인덱스에 남아 노출된다.
3. **외부 신호 부재**: "noxionite" 상단은 Product Hunt/리뷰 사이트들 — 도메인 권위가 높으니 자연스러운 결과. 문제는 그 페이지들의 링크가 전부 옛 vercel.app 주소를 가리켜 새 도메인으로 신호가 전달되지 않는 것. "jzahnny blog"는 인덱스 0건이니 나올 수가 없다.

## 3. 조치한 것 (2026-07-14)

- **Rate limit 규칙에 검증봇 예외 추가**: M1의 IP당 60req/10s 차단이 Googlebot의 크롤링 속도를 늦출 수 있어 `not cf.client.bot`(구글/빙 등 검증된 봇 제외) 조건 추가. 스팸봇 방어는 유지.
- **옛 주소 링크 일괄 교체**: 양쪽 repo의 README(4곳)·site.config 데모 링크(6~7곳)·Footer에서 `noxionite.vercel.app` → `noxionite.leapsignal.net`. GitHub README는 구글이 크롤링하는 백링크 소스이기도 하다.
- (07-13 기 조치) sitemap이 새 도메인 절대 URL로 생성되는 것, 전 페이지 200 응답 확인.

## 4. 사용자가 직접 해야 하는 것 — Search Console (가장 중요)

코드는 준비 끝. 이제 구글에게 "사이트 살아났다"고 알리는 단계이며 이건 계정 주인만 할 수 있다.

1. https://search.google.com/search-console 접속.
2. **속성 확인**: `leapsignal.net`을 **도메인(Domain) 속성**으로 등록했는지 확인 (DNS TXT 인증 방식). 도메인 속성이면 모든 서브도메인이 한 속성에 포함된다. URL 접두어 방식으로 `jzahnny.…`만 등록했다면 noxionite도 따로 추가.
3. **Sitemaps 메뉴**에서 제출:
   - `https://jzahnny.leapsignal.net/sitemap.xml`
   - `https://noxionite.leapsignal.net/sitemap.xml`
4. **URL 검사** 도구에 아래 URL을 하나씩 넣고 → "색인 생성 요청" 클릭 (하루 할당량 ~10개):
   - `https://jzahnny.leapsignal.net/` , `/ko`
   - 대표 포스트 2~3개
   - `https://noxionite.leapsignal.net/`
   - 이때 "페이지를 가져올 수 없음"이 뜨면 나에게 알려줄 것 (차단 이슈 재조사).
5. **기대 타임라인**: 색인 요청한 페이지는 보통 수일 내, 나머지는 sitemap 기준 수주에 걸쳐 재인덱싱. 402 이력 때문에 처음엔 느리다가 정상 응답이 누적되면 빨라진다.

## 5. 검색어별 현실적인 기대치

- **`site:jzahnny.leapsignal.net`**: 위 단계 후 가장 먼저 차는 지표. 이걸로 진행 상황을 확인하라.
- **"noxionite"**: Product Hunt 상단은 계속 유지될 가능성이 높다(그게 정상). 내 사이트를 그 아래라도 노출시키려면 — ① Product Hunt 제품 페이지의 웹사이트 링크를 새 주소로 수정(메이커 권한으로 가능), ② GitHub repo의 About 웹사이트 필드 갱신, ③ 옛 vercel.app 인덱스는 402 상태라 자연 탈락 대기 (Vercel 대시보드에서 프로젝트를 삭제하면 404가 되어 더 빨리 떨어짐 — 선택).
- **"jzahnny blog"**: 인덱싱 완료가 선행 조건. 이후엔 브랜드 검색량·백링크가 쌓이며 올라온다. YouTube 채널 소개란 링크(이미 있음)도 도움이 된다.

## 6. 선택적 다음 단계 (인덱싱과 별개인 품질 개선)

- **JSON-LD 구조화 데이터**: 포스트에 `Article`(제목/저자/날짜), 사이트에 `WebSite` 스키마 추가 → 리치 결과 자격. 원하면 구현해줄 것.
- **Bing Webmaster Tools / 네이버 서치어드바이저** 등록 (한국 독자라면 네이버 효과 큼).
- Product Hunt 런칭 페이지 링크 갱신 (위 5번).
