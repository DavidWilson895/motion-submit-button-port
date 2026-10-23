import * as React from "react";
import MotionSubmitButton from "./MotionSubmitButton.jsx";
import WaveText from "./WaveText.jsx";
import { withDelivery } from "./NativeDelivery.jsx";

/**
 * ContactForm — the "Full Contact" layout from the original Framer component.
 *
 * The wrapper below (`withDelivery`) is the original HOC: it measures this
 * <form>, hides it, and plays the envelope → seal → mailbox sequence in a portal
 * positioned exactly over it. Whatever form you give it gets that animation, so
 * this file is the only piece you would normally rewrite for your own site.
 */

const FIELDS = [
  { name: "Name", type: "text", placeholder: "Your name", required: true },
  { name: "Email", type: "email", placeholder: "Your email address", required: true },
  { name: "Phone", type: "tel", placeholder: "Phone number (optional)", required: false },
];

const ContactForm = React.forwardRef(function ContactForm(props, forwardedRef) {
  const {
    demoMode = true,
    endpoint,
    paper = "#FFFFFF",
    buttonColor = "#181614",
    buttonText = "#FFFFFF",
    buttonLabel = "Send message",
    successLabel = "Thank you, message received.",
    successColor = "#CDD0CB",
    successText = "#414640",
    seal = "#A82B32",
    sealSize = 64,
    mailbox = "#343E3C",
    duration = 5.6,
    flight = 1,
    onDelivered,
    ...rest
  } = props;

  const localRef = React.useRef(null);
  const [status, setStatus] = React.useState("idle");
  const [delivered, setDelivered] = React.useState(false);

  const setRefs = React.useCallback(
    (node) => {
      localRef.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    },
    [forwardedRef],
  );

  React.useEffect(() => {
    const form = localRef.current;
    if (!form) return;

    // The HOC fires these on the native form, same as inside Framer.
    // On completion the form is retired: it does not come back after the letter
    // has been delivered. A confirmation panel takes its place instead.
    const complete = () => {
      setStatus("success");
      setDelivered(true);
    };
    const reset = () => setStatus("idle");
    const edited = () => setStatus((s) => (s === "error" ? "idle" : s));

    form.addEventListener("delivery-complete", complete);
    form.addEventListener("reset", reset);
    form.addEventListener("input", edited);
    return () => {
      form.removeEventListener("delivery-complete", complete);
      form.removeEventListener("reset", reset);
      form.removeEventListener("input", edited);
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    if (demoMode || status === "pending") return;

    setStatus("pending");
    try {
      if (endpoint) {
        const response = await fetch(endpoint, {
          method: "POST",
          body: new FormData(event.currentTarget),
        });
        if (!response.ok) throw new Error(`Request failed: ${response.status}`);
      } else {
        // Local test without a backend: keep the envelope in flight for a beat.
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }
      setStatus("success");
      onDelivered?.();
    } catch {
      setStatus("error");
    }
  }

  const variant = status;

  return (
    <>
      <form
        {...rest}
        ref={setRefs}
        className={`contact-form${delivered ? " is-delivered" : ""}`}
        aria-label="Contact form"
        aria-hidden={delivered || undefined}
        onSubmit={handleSubmit}
        style={{ ...rest.style, backgroundColor: paper }}
      >
        {FIELDS.map((field) => (
          <label key={field.name} className="field" aria-label={field.name}>
            <input
              name={field.name}
              type={field.type}
              placeholder={field.placeholder}
              required={field.required}
              autoComplete="off"
            />
          </label>
        ))}

        <label className="field" aria-label="Message">
          <textarea
            name="Message"
            placeholder={"A big idea, a small question,\nor just a little hello."}
            required
          />
        </label>

        <MotionSubmitButton
          variant={variant}
          demo={demoMode}
          duration={duration}
          flight={flight}
          buttonLabel={buttonLabel}
          successLabel={successLabel}
          buttonColor={buttonColor}
          textColor={buttonText}
          successColor={successColor}
          successText={successText}
          paper={paper}
          seal={seal}
          sealSize={sealSize}
          mailbox={mailbox}
        />
      </form>

      {delivered && (
        <div className="depth-text" role="status">
          <WaveText
            text={successLabel}
            color="#181614"
            background="transparent"
            align="left"
            amplitude={10}
            speed={1.2}
          />
        </div>
      )}
    </>
  );
});

export default withDelivery(ContactForm);
