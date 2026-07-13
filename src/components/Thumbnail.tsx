import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_THUMBNAIL, type ServiceCard, type ServiceThumbnail } from "../data/services";

type Props = {
  thumb: ServiceCard["thumbnail"];
  /** 직접 지정한 썸네일이 없거나 로드에 실패했을 때 사용할 OG 이미지 */
  ogImage?: string;
  /** 카드가 확장/glow 상태일 때만 video 재생 (Contract 06) */
  active: boolean;
  /** 첫 카드만 eager 로드 (Contract 06 단계 2) */
  eager?: boolean;
  className?: string;
  /** 배경처럼 동영상 재생이 불필요한 곳에서는 poster 이미지만 사용 */
  preferPoster?: boolean;
  /** 원본 video 프레임을 배경 canvas와 공유하기 위한 DOM 요소 전달 */
  onVideoElementChange?: (element: HTMLVideoElement | null) => void;
};

function initialMedia(thumb: Props["thumb"], ogImage?: string, preferPoster?: boolean): ServiceThumbnail {
  const resolved = thumb ?? (ogImage ? { type: "image" as const, src: ogImage } : DEFAULT_THUMBNAIL);
  return preferPoster && resolved.type === "video"
    ? { type: "image", src: resolved.poster }
    : resolved;
}

export default function Thumbnail({
  thumb,
  ogImage,
  active,
  eager,
  className = "thumb-media",
  preferPoster,
  onVideoElementChange,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [media, setMedia] = useState<ServiceThumbnail>(() => initialMedia(thumb, ogImage, preferPoster));

  const setVideoRef = useCallback(
    (element: HTMLVideoElement | null) => {
      videoRef.current = element;
      onVideoElementChange?.(element);
    },
    [onVideoElementChange],
  );

  useEffect(() => {
    setMedia(initialMedia(thumb, ogImage, preferPoster));
  }, [thumb, ogImage, preferPoster]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (active) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [active, media]);

  const useFallback = () => {
    if (thumb?.type === "video" && media.src !== thumb.poster) {
      setMedia({ type: "image", src: thumb.poster });
      return;
    }
    if (ogImage && media.src !== ogImage) {
      setMedia({ type: "image", src: ogImage });
      return;
    }
    if (media.src !== DEFAULT_THUMBNAIL.src) setMedia(DEFAULT_THUMBNAIL);
  };

  if (media.type === "video") {
    return (
      <video
        ref={setVideoRef}
        className={className}
        src={media.src}
        poster={media.poster}
        muted
        loop
        playsInline
        preload={active ? "metadata" : "none"}
        onError={useFallback}
      />
    );
  }

  return (
    <img
      className={className}
      src={media.src}
      alt=""
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : undefined}
      decoding="async"
      onError={useFallback}
    />
  );
}
