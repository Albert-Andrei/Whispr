import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

type URLInputProps = {
  onSubmitUrl: (url: string) => void;
  disabled?: boolean;
  /** Focus the field when true (e.g. modal opened from “Import from URL”). */
  focusRequest?: boolean;
  /** Tighter spacing and button size only; URL field matches the modal. */
  compact?: boolean;
};

export function URLInput({
  onSubmitUrl,
  disabled,
  focusRequest = false,
  compact = false,
}: URLInputProps) {
  const { t } = useTranslation();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!focusRequest || disabled) return;
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [focusRequest, disabled]);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setError(t("import.urlInput.errorEmpty"));
      return;
    }
    try {
      new URL(trimmed);
    } catch {
      setError(t("import.urlInput.errorInvalid"));
      return;
    }
    setError(null);
    onSubmitUrl(trimmed);
    setValue("");
  };

  /* Same field chrome as the modal everywhere; `compact` only tightens spacing / button. */
  const inputClassName =
    "mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none ring-zinc-400/20 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-500/20";

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <label className="block text-left">
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          {t("import.urlInput.label")}
        </span>
        <input
          ref={inputRef}
          type="url"
          value={value}
          disabled={disabled}
          placeholder={t("import.urlInput.placeholder")}
          className={inputClassName}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
        />
      </label>
      {error ? (
        <p className="text-left text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : null}
      <button
        type="button"
        disabled={disabled}
        onClick={submit}
        className={
          compact
            ? "w-full rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
            : "w-full rounded-xl bg-zinc-900 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
        }
      >
        {t("common:actions.addToQueue")}
      </button>
    </div>
  );
}
