import type { ServiceCard } from "../data/services";
import { useLocale } from "../i18n/LocaleContext";
import Thumbnail from "./Thumbnail";

type Props = {
  card: ServiceCard;
  expanded: boolean;
  glowing: boolean;
  eager?: boolean;
  onHoverChange?: (id: string | null) => void;
  register: (id: string, el: HTMLElement | null) => void;
};

export default function Card({ card, expanded, glowing, eager, onHoverChange, register }: Props) {
  const { locale, t } = useLocale();

  return (
    <a
      id={card.card_id}
      ref={(el) => register(card.card_id, el)}
      className="card"
      data-expanded={expanded || undefined}
      data-glow={glowing || undefined}
      href={card.link}
      target="_blank"
      rel="noreferrer"
      aria-label={`${card.title[locale]} — ${t("open")}`}
      onMouseEnter={onHoverChange ? () => onHoverChange(card.card_id) : undefined}
      onMouseLeave={onHoverChange ? () => onHoverChange(null) : undefined}
    >
      <div className="card-thumb">
        <Thumbnail thumb={card.thumbnail} active={expanded || glowing} eager={eager} />
      </div>
      <div className="card-body">
        <h2 className="card-title">{card.title[locale]}</h2>
        <p className="card-desc">{card.desc[locale]}</p>
      </div>
      <div className="card-arrow" aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14" />
          <path d="m13 6 6 6-6 6" />
        </svg>
      </div>
    </a>
  );
}
