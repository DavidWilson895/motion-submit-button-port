import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from "react";
import { createPortal } from "react-dom";
// --- port shim: replaces the framer runtime ---
const useIsStaticRenderer = () => false;

// Framer's Color() returns { r, g, b (0-255), a (0-1) }. Only WaxSeal uses it.
function Color(value) {
  const fallback = { r: 168, g: 43, b: 50, a: 1 };
  if (!value) return fallback;
  const str = String(value).trim().toLowerCase();
  if (str.startsWith("#")) {
    let hex = str.slice(1);
    if (hex.length === 3 || hex.length === 4) hex = hex.split("").map((c) => c + c).join("");
    if (hex.length < 6) return fallback;
    const num = (i) => parseInt(hex.slice(i, i + 2), 16) || 0;
    return { r: num(0), g: num(2), b: num(4), a: hex.length >= 8 ? num(6) / 255 : 1 };
  }
  const rgb = str.match(/^rgba?\(([^)]+)\)$/);
  if (rgb) {
    const parts = rgb[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    return {
      r: parts[0] || 0,
      g: parts[1] || 0,
      b: parts[2] || 0,
      a: parts.length > 3 ? parts[3] : 1,
    };
  }
  return fallback;
}
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
const WAX_TEXTURE =
  "https://framerusercontent.com/images/iqHChEn0wRooi2chZFgQSbUUUw.png?scale-down-to=512";
