// Contract 05: Locale 타입의 유일한 정의 위치.
export type Locale = "ko" | "en";
export type LocalizedText = Record<Locale, string>;

export const messages = {
  ko: {
    open: "바로가기",
    switchLang: "English",
    switchLangAria: "언어 선택 열기",
    languageMenuAria: "언어 선택",
  },
  en: {
    open: "Open",
    switchLang: "한국어",
    switchLangAria: "Open language selector",
    languageMenuAria: "Select language",
  },
} satisfies Record<Locale, Record<string, string>>;

export type MessageKey = keyof (typeof messages)["ko"];
