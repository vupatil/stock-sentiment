import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import ErrorBoundary from "./ErrorBoundary.jsx";
import "./index.css";

// Create global runtime error overlay container
const RUNTIME_ERROR_ID = "runtime-error-overlay";
function renderRuntimeErrorOverlay(message, stack) {
  let el = document.getElementById(RUNTIME_ERROR_ID);
  if (!el) {
    el = document.createElement("div");
    el.id = RUNTIME_ERROR_ID;
    document.body.appendChild(el);
  }
  el.innerHTML = `
    <div style="position:fixed;left:0;top:0;right:0;background:var(--danger);color:var(--danger-text);padding:12px;z-index:9999;font-family:system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;">
      <strong>Uncaught runtime error:</strong>
      <div style="margin-top:4px;font-size:13px;white-space:pre-wrap">${String(message)}\n\n${String(stack || '')}</div>
      <div style="margin-top:10px;"><button onclick="location.reload()" style="padding:8px 12px">Reload</button></div>
    </div>
  `;
}

// Global JS error handlers
window.addEventListener("error", (e) => {
  renderRuntimeErrorOverlay(e.message || e.error || "Unknown error", e.error?.stack || e.filename || "");
});
window.addEventListener("unhandledrejection", (e) => {
  renderRuntimeErrorOverlay(e.reason?.message || String(e.reason) || "Unhandled promise rejection", e.reason?.stack || "");
});

// Mount the app inside an ErrorBoundary so we show the error UI if rendering fails
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
