import { createContext, useContext, type ReactNode } from "react";

export type PopupOptions = {
  title?: string;
  message: ReactNode; // text or JSX
  buttonLabel?: string; // defaults to "OK"
};

export type ConfirmOptions = {
  title?: string;
  message: ReactNode;
  confirmLabel?: string; // defaults to "Confirm"
  cancelLabel?: string; // defaults to "Cancel"
};

export type Choice<T> = {
  value: T; // what choosePopup resolves with when this is picked
  label: ReactNode; // the card's content
  buttonLabel?: string; // the card's button text. Defaults to "Choose"
  tooltip?: ReactNode; // optional hover tooltip
  disabled?: boolean; // greyed out and can't be picked
};

export type ChoiceGroup<T> = {
  title?: string; // heading above this row
  choices: Choice<T>[]; // laid out side by side (wrapping on narrow screens)
};

export type ChoiceOptions<T> = {
  title?: string;
  message?: ReactNode;
  groups: ChoiceGroup<T>[]; // one row each, top to bottom
  cancelLabel?: string; // defaults to "Cancel"
};

type PopupContextValue = {
  showPopup: (options: PopupOptions) => void;
  closePopup: () => void;
  // Resolves true if the player confirms, false if they cancel,
  // press Escape, or click outside the popup
  confirmPopup: (options: ConfirmOptions) => Promise<boolean>;
  // Resolves with the clicked choice's value, or null if they cancel
  choosePopup: <T>(options: ChoiceOptions<T>) => Promise<T | null>;
};

export const PopupContext = createContext<PopupContextValue | null>(null);

export function usePopup() {
  const ctx = useContext(PopupContext);
  if (!ctx) throw new Error("usePopup must be used inside <PopupProvider>");
  return ctx;
}