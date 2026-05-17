import { useState } from "react";

type URLInputProps = {
  onSubmitUrl: (url: string) => void;
  disabled?: boolean;
};

export function URLInput({ onSubmitUrl, disabled }: URLInputProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Paste a URL first");
      return;
    }
    try {
      new URL(trimmed);
    } catch {
      setError("That does not look like a valid URL");
      return;
    }
    setError(null);
    onSubmitUrl(trimmed);
    setValue("");
  };

  return (
    <div className="space-y-3">
      <label className="block text-left text-xs font-medium text-zinc-600 dark:text-zinc-400">
        Video URL
        <input
          type="url"
          value={value}
          disabled={disabled}
          placeholder="Paste a YouTube, Vimeo, or other video URL"
          className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-indigo-500/30 placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
        />
      </label>
      {error ? (
        <p className="text-left text-xs text-red-500 dark:text-red-400">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        disabled={disabled}
        onClick={submit}
        className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
      >
        Add to queue
      </button>
    </div>
  );
}
