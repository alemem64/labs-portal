import { useEffect, useLayoutEffect, useRef } from "react";
import type { ServiceCard } from "../data/services";
import { readTokenMs } from "../lib/tokens";
import Card from "./Card";

type Props = {
  cards: readonly ServiceCard[];
  /** true면 전체 확장(데스크톱), 아니면 activeId만 확장(모바일) */
  expandAll: boolean;
  activeId: string;
  glowingId: string | null;
  onHoverChange?: (id: string | null) => void;
  register: (id: string, el: HTMLElement | null) => void;
  registerVideo: (id: string, element: HTMLVideoElement | null) => void;
};

export default function CardList({
  cards,
  expandAll,
  activeId,
  glowingId,
  onHoverChange,
  register,
  registerVideo,
}: Props) {
  const listRef = useRef<HTMLDivElement | null>(null);
  const transitionFloorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;

    if (transitionFloorTimerRef.current) clearTimeout(transitionFloorTimerRef.current);
    if (expandAll) {
      list.style.removeProperty("min-height");
      return;
    }

    // 두 카드의 media fade 완료 시점이 한 프레임 달라도 문서 높이가 줄지 않게 한다.
    // 그렇지 않으면 최하단 근처에서 브라우저가 scrollY를 강제로 clamp한다.
    list.style.minHeight = `${list.getBoundingClientRect().height}px`;
    const duration =
      readTokenMs("--dur-media-fade", 140) +
      readTokenMs("--dur-state", 420) +
      readTokenMs("--active-lock-buffer", 48);
    transitionFloorTimerRef.current = setTimeout(() => {
      list.style.removeProperty("min-height");
      transitionFloorTimerRef.current = null;
    }, duration);
  }, [activeId, expandAll]);

  useEffect(() => () => {
    if (transitionFloorTimerRef.current) clearTimeout(transitionFloorTimerRef.current);
  }, []);

  return (
    <div ref={listRef} className="card-list">
      {cards.map((card, i) => (
        <Card
          key={card.card_id}
          card={card}
          expanded={expandAll || card.card_id === activeId}
          glowing={card.card_id === glowingId}
          eager={i === 0}
          onHoverChange={onHoverChange}
          register={register}
          registerVideo={registerVideo}
        />
      ))}
    </div>
  );
}
