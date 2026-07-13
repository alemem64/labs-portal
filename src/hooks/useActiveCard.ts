import { useEffect, type RefObject } from "react";

type Options = {
  enabled: boolean;
  refs: RefObject<Map<string, HTMLElement>>;
  onChange: (id: string) => void;
};

// Contract 04 모바일: 뷰포트 세로 중앙에 가장 가까운 카드를 활성으로 판정.
export function useActiveCard({ enabled, refs, onChange }: Options) {
  useEffect(() => {
    if (!enabled) return;

    let raf = 0;

    const pick = () => {
      raf = 0;
      if (window.scrollY <= 1) {
        const firstId = refs.current?.keys().next().value;
        if (firstId) onChange(firstId);
        return;
      }

      const viewportCenter = window.innerHeight / 2;
      let bestId: string | null = null;
      let bestDist = Infinity;
      refs.current?.forEach((el, id) => {
        const rect = el.getBoundingClientRect();
        const dist = Math.abs(rect.top + rect.height / 2 - viewportCenter);
        if (dist < bestDist) {
          bestDist = dist;
          bestId = id;
        }
      });
      if (bestId) onChange(bestId);
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(pick);
    };

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    pick();

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [enabled, refs, onChange]);
}
