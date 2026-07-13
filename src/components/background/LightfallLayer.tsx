import { lazy, Suspense, useEffect, useState } from "react";
import { prefersReducedMotion } from "../../lib/introSequence";

// Contract 06: lightfall은 별도 청크 + 유휴 시점 로드. 실패해도 사이트 정상.
const Lightfall = lazy(() => import("../../vendor/lightfall/Lightfall"));

export default function LightfallLayer() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const frame = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  if (!ready) return null;

  return (
    <Suspense fallback={null}>
      <Lightfall />
    </Suspense>
  );
}
