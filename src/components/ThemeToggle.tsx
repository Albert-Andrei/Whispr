import { useTheme } from "../hooks/useTheme";
import type { ThemePreference } from "../lib/theme";

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

export function ThemeToggle() {
  const { preference, setPreference } = useTheme();

  return (
    <div
      className="grid grid-cols-3 gap-1 p-1"
      role="radiogroup"
      aria-label="Color theme"
    >
      {OPTIONS.map(({ value, label }) => {
        const selected = preference === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setPreference(value)}
            className={
              selected
                ? "rounded-lg bg-zinc-200 px-2 py-2 text-[13px] font-medium text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                : "rounded-lg px-2 py-2 text-[13px] font-medium text-zinc-500 transition hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            }
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