const DEFAULTS = {
  duration: 5.6,
  flight: 1,
  paper: "#FFFFFF",
  seal: "#A82B32",
  sealSize: 64,
  mailbox: "#343E3C",
  reducedMotion: false,
  demo: false,
};
const DeliveryContext = /*#__PURE__*/ React.createContext(null);
const clamp = (n) => Math.max(0, Math.min(1, n));
const range = (n, a, b) => clamp((n - a) / (b - a));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);
const soft = (t) => t * t * t * (t * (t * 6 - 15) + 10);
function mix(n, stops, values, easing = smooth) {
  if (n <= stops[0]) return values[0];
  for (let i = 1; i < stops.length; i++)
    if (n <= stops[i])
      return lerp(values[i - 1], values[i], easing(range(n, stops[i - 1], stops[i])));
  return values[values.length - 1];
}
function pose(p, width) {
  const unit = width / 600;
  if (p <= 0.46)
    return {
      x: 0,
      y: mix(p, [0, 0.18, 0.35, 0.4, 0.426, 0.46], [0, -12, -3, 0, 1.2, 0], soft),
      rotate: mix(p, [0, 0.18, 0.36, 0.46], [0, -2, -1, -2], soft),
      scale: mix(p, [0, 0.09, 0.32, 0.4, 0.426, 0.46], [1, 0.99, 0.62, 0.62, 0.617, 0.62], soft),
      rx: mix(p, [0, 0.18, 0.38, 0.46], [0, 14, 0, 0], soft),
      ry: 0,
    };
  return {
    x: mix(p, [0.46, 0.49, 0.61, 0.8], [0, 0, -110, 158]) * unit,
    y: mix(p, [0.46, 0.49, 0.61, 0.8], [0, 0, 43, -15]) * unit,
    rotate: mix(p, [0.46, 0.61, 0.8], [-2, 7, 7]),
    scale: mix(p, [0.46, 0.49, 0.61], [0.62, 0.62, 0.34]),
    rx: mix(p, [0.46, 0.61, 0.8], [3, 55, 55]),
    ry: mix(p, [0.46, 0.61, 0.8], [0, 52, 52]),
  };
}
/**
 * Native form animation settings and submit-state bridge.
 * @framerIntrinsicWidth 24
 * @framerIntrinsicHeight 24
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerDisableUnlink
 */ export default function DeliverySignal(props) {
  const {
    status = "idle",
    duration = 5.6,
    flight = 1,
    paper = "#FFFFFF",
    seal = "#A82B32",
    sealImage,
    sealSize = 64,
    mailbox = "#343E3C",
    reducedMotion = false,
    demo = false,
    iconColor = "#FFFFFF",
    successLabel = "Thank you, message received.",
    successTextColor = "#414640",
    successColor = "#CDD0CB",
    style,
  } = props;
  const context = React.useContext(DeliveryContext);
  const isStatic = useIsStaticRenderer(),
    systemReduced = useReducedMotion();
  const quiet = isStatic || reducedMotion || !!systemReduced;
  const report = context?.report;
  const imageSrc = sealImage?.src,
    imageAlt = sealImage?.alt;
  const marker = React.useRef(null);
  const [button, setButton] = React.useState(null);
  const [labelStyle, setLabelStyle] = React.useState({
    fontFamily: "Inter, sans-serif",
    fontSize: 16,
    fontWeight: 400,
    letterSpacing: "-.02em",
  });
  const [filled, setFilled] = React.useState(false),
    [ready, setReady] = React.useState(false),
    [engaged, setEngaged] = React.useState(false),
    [completed, setCompleted] = React.useState(false);
  React.useEffect(() => {
    if (!isStatic)
      report?.(status, {
        duration,
        flight,
        paper,
        seal,
        sealImage: imageSrc ? { src: imageSrc, alt: imageAlt } : undefined,
        sealSize,
        mailbox,
        reducedMotion,
        demo,
      });
  }, [
    report,
    isStatic,
    status,
    duration,
    flight,
    paper,
    seal,
    imageSrc,
    imageAlt,
    sealSize,
    mailbox,
    reducedMotion,
    demo,
  ]); // Only the icon observes native values. Typing never rerenders the input owner.
  React.useEffect(() => {
    const form = marker.current?.closest("form");
    if (isStatic || !form) return;
    const nativeButton = marker.current?.closest("button");
    if (nativeButton) {
      setButton(nativeButton);
      const label = nativeButton.querySelector("p") || nativeButton;
      const css = getComputedStyle(label);
      setLabelStyle({
        fontFamily: css.fontFamily,
        fontSize: css.fontSize,
        fontWeight: css.fontWeight,
        letterSpacing: css.letterSpacing,
        lineHeight: css.lineHeight,
      });
    }
    const clearSuccess = () => {
      delete form.dataset.deliveryCompletedAt;
      setCompleted(false);
    };
    const update = () => {
      const fields = Array.from(form.elements).filter(
        (e) =>
          e instanceof HTMLInputElement ||
          e instanceof HTMLTextAreaElement ||
          e instanceof HTMLSelectElement,
      );
      const hasText = fields.some(
        (e) =>
          !e.disabled &&
          !["hidden", "submit", "button"].includes(e.type) &&
          (e instanceof HTMLInputElement && ["checkbox", "radio"].includes(e.type)
            ? e.checked
            : e.value.trim().length > 0),
      );
      setFilled(hasText);
      setReady(hasText && fields.every((e) => e.disabled || e.validity.valid));
    };
    let resetFrame = 0;
    const changed = () => {
      clearSuccess();
      update();
    };
    const reset = () => {
      clearSuccess();
      cancelAnimationFrame(resetFrame);
      resetFrame = requestAnimationFrame(update);
    };
    const complete = () => setCompleted(Number(form.dataset.deliveryCompletedAt || 0) > 0);
    update();
    complete();
    form.addEventListener("input", changed);
    form.addEventListener("change", changed);
    form.addEventListener("reset", reset);
    form.addEventListener("delivery-complete", complete);
    form.addEventListener("delivery-start", clearSuccess);
    return () => {
      cancelAnimationFrame(resetFrame);
      form.removeEventListener("input", changed);
      form.removeEventListener("change", changed);
      form.removeEventListener("reset", reset);
      form.removeEventListener("delivery-complete", complete);
      form.removeEventListener("delivery-start", clearSuccess);
    };
  }, [isStatic]); // Hover state is local to the icon; native fields retain their own state.
  React.useEffect(() => {
    if (!button || isStatic) return;
    const canHover = () => window.matchMedia("(hover:hover) and (pointer:fine)").matches;
    const enter = (event) => {
      if (event.pointerType !== "touch" && canHover()) setEngaged(true);
    };
    const leave = () => setEngaged(button.matches(":focus-visible"));
    const focus = () => setEngaged(button.matches(":focus-visible"));
    const blur = () => setEngaged(canHover() && button.matches(":hover"));
    setEngaged(button.matches(":focus-visible") || (canHover() && button.matches(":hover")));
    button.addEventListener("pointerenter", enter);
    button.addEventListener("pointerleave", leave);
    button.addEventListener("focus", focus);
    button.addEventListener("blur", blur);
    return () => {
      button.removeEventListener("pointerenter", enter);
      button.removeEventListener("pointerleave", leave);
      button.removeEventListener("focus", focus);
      button.removeEventListener("blur", blur);
    };
  }, [button, isStatic]);
  const activeHover = (engaged || status === "pending") && !quiet;
  const checked = !isStatic && completed;
  React.useEffect(() => {
    if (!button || !checked) return;
    const previous = button.getAttribute("aria-label");
    const previousDisabled = button.getAttribute("aria-disabled");
    button.setAttribute("aria-label", successLabel);
    button.setAttribute("aria-disabled", "true");
    button.dataset.deliveryConfirmed = "true";
    return () => {
      restoreAttribute(button, "aria-label", previous);
      restoreAttribute(button, "aria-disabled", previousDisabled);
      delete button.dataset.deliveryConfirmed;
    };
  }, [button, checked, successLabel]);
  return /*#__PURE__*/ _jsxs("span", {
    ref: marker,
    "data-delivery-signal": "",
    "data-delivery-quiet": quiet ? "true" : "false",
    "data-delivery-status": status,
    "data-delivery-duration": duration,
    "data-delivery-demo": demo ? "true" : "false",
    "aria-hidden": "true",
    style: {
      ...style,
      position: status === "success" ? "absolute" : "relative",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: status === "success" ? 1 : 24,
      height: status === "success" ? 1 : 24,
      flexShrink: 0,
      color: iconColor,
      pointerEvents: "none",
      userSelect: "none",
    },
    children: [
      !isStatic &&
        button &&
        /*#__PURE__*/ createPortal(
          /*#__PURE__*/ _jsx(_Fragment, {
            children: /*#__PURE__*/ _jsx(motion.span, {
              "data-delivery-success-panel": "",
              "aria-hidden": "true",
              initial: false,
              animate: { opacity: checked ? 1 : 0 },
              transition: { duration: quiet || checked ? 0 : 0.2, ease: [0.25, 0.1, 0.25, 1] },
              style: {
                ...labelStyle,
                position: "absolute",
                inset: 0,
                borderRadius: "inherit",
                background: successColor,
                color: successTextColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 10px",
                overflow: "hidden",
                pointerEvents: "none",
                userSelect: "none",
                zIndex: 2,
              },
              children: /*#__PURE__*/ _jsx("span", {
                style: { overflow: "hidden", display: "block", maxWidth: "100%", padding: "3px 0" },
                children: /*#__PURE__*/ _jsx(motion.span, {
                  initial: false,
                  animate: {
                    y: checked ? 0 : 5,
                    opacity: checked ? 1 : 0,
                    filter: checked ? "blur(0px)" : "blur(1.5px)",
                  },
                  transition: {
                    duration: quiet ? 0 : checked ? 0.9 : 0.2,
                    delay: checked && !quiet ? 0.3 : 0,
                    ease: [0.25, 0.1, 0.25, 1],
                  },
                  style: {
                    display: "block",
                    font: "inherit",
                    letterSpacing: "inherit",
                    lineHeight: "1.25",
                    textAlign: "center",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  },
                  children: successLabel,
                }),
              }),
            }),
          }),
          button,
        ),
      /*#__PURE__*/ _jsx("img", {
        src: imageSrc || WAX_TEXTURE,
        alt: "",
        width: "1",
        height: "1",
        draggable: false,
        style: { position: "absolute", opacity: 0, pointerEvents: "none" },
      }),
      /*#__PURE__*/ _jsx("style", {
        children: `
        button:has([data-delivery-signal]):focus-visible { outline:2px solid currentColor; outline-offset:4px; }
        button[data-delivery-confirmed="true"] { cursor:default!important; }
        `,
      }),
      status !== "success" &&
        /*#__PURE__*/ _jsx(PostalButtonIcon, {
          active: activeHover && !checked,
          quiet: quiet,
          filled: filled,
          ready: ready,
          checked: checked,
        }),
    ],
  });
} // The button stays stationary; only this small postal scene loops on hover or focus.
function PostalButtonIcon({ active, quiet, filled, ready, checked }) {
  const uid = React.useId().replace(/:/g, "");
  const loop = {
    duration: 2.65,
    times: [0, 0.14, 0.26, 0.6, 0.72, 0.88, 1],
    repeat: Infinity,
    ease: "easeInOut",
  };
  const rest = { duration: quiet ? 0 : 0.18 };
  return /*#__PURE__*/ _jsxs("svg", {
    "data-delivery-glyph": "",
    "data-postal-loop": active ? "true" : "false",
    width: "24",
    height: "24",
    viewBox: "0 2 32 28",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.65",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: { overflow: "visible", pointerEvents: "none", flexShrink: 0 },
    children: [
      /*#__PURE__*/ _jsx("defs", {
        children: /*#__PURE__*/ _jsx("clipPath", {
          id: `postal-icon-entry-${uid}`,
          children: /*#__PURE__*/ _jsx("rect", { x: "0", y: "10", width: "18.2", height: "14" }),
        }),
      }),
      /*#__PURE__*/ _jsx(motion.g, {
        initial: false,
        animate: { opacity: active || checked ? 0 : 1, scale: active ? 0.85 : 1 },
        transition: rest,
        style: { transformOrigin: "16px 16px" },
        children: /*#__PURE__*/ _jsxs("g", {
          transform: "translate(0 -3)",
          children: [
            /*#__PURE__*/ _jsx("rect", { x: "5", y: "12", width: "22", height: "14", rx: "3" }),
            /*#__PURE__*/ _jsx(motion.path, {
              d: "M11 10V7h10v3M14 9h4",
              initial: false,
              animate: { y: filled ? 0 : 3, opacity: filled ? 1 : 0 },
              transition: { duration: quiet ? 0 : 0.24 },
            }),
            /*#__PURE__*/ _jsx(motion.path, {
              initial: false,
              animate: { d: ready ? "M6 13l10 4 10-4" : "M6 13l10 7 10-7" },
              transition: { duration: quiet ? 0 : 0.25 },
            }),
          ],
        }),
      }),
      /*#__PURE__*/ _jsxs(motion.g, {
        initial: false,
        animate: { opacity: active ? 1 : 0 },
        transition: rest,
        children: [
          /*#__PURE__*/ _jsx("path", {
            d: "M18 21h12v-9a4.5 4.5 0 0 0-4.5-4.5H22a4 4 0 0 0-4 4.5M22 7.5c2.5 0 4 1.8 4 4.5v9M24 21v6M21 27h6",
            strokeOpacity: "1",
          }),
          /*#__PURE__*/ _jsx(motion.path, {
            d: "M27 17V5h4v4h-4",
            initial: false,
            animate: { rotate: active ? [-65, -65, -65, -65, 0, 0, -65] : -65 },
            transition: active ? loop : rest,
            style: { transformOrigin: "27px 17px" },
          }),
          /*#__PURE__*/ _jsx("g", {
            clipPath: `url(#postal-icon-entry-${uid})`,
            children: /*#__PURE__*/ _jsxs(motion.g, {
              initial: false,
              animate: {
                x: active ? [0, 0, 1, 18, 18, 18, 0] : 0,
                opacity: active ? [0, 1, 1, 1, 0, 0, 0] : 0,
              },
              transition: active ? loop : rest,
              children: [
                /*#__PURE__*/ _jsx("rect", {
                  x: "1",
                  y: "13.5",
                  width: "10",
                  height: "7",
                  rx: "1.2",
                }),
                /*#__PURE__*/ _jsx("path", { d: "m2 14.5 4 3 4-3", strokeWidth: "1.4" }),
              ],
            }),
          }),
          /*#__PURE__*/ _jsx(motion.path, {
            initial: false,
            animate: {
              d: active
                ? [
                    "M18 12L18 21",
                    "M10 23L18 21",
                    "M10 23L18 21",
                    "M10 23L18 21",
                    "M18 12L18 21",
                    "M18 12L18 21",
                    "M18 12L18 21",
                  ]
                : "M18 12L18 21",
            },
            transition: active ? loop : rest,
          }),
        ],
      }),
      /*#__PURE__*/ _jsx(motion.path, {
        d: "m8 16 5 5L25 9",
        initial: false,
        animate: { pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 },
        transition: { duration: quiet ? 0 : 0.3 },
      }),
    ],
  });
}
const SR = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0,0,0,0)",
  whiteSpace: "nowrap",
  border: 0,
  pointerEvents: "none",
};
const initialBounds = {
  left: 0,
  top: 0,
  width: 560,
  height: 250,
  radius: 28,
  shadow: "0 16px 40px -20px rgba(24,22,20,.3)",
  border: "1px solid #E9E8E5",
};
function formWithin(root) {
  return root?.tagName === "FORM" ? root : (root?.querySelector("form") ?? null);
}
function restoreAttribute(element, name, value) {
  if (value === null) element.removeAttribute(name);
  else element.setAttribute(name, value);
} // Apply to the native Form layer inside a relative Frame with visible overflow.
// The native form stays mounted, retains its layout space, and owns submission.
export function withDelivery(Component) {
  // Keep the native input owner stable while the delivery overlay updates.
  const NativeForm = /*#__PURE__*/ React.memo(Component);
  return /*#__PURE__*/ React.forwardRef(function NativeDelivery(props, forwardedRef) {
    const isStatic = useIsStaticRenderer(),
      systemReduced = useReducedMotion();
    const root = React.useRef(null);
    const [element, setElement] = React.useState(null);
    const [host, setHost] = React.useState(null);
    const [bounds, setBounds] = React.useState(initialBounds);
    const boundsRef = React.useRef(bounds);
    const [scene, setScene] = React.useState(null);
    const [announcement, setAnnouncement] = React.useState("");
    const progress = useMotionValue(0);
    const config = React.useRef(DEFAULTS);
    const previousStatus = React.useRef("idle");
    const active = React.useRef(null);
    const sequence = React.useRef(0);
    const snapshot = React.useRef(null);
    const animation = React.useRef(null);
    const alive = React.useRef(true);
    const reducedRef = React.useRef(!!systemReduced);
    reducedRef.current = !!systemReduced;
    const reportHandler = React.useRef(() => {});
    const report = React.useCallback((status, next) => reportHandler.current(status, next), []);
    const value = React.useMemo(() => ({ report }), [report]);
    const mergedRef = React.useCallback(
      (node) => {
        root.current = node;
        setElement(node);
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      },
      [forwardedRef],
    );
    function measure(form) {
      const css = getComputedStyle(form);
      const next = {
        left: form.offsetLeft,
        top: form.offsetTop,
        width: form.offsetWidth,
        height: form.offsetHeight,
        radius: parseFloat(css.borderTopLeftRadius) || 0,
        shadow: css.boxShadow,
        border: css.border,
      };
      boundsRef.current = next;
      setBounds((old) => (Object.keys(next).every((k) => old[k] === next[k]) ? old : next));
    }
    function restore() {
      const saved = snapshot.current;
      snapshot.current = null;
      if (!saved) return;
      restoreAttribute(saved.form, "style", saved.style);
      restoreAttribute(saved.form, "inert", saved.inert);
      restoreAttribute(saved.form, "aria-hidden", saved.hidden);
      restoreAttribute(saved.form, "aria-busy", saved.busy); // Keep keyboard position when inert temporarily removed focus. Never steal
      // focus if the visitor moved elsewhere while the delivery was pending.
      if (
        saved.focused?.isConnected &&
        (document.activeElement === document.body || document.activeElement === saved.form)
      )
        saved.focused.focus({ preventScroll: true });
    }
    function move(to, seconds) {
      animation.current?.stop();
      return new Promise((resolve) => {
        let finished = false;
        const finish = (ok) => {
          if (finished) return;
          finished = true;
          if (animation.current === job) animation.current = null;
          resolve(ok);
        };
        const controls = animate(progress, to, {
          duration: Math.max(0.01, seconds),
          ease: "linear",
          onComplete: () => finish(true),
        });
        const job = {
          stop: () => {
            controls.stop();
            finish(false);
          },
        };
        animation.current = job;
      });
    }
    function stopCurrent() {
      sequence.current++;
      animation.current?.stop();
      active.current?.release?.();
      active.current = null;
    }
    async function fail() {
      if (!active.current) {
        if (alive.current) setAnnouncement("Your message could not be sent. Please try again.");
        return;
      }
      const reduced = active.current.reduced;
      stopCurrent();
      const id = sequence.current;
      if (!(await move(0, reduced ? 0.12 : 0.4)) || id !== sequence.current) return;
      restore();
      if (alive.current) {
        setScene(null);
        setAnnouncement("Your message could not be sent. Your entries are still available.");
      }
    }
    async function begin(demo, successAlready = false) {
      const form = formWithin(root.current);
      if (active.current || snapshot.current || isStatic || !form?.parentElement || !alive.current)
        return;
      const next = {
        ...config.current,
        duration: Math.max(0.5, config.current.duration),
        flight: Math.max(0.1, config.current.flight),
        demo,
      };
      const run = {
        id: ++sequence.current,
        config: next,
        reduced: next.reducedMotion || reducedRef.current,
        terminal: demo || successAlready ? "success" : null,
        release: null,
      };
      active.current = run;
      delete form.dataset.deliveryCompletedAt;
      form.dispatchEvent(new Event("delivery-start"));
      const css = getComputedStyle(form);
      measure(form);
      setHost(form.parentElement);
      snapshot.current = {
        form,
        style: form.getAttribute("style"),
        inert: form.getAttribute("inert"),
        hidden: form.getAttribute("aria-hidden"),
        busy: form.getAttribute("aria-busy"),
        transform: css.transform === "none" ? "" : css.transform,
        opacity: Number(css.opacity),
        focused: form.contains(document.activeElement) ? document.activeElement : null,
      };
      form.setAttribute("inert", "");
      form.setAttribute("aria-busy", "true");
      form.style.transformOrigin = "50% 50%";
      form.style.willChange = "transform, opacity";
      form.style.transition = "none";
      setAnnouncement(demo ? "Previewing delivery. No message is sent." : "Sending your message.");
      progress.set(0);
      setScene(run.reduced ? null : next);
      if (!(await move(0.46, run.reduced ? 0.12 : next.duration * 0.34)) || active.current !== run)
        return;
      if (!run.terminal) {
        setAnnouncement("Waiting for delivery confirmation.");
        await new Promise((resolve) => {
          run.release = resolve;
          if (run.terminal || active.current !== run) resolve();
        });
        run.release = null;
      }
      if (active.current !== run || !alive.current) return;
      if (
        !(await move(run.reduced ? 0 : 1, run.reduced ? 0.15 : next.duration * 0.66)) ||
        active.current !== run
      )
        return;
      if (!run.reduced && (!(await move(1.08, 0.7)) || active.current !== run)) return;
      restore();
      active.current = null;
      form.dataset.deliveryCompletedAt = String(Date.now());
      form.dispatchEvent(new Event("delivery-complete"));
      setAnnouncement(
        demo
          ? "Delivery preview complete. No message was sent."
          : "Your message was sent successfully.",
      );
    }
    reportHandler.current = (status, next) => {
      config.current = next;
      if (isStatic || status === previousStatus.current) return;
      previousStatus.current = status;
      if (next.demo) return;
      if (status === "pending") {
        void begin(false);
        return;
      }
      if (status === "error") {
        void fail();
        return;
      }
      if (status === "success") {
        if (active.current) {
          active.current.terminal = "success";
          active.current.release?.();
        } else void begin(false, true);
      }
    };
    React.useEffect(
      () =>
        progress.on("change", (p) => {
          const saved = snapshot.current;
          if (!saved) return;
          const run = active.current;
          const reduced = run?.reduced ?? (config.current.reducedMotion || reducedRef.current);
          const returning = !reduced && p >= 1.01;
          if (returning && run && !saved.form.dataset.deliveryCompletedAt) {
            saved.form.dataset.deliveryCompletedAt = String(Date.now());
            saved.form.dispatchEvent(new Event("delivery-complete"));
          }
          saved.form.style.opacity = String(
            saved.opacity *
              (returning ? soft(range(p, 1.01, 1.08)) : 1 - smooth(range(p, 0.08, 0.18))),
          );
          if (!reduced) {
            const q = pose(Math.min(p, 0.46), boundsRef.current.width);
            saved.form.style.transform = returning
              ? saved.transform
              : `${saved.transform} translate3d(${q.x}px,${q.y}px,0) rotate(${q.rotate}deg) scale(${q.scale}) perspective(1200px) rotateX(${q.rx}deg)`;
          }
          if (p >= 0.18 && !returning) saved.form.setAttribute("aria-hidden", "true");
          else restoreAttribute(saved.form, "aria-hidden", saved.hidden);
        }),
      [progress],
    );
    React.useEffect(() => {
      const form = formWithin(element);
      if (isStatic || !form?.parentElement) return;
      const parent = form.parentElement;
      setHost(parent);
      measure(form);
      const observer = new ResizeObserver(() => {
        if (form.isConnected) measure(form);
      });
      observer.observe(form);
      observer.observe(parent);
      const block = (event) => {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      };
      const submitButton = (target) => {
        const button = target instanceof Element ? target.closest("button") : null;
        return button &&
          button.closest("form") === form &&
          (button.type === "submit" || button.querySelector("[data-delivery-signal]"))
          ? button
          : null;
      };
      const click = (event) => {
        if (!submitButton(event.target)) return;
        if (
          active.current ||
          snapshot.current ||
          form.querySelector('[data-delivery-confirmed="true"]')
        ) {
          block(event);
          return;
        }
        if (config.current.demo) {
          block(event);
          void begin(true);
        }
      };
      const submit = (event) => {
        if (event.target !== form) return;
        if (
          active.current ||
          snapshot.current ||
          form.querySelector('[data-delivery-confirmed="true"]')
        ) {
          block(event);
          return;
        }
        if (config.current.demo) {
          block(event);
          void begin(true);
        }
      };
      const keydown = (event) => {
        if (
          !config.current.demo ||
          event.isComposing ||
          event.altKey ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey
        )
          return;
        const target = event.target;
        const buttonKey = !!submitButton(target) && (event.key === "Enter" || event.key === " ");
        const inputKey =
          event.key === "Enter" &&
          target instanceof HTMLInputElement &&
          target.closest("form") === form &&
          !["button", "submit", "reset", "checkbox", "radio", "file", "range", "color"].includes(
            target.type,
          );
        if (!buttonKey && !inputKey) return;
        block(event);
        if (
          !event.repeat &&
          !active.current &&
          !snapshot.current &&
          !form.querySelector('[data-delivery-confirmed="true"]')
        )
          void begin(true);
      };
      const keyup = (event) => {
        if (
          config.current.demo &&
          submitButton(event.target) &&
          (event.key === "Enter" || event.key === " ")
        )
          block(event);
      };
      form.addEventListener("click", click, true);
      form.addEventListener("submit", submit, true);
      form.addEventListener("keydown", keydown, true);
      form.addEventListener("keyup", keyup, true);
      return () => {
        observer.disconnect();
        form.removeEventListener("click", click, true);
        form.removeEventListener("submit", submit, true);
        form.removeEventListener("keydown", keydown, true);
        form.removeEventListener("keyup", keyup, true);
      };
    }, [element, isStatic]);
    React.useEffect(() => {
      alive.current = true;
      return () => {
        alive.current = false;
        stopCurrent();
        restore();
      };
    }, []);
    return /*#__PURE__*/ _jsxs(DeliveryContext.Provider, {
      value: value,
      children: [
        /*#__PURE__*/ _jsx(NativeForm, { ...props, ref: mergedRef }),
        !isStatic &&
          host &&
          /*#__PURE__*/ createPortal(
            /*#__PURE__*/ _jsxs(_Fragment, {
              children: [
                /*#__PURE__*/ _jsx("span", {
                  role: "status",
                  "aria-live": "polite",
                  "aria-atomic": "true",
                  style: SR,
                  children: announcement,
                }),
                scene &&
                  /*#__PURE__*/ _jsx(Envelope, {
                    progress: progress,
                    bounds: bounds,
                    config: scene,
                  }),
              ],
            }),
            host,
          ),
      ],
    });
  });
} // Project each paper face into a single SVG plane. Both sides stay visible as
// the folds pass through their edge: no coplanar CSS layers or backface switches.
function postalSideFold(degrees, right) {
  const theta = (degrees * Math.PI) / 180,
    hingeX = right ? 1e3 : 0;
  const points = right
    ? [
        [1e3, 0],
        [450, 318],
        [1e3, 600],
      ]
    : [
        [0, 0],
        [550, 318],
        [0, 600],
      ];
  return (
    points
      .map(([x, y], i) => {
        const dx = x - hingeX,
          depth = -dx * Math.sin(theta),
          perspective = 1800 / (1800 - depth);
        return `${i ? "L" : "M"}${hingeX + dx * Math.cos(theta) * perspective},${300 + (y - 300) * perspective}`;
      })
      .join(" ") + " Z"
  );
}
function postalTopFold(degrees) {
  const theta = (degrees * Math.PI) / 180;
  return (
    [
      [0, 0],
      [1e3, 0],
      [520, 390],
      [500, 398],
      [480, 390],
    ]
      .map(([x, y], i) => {
        const perspective = 1800 / (1800 - y * Math.sin(theta));
        return `${i ? "L" : "M"}${500 + (x - 500) * perspective},${y * Math.cos(theta) * perspective}`;
      })
      .join(" ") + " Z"
  );
}
function Envelope({ progress: p, bounds: b, config: c }) {
  const uid = React.useId().replace(/:/g, "");
  const leftGradient = `postal-left-${uid}`,
    rightGradient = `postal-right-${uid}`,
    topGradient = `postal-top-${uid}`,
    pocketGradient = `postal-pocket-${uid}`;
  const paperTransform = useTransform(p, (v) => {
    if (v <= 0.46) {
      const q = pose(v, b.width);
      return `translate3d(0,${q.y}px,0) rotate(${q.rotate}deg) scale(${q.scale}) perspective(1200px) rotateX(${q.rx}deg)`;
    } // Project the letter above the mailbox floor with clearance for the open door. Its leading edge is
    // parallel to the opening and moves along the depth of the steel shell.
    const t = smooth(range(v, 0.49, 0.6)),
      unit = b.width / 600;
    const depth = mix(v, [0.735, 0.875], [-225, 90]),
      h = Math.min(b.width * 0.54, 250);
    const a = lerp(0.62 * Math.cos(-Math.PI / 90), 0.15, t);
    const bb = lerp(0.62 * Math.sin(-Math.PI / 90), 16 / 600, t);
    const c = lerp(-0.62 * Math.sin(-Math.PI / 90), (-100 * unit) / h, t);
    const d = lerp(0.62 * Math.cos(-Math.PI / 90), (((100 * 40) / 155) * unit) / h, t);
    const lift = 48 - 36 * smooth(range(depth, 20, 90));
    return `matrix(${a},${bb},${c},${d},${t * (24 + depth) * unit},${t * (64.6 - lift - (depth * 40) / 155) * unit})`;
  });
  const height = useTransform(p, (v) =>
      mix(v, [0, 0.1, 0.32], [b.height, b.height, Math.min(b.width * 0.54, 250)]),
    ),
    marginTop = useTransform(height, (v) => -v / 2);
  const faceOpacity = useTransform(p, [0, 0.1, 0.2, 1], [0, 0, 1, 1]),
    cardOpacity = useTransform(p, [0, 0.08, 0.18, 0.95, 0.965, 1], [0, 0, 1, 1, 0, 0]);
  const leftPath = useTransform(p, (v) =>
    postalSideFold(mix(v, [0, 0.13, 0.27], [110, 110, 0]), false),
  );
  const rightPath = useTransform(p, (v) =>
    postalSideFold(mix(v, [0, 0.16, 0.3], [-110, -110, 0]), true),
  );
  const topPath = useTransform(p, (v) =>
    postalTopFold(mix(v, [0, 0.23, 0.4], [178, 178, 0], soft)),
  );
  const topShade = useTransform(p, (v) =>
    mix(v, [0, 0.23, 0.31, 0.4], [0.025, 0.025, 0.13, 0.025]),
  ); // Ease the material onto the closing flap, then let the small press settle.
  // The seal and paper share one contact beat instead of two abrupt scale rebounds.
  const sealScale = useTransform(p, (v) =>
    mix(v, [0, 0.35, 0.405, 0.426, 0.46], [1.035, 1.035, 1, 0.985, 1], soft),
  );
  const sealOpacity = useTransform(p, (v) => mix(v, [0, 0.35, 0.401, 1], [0, 0, 1, 1], soft));
  const sealY = useTransform(p, (v) =>
    mix(v, [0, 0.35, 0.405, 0.426, 0.46], [-9, -9, 0, 0.65, 0], soft),
  );
  const paperShadow = useTransform(p, (v) =>
    v < 0.32
      ? b.shadow
      : `0 ${mix(v, [0.32, 0.6, 0.78, 1], [12, 10, 5, 4])}px ${mix(v, [0.32, 0.6, 0.78, 1], [22, 18, 10, 9])}px -7px rgba(24,22,20,${0.25 * (1 - smooth(range(v, 0.49, 0.6)))}),0 1px 2px rgba(24,22,20,${0.09 * (1 - smooth(range(v, 0.49, 0.6)))})`,
  );
  const rounding = useTransform(p, (v) => mix(v, [0, 0.15, 0.33], [b.radius, b.radius, 7]));
  const radiusX = useTransform(rounding, (v) => (v / Math.max(1, b.width)) * 1e3);
  const radiusY = useTransform(
    p,
    (v) =>
      (mix(v, [0, 0.15, 0.33], [b.radius, b.radius, 7]) /
        Math.max(1, mix(v, [0, 0.1, 0.32], [b.height, b.height, Math.min(b.width * 0.54, 250)]))) *
      600,
  );
  const stageOpacity = 1;
  const stageScale = useTransform(p, (v) =>
    mix(v, [0, 0.46, 0.61], [1, 1, Math.max(0.65, Math.min(1.05, c.flight))]),
  );
  const mailboxOpacity = useTransform(p, (v) => smooth(range(v, 0.58, 0.64)));
  const mailboxX = useTransform(p, (v) => mix(v, [0.58, 0.64], [16, 0]));
  const mailboxY = useTransform(p, (v) => mix(v, [0.58, 0.64], [5, 0]));
  const interiorDepth = useTransform(
    p,
    (v) => `${clamp((mix(v, [0.735, 0.875], [-225, 90]) + 50) / 100) * 100}%`,
  );
  const border = "rgba(24,22,20,.12)";
  return /*#__PURE__*/ _jsx("div", {
    "aria-hidden": "true",
    style: {
      position: "absolute",
      left: b.left,
      top: b.top,
      width: b.width,
      height: b.height,
      pointerEvents: "none",
      userSelect: "none",
      overflow: "visible",
      perspective: 1200,
      zIndex: 20,
    },
    children: /*#__PURE__*/ _jsxs(motion.div, {
      style: {
        position: "absolute",
        inset: 0,
        opacity: stageOpacity,
        scale: stageScale,
        transformOrigin: "50% 50%",
      },
      children: [
        /*#__PURE__*/ _jsx(motion.div, {
          style: {
            position: "absolute",
            left: 0,
            top: b.height / 2 - b.width / 3,
            width: b.width,
            height: (b.width * 2) / 3,
            opacity: mailboxOpacity,
            x: mailboxX,
            y: mailboxY,
            zIndex: 0,
          },
          children: /*#__PURE__*/ _jsx(MailboxArtwork, {
            progress: p,
            color: c.mailbox,
            flagColor: c.seal,
            layer: "back",
          }),
        }),
        /*#__PURE__*/ _jsxs(motion.div, {
          style: {
            position: "absolute",
            left: 0,
            top: "50%",
            width: "100%",
            height,
            marginTop,
            transform: paperTransform,
            zIndex: 1,
            opacity: cardOpacity,
            background: c.paper,
            border: b.border,
            borderRadius: rounding,
            boxShadow: paperShadow,
            transformOrigin: "50% 50%",
            boxSizing: "border-box",
            willChange: "transform",
          },
          children: [
            /*#__PURE__*/ _jsxs(motion.svg, {
              viewBox: "0 0 1000 600",
              preserveAspectRatio: "none",
              width: "100%",
              height: "100%",
              style: { position: "absolute", inset: 0, overflow: "visible", opacity: faceOpacity },
              children: [
                /*#__PURE__*/ _jsxs("defs", {
                  children: [
                    /*#__PURE__*/ _jsxs("linearGradient", {
                      id: leftGradient,
                      x1: "0",
                      y1: "0",
                      x2: "1",
                      y2: ".5",
                      children: [
                        /*#__PURE__*/ _jsx("stop", { stopColor: "#181614", stopOpacity: "0" }),
                        /*#__PURE__*/ _jsx("stop", {
                          offset: "1",
                          stopColor: "#181614",
                          stopOpacity: ".065",
                        }),
                      ],
                    }),
                    /*#__PURE__*/ _jsxs("linearGradient", {
                      id: rightGradient,
                      x1: "1",
                      y1: "0",
                      x2: "0",
                      y2: ".5",
                      children: [
                        /*#__PURE__*/ _jsx("stop", { stopColor: "#181614", stopOpacity: "0" }),
                        /*#__PURE__*/ _jsx("stop", {
                          offset: "1",
                          stopColor: "#181614",
                          stopOpacity: ".055",
                        }),
                      ],
                    }),
                    /*#__PURE__*/ _jsxs("linearGradient", {
                      id: topGradient,
                      x1: "0",
                      y1: "0",
                      x2: "0",
                      y2: "1",
                      children: [
                        /*#__PURE__*/ _jsx("stop", { stopColor: "#181614", stopOpacity: "0" }),
                        /*#__PURE__*/ _jsx("stop", {
                          offset: "1",
                          stopColor: "#181614",
                          stopOpacity: ".045",
                        }),
                      ],
                    }),
                    /*#__PURE__*/ _jsxs("linearGradient", {
                      id: pocketGradient,
                      x1: "0",
                      y1: "0",
                      x2: "0",
                      y2: "1",
                      children: [
                        /*#__PURE__*/ _jsx("stop", { stopColor: "#181614", stopOpacity: ".07" }),
                        /*#__PURE__*/ _jsx("stop", {
                          offset: ".5",
                          stopColor: "#181614",
                          stopOpacity: "0",
                        }),
                        /*#__PURE__*/ _jsx("stop", {
                          offset: "1",
                          stopColor: "#181614",
                          stopOpacity: ".015",
                        }),
                      ],
                    }),
                  ],
                }),
                /*#__PURE__*/ _jsx(motion.rect, {
                  width: "1000",
                  height: "600",
                  rx: radiusX,
                  ry: radiusY,
                  fill: c.paper,
                }),
                /*#__PURE__*/ _jsx(motion.rect, {
                  width: "1000",
                  height: "600",
                  rx: radiusX,
                  ry: radiusY,
                  fill: "#181614",
                  fillOpacity: ".045",
                }),
                /*#__PURE__*/ _jsx(motion.path, {
                  d: leftPath,
                  fill: c.paper,
                  stroke: border,
                  strokeWidth: ".6",
                  vectorEffect: "non-scaling-stroke",
                  strokeLinejoin: "round",
                }),
                /*#__PURE__*/ _jsx(motion.path, { d: leftPath, fill: `url(#${leftGradient})` }),
                /*#__PURE__*/ _jsx(motion.path, {
                  d: rightPath,
                  fill: c.paper,
                  stroke: border,
                  strokeWidth: ".6",
                  vectorEffect: "non-scaling-stroke",
                  strokeLinejoin: "round",
                }),
                /*#__PURE__*/ _jsx(motion.path, { d: rightPath, fill: `url(#${rightGradient})` }),
                /*#__PURE__*/ _jsx("path", {
                  d: "M0 592 L0 586 L480 259 Q500 245 520 259 L1000 586 L1000 592 Q1000 600 992 600 L8 600 Q0 600 0 592Z",
                  fill: c.paper,
                }),
                /*#__PURE__*/ _jsx("path", {
                  d: "M0 592 L0 586 L480 259 Q500 245 520 259 L1000 586 L1000 592 Q1000 600 992 600 L8 600 Q0 600 0 592Z",
                  fill: `url(#${pocketGradient})`,
                }),
                /*#__PURE__*/ _jsx("path", {
                  d: "M0 586 L480 259 Q500 245 520 259 L1000 586",
                  fill: "none",
                  stroke: "rgba(24,22,20,.11)",
                  strokeWidth: ".65",
                  vectorEffect: "non-scaling-stroke",
                }),
                /*#__PURE__*/ _jsx("path", {
                  d: "M3 589 L482 262 Q500 249 518 262 L997 589",
                  fill: "none",
                  stroke: "rgba(255,255,255,.65)",
                  strokeWidth: ".65",
                  vectorEffect: "non-scaling-stroke",
                }),
                /*#__PURE__*/ _jsx(motion.path, {
                  d: topPath,
                  fill: c.paper,
                  stroke: "rgba(24,22,20,.14)",
                  strokeWidth: ".75",
                  vectorEffect: "non-scaling-stroke",
                  strokeLinejoin: "round",
                }),
                /*#__PURE__*/ _jsx(motion.path, { d: topPath, fill: `url(#${topGradient})` }),
                /*#__PURE__*/ _jsx(motion.path, {
                  d: topPath,
                  fill: "#181614",
                  style: { fillOpacity: topShade },
                }),
                /*#__PURE__*/ _jsx("path", {
                  d: "M8 1 H992",
                  stroke: "rgba(255,255,255,.65)",
                  strokeWidth: ".7",
                  vectorEffect: "non-scaling-stroke",
                }),
              ],
            }),
            /*#__PURE__*/ _jsx(motion.div, {
              style: {
                position: "absolute",
                left: "50%",
                top: "63%",
                marginLeft: -c.sealSize / 2,
                marginTop: -c.sealSize / 2,
                width: c.sealSize,
                height: c.sealSize,
                scale: sealScale,
                y: sealY,
                opacity: sealOpacity,
                pointerEvents: "none",
              },
              children: /*#__PURE__*/ _jsx(WaxSeal, {
                color: c.seal,
                image: c.sealImage,
                size: c.sealSize,
              }),
            }),
            /*#__PURE__*/ _jsx(motion.div, {
              style: {
                position: "absolute",
                left: 0,
                top: 0,
                width: "100%",
                height: interiorDepth,
                borderRadius: "inherit",
                background:
                  "linear-gradient(to bottom,rgba(10,18,14,.16),rgba(10,18,14,.10) 70%,transparent)",
                pointerEvents: "none",
              },
            }),
          ],
        }),
        /*#__PURE__*/ _jsx(motion.div, {
          style: {
            position: "absolute",
            left: 0,
            top: b.height / 2 - b.width / 3,
            width: b.width,
            height: (b.width * 2) / 3,
            opacity: mailboxOpacity,
            x: mailboxX,
            y: mailboxY,
            zIndex: 2,
          },
          children: /*#__PURE__*/ _jsx(MailboxArtwork, {
            progress: p,
            color: c.mailbox,
            flagColor: c.seal,
            layer: "front",
          }),
        }),
      ],
    }),
  });
} // Original rendered wax material. The tonal map preserves highlights and lets
// Seal Color recolor the built-in wax; custom uploads keep their original colors.
function WaxSeal({ color, image, size }) {
  const id = React.useId().replace(/:/g, "");
  const [loaded, setLoaded] = React.useState(false);
  React.useEffect(() => {
    if (image?.src) return;
    let live = true;
    const texture = new window.Image();
    texture.onload = () => {
      if (live) setLoaded(true);
    };
    texture.src = WAX_TEXTURE;
    return () => {
      live = false;
      texture.onload = null;
    };
  }, [image?.src]);
  if (image?.src || !loaded)
    return /*#__PURE__*/ _jsx(VectorWaxSeal, { color: color, image: image, size: size });
  const tone = Color(color || "#A82B32");
  const channel = (value) => Math.max(0, Math.min(1, value / 255));
  return /*#__PURE__*/ _jsxs("svg", {
    "aria-hidden": "true",
    focusable: "false",
    width: size,
    height: size,
    viewBox: "0 0 100 100",
    style: {
      display: "block",
      overflow: "visible",
      pointerEvents: "none",
      userSelect: "none",
      opacity: Math.max(0, Math.min(1, tone.a)),
    },
    children: [
      /*#__PURE__*/ _jsx("defs", {
        children: /*#__PURE__*/ _jsxs("filter", {
          id: `wax-tone-${id}`,
          x: "-5%",
          y: "-5%",
          width: "110%",
          height: "110%",
          colorInterpolationFilters: "sRGB",
          children: [
            /*#__PURE__*/ _jsx("feColorMatrix", { type: "saturate", values: "0" }),
            /*#__PURE__*/ _jsxs("feComponentTransfer", {
              children: [
                /*#__PURE__*/ _jsx("feFuncR", {
                  type: "gamma",
                  amplitude: "1",
                  exponent: ".58",
                  offset: "0",
                }),
                /*#__PURE__*/ _jsx("feFuncG", {
                  type: "gamma",
                  amplitude: "1",
                  exponent: ".58",
                  offset: "0",
                }),
                /*#__PURE__*/ _jsx("feFuncB", {
                  type: "gamma",
                  amplitude: "1",
                  exponent: ".58",
                  offset: "0",
                }),
              ],
            }),
            /*#__PURE__*/ _jsxs("feComponentTransfer", {
              children: [
                /*#__PURE__*/ _jsx("feFuncR", {
                  type: "table",
                  tableValues: `0 ${channel(tone.r)} 1`,
                }),
                /*#__PURE__*/ _jsx("feFuncG", {
                  type: "table",
                  tableValues: `0 ${channel(tone.g)} 1`,
                }),
                /*#__PURE__*/ _jsx("feFuncB", {
                  type: "table",
                  tableValues: `0 ${channel(tone.b)} 1`,
                }),
              ],
            }),
          ],
        }),
      }),
      /*#__PURE__*/ _jsx("image", {
        href: WAX_TEXTURE,
        x: "0",
        y: "0",
        width: "100",
        height: "100",
        preserveAspectRatio: "xMidYMid meet",
        filter: `url(#wax-tone-${id})`,
      }),
    ],
  });
} // Internal artwork; keep the parent's existing color, image and size controls.
function VectorWaxSeal({ color, image, size }) {
  const uid = React.useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const id = (name) => `wax-refined-${uid}-${name}`;
  const url = (name) => `url(#${id(name)})`;
  const diameter = Number.isFinite(size) ? Math.max(1, size) : 64;
  const wax = color || "#A82B32";
  const style = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: diameter,
    height: diameter,
    flexShrink: 0,
    verticalAlign: "middle",
    pointerEvents: "none",
    userSelect: "none",
  };
  if (image?.src?.trim()) {
    return /*#__PURE__*/ _jsx("span", {
      "aria-hidden": "true",
      style: style,
      children: /*#__PURE__*/ _jsx("img", {
        src: image.src,
        alt: "",
        draggable: false,
        decoding: "async",
        width: diameter,
        height: diameter,
        style: {
          display: "block",
          width: "100%",
          height: "100%",
          objectFit: "contain",
          pointerEvents: "none",
          userSelect: "none",
        },
      }),
    });
  } // A few broad pools, rather than regular scallops, leave an uneven wax margin.
  const edge =
    "M48.2 6.2 C56.4 4.4 62.1 8.2 69.4 9.7 C78.2 11.5 82.3 18.2 85.3 25.1 C90.3 30.3 91.7 36.5 91.2 43.3 C94.2 51.4 91.7 58.3 88.7 64.4 C87.6 73.2 81.6 78.6 74.7 82.7 C69.7 88.9 62.4 90.2 55.4 89.8 C47.7 93.2 41.2 90.3 34.4 88.2 C25.5 87.3 20.3 81.8 17.2 75 C10.1 69.7 9.1 61.7 9.6 54.6 C6.2 47.2 8.9 40.5 11.1 34.3 C11.6 25.6 17.3 20.1 23.6 16.7 C29.3 9.4 37.6 7.9 43.3 8.1 C45.2 7.4 46.3 6.7 48.2 6.2Z";
  const well =
    "M49.3 16.2 C67.8 15.2 81.6 29.1 81.7 47.7 C82.4 66.3 69.4 80.5 50.4 80.9 C31.2 81.5 17.6 68 17.3 49.5 C16.7 31 30.4 17 49.3 16.2Z";
  const sprig = "M36.9 68.8 C39.9 56.7 48.2 40.7 60.6 28.9";
  const leaves =
    "M41.2 59.4 C34.3 59.5 30.7 54.2 31.9 47.3 C38.5 47.7 42.3 52.4 41.2 59.4Z M45.3 53.9 C51.7 46.3 57.2 45.1 63.9 46.7 C61.5 53.6 54.5 57.4 45.3 53.9Z M49.2 43.5 C41.8 42.5 38.1 36.7 39.6 30.1 C46.2 30.4 50.4 35.6 49.2 43.5Z M54.4 37.1 C57.2 29.8 62.3 26.9 68.1 28.1 C67.5 34.3 62.1 39 54.4 37.1Z";
  return /*#__PURE__*/ _jsx("span", {
    "aria-hidden": "true",
    style: style,
    children: /*#__PURE__*/ _jsxs("svg", {
      width: diameter,
      height: diameter,
      viewBox: "0 0 100 100",
      fill: "none",
      focusable: "false",
      style: { display: "block", overflow: "visible", pointerEvents: "none" },
      children: [
        /*#__PURE__*/ _jsxs("defs", {
          children: [
            /*#__PURE__*/ _jsxs("radialGradient", {
              id: id("surface"),
              cx: "25%",
              cy: "15%",
              r: "95%",
              children: [
                /*#__PURE__*/ _jsx("stop", { stopColor: "#F3D7CE", stopOpacity: ".14" }),
                /*#__PURE__*/ _jsx("stop", {
                  offset: ".42",
                  stopColor: "#F3D7CE",
                  stopOpacity: ".025",
                }),
                /*#__PURE__*/ _jsx("stop", {
                  offset: ".74",
                  stopColor: "#17070B",
                  stopOpacity: ".035",
                }),
                /*#__PURE__*/ _jsx("stop", {
                  offset: "1",
                  stopColor: "#17070B",
                  stopOpacity: ".23",
                }),
              ],
            }),
            /*#__PURE__*/ _jsxs("linearGradient", {
              id: id("edge"),
              x1: "13%",
              y1: "4%",
              x2: "78%",
              y2: "98%",
              children: [
                /*#__PURE__*/ _jsx("stop", { stopColor: "#E9BEB3", stopOpacity: ".24" }),
                /*#__PURE__*/ _jsx("stop", {
                  offset: ".44",
                  stopColor: "#E9BEB3",
                  stopOpacity: ".035",
                }),
                /*#__PURE__*/ _jsx("stop", {
                  offset: ".7",
                  stopColor: "#1B060A",
                  stopOpacity: ".09",
                }),
                /*#__PURE__*/ _jsx("stop", {
                  offset: "1",
                  stopColor: "#1B060A",
                  stopOpacity: ".28",
                }),
              ],
            }),
            /*#__PURE__*/ _jsxs("linearGradient", {
              id: id("pressed"),
              x1: "22%",
              y1: "0%",
              x2: "74%",
              y2: "100%",
              children: [
                /*#__PURE__*/ _jsx("stop", { stopColor: "#1B060A", stopOpacity: ".19" }),
                /*#__PURE__*/ _jsx("stop", {
                  offset: ".34",
                  stopColor: "#1B060A",
                  stopOpacity: ".045",
                }),
                /*#__PURE__*/ _jsx("stop", {
                  offset: ".75",
                  stopColor: "#F0C9BE",
                  stopOpacity: ".015",
                }),
                /*#__PURE__*/ _jsx("stop", {
                  offset: "1",
                  stopColor: "#F0C9BE",
                  stopOpacity: ".09",
                }),
              ],
            }),
            /*#__PURE__*/ _jsxs("linearGradient", {
              id: id("impression"),
              x1: "12%",
              y1: "0%",
              x2: "77%",
              y2: "100%",
              children: [
                /*#__PURE__*/ _jsx("stop", { stopColor: "#23070C", stopOpacity: ".26" }),
                /*#__PURE__*/ _jsx("stop", {
                  offset: ".65",
                  stopColor: "#23070C",
                  stopOpacity: ".12",
                }),
                /*#__PURE__*/ _jsx("stop", {
                  offset: "1",
                  stopColor: "#23070C",
                  stopOpacity: ".075",
                }),
              ],
            }),
          ],
        }),
        /*#__PURE__*/ _jsx("path", {
          d: edge,
          transform: "translate(.2 2.8)",
          fill: "#190A0D",
          fillOpacity: ".09",
        }),
        /*#__PURE__*/ _jsx("path", { d: edge, transform: "translate(0 1.5)", fill: wax }),
        /*#__PURE__*/ _jsx("path", {
          d: edge,
          transform: "translate(0 1.5)",
          fill: "#1B060A",
          fillOpacity: ".23",
        }),
        /*#__PURE__*/ _jsx("path", { d: edge, fill: wax }),
        /*#__PURE__*/ _jsx("path", { d: edge, fill: url("surface") }),
        /*#__PURE__*/ _jsx("path", { d: edge, stroke: url("edge"), strokeWidth: "1.2" }),
        /*#__PURE__*/ _jsx("path", {
          d: well,
          transform: "translate(.1 .75)",
          stroke: "#F0C9BE",
          strokeOpacity: ".1",
          strokeWidth: "2.2",
        }),
        /*#__PURE__*/ _jsx("path", { d: well, fill: wax }),
        /*#__PURE__*/ _jsx("path", {
          d: well,
          fill: url("pressed"),
          stroke: "#24080E",
          strokeOpacity: ".14",
          strokeWidth: "1.7",
        }),
        /*#__PURE__*/ _jsx("path", {
          d: "M20 47 C20.3 31.6 32.7 19 48.8 18.9 C60.1 18.2 69.5 22.6 75.7 30.7",
          stroke: "#21070C",
          strokeOpacity: ".09",
          strokeWidth: "2.6",
          strokeLinecap: "round",
        }),
        /*#__PURE__*/ _jsx("path", {
          d: "M26.6 71.7 C38.7 82.1 58.6 82 71.4 70.6",
          stroke: "#EDC4B9",
          strokeOpacity: ".14",
          strokeWidth: ".9",
          strokeLinecap: "round",
        }),
        /*#__PURE__*/ _jsxs("g", {
          transform: "translate(.4 .65)",
          children: [
            /*#__PURE__*/ _jsx("path", { d: leaves, fill: "#EDC4B9", fillOpacity: ".12" }),
            /*#__PURE__*/ _jsx("path", {
              d: sprig,
              stroke: "#EDC4B9",
              strokeOpacity: ".13",
              strokeWidth: "1.65",
              strokeLinecap: "round",
            }),
          ],
        }),
        /*#__PURE__*/ _jsx("path", { d: leaves, fill: wax }),
        /*#__PURE__*/ _jsx("path", { d: leaves, fill: url("impression") }),
        /*#__PURE__*/ _jsx("path", {
          d: sprig,
          stroke: "#25090F",
          strokeOpacity: ".27",
          strokeWidth: "1.65",
          strokeLinecap: "round",
        }),
        /*#__PURE__*/ _jsx("path", {
          d: "M35.2 51.3 L40.2 57.5 M48.1 53.2 L59.2 48.7 M42.4 33.8 L47.9 41.7 M57.1 35.7 L65 30.9",
          stroke: "#25090F",
          strokeOpacity: ".1",
          strokeWidth: ".7",
          strokeLinecap: "round",
        }),
        /*#__PURE__*/ _jsx("path", {
          d: "M15.2 32.6 C17.8 23.6 24.5 17.6 31.8 14.9 M72.4 78.9 C79 74.7 83.7 68.9 85.3 62.5",
          stroke: "#E8BEB2",
          strokeOpacity: ".095",
          strokeWidth: "1.5",
          strokeLinecap: "round",
        }),
      ],
    }),
  });
} // Two matching SVG layers let the letter pass between the dark interior and shell.
function MailboxArtwork({ progress, color, flagColor, layer }) {
  const id = React.useId().replace(/:/g, "");
  const ease = (v) => {
    const t = Math.max(0, Math.min(1, v));
    return t * t * (3 - 2 * t);
  };
  const angle = (p) =>
    (Math.PI / 180) * 96 * ease((p - 0.64) / 0.095) * (1 - ease((p - 0.875) / 0.07));
  const point = (u, v, theta) => {
    const depth = -(160 - v) * Math.sin(theta);
    return `${270 + 0.9 * u + depth * 0.62},${95 + 0.16 * u + 160 + (v - 160) * Math.cos(theta) - depth * 0.35}`;
  };
  const face = (theta, inset = 0) => {
    const k = 33.14,
      left = inset,
      right = 120 - inset,
      top = inset;
    const mid = 60,
      bottom = 160 - inset,
      r = 60 - inset;
    return `M${point(left, bottom, theta)} L${point(left, 60, theta)} C${point(left, 60 - k * (r / 60), theta)} ${point(mid - k * (r / 60), top, theta)} ${point(mid, top, theta)} C${point(mid + k * (r / 60), top, theta)} ${point(right, 60 - k * (r / 60), theta)} ${point(right, 60, theta)} L${point(right, bottom, theta)} Z`;
  };
  const door = useTransform(progress, (p) => face(angle(p)));
  const doorInset = useTransform(progress, (p) => face(angle(p), 5));
  const doorHighlight = useTransform(progress, (p) => {
    const a = angle(p);
    return `M${point(9, 149, a)} L${point(9, 60, a)} C${point(9, 33, a)} ${point(32, 9, a)} ${point(60, 9, a)}`;
  });
  const doorShade = useTransform(progress, (p) => 0.09 + 0.21 * Math.sin(angle(p)));
  const latch = useTransform(progress, (p) => {
    const a = angle(p);
    return `M${point(50, 18, a)} L${point(70, 18, a)} L${point(70, 27, a)} L${point(50, 27, a)} Z`;
  });
  const latchEdge = useTransform(progress, (p) => {
    const a = angle(p);
    return `M${point(52, 19, a)} L${point(68, 19, a)}`;
  });
  const flagPoint = (x, y, p) => {
    const a = (-76 * (1 - ease((p - 0.945) / 0.04)) * Math.PI) / 180;
    return `${470 + (x - 470) * Math.cos(a) - (y - 189) * Math.sin(a)},${189 + (x - 470) * Math.sin(a) + (y - 189) * Math.cos(a)}`;
  };
  const flagPath = (points, p, close = false) =>
    points.map(([x, y], i) => `${i ? "L" : "M"}${flagPoint(x, y, p)}`).join(" ") +
    (close ? " Z" : "");
  const flag = useTransform(progress, (p) =>
    flagPath(
      [
        [467, 190],
        [467, 116],
        [470, 113],
        [493, 107],
        [495, 109],
        [495, 128],
        [473, 133.5],
        [473, 190],
      ],
      p,
      true,
    ),
  );
  const flagHighlight = useTransform(progress, (p) =>
    flagPath(
      [
        [470, 188],
        [470, 117],
        [492, 111],
      ],
      p,
    ),
  );
  const flagEdge = useTransform(progress, (p) =>
    flagPath(
      [
        [473, 134],
        [492.5, 129],
      ],
      p,
    ),
  );
  const url = (name) => `url(#${id}-${name})`;
  const doorArtwork = /*#__PURE__*/ _jsxs(_Fragment, {
    children: [
      /*#__PURE__*/ _jsx(motion.path, {
        d: door,
        fill: color,
        stroke: "#14221B",
        strokeWidth: "1.7",
        strokeLinejoin: "round",
      }),
      /*#__PURE__*/ _jsx(motion.path, { d: door, fill: url("door") }),
      /*#__PURE__*/ _jsx(motion.path, { d: door, fill: "#07120C", style: { opacity: doorShade } }),
      /*#__PURE__*/ _jsx(motion.path, {
        d: doorInset,
        fill: "none",
        stroke: "white",
        strokeOpacity: ".13",
        strokeWidth: ".8",
      }),
      /*#__PURE__*/ _jsx(motion.path, {
        d: doorHighlight,
        fill: "none",
        stroke: "white",
        strokeOpacity: ".19",
        strokeWidth: ".8",
        strokeLinecap: "round",
      }),
      /*#__PURE__*/ _jsx(motion.path, {
        d: latch,
        fill: url("brass"),
        stroke: "#6B593A",
        strokeWidth: ".8",
        strokeLinejoin: "round",
      }),
      /*#__PURE__*/ _jsx(motion.path, {
        d: latchEdge,
        fill: "none",
        stroke: "#F2E3BD",
        strokeWidth: ".7",
        strokeLinecap: "round",
      }),
    ],
  });
  return /*#__PURE__*/ _jsxs("svg", {
    viewBox: "0 0 600 400",
    width: "100%",
    height: "100%",
    "aria-hidden": "true",
    focusable: "false",
    style: {
      overflow: "visible",
      pointerEvents: "none",
      userSelect: "none",
      position: "absolute",
      inset: 0,
    },
    children: [
      /*#__PURE__*/ _jsxs("defs", {
        children: [
          /*#__PURE__*/ _jsxs("linearGradient", {
            id: `${id}-roof`,
            x1: "341",
            y1: "84",
            x2: "454",
            y2: "216",
            gradientUnits: "userSpaceOnUse",
            children: [
              /*#__PURE__*/ _jsx("stop", { stopColor: "white", stopOpacity: ".23" }),
              /*#__PURE__*/ _jsx("stop", { offset: ".34", stopColor: "white", stopOpacity: ".10" }),
              /*#__PURE__*/ _jsx("stop", { offset: ".69", stopColor: "black", stopOpacity: ".03" }),
              /*#__PURE__*/ _jsx("stop", { offset: "1", stopColor: "black", stopOpacity: ".24" }),
            ],
          }),
          /*#__PURE__*/ _jsxs("linearGradient", {
            id: `${id}-side`,
            x1: "370",
            y1: "163",
            x2: "492",
            y2: "268",
            gradientUnits: "userSpaceOnUse",
            children: [
              /*#__PURE__*/ _jsx("stop", { stopColor: "white", stopOpacity: ".03" }),
              /*#__PURE__*/ _jsx("stop", { offset: "1", stopColor: "black", stopOpacity: ".31" }),
            ],
          }),
          /*#__PURE__*/ _jsxs("linearGradient", {
            id: `${id}-inside`,
            x1: "276",
            y1: "167",
            x2: "401",
            y2: "231",
            gradientUnits: "userSpaceOnUse",
            children: [
              /*#__PURE__*/ _jsx("stop", { stopColor: "#0C1413" }),
              /*#__PURE__*/ _jsx("stop", { offset: ".55", stopColor: "#111D1A" }),
              /*#__PURE__*/ _jsx("stop", { offset: "1", stopColor: "#263631" }),
            ],
          }),
          /*#__PURE__*/ _jsxs("linearGradient", {
            id: `${id}-door`,
            x1: "242",
            y1: "104",
            x2: "313",
            y2: "321",
            gradientUnits: "userSpaceOnUse",
            children: [
              /*#__PURE__*/ _jsx("stop", { stopColor: "white", stopOpacity: ".18" }),
              /*#__PURE__*/ _jsx("stop", {
                offset: ".48",
                stopColor: "white",
                stopOpacity: ".025",
              }),
              /*#__PURE__*/ _jsx("stop", { offset: "1", stopColor: "black", stopOpacity: ".21" }),
            ],
          }),
          /*#__PURE__*/ _jsxs("linearGradient", {
            id: `${id}-brass`,
            x1: "0",
            y1: "0",
            x2: "0",
            y2: "1",
            children: [
              /*#__PURE__*/ _jsx("stop", { stopColor: "#E6D5A4" }),
              /*#__PURE__*/ _jsx("stop", { offset: ".46", stopColor: "#B79B60" }),
              /*#__PURE__*/ _jsx("stop", { offset: "1", stopColor: "#806B44" }),
            ],
          }),
          /*#__PURE__*/ _jsxs("linearGradient", {
            id: `${id}-post`,
            x1: "411",
            y1: "270",
            x2: "438",
            y2: "270",
            gradientUnits: "userSpaceOnUse",
            children: [
              /*#__PURE__*/ _jsx("stop", { stopColor: "#958B77" }),
              /*#__PURE__*/ _jsx("stop", { offset: ".36", stopColor: "#A69B85" }),
              /*#__PURE__*/ _jsx("stop", { offset: "1", stopColor: "#756D5D" }),
            ],
          }),
          /*#__PURE__*/ _jsxs("radialGradient", {
            id: `${id}-ground`,
            children: [
              /*#__PURE__*/ _jsx("stop", { stopColor: "#17241F", stopOpacity: ".20" }),
              /*#__PURE__*/ _jsx("stop", {
                offset: ".5",
                stopColor: "#17241F",
                stopOpacity: ".075",
              }),
              /*#__PURE__*/ _jsx("stop", { offset: "1", stopColor: "#17241F", stopOpacity: "0" }),
            ],
          }),
        ],
      }),
      layer === "back"
        ? /*#__PURE__*/ _jsxs(_Fragment, {
            children: [
              /*#__PURE__*/ _jsx("ellipse", {
                cx: "414",
                cy: "357",
                rx: "132",
                ry: "23",
                fill: url("ground"),
              }),
              /*#__PURE__*/ _jsx("path", {
                d: "M411 245 L430 240 L445 249 L426 255 Z",
                fill: "#B0A38B",
              }),
              /*#__PURE__*/ _jsx("path", {
                d: "M411 245 L426 251 L426 352 L411 346 Z",
                fill: url("post"),
              }),
              /*#__PURE__*/ _jsx("path", {
                d: "M426 251 L442 247 L442 347 L426 352 Z",
                fill: "#716A5A",
              }),
              /*#__PURE__*/ _jsx("path", {
                d: "M415 269 L415 339 M422 286 L422 346",
                stroke: "#554F43",
                strokeOpacity: ".15",
                strokeWidth: "1",
              }),
              /*#__PURE__*/ _jsx("path", {
                d: "M387 261 L446 245 L469 250 L412 267 Z",
                fill: "#26352F",
              }),
              /*#__PURE__*/ _jsx("path", {
                d: "M412 267 L469 250 L469 256 L412 272 Z",
                fill: "#16221D",
              }),
              /*#__PURE__*/ _jsx("path", {
                d: "M387 261 L412 267 L412 272 L387 266 Z",
                fill: "#43534A",
              }),
              /*#__PURE__*/ _jsx("path", {
                d: "M270 155 L425 115 C425 81.86 449.174 59.298 479 64.6 L324 104.6 C294.174 99.298 270 121.86 270 155 Z",
                fill: color,
              }),
              /*#__PURE__*/ _jsx("path", {
                d: "M270 155 L425 115 C425 81.86 449.174 59.298 479 64.6 L324 104.6 C294.174 99.298 270 121.86 270 155 Z",
                fill: url("roof"),
              }),
              /*#__PURE__*/ _jsx("path", {
                d: "M270 255 L270 155 C270 121.86 294.174 99.298 324 104.6 C353.826 109.902 378 141.06 378 174.2 L378 274.2 Z",
                fill: url("inside"),
              }),
              /*#__PURE__*/ _jsx("path", {
                d: "M274 253 L371 269 L506 234 L410 217 Z",
                fill: "#314238",
              }),
              /*#__PURE__*/ _jsx("path", {
                d: "M280 251 L368 267 L501 233",
                fill: "none",
                stroke: "#526255",
                strokeWidth: "1",
                strokeOpacity: ".55",
              }),
              /*#__PURE__*/ _jsx("path", {
                d: "M283 155 C283 129 302 113 324 117 C346 121 365 146 365 173",
                fill: "none",
                stroke: "#526557",
                strokeWidth: "1.2",
                strokeOpacity: ".15",
              }),
              /*#__PURE__*/ _jsx("path", {
                d: "M270 255 L270 155 C270 121.86 294.174 99.298 324 104.6",
                fill: "none",
                stroke: "#15241D",
                strokeWidth: "6",
                strokeLinejoin: "round",
              }),
              /*#__PURE__*/ _jsx("path", {
                d: "M270 254 L270 155 C270 121.86 294.174 99.298 324 104.6",
                fill: "none",
                stroke: color,
                strokeWidth: "3.2",
                strokeLinejoin: "round",
              }),
              /*#__PURE__*/ _jsx("path", {
                d: "M271 152 C272 120 295 100.3 324 105.6",
                fill: "none",
                stroke: "white",
                strokeWidth: ".85",
                strokeOpacity: ".27",
              }),
            ],
          })
        : /*#__PURE__*/ _jsxs(_Fragment, {
            children: [
              /*#__PURE__*/ _jsx("path", {
                d: "M324 104.6 L479 64.6 C508.826 69.902 533 101.06 533 134.2 L378 174.2 C378 141.06 353.826 109.902 324 104.6 Z",
                fill: color,
              }),
              /*#__PURE__*/ _jsx("path", {
                d: "M324 104.6 L479 64.6 C508.826 69.902 533 101.06 533 134.2 L378 174.2 C378 141.06 353.826 109.902 324 104.6 Z",
                fill: url("roof"),
              }),
              /*#__PURE__*/ _jsx("path", {
                d: "M378 174.2 L533 134.2 L533 234.2 L378 274.2 Z",
                fill: color,
              }),
              /*#__PURE__*/ _jsx("path", {
                d: "M378 174.2 L533 134.2 L533 234.2 L378 274.2 Z",
                fill: url("side"),
              }),
              /*#__PURE__*/ _jsx("path", {
                d: "M529 133.4 L529 230.8 L381 269.1",
                fill: "none",
                stroke: "#070C0A",
                strokeWidth: "1.1",
                strokeOpacity: ".27",
              }),
              /*#__PURE__*/ _jsx("path", {
                d: "M378 270.3 L533 230.3",
                fill: "none",
                stroke: "white",
                strokeWidth: "1",
                strokeOpacity: ".13",
              }),
              /*#__PURE__*/ _jsx("path", {
                d: "M331 104 L482 65.2",
                fill: "none",
                stroke: "white",
                strokeWidth: "1",
                strokeOpacity: ".20",
              }),
              /*#__PURE__*/ _jsx("path", {
                d: "M324 104.6 C353.826 109.902 378 141.06 378 174.2 L378 274.2 L270 255",
                fill: "none",
                stroke: "#15241D",
                strokeWidth: "6",
                strokeLinejoin: "round",
              }),
              /*#__PURE__*/ _jsx("path", {
                d: "M324 104.6 C353.826 109.902 378 141.06 378 174.2 L378 273",
                fill: "none",
                stroke: color,
                strokeWidth: "3.2",
                strokeLinejoin: "round",
              }),
              /*#__PURE__*/ _jsx("path", {
                d: "M324 105.6 C352.5 110.7 376.7 142 377 172",
                fill: "none",
                stroke: "white",
                strokeWidth: ".85",
                strokeOpacity: ".27",
              }),
              doorArtwork,
              /*#__PURE__*/ _jsx("path", {
                d: "M283.5 257.4 L305.5 261.3 M341.5 267.7 L363.5 271.6",
                stroke: "#17261D",
                strokeWidth: "6",
                strokeLinecap: "round",
              }),
              /*#__PURE__*/ _jsx("path", {
                d: "M283.5 256.8 L305.5 260.7 M341.5 267.1 L363.5 271",
                stroke: "#6D7A6D",
                strokeWidth: "2",
                strokeLinecap: "round",
              }),
              /*#__PURE__*/ _jsxs("g", {
                children: [
                  /*#__PURE__*/ _jsx(motion.path, {
                    d: flag,
                    fill: flagColor,
                    stroke: "#612623",
                    strokeWidth: ".8",
                    strokeLinejoin: "round",
                  }),
                  /*#__PURE__*/ _jsx(motion.path, {
                    d: flagHighlight,
                    fill: "none",
                    stroke: "white",
                    strokeOpacity: ".22",
                    strokeWidth: "1.1",
                    strokeLinecap: "round",
                  }),
                  /*#__PURE__*/ _jsx(motion.path, {
                    d: flagEdge,
                    fill: "none",
                    stroke: "black",
                    strokeOpacity: ".12",
                    strokeWidth: ".7",
                  }),
                ],
              }),
              /*#__PURE__*/ _jsx("ellipse", {
                cx: "470",
                cy: "189",
                rx: "5",
                ry: "5.3",
                fill: "#17281D",
              }),
              /*#__PURE__*/ _jsx("ellipse", {
                cx: "470",
                cy: "189",
                rx: "3.1",
                ry: "3.3",
                fill: url("brass"),
              }),
              /*#__PURE__*/ _jsx("path", {
                d: "M468.7 189.7 L471.3 188.3",
                stroke: "#796640",
                strokeWidth: ".8",
                strokeLinecap: "round",
              }),
            ],
          }),
    ],
  });
}
