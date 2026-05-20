import { invoke, isTauri } from "@tauri-apps/api/core";
import { useCallback, useEffect, useState } from "react";
import { useRecordStore } from "../record/store";
import { useTranscriptionStore } from "../dashboard/store";
import { DeleteMediaDialog } from "./DeleteMediaDialog";
import { MediaEmptyState } from "./MediaEmptyState";
import { MediaRow } from "./MediaRow";
import type { PlaybackMediaItem } from "./types";

type RawPlaybackMediaItem = {
  jobId: string;
  path: string;
  filename: string;
  sourceType: string | null;
  bytes: number;
  hasSyncedPlayback: boolean;
};

export function Media() {
  const [items, setItems] = useState<PlaybackMediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PlaybackMediaItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const patchTranscriptionJob = useTranscriptionStore((s) => s.patchJob);
  const patchRecordJob = useRecordStore((s) => s.patchJob);

  const loadMedia = useCallback(async () => {
    if (!isTauri()) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const raw = await invoke<RawPlaybackMediaItem[]>("list_playback_media");
      setItems(raw);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load media");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMedia();
  }, [loadMedia]);

  const handlePlayToggle = (jobId: string) => {
    setPlayingId((current) => (current === jobId ? null : jobId));
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await invoke("delete_playback_media", { jobId: deleteTarget.jobId });
      patchTranscriptionJob(deleteTarget.jobId, { audio_path: null });
      patchRecordJob(deleteTarget.jobId, { audio_path: null });
      if (playingId === deleteTarget.jobId) setPlayingId(null);
      setDeleteTarget(null);
      await loadMedia();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete media");
    } finally {
      setDeleting(false);
    }
  };

  if (!isTauri()) {
    return (
      <div className="flex flex-1 items-center justify-center px-5 py-16 text-sm text-zinc-500 dark:text-zinc-400">
        Playback media is available in the desktop app.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center px-5 py-16 text-sm text-zinc-500 dark:text-zinc-400">
        Loading media…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-5 py-16 text-center">
        <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
        <button
          type="button"
          onClick={() => void loadMedia()}
          className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
        >
          Try again
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return <MediaEmptyState />;
  }

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6">
        <p className="mb-4 text-[13px] text-zinc-600 dark:text-zinc-400">
          Compact audio copies for in-app playback. Deleting a file frees disk
          space; transcripts stay, but playback and segment sync depend on these
          files.
        </p>

        <ul className="space-y-2">
          {items.map((item) => (
            <MediaRow
              key={item.jobId}
              item={item}
              playing={playingId === item.jobId}
              onPlayToggle={() => handlePlayToggle(item.jobId)}
              onStop={() => setPlayingId(null)}
              onDelete={() => setDeleteTarget(item)}
            />
          ))}
        </ul>
      </div>

      <DeleteMediaDialog
        item={deleteTarget}
        open={deleteTarget !== null}
        deleting={deleting}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={() => void handleDeleteConfirm()}
      />
    </>
  );
}
