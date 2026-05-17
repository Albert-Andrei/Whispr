import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";
import { setConfig } from "../../lib/db";

export type ModelTier = "small" | "medium" | "large";

const MODEL_FILE: Record<ModelTier, string> = {
  small: "ggml-small.bin",
  medium: "ggml-medium.bin",
  large: "ggml-large-v3.bin",
};

type SetupProgress = {
  component: string;
  downloaded: number;
  total: number | null;
};

type Phase = "pick" | "loading" | "error";

export function SetupScreen({ onComplete }: { onComplete: () => void }) {
  const [tier, setTier] = useState<ModelTier>("medium");
  const [phase, setPhase] = useState<Phase>("pick");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<string, SetupProgress>>({});

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    void listen<SetupProgress>("setup:progress", (ev) => {
      const p = ev.payload;
      setProgress((prev) => ({ ...prev, [p.component]: p }));
    }).then((fn) => {
      unlisten = fn;
    });
    return () => {
      unlisten?.();
    };
  }, []);

  const runSetup = async () => {
    setPhase("loading");
    setError(null);
    setProgress({});
    try {
      await invoke("download_tools");
      await invoke("download_model_file", { tier });
      await setConfig("selected_model", MODEL_FILE[tier]);
      await setConfig("setup_completed", "true");
      onComplete();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setPhase("error");
    }
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-zinc-100 px-4 py-12 dark:bg-zinc-950">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-center text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Welcome to Whispr
        </h1>
        <p className="mt-2 text-center text-sm text-zinc-500 dark:text-zinc-400">
          One-time setup downloads ffmpeg, yt-dlp, and your chosen Whisper model. If{" "}
          <strong className="text-zinc-700 dark:text-zinc-200">whisper-cli</strong> is not
          already on your Mac, Whispr installs it via{" "}
          <strong className="text-zinc-700 dark:text-zinc-200">Homebrew</strong> for you (you need
          Homebrew from{" "}
          <a
            href="https://brew.sh"
            className="font-medium text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-400"
          >
            brew.sh
          </a>
          ). You can change the model later in Settings.
        </p>
        <p className="mt-2 text-center text-xs text-zinc-400">
          After setup, transcription works offline. Internet is only required during this download
          step.
        </p>

        {phase === "pick" ? (
          <div className="mt-8 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Choose model (multilingual)
            </p>
            {(
              [
                ["small", "Small (~466 MB)", "Good quality, faster"],
                ["medium", "Medium (~1.5 GB)", "Recommended"],
                ["large", "Large (~3.1 GB)", "Best quality"],
              ] as const
            ).map(([id, title, sub]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTier(id as ModelTier)}
                className={`flex w-full flex-col rounded-xl border px-4 py-3 text-left transition ${
                  tier === id
                    ? "border-indigo-400 bg-indigo-50/80 dark:border-indigo-500 dark:bg-indigo-500/10"
                    : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
                }`}
              >
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {title}
                </span>
                <span className="text-xs text-zinc-500">{sub}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => void runSetup()}
              className="mt-4 w-full rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              Set up Whispr
            </button>
          </div>
        ) : null}

        {phase === "loading" ? (
          <div className="mt-8 space-y-4">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
              Downloading components…
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              The transcription step may run Homebrew to install <code className="text-zinc-600 dark:text-zinc-300">whisper-cpp</code> — first time can take several minutes.
            </p>
            {(
              [
                "ffmpeg",
                "yt-dlp",
                "whisper-cli",
                `model:${MODEL_FILE[tier]}`,
              ] as const
            ).map((key) => {
              const p = progress[key];
              const label =
                key === "ffmpeg"
                  ? "ffmpeg — audio/video"
                  : key === "yt-dlp"
                    ? "yt-dlp — URL download"
                    : key === "whisper-cli"
                      ? "whisper-cli — transcription"
                      : "Whisper model";
              const pct =
                p?.total && p.total > 0
                  ? Math.round((p.downloaded / p.total) * 100)
                  : p?.downloaded
                    ? null
                    : 0;
              return (
                <div key={key}>
                  <div className="flex justify-between text-xs text-zinc-500">
                    <span>{label}</span>
                    <span>{pct != null ? `${pct}%` : "…"}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-indigo-500 transition-all"
                      style={{
                        width: `${pct != null ? Math.min(100, pct) : 5}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        {phase === "error" && error ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-500/40 dark:bg-red-500/10">
            <p className="whitespace-pre-line text-sm text-red-800 dark:text-red-200">{error}</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setPhase("pick")}
                className="order-2 w-full rounded-lg border border-red-300 bg-white py-2 text-center text-xs font-semibold text-red-800 dark:border-red-500/50 dark:bg-red-950/40 dark:text-red-100 sm:order-1 sm:w-auto sm:px-4"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => void runSetup()}
                className="order-1 w-full rounded-lg bg-red-600 py-2 text-center text-xs font-semibold text-white hover:bg-red-700 sm:order-2 sm:w-auto sm:px-4"
              >
                Try again
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
