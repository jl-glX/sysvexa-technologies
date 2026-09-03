import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { LegalPage, resolveLegalPage } from "./components/LegalPage";
import "./i18n/config";
import "./styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

const legalPage = resolveLegalPage(window.location.pathname);
if (legalPage) {
  document.title = legalPage === "data-protection"
    ? "Protección de datos | Sysvexa Technologies"
    : "Política de privacidad | Sysvexa Technologies";
  document.querySelector('meta[name="description"]')?.setAttribute(
    "content",
    legalPage === "data-protection"
      ? "Información sobre el tratamiento de datos en las solicitudes de servicio de Sysvexa Technologies."
      : "Política de privacidad de Sysvexa Technologies.",
  );
}

createRoot(root).render(
  <StrictMode>
    {legalPage ? <LegalPage kind={legalPage} /> : <App />}
  </StrictMode>,
);
