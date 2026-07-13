import { useEffect, useRef } from "react";
import type { ServiceCard } from "../data/services";

type Props = {
  thumb: ServiceCard["thumbnail"];
  /** 카드가 확장/glow 상태일 때만 video 재생 (Contract 06) */
  active: boolean;
  /** 첫 카드만 eager 로드 (Contract 06 단계 2) */
  eager?: boolean;
};

export default function Thumbnail({ thumb, active, eager }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (active) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [active]);

  if (thumb.type === "video") {
    return (
      <video
        ref={videoRef}
        className="thumb-media"
        src={thumb.src}
        poster={thumb.poster}
        muted
        loop
        playsInline
        preload="none"
      />
    );
  }

  return (
    <img
      className="thumb-media"
      src={thumb.src}
      alt=""
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : undefined}
      decoding="async"
    />
  );
}
