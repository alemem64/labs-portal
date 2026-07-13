import { useEffect, useRef, useState } from "react";
import type { ServiceCard } from "../../data/services";
import Thumbnail from "../Thumbnail";
import SyncedBackdropCanvas from "./SyncedBackdropCanvas";

type Layer = { key: number; card: ServiceCard; video: HTMLVideoElement | null };

// Contract 04: 활성 카드 썸네일을 cover+blur+black으로 배경에 깔고,
// 활성 카드가 바뀌면 crossfade한다. 썸네일 파일 재사용(추가 다운로드 없음).
export default function ThumbBackdrop({ card, video }: { card: ServiceCard; video: HTMLVideoElement | null }) {
  const counter = useRef(0);
  const [layers, setLayers] = useState<Layer[]>([{ key: 0, card, video }]);

  useEffect(() => {
    setLayers((prev) => {
      const top = prev[prev.length - 1];
      if (top && top.card.card_id === card.card_id && top.video === video) return prev;
      counter.current += 1;
      // 직전 레이어 1장만 유지한 채 새 레이어를 위에 얹는다
      return [...prev.slice(-1), { key: counter.current, card, video }];
    });
  }, [card, video]);

  // 새 레이어의 fade-in이 끝나면 아래 레이어들을 제거
  const settle = (key: number) => {
    setLayers((prev) => (prev.length > 1 ? prev.filter((l) => l.key >= key) : prev));
  };

  return (
    <div className="thumb-backdrop" aria-hidden="true">
      {layers.map((layer, i) => {
        const isTop = i === layers.length - 1;
        return (
          <div key={layer.key} className="thumb-backdrop-layer" onAnimationEnd={() => isTop && settle(layer.key)}>
            <Thumbnail
              thumb={layer.card.thumbnail}
              ogImage={layer.card.ogImage}
              active={isTop}
              eager={isTop}
              className="backdrop-media"
              preferPoster
            />
            {layer.video ? <SyncedBackdropCanvas source={layer.video} /> : null}
          </div>
        );
      })}
      <div className="thumb-backdrop-overlay" />
    </div>
  );
}
