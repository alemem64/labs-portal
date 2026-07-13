import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { DEFAULT_THUMBNAIL, type ServiceCard } from "../data/services";
import { useLocale } from "../i18n/LocaleContext";
import { readToken, readTokenMs } from "../lib/tokens";
import Thumbnail from "./Thumbnail";

type Props = {
  card: ServiceCard;
  expanded: boolean;
  glowing: boolean;
  eager?: boolean;
  onHoverChange?: (id: string | null) => void;
  register: (id: string, el: HTMLElement | null) => void;
  registerVideo: (id: string, element: HTMLVideoElement | null) => void;
};

export default function Card({ card, expanded, glowing, eager, onHoverChange, register, registerVideo }: Props) {
  const { locale, t } = useLocale();
  const [layoutExpanded, setLayoutExpanded] = useState(expanded);
  const cardRef = useRef<HTMLAnchorElement | null>(null);
  const logoRef = useRef<HTMLDivElement | null>(null);
  const thumbRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const previousLayout = useRef<{
    expanded: boolean;
    card: DOMRect;
    body: DOMRect;
  } | null>(null);
  const animations = useRef<Animation[]>([]);

  const setCardRef = useCallback(
    (el: HTMLAnchorElement | null) => {
      cardRef.current = el;
      register(card.card_id, el);
    },
    [card.card_id, register],
  );

  const setThumbnailVideo = useCallback(
    (element: HTMLVideoElement | null) => registerVideo(card.card_id, element),
    [card.card_id, registerVideo],
  );

  useEffect(() => {
    if (expanded === layoutExpanded) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setLayoutExpanded(expanded);
      return;
    }

    const outgoingContainer = layoutExpanded ? thumbRef.current : logoRef.current;
    const outgoingMedia = outgoingContainer?.querySelector<HTMLElement>(".card-primary-media");
    if (!outgoingMedia) {
      setLayoutExpanded(expanded);
      return;
    }

    let cancelled = false;
    const fade = outgoingMedia.animate(
      [{ opacity: 1 }, { opacity: 0 }],
      {
        duration: readTokenMs("--dur-media-fade", 140),
        easing: readToken("--ease-standard") || "ease-in-out",
        fill: "forwards",
      },
    );
    void fade.finished.then(() => {
      if (!cancelled) setLayoutExpanded(expanded);
    }).catch(() => {});

    return () => {
      cancelled = true;
      fade.cancel();
    };
  }, [expanded, layoutExpanded]);

  useLayoutEffect(() => {
    const cardEl = cardRef.current;
    const thumbEl = thumbRef.current;
    const bodyEl = bodyRef.current;
    if (!cardEl || !thumbEl || !bodyEl) return;

    const nextLayout = {
      expanded: layoutExpanded,
      card: cardEl.getBoundingClientRect(),
      body: bodyEl.getBoundingClientRect(),
    };
    const previous = previousLayout.current;
    previousLayout.current = nextLayout;

    animations.current.forEach((animation) => animation.cancel());
    animations.current = [];

    if (!previous || previous.expanded === layoutExpanded || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const options: KeyframeAnimationOptions = {
      duration: readTokenMs("--dur-state", 420),
      easing: readToken("--ease-standard") || "ease-in-out",
    };
    const bodyX = previous.body.left - nextLayout.body.left;
    const bodyY = previous.body.top - nextLayout.body.top;
    const incomingContainer = layoutExpanded ? thumbEl : logoRef.current;
    const mediaEl = incomingContainer?.querySelector<HTMLElement>(".card-primary-media");

    animations.current = [
      cardEl.animate(
        [{ height: `${previous.card.height}px` }, { height: `${nextLayout.card.height}px` }],
        options,
      ),
      bodyEl.animate(
        [
          { transform: `translate(${bodyX}px, ${bodyY}px)` },
          { transform: "none" },
        ],
        options,
      ),
    ];
    if (mediaEl) {
      animations.current.push(
        mediaEl.animate([{ opacity: 0 }, { opacity: 1 }], options),
      );
    }

    return () => {
      animations.current.forEach((animation) => animation.cancel());
    };
  }, [layoutExpanded]);

  return (
    <a
      id={card.card_id}
      ref={setCardRef}
      className="card"
      data-expanded={layoutExpanded || undefined}
      data-glow={glowing || undefined}
      href={card.link}
      target="_blank"
      rel="noreferrer"
      aria-label={`${card.title[locale]} — ${t("open")}`}
      onMouseEnter={onHoverChange ? () => onHoverChange(card.card_id) : undefined}
      onMouseLeave={onHoverChange ? () => onHoverChange(null) : undefined}
    >
      <div ref={logoRef} className="card-logo">
        <img
          className="app-logo-media card-primary-media"
          src={card.appLogo}
          alt=""
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : undefined}
          decoding="async"
          onError={(event) => {
            if (event.currentTarget.src.endsWith(DEFAULT_THUMBNAIL.src)) return;
            event.currentTarget.src = DEFAULT_THUMBNAIL.src;
          }}
        />
      </div>
      <div ref={thumbRef} className="card-thumb">
        <Thumbnail
          thumb={card.thumbnail}
          ogImage={card.ogImage}
          active={expanded || glowing}
          eager={eager}
          className="thumb-media card-primary-media"
          onVideoElementChange={setThumbnailVideo}
        />
      </div>
      <div ref={bodyRef} className="card-body">
        <div className="card-heading">
          <span className="card-title-logo" aria-hidden="true">
            <img
              className="card-title-logo-media"
              src={card.appLogo}
              alt=""
              loading={eager ? "eager" : "lazy"}
              decoding="async"
              onError={(event) => {
                if (event.currentTarget.src.endsWith(DEFAULT_THUMBNAIL.src)) return;
                event.currentTarget.src = DEFAULT_THUMBNAIL.src;
              }}
            />
          </span>
          <h2 className="card-title">{card.title[locale]}</h2>
        </div>
        <p className="card-desc">{card.desc[locale]}</p>
      </div>
      <div className="card-arrow" aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14" />
          <path d="m13 6 6 6-6 6" />
        </svg>
      </div>
    </a>
  );
}
