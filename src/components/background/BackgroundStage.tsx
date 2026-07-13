import type { ServiceCard } from "../../data/services";
import ThumbBackdrop from "./ThumbBackdrop";
import SunsetGradient from "./SunsetGradient";
import LightfallLayer from "./LightfallLayer";

// z-index (Contract 03): 썸네일 < 그라디언트 < lightfall — 각 레이어 CSS가 토큰 사용.
export default function BackgroundStage({ card, video }: { card: ServiceCard; video: HTMLVideoElement | null }) {
  return (
    <>
      <ThumbBackdrop card={card} video={video} />
      <SunsetGradient />
      <LightfallLayer />
    </>
  );
}
