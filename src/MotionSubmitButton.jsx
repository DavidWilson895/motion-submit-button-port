import * as React from "react";
import { motion } from "framer-motion";
import DeliverySignal from "./NativeDelivery.jsx";

/**
 * MotionSubmitButton — standalone port of the Framer "Motion Submit Button · Submit".
 *
 * Faithful to the original in every visual respect:
 *   - pill button, 48px tall, 164px min width, 22px side padding, 8px gap
 *   - 24x24 postal glyph that loops on hover, lifts when the form is filled,
 *     and swaps to a checkmark once delivery completes
 *   - the success panel is painted by DeliverySignal itself (portal into the
 *     button element), exactly like the original
 *
 * What changed: Framer's `useVariantState` / `RichText` / `withCSS` are gone.
 * The four variants are a plain `variant` prop.
 */

const STATUS_BY_VARIANT = {
  default: "idle",
  pending: "pending",
  success: "success",
  error: "error",
};

export default function MotionSubmitButton({
  variant = "default",
  buttonLabel = "Send message",
  pendingLabel = "Sending…",
  errorLabel = "Try again",
  successLabel = "Thank you, message received.",
  buttonColor = "#181614",
  textColor = "#FFFFFF",
  successColor = "#CDD0CB",
  successText = "#414640",
  paper = "#FFFFFF",
  seal = "#A82B32",
  sealSize = 64,
  mailbox = "#343E3C",
  duration = 5.6,
  flight = 1,
  demo = false,
  style,
  ...rest
}) {
  const status = STATUS_BY_VARIANT[variant] ?? "idle";
  const success = status === "success";
  const label =
    status === "pending" ? pendingLabel : status === "error" ? errorLabel : buttonLabel;

  return (
    <motion.button
      {...rest}
      type="submit"
      className="msb"
      aria-label={label}
      initial={false}
      animate={{ backgroundColor: success ? successColor : buttonColor }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      style={{
        ...style,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: success ? 0 : 8,
        width: "100%",
        height: 48,
        minWidth: 164,
        padding: "0 22px",
        border: "none",
        borderRadius: 100,
        overflow: "visible",
        cursor: status === "pending" ? "progress" : "pointer",
        fontFamily: "Inter, sans-serif",
        userSelect: "none",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <p
        className="msb__label"
        style={{ color: success ? successText : textColor, transition: "color .35s" }}
      >
        {label}
      </p>

      <span className="msb__slot" data-success={success ? "true" : "false"}>
        <DeliverySignal
          status={status}
          duration={duration}
          flight={flight}
          paper={paper}
          seal={seal}
          sealSize={sealSize}
          mailbox={mailbox}
          demo={demo}
          iconColor={success ? successText : textColor}
          successLabel={successLabel}
          successColor={successColor}
          successTextColor={successText}
        />
      </span>
    </motion.button>
  );
}
