import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import VersionLabel from "./VersionLabel";
import "./index.css";
import App from "./App";
import PopupProvider from "./PopupProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PopupProvider>
      <App />
      <VersionLabel />
    </PopupProvider>
  </StrictMode>
);