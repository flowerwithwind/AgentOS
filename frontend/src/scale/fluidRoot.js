/**
 * JS entry for Node checks — keep formula in sync with fluidRoot.ts
 * (single source of truth for runtime is the TS module in the app bundle;
 * this file mirrors it for Node-based gating scripts).
 */

export const FLUID_ROOT_SCALE = Object.freeze({
  minWidth: 375,
  maxWidth: 1440,
  minFont: 14,
  maxFont: 18,
  remBase: 16,
});

export function rootFontSizePx(viewportWidth, opts = {}) {
  const { minWidth, maxWidth, minFont, maxFont } = { ...FLUID_ROOT_SCALE, ...opts };
  const w = Number(viewportWidth);
  if (!Number.isFinite(w)) return minFont;
  if (w <= minWidth) return minFont;
  if (w >= maxWidth) return maxFont;
  const t = (w - minWidth) / (maxWidth - minWidth);
  return minFont + t * (maxFont - minFont);
}

export function rootFontSizeCssClamp(opts = {}) {
  const { minWidth, maxWidth, minFont, maxFont } = { ...FLUID_ROOT_SCALE, ...opts };
  const slope = (maxFont - minFont) / (maxWidth - minWidth);
  const vwCoef = slope * 100;
  const intercept = minFont - slope * minWidth;
  return `clamp(${minFont}px, calc(${intercept.toFixed(4)}px + ${vwCoef.toFixed(4)}vw), ${maxFont}px)`;
}

export function pxToRem(px, remBase = FLUID_ROOT_SCALE.remBase) {
  return `${Number(px) / remBase}rem`;
}
