# Contract 02 — 데이터 스키마

## 단일 소스

- 카드/링크 데이터는 `src/data/services.ts` **한 파일에만** 존재한다 (MUST).
- 링크 추가·수정·삭제·순서 변경은 이 파일 수정으로만 이루어진다.
- 배열 순서 = 화면 노출 순서 (MUST).

## 스키마

```ts
// Locale 타입은 05_i18n.md가 관할하며 src/i18n/locales.ts에서 import한다.
export type LocalizedText = Record<Locale, string>;   // { ko, en } 모두 필수

export type ServiceCard = {
  card_id: string;              // 해시 딥링크 키. 소문자 영숫자와 하이픈만. 전역 유일
  title: LocalizedText;
  desc: LocalizedText;
  link: string;                 // 절대 URL
  thumbnail:
    | { type: "image"; src: string }                  // /thumbs/{card_id}.*
    | { type: "video"; src: string; poster: string }; // video는 poster 필수
};
```

- `card_id` 중복은 모듈 로드 시 런타임 assert로 차단한다 (MUST) — 빌드가 실패한다.
- video 썸네일에 poster 누락은 타입으로 차단한다 (union 강제).

## 초기 데이터 (노출 순서 고정)

| # | card_id | link |
|---|---|---|
| 1 | `ypjr` | https://ypjr.leapsignal.net |
| 2 | `jzahnny` | https://jzahnny.leapsignal.net |
| 3 | `eclipse` | https://eclipse.leapsignal.net/ |
| 4 | `focusroyale` | https://focusroyale.leapsignal.net |

## 파생 데이터

- `index.html`의 `<noscript>` 링크 목록은 **빌드 시** vite 플러그인이 `services.ts`에서 생성한다 (MUST). 수동 복사 금지 — 단일 소스 원칙 유지 장치다.
- 썸네일 파일은 `public/thumbs/`에 두고 파일명은 `{card_id}.*`로 맞춘다 (SHOULD).
