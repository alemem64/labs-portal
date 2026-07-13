import type { LocalizedText } from "../i18n/locales";

// Contract 02: 카드/링크 데이터의 단일 소스. 배열 순서 = 노출 순서.
export type ServiceCard = {
  card_id: string;
  title: LocalizedText;
  desc: LocalizedText;
  link: string;
  thumbnail:
    | { type: "image"; src: string }
    | { type: "video"; src: string; poster: string };
};

export const services: ServiceCard[] = [
  {
    card_id: "ypjr",
    title: { ko: "YPJR", en: "YPJR" },
    desc: {
      ko: "YPJR 서비스로 이동합니다.",
      en: "Head over to the YPJR service.",
    },
    link: "https://ypjr.leapsignal.net",
    thumbnail: { type: "image", src: "/thumbs/ypjr.svg" },
  },
  {
    card_id: "jzahnny",
    title: { ko: "Jzahnny", en: "Jzahnny" },
    desc: {
      ko: "Jzahnny의 개인 공간입니다.",
      en: "Jzahnny's personal space.",
    },
    link: "https://jzahnny.leapsignal.net",
    thumbnail: { type: "image", src: "/thumbs/jzahnny.svg" },
  },
  {
    card_id: "eclipse",
    title: { ko: "Eclipse", en: "Eclipse" },
    desc: {
      ko: "Eclipse 프로젝트를 만나보세요.",
      en: "Explore the Eclipse project.",
    },
    link: "https://eclipse.leapsignal.net/",
    thumbnail: { type: "image", src: "/thumbs/eclipse.svg" },
  },
  {
    card_id: "focusroyale",
    title: { ko: "Focus Royale", en: "Focus Royale" },
    desc: {
      ko: "집중력 배틀, Focus Royale.",
      en: "The focus battle — Focus Royale.",
    },
    link: "https://focusroyale.leapsignal.net",
    thumbnail: { type: "image", src: "/thumbs/focusroyale.svg" },
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
