import type { ServiceCard } from "../data/services";
import Card from "./Card";

type Props = {
  cards: readonly ServiceCard[];
  /** true면 전체 확장(데스크톱), 아니면 activeId만 확장(모바일) */
  expandAll: boolean;
  activeId: string;
  glowingId: string | null;
  onHoverChange?: (id: string | null) => void;
  register: (id: string, el: HTMLElement | null) => void;
};

export default function CardList({ cards, expandAll, activeId, glowingId, onHoverChange, register }: Props) {
  return (
    <div className="card-list">
      {cards.map((card, i) => (
        <Card
          key={card.card_id}
          card={card}
          expanded={expandAll || card.card_id === activeId}
          glowing={card.card_id === glowingId}
          eager={i === 0}
          onHoverChange={onHoverChange}
          register={register}
        />
      ))}
    </div>
  );
}
