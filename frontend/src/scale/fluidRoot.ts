/**
 * Fluid document root type scale (viewport-width driven).
 * Anchors: 14px @ 375px viewport → 18px @ 1440px (linear between).
 * CSS must mirror rootFontSizeCssClamp() on `html { font-size: ... }`.
 */

export const FLUID_ROOT_SCALE = Object.freeze({
  minWidth: 375,
  maxWidth: 1440,
  minFont: 14,
  maxFont: 18,
  remBase: 16,
});

export type FluidRootScale = {
  minWidth: number;
  maxWidth: number;
  minFont: number;
  maxFont: number;
  remBase: number;
};

/** Root font-size in CSS px for a given viewport width. */
export function rootFontSizePx(
  viewportWidth: number,
  opts: Partial<FluidRootScale> = {},
): number {
  const { minWidth, maxWidth, minFont, maxFont } = { ...FLUID_ROOT_SCALE, ...opts };
  const w = Number(viewportWidth);
  if (!Number.isFinite(w)) return minFont;
  if (w <= minWidth) return minFont;
  if (w >= maxWidth) return maxFont;
  const t = (w - minWidth) / (maxWidth - minWidth);
  return minFont + t * (maxFont - minFont);
}

/** CSS clamp() expression matching rootFontSizePx. */
export function rootFontSizeCssClamp(opts: Partial<FluidRootScale> = {}): string {
  const { minWidth, maxWidth, minFont, maxFont } = { ...FLUID_ROOT_SCALE, ...opts };
  const slope = (maxFont - minFont) / (maxWidth - minWidth);
  const vwCoef = slope * 100;
  const intercept = minFont - slope * minWidth;
  return `clamp(${minFont}px, calc(${intercept.toFixed(4)}px + ${vwCoef.toFixed(4)}vw), ${maxFont}px)`;
}

export function pxToRem(px: number, remBase = FLUID_ROOT_SCALE.remBase): string {
  return `${Number(px) / remBase}rem`;
}
