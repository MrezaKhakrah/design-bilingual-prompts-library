import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

/* Register the offline service worker (PWA) — silently skipped when unsupported */
if (typeof window !== "undefined" && "serviceWorker" in navigator && /^https?:/.test(location.protocol)) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {
      /* app keeps working without SW (e.g. single-file hosting) */
    });
  });
}
