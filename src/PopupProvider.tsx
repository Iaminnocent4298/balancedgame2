import {
  Fragment, useCallback, useEffect, useMemo, useRef, useState, type ReactNode,
} from "react";
import Tooltip from "./Tooltip";
import {
  PopupContext, type ChoiceOptions, type ConfirmOptions, type PopupOptions,
} from "./usePopup";

type Active =
  | { kind: "message"; options: PopupOptions }
  | { kind: "confirm"; options: ConfirmOptions; resolve: (ok: boolean) => void }
  | { kind: "choice"; options: ChoiceOptions<unknown>; resolve: (value: unknown) => void };

export default function PopupProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<Active | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  // How to answer the open popup if it's dismissed (false for confirm, null for choice)
  const cancelPending = useRef<(() => void) | null>(null);

  const open = useCallback((next: Active) => {
    // Remember what had focus, so we can give it back when the popup closes
    if (!previousFocus.current && document.activeElement instanceof HTMLElement) {
      previousFocus.current = document.activeElement;
    }
    cancelPending.current?.(); // a popup that gets replaced counts as cancelled
    cancelPending.current =
      next.kind === "confirm"
        ? () => next.resolve(false)
        : next.kind === "choice"
          ? () => next.resolve(null)
          : null;
    setActive(next);
  }, []);

  // Closes the popup, running `answer` (if any) to settle its promise
  const finish = useCallback((answer?: () => void) => {
    cancelPending.current = null;
    answer?.();
    setActive(null);
    previousFocus.current?.focus();
    previousFocus.current = null;
  }, []);

  // Cancel, Escape, click outside, or OK on a plain message
  const dismiss = useCallback(() => {
    finish(cancelPending.current ?? undefined);
  }, [finish]);

  const showPopup = useCallback(
    (options: PopupOptions) => open({ kind: "message", options }),
    [open]
  );
  const confirmPopup = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => open({ kind: "confirm", options, resolve })),
    [open]
  );
  const choosePopup = useCallback(
    <T,>(options: ChoiceOptions<T>) =>
      new Promise<T | null>((resolve) =>
        open({
          kind: "choice",
          options: options as ChoiceOptions<unknown>,
          resolve: resolve as (value: unknown) => void,
        })
      ),
    [open]
  );

  useEffect(() => {
    if (!active) return;
    const buttons = () =>
      Array.from(
        dialogRef.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? []
      );

    // Safe default: the Cancel / OK button, never a choice or a confirm
    dialogRef.current?.querySelector<HTMLButtonElement>(".popup-buttons button")?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        dismiss();
      } else if (e.key === "Tab") {
        e.preventDefault(); // keep focus inside the popup
        const list = buttons();
        if (list.length === 0) return;
        const i = list.indexOf(document.activeElement as HTMLButtonElement);
        const next = e.shiftKey ? (i <= 0 ? list.length - 1 : i - 1) : (i + 1) % list.length;
        list[next].focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, dismiss]);

  const value = useMemo(
    () => ({ showPopup, closePopup: dismiss, confirmPopup, choosePopup }),
    [showPopup, dismiss, confirmPopup, choosePopup]
  );

  return (
    <PopupContext.Provider value={value}>
      {children}
      {active && (
        <div
          className="popup-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) dismiss(); // click outside = cancel
          }}
        >
          <div
            ref={dialogRef}
            className={`box popup${active.kind === "choice" ? " popup-wide" : ""}`}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={active.options.title ? "popup-title" : undefined}
            aria-describedby={active.options.message ? "popup-message" : undefined}
          >
            {active.options.title && <h2 id="popup-title">{active.options.title}</h2>}
            {active.options.message && (
              <div id="popup-message" className="popup-message">{active.options.message}</div>
            )}

            {active.kind === "choice" && (
              <div className="popup-choices">
                {active.options.choices.map((choice, i) => {
                  // aria-disabled (not "disabled") so hover tooltips still work on greyed-out choices
                  const button = (
                    <button
                      className="choice"
                      aria-disabled={choice.disabled || undefined}
                      onClick={() => {
                        if (!choice.disabled) finish(() => active.resolve(choice.value));
                      }}
                    >
                      {choice.label}
                    </button>
                  );
                  return choice.tooltip ? (
                    <Tooltip key={i} content={choice.tooltip}>{button}</Tooltip>
                  ) : (
                    <Fragment key={i}>{button}</Fragment>
                  );
                })}
              </div>
            )}

            <div className="popup-buttons">
              {active.kind === "confirm" && (
                <>
                  <button onClick={dismiss}>{active.options.cancelLabel ?? "Cancel"}</button>
                  <button onClick={() => finish(() => active.resolve(true))}>
                    {active.options.confirmLabel ?? "Confirm"}
                  </button>
                </>
              )}
              {active.kind === "choice" && (
                <button onClick={dismiss}>{active.options.cancelLabel ?? "Cancel"}</button>
              )}
              {active.kind === "message" && (
                <button onClick={dismiss}>{active.options.buttonLabel ?? "OK"}</button>
              )}
            </div>
          </div>
        </div>
      )}
    </PopupContext.Provider>
  );
}