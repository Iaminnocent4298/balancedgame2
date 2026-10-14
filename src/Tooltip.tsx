import {
  cloneElement, useCallback, useEffect, useId, useLayoutEffect, useRef, useState,
  type FocusEvent, type MouseEvent, type ReactElement, type ReactNode,
} from "react";
import { createPortal } from "react-dom";

type Point = { x: number; y: number };

type TriggerProps = {
  onMouseEnter?: (e: MouseEvent<HTMLElement>) => void;
  onMouseMove?: (e: MouseEvent<HTMLElement>) => void;
  onMouseLeave?: (e: MouseEvent<HTMLElement>) => void;
  onFocus?: (e: FocusEvent<HTMLElement>) => void;
  onBlur?: (e: FocusEvent<HTMLElement>) => void;
  "aria-describedby"?: string;
};

type TooltipProps = {
  content: ReactNode; // text or JSX. If empty, no tooltip is shown
  children: ReactElement<TriggerProps>; // exactly ONE element: a td, th, button, etc.
  delay?: number; // ms to wait before showing
};

export default function Tooltip({ content, children, delay = 0 }: TooltipProps) {
  const id = useId();
  const [point, setPoint] = useState<Point | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const latest = useRef<Point>({ x: 0, y: 0 });

  const hide = useCallback(() => {
    window.clearTimeout(timer.current);
    setPoint(null);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const hasContent = content !== null && content !== undefined && content !== false && content !== "";
  if (!hasContent) return children;

  const child = children;
  return (
    <>
      {cloneElement(child, {
        onMouseEnter: (e) => {
          child.props.onMouseEnter?.(e);
          latest.current = { x: e.clientX, y: e.clientY };
          window.clearTimeout(timer.current);
          timer.current = window.setTimeout(() => setPoint(latest.current), delay);
        },
        onMouseMove: (e) => {
          child.props.onMouseMove?.(e);
          const next = { x: e.clientX, y: e.clientY };
          latest.current = next;
          setPoint((p) => (p ? next : p)); // follow the mouse once visible
        },
        onMouseLeave: (e) => {
          child.props.onMouseLeave?.(e);
          hide();
        },
        // Keyboard users: show it next to the focused element (not on mouse clicks)
        onFocus: (e) => {
          child.props.onFocus?.(e);
          if (!e.currentTarget.matches(":focus-visible")) return;
          const r = e.currentTarget.getBoundingClientRect();
          setPoint({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
        },
        onBlur: (e) => {
          child.props.onBlur?.(e);
          hide();
        },
        "aria-describedby": point ? id : child.props["aria-describedby"],
      })}
      {point && <Bubble id={id} point={point}>{content}</Bubble>}
    </>
  );
}

function Bubble({ id, point, children }: { id: string; point: Point; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  // Sits just below and to the right of the cursor. Flips to the other side
  // when it would run off the screen.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const gap = 8;
    const offset = 14;

    let left = point.x + offset;
    let top = point.y + offset + 4;
    if (left + width > window.innerWidth - gap) left = point.x - width - offset;
    if (top + height > window.innerHeight - gap) top = point.y - height - offset;

    el.style.left = `${Math.max(gap, left)}px`;
    el.style.top = `${Math.max(gap, top)}px`;
    el.style.visibility = "visible";
  }, [point]);

  return createPortal(
    <div ref={ref} id={id} role="tooltip" className="tooltip">{children}</div>,
    document.body
  );
}