import { readTokenMs } from "./tokens";

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// smooth scroll이 멈출 때까지 대기 (연속 프레임 동안 scrollY 불변이면 정착으로 판정)
function waitForScrollSettle(timeoutMs: number): Promise<void> {
  return new Promise((resolve) => {
    const start = performance.now();
    let lastY = window.scrollY;
    let stableFrames = 0;
    const check = () => {
      const y = window.scrollY;
      stableFrames = y === lastY ? stableFrames + 1 : 0;
      lastY = y;
      if (stableFrames >= 8 || performance.now() - start > timeoutMs) resolve();
      else requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  });
}

const CANCEL_EVENTS = ["wheel", "touchstart", "pointerdown", "keydown"] as const;

type Options = {
  ids: readonly string[];
  targetId: string;
  refs: Map<string, HTMLElement>;
  onStep: (id: string) => void;
};

// Contract 04: 모바일 접속 인트로 — 맨 아래 카드부터 위로 순차 활성화,
// 타깃 카드에서 정지. 사용자 입력 시 즉시 중단.
export async function runIntroSequence({ ids, targetId, refs, onStep }: Options): Promise<void> {
  const targetIndex = Math.max(0, ids.indexOf(targetId));

  const scrollToCard = (id: string, smooth: boolean) => {
    refs.get(id)?.scrollIntoView({ block: "center", behavior: smooth ? "smooth" : "auto" });
  };

  if (prefersReducedMotion()) {
    onStep(targetId);
    scrollToCard(targetId, false);
    return;
  }

  let cancelled = false;
  const cancel = () => {
    cancelled = true;
  };
  CANCEL_EVENTS.forEach((e) => window.addEventListener(e, cancel, { passive: true }));

  try {
    const step = readTokenMs("--intro-step", 420);
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "auto" });

    for (let i = ids.length - 1; i >= targetIndex; i--) {
      if (cancelled) return;
      onStep(ids[i]);
      scrollToCard(ids[i], true);
      await sleep(step);
    }
    if (cancelled) return;

    // 타깃 카드 확장 애니메이션이 레이아웃을 바꾼 뒤 다시 센터링하고,
    // 스크롤이 정착한 뒤에 종료해야 스크롤 기반 활성 판정이 타깃을 뺏지 않는다.
    onStep(ids[targetIndex]);
    await sleep(readTokenMs("--dur-state", 350) + 50);
    if (cancelled) return;
    scrollToCard(ids[targetIndex], true);
    await waitForScrollSettle(1500);
  } finally {
    CANCEL_EVENTS.forEach((e) => window.removeEventListener(e, cancel));
  }
}
