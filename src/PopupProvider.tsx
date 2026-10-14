import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { PopupContext, type PopupOptions } from "./usePopup";

export default function PopupProvider({ children }: { children: ReactNode }) {
  const [popup, setPopup] = useState<PopupOptions | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  const showPopup = useCallback((options: PopupOptions) => {
    // Remember what had focus, so we can give it back when the popup closes
    if (!previousFocus.current && document.activeElement instanceof HTMLElement) {
      previousFocus.current = document.activeElement;
    }
    setPopup(options); // a new popup replaces any popup that's already open
  }, []);

  const closePopup = useCallback(() => {
    setPopup(null);
    previousFocus.current?.focus();
    previousFocus.current = null;
  }, []);

  useEffect(() => {
    if (!popup) return;
    buttonRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closePopup();
      if (e.key === "Tab") {
        e.preventDefault(); // the OK button is the only focusable thing
        buttonRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [popup, closePopup]);

  const value = useMemo(() => ({ showPopup, closePopup }), [showPopup, closePopup]);

  return (
    <PopupContext.Provider value={value}>
      {children}
      {popup && (
        <div
          className="popup-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closePopup(); // click outside to close
          }}
        >
          <div
            className="box popup"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={popup.title ? "popup-title" : undefined}
            aria-describedby="popup-message"
          >
            {popup.title && <h2 id="popup-title">{popup.title}</h2>}
            <div id="popup-message" className="popup-message">{popup.message}</div>
            <button ref={buttonRef} onClick={closePopup}>
              {popup.buttonLabel ?? "OK"}
            </button>
          </div>
        </div>
      )}
    </PopupContext.Provider>
  );
}