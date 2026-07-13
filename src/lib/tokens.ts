// Contract 03: JS가 시각 값을 쓸 때는 tokens.css를 읽는다.

export function readToken(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function readTokenMs(name: string, fallback: number): number {
  // CSS 압축기가 "420ms"를 ".42s"로 바꿀 수 있으므로 단위를 해석한다
  const v = readToken(name);
  const n = parseFloat(v);
  if (!Number.isFinite(n)) return fallback;
  if (v.endsWith("ms")) return n;
  if (v.endsWith("s")) return n * 1000;
  return n;
}

export function readTokenNumber(name: string, fallback: number): number {
  const value = parseFloat(readToken(name));
  return Number.isFinite(value) ? value : fallback;
}

/** "#rrggbb" → [r, g, b] (0..1). 실패 시 null */
export function readTokenRgb(name: string): [number, number, number] | null {
  const v = readToken(name);
  const m = /^#([0-9a-f]{6})$/i.exec(v);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
