#!/usr/bin/env bash
# Contract 07: worker/schema.sql을 원격 D1에 적용한다. CI가 아닌 로컬에서 실행한다.
# 로컬 wrangler 로그인(`npx wrangler login`)을 사용한다.
set -euo pipefail

cd "$(dirname "$0")/.."

npx wrangler whoami
npx wrangler d1 execute DB --remote --file worker/schema.sql
