import * as React from "react";
import ContactForm from "./ContactForm.jsx";

export default function App() {
  return (
    <main className="page">
      <div className="stage">
        <ContactForm demoMode />
      </div>
    </main>
  );
}
