import {
  useCallback,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

type TooltipProps = {
  label: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

const TOOLTIP_CLASS =
  "pointer-events-none fixed z-[99999] -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[12px] font-medium leading-none text-zinc-800 shadow-[0_2px_8px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04)] dark:border-zinc-600 dark:bg-[#353538] dark:text-zinc-100 dark:shadow-[0_4px_14px_rgba(0,0,0,0.4)]";

/** Linear-style tooltip portaled to document.body so it is never clipped */
export function Tooltip({
  label,
  children,
  className = "",
  style,
}: TooltipProps) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null,
  );

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const padding = 8;
    const centerX = rect.left + rect.width / 2;
    const clampedLeft = Math.min(
      window.innerWidth - padding,
      Math.max(padding, centerX),
    );
    setCoords({ top: rect.top - 6, left: clampedLeft });
  }, []);

  const show = useCallback(() => {
    updatePosition();
  }, [updatePosition]);

  const hide = useCallback(() => {
    setCoords(null);
  }, []);

  return (
    <>
      <span
        ref={anchorRef}
        className={`inline-flex ${className}`.trim()}
        style={style}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {children}
      </span>
      {coords
        ? createPortal(
            <span
              role="tooltip"
              className={TOOLTIP_CLASS}
              style={{ top: coords.top, left: coords.left }}
            >
              {label}
            </span>,
            document.body,
          )
        : null}
    </>
  );
}
