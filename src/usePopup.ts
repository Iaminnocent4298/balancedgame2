import { createContext, useContext, type ReactNode } from "react";

export type PopupOptions = {
  title?: string;
  message: ReactNode; // text or JSX
  buttonLabel?: string; // defaults to "OK"
};

type PopupContextValue = {
  showPopup: (options: PopupOptions) => void;
  closePopup: () => void;
};

export const PopupContext = createContext<PopupContextValue | null>(null);

export function usePopup() {
  const ctx = useContext(PopupContext);
  if (!ctx) throw new Error("usePopup must be used inside <PopupProvider>");
  return ctx;
}