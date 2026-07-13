import { useCallback, useEffect, useRef, type RefObject } from "react";
import { readTokenMs, readTokenNumber } from "../lib/tokens";

type Options = {
  enabled: boolean;
  ids: readonly string[];
  activeId: string;
  refs: RefObject<Map<string, HTMLElement>>;
  onChange: (id: string) => void;
};

type Controls = {
  /** 해시 이동처럼 프로그램이 스크롤하는 동안 일반 판정을 잠시 정지한다. */
  suspend: (durationMs?: number) => void;
};

const USER_INTERRUPT_EVENTS = ["wheel", "touchstart", "pointerdown", "keydown"] as const;

// Contract 04 모바일: 방향별 활성 rail + hysteresis로 카드를 판정한다.
// 애니메이션 중 변하는 카드 중심은 사용하지 않고, 높이에 영향받지 않는 카드 상단을 anchor로 쓴다.
export function useActiveCard({ enabled, ids, activeId, refs, onChange }: Options): Controls {
  const activeIdRef = useRef(activeId);
  const lastScrollYRef = useRef(0);
  const directionRef = useRef<-1 | 0 | 1>(0);
  const lockedUntilRef = useRef(0);
  const suspendedUntilRef = useRef(0);
  const rafRef = useRef(0);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleRef = useRef<() => void>(() => {});

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  const suspend = useCallback((durationMs?: number) => {
    const duration = durationMs ?? readTokenMs("--programmatic-scroll-lock", 1800);
    suspendedUntilRef.current = performance.now() + duration;
  }, []);

  useEffect(() => {
    if (!enabled) return;

    lastScrollYRef.current = window.scrollY;

    const scheduleAfterLock = (delay: number) => {
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
      settleTimerRef.current = setTimeout(() => scheduleRef.current(), delay);
    };

    const activate = (id: string, now: number) => {
      if (id === activeIdRef.current) return;

      activeIdRef.current = id;
      onChange(id);

      const lockDuration =
        readTokenMs("--dur-media-fade", 140) +
        readTokenMs("--dur-state", 420) +
        readTokenMs("--active-lock-buffer", 48);
      lockedUntilRef.current = now + lockDuration;
      scheduleAfterLock(lockDuration);
    };

    const pick = () => {
      rafRef.current = 0;

      const now = performance.now();
      const scrollY = window.scrollY;
      const delta = scrollY - lastScrollYRef.current;
      const epsilon = readTokenNumber("--active-scroll-epsilon", 2);
      if (Math.abs(delta) >= epsilon) directionRef.current = delta > 0 ? 1 : -1;
      lastScrollYRef.current = scrollY;

      if (now < suspendedUntilRef.current) return;

      const firstId = ids[0];
      const lastId = ids[ids.length - 1];
      if (!firstId || !lastId) return;

      const topLatch = readTokenNumber("--active-top-latch", 2);
      if (scrollY <= topLatch) {
        activate(firstId, now);
        return;
      }

      const documentHeight = document.documentElement.scrollHeight;
      const distanceToBottom = documentHeight - (scrollY + window.innerHeight);
      const scrollRange = Math.max(0, documentHeight - window.innerHeight);
      // 짧은 모바일 문서에서 넓은 고정 px 범위가 중간 카드를 건너뛰지 않도록
      // 전체 스크롤 구간의 마지막 12%까지만 bottom latch로 사용한다.
      const bottomLatch = Math.min(
        readTokenNumber("--active-bottom-latch", 120),
        Math.max(12, scrollRange * 0.12),
      );
      if (distanceToBottom <= bottomLatch) {
        activate(lastId, now);
        return;
      }

      if (now < lockedUntilRef.current) return;

      const currentIndex = Math.max(0, ids.indexOf(activeIdRef.current));
      const direction = directionRef.current;
      if (direction === 0) return;

      const railRatio = readTokenNumber(
        direction > 0 ? "--active-rail-lower" : "--active-rail-upper",
        direction > 0 ? 0.58 : 0.42,
      );
      const railY = window.innerHeight * railRatio;
      let targetIndex = direction > 0 ? currentIndex : 0;

      // 해당 rail 위에 올라온 마지막 anchor를 선택한다. 빠른 스크롤은 중간 카드를 건너뛸 수 있다.
      for (let index = 0; index < ids.length; index += 1) {
        const element = refs.current?.get(ids[index]);
        if (element && element.getBoundingClientRect().top <= railY) targetIndex = index;
      }

      if (direction > 0 && targetIndex > currentIndex) activate(ids[targetIndex], now);
      if (direction < 0 && targetIndex < currentIndex) activate(ids[targetIndex], now);
    };

    const schedule = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(pick);
    };
    scheduleRef.current = schedule;

    const resumeFromUserInput = () => {
      suspendedUntilRef.current = 0;
      lastScrollYRef.current = window.scrollY;
      schedule();
    };

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    USER_INTERRUPT_EVENTS.forEach((event) => window.addEventListener(event, resumeFromUserInput, { passive: true }));
    schedule();

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      USER_INTERRUPT_EVENTS.forEach((event) => window.removeEventListener(event, resumeFromUserInput));
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
      scheduleRef.current = () => {};
    };
  }, [enabled, ids, onChange, refs]);

  return { suspend };
}
