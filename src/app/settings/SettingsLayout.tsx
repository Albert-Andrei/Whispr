import type { ReactNode } from "react";

type SettingsSectionProps = {
  title: string;
  children: ReactNode;
};

export function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <section>
      <h2 className="mb-2 px-1 text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">
        {title}
      </h2>
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
