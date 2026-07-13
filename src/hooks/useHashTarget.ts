import { useEffect, useState } from "react";

// Contract 04: 해시(#card_id) 딥링크. 유효하지 않은 id는 null.
export function useHashTarget(validIds: readonly string[]): string | null {
  const read = () => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    return validIds.includes(id) ? id : null;
  };

  const [target, setTarget] = useState<string | null>(read);

  useEffect(() => {
    const onChange = () => setTarget(read());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
    // validIds는 services.ts에서 고정 — 재구독 불필요
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return target;
}
