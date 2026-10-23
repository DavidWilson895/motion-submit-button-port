import * as React from "react";

/**
 * Port of Framer's "LumoRippleType" (WaveText) component.
 *
 * Letters ride a sine wave; the pointer boosts the amplitude of nearby letters.
 * DOM + CSS only, no WebGL. Static (reduced motion): letters at rest.
 */
function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

function formatNumber(n, decimals) {
  return Number(n).toFixed(decimals);
}

function waveOffset(i, t, params) {
  const { amplitude = 12, wavelength = 8, speed = 1 } = params;
  const wl = Math.max(1, wavelength);
  return Math.sin(2 * Math.PI * (t * speed + i / wl)) * amplitude;
}

const TICK_MS = 16;
const LERP = 0.2;

export default function WaveText(props) {
  const {
    text = "Make waves",
    amplitude = 12,
    wavelength = 8,
    speed = 1,
    rotate = 0,
    pointerRadius = 120,
    pointerBoost = 2,
    color = "#FFFFFF",
    background = "#0B0B0F",
    align = "center",
    style,
    font,
  } = props;

  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const animated = !reduced;

  const rootRef = React.useRef(null);
  const centersRef = React.useRef(null);
  const boostRef = React.useRef([]);
  const pointerRef = React.useRef(null);

  const words = React.useMemo(
    () => text.split(/\s+/).filter(Boolean).map((w) => [...w]),
    [text],
  );

  const params = React.useMemo(
    () => ({ amplitude, wavelength, speed }),
    [amplitude, wavelength, speed],
  );

  const draw = React.useCallback(
    (t) => {
      const root = rootRef.current;
      if (!root) return;
      const letters = root.querySelectorAll("[data-hk=letter]");
      const boosts = boostRef.current;
      const p = pointerRef.current;
      const r = Math.max(1, pointerRadius);
      if (p && !centersRef.current) {
        centersRef.current = [...letters].map((el) => {
          const rect = el.getBoundingClientRect();
          return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        });
      }
      const centers = centersRef.current;
      for (let i = 0; i < letters.length; i++) {
        let target = 1;
        if (p && centers && centers[i]) {
          const d = Math.hypot(centers[i].x - p.x, centers[i].y - p.y);
          if (d < r) target = 1 + pointerBoost * (1 - d / r);
        }
        const b =
          (boosts[i] ?? 1) + (target - (boosts[i] ?? 1)) * LERP;
        boosts[i] = b;
        const y = waveOffset(i, t, params) * b;
        letters[i].style.transform = rotate
          ? `translateY(${formatNumber(y, 2)}px) rotate(${formatNumber(
              (y / Math.max(0.001, amplitude)) * rotate,
              2,
            )}deg)`
          : `translateY(${formatNumber(y, 2)}px)`;
      }
      root.style.setProperty("--hk-t", formatNumber(t, 3));
    },
    [params, rotate, amplitude, pointerRadius, pointerBoost],
  );

  React.useEffect(() => {
    if (!animated) return;
    const start = Date.now();
    let timer = 0;
    const tick = () => {
      draw((Date.now() - start) / 1e3);
      timer = window.setTimeout(tick, TICK_MS);
    };
    draw(0);
    timer = window.setTimeout(tick, TICK_MS);
    return () => window.clearTimeout(timer);
  }, [animated, draw]);

  React.useEffect(() => {
    const root = rootRef.current;
    if (!root || !animated) return;
    const onMove = (e) => {
      pointerRef.current = { x: e.clientX, y: e.clientY };
      const rect = root.getBoundingClientRect();
      root.style.setProperty(
        "--hk-x",
        formatNumber(clamp01((e.clientX - rect.left) / Math.max(1, rect.width)), 4),
      );
    };
    const onLeave = () => {
      pointerRef.current = null;
    };
    root.addEventListener("pointermove", onMove, { passive: true });
    root.addEventListener("pointerleave", onLeave, { passive: true });
    return () => {
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
    };
  }, [animated]);

  React.useEffect(() => {
    centersRef.current = null;
    boostRef.current = [];
    if (typeof ResizeObserver === "undefined" || !rootRef.current) return;
    const ro = new ResizeObserver(() => {
      centersRef.current = null;
    });
    ro.observe(rootRef.current);
    return () => ro.disconnect();
  }, [text]);

  let index = 0;
  return (
    <div
      ref={rootRef}
      data-hk="stage"
      data-hk-mode={animated ? "animated" : "static"}
      style={{
        ...style,
        position: "relative",
        width: "100%",
        boxSizing: "border-box",
        background,
        color,
        textAlign: align,
        overflow: "hidden",
      }}
    >
      <span
        data-hk="sr"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          margin: -1,
          padding: 0,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        {text}
      </span>
      <div
        aria-hidden="true"
        style={{
          fontSize: "clamp(22px, 3vw, 44px)",
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
          fontWeight: 700,
          ...(font || {}),
        }}
      >
        {words.map((letters, wi) => (
          <React.Fragment key={wi}>
            <span
              data-hk="word"
              style={{ display: "inline-block", whiteSpace: "nowrap" }}
            >
              {letters.map((ch, li) => (
                <span
                  key={li}
                  data-hk="letter"
                  aria-hidden="true"
                  data-hk-i={index++}
                  style={{
                    display: "inline-block",
                    willChange: animated ? "transform" : undefined,
                  }}
                >
                  {ch}
                </span>
              ))}
            </span>
            {wi < words.length - 1 ? " " : null}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
