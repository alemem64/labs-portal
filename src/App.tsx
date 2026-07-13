import { useCallback, useEffect, useRef, useState } from "react";
import { services } from "./data/services";
import { LocaleProvider } from "./i18n/LocaleContext";
import Logo from "./components/Logo";
import CardList from "./components/CardList";
import SiteFooter from "./components/SiteFooter";
import BackgroundStage from "./components/background/BackgroundStage";
import { useIsDesktop } from "./hooks/useIsDesktop";
import { useHashTarget } from "./hooks/useHashTarget";
import { useActiveCard } from "./hooks/useActiveCard";
import { runIntroSequence, prefersReducedMotion } from "./lib/introSequence";

const cardIds = services.map((s) => s.card_id);
const PULSE_MS = 1600; // 데스크톱 해시 진입 glow 점등 시간 (Contract 04)

export default function App() {
  const isDesktop = useIsDesktop();
  const hashTarget = useHashTarget(cardIds);

  const cardRefs = useRef(new Map<string, HTMLElement>());
  const [cardVideos, setCardVideos] = useState<Map<string, HTMLVideoElement>>(() => new Map());
  const registerCard = useCallback((id: string, el: HTMLElement | null) => {
    if (el) cardRefs.current.set(id, el);
    else cardRefs.current.delete(id);
  }, []);

  const registerCardVideo = useCallback((id: string, element: HTMLVideoElement | null) => {
    setCardVideos((current) => {
      const previous = current.get(id) ?? null;
      if (previous === element) return current;

      const next = new Map(current);
      if (element) next.set(id, element);
      else next.delete(id);
      return next;
    });
  }, []);

  const initialId = hashTarget ?? cardIds[0];
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [pulseId, setPulseId] = useState<string | null>(null);
  const [desktopBgId, setDesktopBgId] = useState(initialId);
  const [mobileActiveId, setMobileActiveId] = useState(initialId);
  const [introDone, setIntroDone] = useState(false);

  const handleHover = useCallback((id: string | null) => {
    setHoverId(id);
    if (id) setDesktopBgId(id);
  }, []);

  // 모바일: 방향별 rail + hysteresis 상태 판정 (인트로 중에는 정지 — Contract 04)
  const { suspend: suspendMobileActiveTracking } = useActiveCard({
    enabled: !isDesktop && introDone,
    ids: cardIds,
    activeId: mobileActiveId,
    refs: cardRefs,
    onChange: setMobileActiveId,
  });

  // 모바일 접속 인트로 시퀀스 (최초 1회)
  const introStarted = useRef(false);
  useEffect(() => {
    if (isDesktop) {
      setIntroDone(true);
      return;
    }
    if (introStarted.current) return;
    introStarted.current = true;
    void runIntroSequence({
      ids: cardIds,
      targetId: initialId,
      refs: cardRefs.current,
      onStep: setMobileActiveId,
    }).then(() => setIntroDone(true));
    // initialId는 최초 마운트 시점 값만 사용
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDesktop]);

  // 해시 딥링크 (로드 후 hashchange 포함 — Contract 04)
  useEffect(() => {
    if (!hashTarget) return;
    const el = cardRefs.current.get(hashTarget);
    if (!el) return;
    const smooth = !prefersReducedMotion();

    if (isDesktop) {
      el.scrollIntoView({ block: "center", behavior: smooth ? "smooth" : "auto" });
      setDesktopBgId(hashTarget);
      setPulseId(hashTarget);
      const timer = setTimeout(() => setPulseId(null), PULSE_MS);
      return () => clearTimeout(timer);
    }
    if (introDone) {
      suspendMobileActiveTracking();
      el.scrollIntoView({ block: "center", behavior: smooth ? "smooth" : "auto" });
      setMobileActiveId(hashTarget);
    }
  }, [hashTarget, isDesktop, introDone, suspendMobileActiveTracking]);

  const backgroundId = isDesktop ? desktopBgId : mobileActiveId;
  const backgroundCard = services.find((s) => s.card_id === backgroundId) ?? services[0];
  const backgroundVideo = cardVideos.get(backgroundId) ?? null;
  const glowingId = isDesktop ? (hoverId ?? pulseId) : mobileActiveId;

  return (
    <LocaleProvider>
      <BackgroundStage card={backgroundCard} video={backgroundVideo} />
      <main>
        <Logo />
        <CardList
          cards={services}
          expandAll={isDesktop}
          activeId={mobileActiveId}
          glowingId={glowingId}
          onHoverChange={isDesktop ? handleHover : undefined}
          register={registerCard}
          registerVideo={registerCardVideo}
        />
      </main>
      <SiteFooter />
    </LocaleProvider>
  );
}
