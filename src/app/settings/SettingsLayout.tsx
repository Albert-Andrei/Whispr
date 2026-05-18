import type { ReactNode } from "react";

type SettingsSectionProps = {
  title: string;
  children: ReactNode;
  syncing?: boolean;
};

function SettingsSyncIcon() {
  return (
    <svg
      className="h-3.5 w-3.5 animate-spin text-zinc-400 dark:text-zinc-500"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M22.008 12.002L20.006 14.002L18.005 12.002"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.341 6.344C7.79 4.896 9.791 4 12.002 4C16.423 4 20.007 7.582 20.007 12.002C20.007 12.61 19.933 13.2 19.805 13.769"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M1.992 11.998L3.994 9.99805L5.995 11.998"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.659 17.656C16.21 19.104 14.209 20 11.998 20C7.577 20 3.993 16.418 3.993 11.998C3.993 11.39 4.067 10.8 4.195 10.231"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SettingsSection({
  title,
  children,
  syncing = false,
}: SettingsSectionProps) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-1.5 px-1">
        <h2 className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">
          {title}
        </h2>
        {syncing ? (
          <span
            className="inline-flex"
            title="Checking tools…"
            aria-label="Checking tools"
          >
            <SettingsSyncIcon />
          </span>
        ) : null}
      </div>
      <div className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white dark:border-[var(--color-settings-border-dark)] dark:bg-[var(--color-settings-surface-dark)]">
        {children}
      </div>
    </section>
  );
}

type SettingsRowProps = {
  label: string;
  description?: string;
  children: ReactNode;
  last?: boolean;
};

export function SettingsRow({
  label,
  description,
  children,
  last = false,
}: SettingsRowProps) {
  return (
    <div
      className={
        last
          ? "flex items-center justify-between gap-6 px-4 py-3.5"
          : "flex items-center justify-between gap-6 border-b border-zinc-100 px-4 py-3.5 dark:border-[var(--color-settings-border-dark)]"
      }
    >
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-zinc-900 dark:text-zinc-50">
          {label}
        </p>
        {description ? (
          <p className="mt-0.5 text-[12px] leading-snug text-zinc-500 dark:text-zinc-400">
            {description}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center justify-end">{children}</div>
    </div>
  );
}

type SettingsSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
};

export function SettingsSelect({
  value,
  onChange,
  options,
  className = "",
}: SettingsSelectProps) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={`w-32 shrink-0 cursor-pointer appearance-none rounded-lg border border-zinc-200 bg-zinc-50/80 py-1.5 pr-7 pl-2 text-[13px] font-medium text-zinc-800 transition hover:border-zinc-300 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20 dark:border-[var(--color-settings-border-dark)] dark:bg-[#353538] dark:text-zinc-100 dark:hover:border-zinc-600 ${className}`}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 10px center",
      }}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function SettingsBlock({
  children,
  last = false,
}: {
  children: ReactNode;
  last?: boolean;
}) {
  return (
    <div
      className={
        last
          ? "px-4 py-4"
          : "border-b border-zinc-100 px-4 py-4 dark:border-[var(--color-settings-border-dark)]"
      }
    >
      {children}
    </div>
  );
}
