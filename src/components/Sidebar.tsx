import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type { SidebarView } from "../types";
import { windowDragPointerDown } from "../lib/windowDrag";

type MainNavItem = {
  id: SidebarView;
  labelKey: string;
  Icon: FC;
};

function IconWhisprMark() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 512 512"
      className="size-4 shrink-0 rounded-[4px]"
      aria-hidden
    >
      <rect
        width="512"
        height="512"
        className="fill-[#171717] dark:fill-[#d0d0d0]"
      />
      <rect
        x="87"
        y="196"
        width="69"
        height="133"
        rx="34.5"
        className="fill-white dark:fill-[#171717]"
      />
      <rect
        x="179"
        y="51"
        width="69"
        height="408"
        rx="34.5"
        className="fill-white dark:fill-[#171717]"
      />
      <rect
        x="270"
        y="130"
        width="68"
        height="256"
        rx="34"
        className="fill-white dark:fill-[#171717]"
      />
      <rect
        x="360"
        y="202"
        width="65"
        height="121"
        rx="32.5"
        className="fill-white dark:fill-[#171717]"
      />
    </svg>
  );
}

function IconTranscriptions() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      className="shrink-0"
      aria-hidden
    >
      <path d="M8 6h13" />
      <path d="M8 12h13" />
      <path d="M8 18h13" />
      <path d="M3 6h.01" />
      <path d="M3 12h.01" />
      <path d="M3 18h.01" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      className="shrink-0"
      aria-hidden
    >
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}

function IconMedia() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      className="shrink-0"
      aria-hidden
    >
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

function IconMic() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      className="shrink-0"
      aria-hidden
    >
      <path d="M12 19v3M8 22h8" />
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
    </svg>
  );
}

const MAIN_ITEMS: MainNavItem[] = [
  { id: "history", labelKey: "common:nav.transcriptions", Icon: IconTranscriptions },
  { id: "record", labelKey: "common:nav.record", Icon: IconMic },
  { id: "media", labelKey: "common:nav.media", Icon: IconMedia },
];

const SIDEBAR_WIDTH_KEY = "whispr.sidebar.width";
const DEFAULT_WIDTH = 240;
const MIN_WIDTH = 180;
const MAX_WIDTH = 360;

type SidebarProps = {
  active: SidebarView;
  onChange: (view: SidebarView) => void;
  width: number;
  onWidthChange: (width: number) => void;
  mainColumnDragStripPx: number;
  trafficInset?: boolean;
  updateAvailable?: boolean;
};

function navButtonClass(isActive: boolean): string {
  const base =
    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium transition";
  if (isActive) {
    return `${base} bg-[var(--color-sidebar-selected-light)] text-[#1a1a1a] dark:bg-[var(--color-sidebar-selected-dark)] dark:text-zinc-50`;
  }
  return `${base} text-[var(--color-sidebar-text-muted-light)] hover:bg-[var(--color-sidebar-hover-light)] hover:text-[#1a1a1a] dark:text-[var(--color-sidebar-text-muted-dark)] dark:hover:bg-[var(--color-sidebar-hover-dark)] dark:hover:text-zinc-100`;
}

export function Sidebar({
  active,
  onChange,
  width,
  onWidthChange,
  mainColumnDragStripPx,
  trafficInset = false,
  updateAvailable = false,
}: SidebarProps) {
  const { t } = useTranslation(["common", "app"]);
  const gutter = "px-0";
  const topPad = trafficInset ? "pt-6" : "pt-2";

  return (
    <aside
      data-tauri-drag-region
      onPointerDown={windowDragPointerDown}
      className="chrome-bg relative flex h-full min-h-0 shrink-0 flex-col select-none"
      style={{ width }}
    >
      <div
        className={`flex min-h-0 min-w-0 flex-1 flex-col ${gutter} ${topPad}`}
      >
        <nav className="flex min-h-0 flex-1 flex-col gap-0.5 pb-2">
          <div className="flex items-center gap-1.5 px-2.5 pt-3.5 pb-3.5">
            <IconWhisprMark />
            <p className="text-left text-[11px] font-semibold tracking-wide text-[var(--color-sidebar-text-muted-light)] dark:text-[var(--color-sidebar-text-muted-dark)]">
              {t("common:nav.whispr")}
            </p>
          </div>

          {MAIN_ITEMS.map((item) => {
            const isActive = item.id === active;
            const Icon = item.Icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChange(item.id)}
                className={navButtonClass(isActive)}
              >
                <Icon />
                {t(item.labelKey)}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto">
          <button
            type="button"
            onClick={() => onChange("settings")}
            aria-current={active === "settings" ? "page" : undefined}
            className={`${navButtonClass(active === "settings")} justify-between`}
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <IconSettings />
              {t("common:nav.settings")}
            </span>
            {updateAvailable ? (
              <span
                className="inline-flex h-5 shrink-0 items-center rounded-full bg-zinc-900 px-2 text-[10px] font-semibold leading-none text-white dark:bg-zinc-100 dark:text-zinc-900"
                aria-label={t("app:components.sidebar.updateAvailable")}
              >
                {t("app:components.sidebar.updateBadge")}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      <div
        data-tauri-no-drag
        role="separator"
        aria-orientation="vertical"
        aria-label={t("common:aria.resizeSidebar")}
        className="absolute -right-2.5 bottom-4 z-10 w-1 cursor-col-resize rounded-full hover:bg-zinc-400/40"
        style={{ top: mainColumnDragStripPx }}
        onMouseDown={(e) => {
          e.preventDefault();
          const startX = e.clientX;
          const startW = width;
          let lastW = startW;

          const onMove = (ev: MouseEvent) => {
            const delta = ev.clientX - startX;
            lastW = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startW + delta));
            onWidthChange(lastW);
          };

          const onUp = () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
            try {
              localStorage.setItem(SIDEBAR_WIDTH_KEY, String(lastW));
            } catch {
              /* ignore */
            }
          };

          window.addEventListener("mousemove", onMove);
          window.addEventListener("mouseup", onUp);
        }}
      />
    </aside>
  );
}

export function readInitialSidebarWidth(): number {
  if (typeof window === "undefined") return DEFAULT_WIDTH;
  try {
    const raw = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    const n = raw ? Number.parseInt(raw, 10) : NaN;
    if (Number.isFinite(n)) {
      return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, n));
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_WIDTH;
}
