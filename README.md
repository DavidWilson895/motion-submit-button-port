# Motion Submit Button — standalone React port

A port of the Framer Marketplace component **Motion Submit Button** by Matthias
Ölschlegel (`framer.com/m/Motion-Submit-Button-UpZfHQ`), running outside Framer.

```bash
npm install
npm run dev
```

Then open http://localhost:5173 and press **Send message**.

The page is just the form — no header, no footer, no demo controls. Once the
letter is delivered the form is retired and a confirmation card fades in; the
form does not come back.

## What is faithful

| Piece | Status |
| --- | --- |
| Envelope fold geometry (`postalSideFold`, `postalTopFold`, 3D pose math) | Original code, untouched |
| Wax seal (texture + vector variants, press timing) | Original code, untouched |
| Mailbox artwork, flag raise, mail drop | Original code, untouched |
| Postal glyph hover loop, filled/ready states, checkmark | Original code, untouched |
| Success panel (portal into the button) | Original code, untouched |
| Button size, padding, radius, colors, typography | Matches original CSS |
| Form layout, field styles, radius, shadow | Matches original CSS |

## What changed

Only the Framer runtime was replaced:

1. `NativeDelivery.jsx` is the original module with `import { ... } from "framer"`
   replaced by two shims: `useIsStaticRenderer = () => false` and a small
   `Color()` parser that returns `{ r, g, b, a }`.
2. Framer-only `addPropertyControls(...)` and `__FramerMetadata__` were cut —
   they are editor metadata, never used at runtime.
3. `MotionSubmitButton.jsx` replaces `useVariantState`/`RichText`/`withCSS` with a
   plain `variant` prop (`default | pending | success | error`).
4. `ContactForm.jsx` replaces Framer's `FormContainer` with a normal `<form>`.
   The `withDelivery` HOC is unchanged and still measures the form and plays the
   scene over it.

`framer-motion` is the only runtime dependency beyond React.

## Wiring it into a real site

```jsx
import ContactForm from "./ContactForm.jsx";

<ContactForm
  demoMode={false}              // demoMode blocks submission and just plays the scene
  endpoint="/api/contact"       // receives multipart FormData
  duration={5.6}                // 2 = snappy, 9 = cinematic
/>
```

The HOC hides the form and animates it, so the form must be the direct child of a
`position: relative` parent with `overflow: visible`. That wrapper is `.stage` in
`App.jsx`.

## Licensing

This is code from a Framer Marketplace component. Running it inside Framer is the
intended use. Before shipping the port on a commercial site, check the
component's licence on its marketplace page.
