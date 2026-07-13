# Contract 07 — CI/CD (GitHub Actions)

## 워크플로 2개 (MUST)

| 파일 | 트리거 | 하는 일 |
|---|---|---|
| `.github/workflows/ci.yml` | PR 생성·갱신 | `npm ci` → `npm run typecheck` → `npm run build` |
| `.github/workflows/deploy.yml` | `main` push | CI와 동일 검증 → `cloudflare/wrangler-action`으로 `wrangler deploy` |

- 배포는 **오직 `main` push**로만 일어난다. 수동 `wrangler deploy`는 로컬 긴급 상황에서만 (SHOULD).
- deploy 워크플로에는 `concurrency: deploy-production` — 동시 배포 방지 (MUST).
- Node 버전은 워크플로와 로컬 모두 22 LTS 계열로 맞춘다.

## GitHub 저장소 시크릿 (배포 전 1회 등록)

| 이름 | 값 |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Workers 배포 권한만 가진 스코프 토큰 (계정 전체 토큰 금지) |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 계정 ID |

- 시크릿을 코드·문서에 커밋 금지 (MUST).

## 파이프라인 불변 조건

- `typecheck`(`tsc --noEmit`) 실패 시 배포 금지 (MUST).
- 빌드 산출물은 CI 안에서 생성한다 — `dist/` 커밋 금지 (`.gitignore`) (MUST).
- 롤백: 문제가 된 커밋을 `git revert` 후 push → 자동 재배포. Cloudflare 대시보드의 이전 버전 롤백은 보조 수단.

## 초기 연결 절차 (1회)

1. GitHub에 repo 생성 후 이 저장소 push.
2. Cloudflare 대시보드에서 API 토큰 발급(Workers Scripts:Edit), 계정 ID 확인.
3. GitHub repo Settings → Secrets and variables → Actions에 위 2개 등록.
4. `main` push → Actions 성공 확인 → `*.workers.dev` URL 확인.
5. Cloudflare 대시보드에서 `leapsignal.net` 커스텀 도메인 연결.
