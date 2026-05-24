import { useTranslation } from "react-i18next";

function IconPlayback() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

export function MediaEmptyState() {
  const { t } = useTranslation("app");
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-5 py-16">
      <div className="max-w-md rounded-2xl border border-dashed border-zinc-300 bg-white/60 p-8 text-center dark:border-zinc-700 dark:bg-zinc-950/40">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
          <IconPlayback />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {t("media.emptyState.title")}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          {t("media.emptyState.description")}
        </p>
        <ul className="mt-4 space-y-2 text-left text-[13px] leading-snug text-zinc-600 dark:text-zinc-400">
          <li className="flex gap-2">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-zinc-400 dark:bg-zinc-500" />
            <span>{t("media.emptyState.bullet1")}</span>
          </li>
          <li className="flex gap-2">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-zinc-400 dark:bg-zinc-500" />
            <span>{t("media.emptyState.bullet2")}</span>
          </li>
        </ul>
        <p className="mt-4 text-[12px] text-zinc-400 dark:text-zinc-500">
          {t("media.emptyState.hint")}
        </p>
      </div>
    </div>
  );
}
