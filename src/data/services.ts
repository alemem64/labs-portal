import type { LocalizedText } from "../i18n/locales";

// Contract 02: 카드/링크 데이터의 단일 소스. 배열 순서 = 노출 순서.
export type ServiceThumbnail =
  | { type: "image"; src: string }
  | { type: "video"; src: string; poster: string };

export type ServiceCard = {
  card_id: string;
  title: LocalizedText;
  desc: LocalizedText;
  link: string;
  /** 접힌 카드에서 표시하는 정사각형 앱 로고 */
  appLogo: string;
  /** 직접 지정한 썸네일이 우선이며, 없으면 ogImage를 사용한다. */
  thumbnail?: ServiceThumbnail;
  ogImage?: string;
};

export const DEFAULT_THUMBNAIL: ServiceThumbnail = { type: "image", src: "/favicon.svg" };

export function resolveCardThumbnail(card: ServiceCard): ServiceThumbnail {
  return card.thumbnail ?? (card.ogImage ? { type: "image", src: card.ogImage } : DEFAULT_THUMBNAIL);
}

const r2AssetBaseUrl = import.meta.env?.VITE_R2_ASSET_BASE_URL?.replace(/\/+$/, "");

function serviceAssets(cardId: string, localFallback: string): Pick<ServiceCard, "appLogo" | "thumbnail"> {
  if (!r2AssetBaseUrl) {
    return {
      appLogo: localFallback,
      thumbnail: { type: "image", src: localFallback },
    };
  }

  const root = `${r2AssetBaseUrl}/${cardId}`;
  return {
    appLogo: `${root}/app-logo.webp`,
    thumbnail: {
      type: "video",
      src: `${root}/thumbnail.mp4`,
      poster: `${root}/thumbnail-poster.webp`,
    },
  };
}

export const services: ServiceCard[] = [
  {
    card_id: "ypjr",
    title: { ko: "연필자루책", en: "Yeonpiljaru Books" },
    desc: {
      ko: "무조건 1등급 받는 내신과 최상위 세특 작성법",
      en: "How to earn top grades and write outstanding subject-specific student records.",
    },
    link: "https://ypjr.leapsignal.net",
    ...serviceAssets("ypjr", "/thumbs/ypjr.svg"),
  },
  {
    card_id: "eclipse",
    title: { ko: "이클립스 보이저", en: "Eclipse Voyager" },
    desc: {
      ko: "수학과 그래프로 풀어내는 신박한 퍼즐 게임",
      en: "A fresh puzzle game solved through mathematics and graphs.",
    },
    link: "https://eclipse.leapsignal.net/",
    ...serviceAssets("eclipse", "/thumbs/eclipse.svg"),
  },
  {
    card_id: "focusroyale",
    title: { ko: "포커스로얄", en: "Focus Royale" },
    desc: {
      ko: "공부시간과 투두로 키워가는 전투 게임",
      en: "A battle game powered by your study time and to-do progress.",
    },
    link: "https://focusroyale.leapsignal.net",
    ...serviceAssets("focusroyale", "/thumbs/focusroyale.svg"),
  },
  {
    card_id: "jzahnny",
    title: { ko: "Jzahnny의 블로그", en: "Jzahnny's Blog" },
    desc: {
      ko: "Noxionite 서비스로 만들어진 개인 블로그",
      en: "A personal blog built with the Noxionite service.",
    },
    link: "https://jzahnny.leapsignal.net",
    ...serviceAssets("jzahnny", "/thumbs/jzahnny.svg"),
  },
];

// Contract 02: card_id 중복은 로드 시점에 차단한다.
const seen = new Set<string>();
for (const s of services) {
  if (seen.has(s.card_id)) {
    throw new Error(`duplicate card_id in services.ts: ${s.card_id}`);
  }
  seen.add(s.card_id);
}
