import { useEffect, useRef } from "react";

type Props = {
  source: HTMLVideoElement;
};

// Noxionite Background와 같은 방식: 별도 video를 만들지 않고 카드 video의
// 현재 프레임을 canvas에 그려 재생·일시정지·탐색 상태를 정확히 공유한다.
export default function SyncedBackdropCanvas({ source }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    let animationFrame = 0;
    let stopped = false;

    const draw = () => {
      if (stopped) return;

      const width = Math.max(1, window.innerWidth);
      const height = Math.max(1, window.innerHeight);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      const mediaWidth = source.videoWidth;
      const mediaHeight = source.videoHeight;
      if (source.readyState >= source.HAVE_CURRENT_DATA && mediaWidth > 0 && mediaHeight > 0) {
        const scale = Math.max(width / mediaWidth, height / mediaHeight);
        const drawWidth = mediaWidth * scale;
        const drawHeight = mediaHeight * scale;
        const x = (width - drawWidth) / 2;
        const y = (height - drawHeight) / 2;

        context.clearRect(0, 0, width, height);
        context.drawImage(source, x, y, drawWidth, drawHeight);
      }

      animationFrame = window.requestAnimationFrame(draw);
    };

    draw();
    return () => {
      stopped = true;
      window.cancelAnimationFrame(animationFrame);
    };
  }, [source]);

  return <canvas ref={canvasRef} className="backdrop-media backdrop-video-canvas" />;
}
