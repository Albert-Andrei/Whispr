import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { TranscriptView } from "../dashboard/TranscriptView";
import { LiveRecordView } from "./LiveRecordView";
import { NavGuardDialog } from "./NavGuardDialog";
import { RecordEmptyState } from "./RecordEmptyState";
import { RecordFab } from "./RecordFab";
import { RecordList } from "./RecordList";
import { useRecordStore } from "./store";

export function Record() {
  const jobs = useRecordStore((s) => s.jobs);
  const ready = useRecordStore((s) => s.ready);
  const error = useRecordStore((s) => s.error);
  const selectedId = useRecordStore((s) => s.selectedJobId);
  const sessionState = useRecordStore((s) => s.sessionState);
  const liveSegments = useRecordStore((s) => s.liveSegments);
  const level = useRecordStore((s) => s.level);
  const elapsedMs = useRecordStore((s) => s.elapsedMs);
  const navPromptOpen = useRecordStore((s) => s.navPromptOpen);

  const startRecording = useRecordStore((s) => s.startRecording);
  const pauseRecording = useRecordStore((s) => s.pauseRecording);
  const resumeRecording = useRecordStore((s) => s.resumeRecording);
  const stopRecording = useRecordStore((s) => s.stopRecording);
  const discardRecording = useRecordStore((s) => s.discardRecording);
  const patchJob = useRecordStore((s) => s.patchJob);
  const closeNavPrompt = useRecordStore((s) => s.closeNavPrompt);
  const confirmNavStop = useRecordStore((s) => s.confirmNavStop);
  const confirmNavDiscard = useRecordStore((s) => s.confirmNavDiscard);

  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);

  useEffect(() => {
    if (sessionState === "idle") return;
    const tick = window.setInterval(async () => {
      try {
        const status = await invoke<{
          active: boolean;
          paused: boolean;
          elapsedMs: number;
        }>("record_status");
        if (status.active) {
          useRecordStore.setState({ elapsedMs: status.elapsedMs });
        }
      } catch {
        /* ignore */
      }
    }, 500);
    return () => window.clearInterval(tick);
  }, [sessionState]);

  const handleStart = () => {
    void startRecording().catch((err) => {
      useRecordStore.setState({
        error: err instanceof Error ? err.message : "Could not start recording",
      });
    });
  };

  const handleDiscard = () => setDiscardConfirmOpen(true);

  const confirmDiscard = () => {
    setDiscardConfirmOpen(false);
    void discardRecording();
  };

  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center px-5 py-16 text-sm text-zinc-500 dark:text-zinc-400">
        Loading recordings…
      </div>
    );
  }

  if (error && sessionState === "idle" && !selectedId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-5 py-16 text-center">
        <p className="text-sm font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      </div>
    );
  }

  if (sessionState !== "idle") {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <LiveRecordView
          segments={liveSegments}
          paused={sessionState === "paused"}
          elapsedMs={elapsedMs}
          level={level}
          onPause={() => void pauseRecording()}
          onResume={() => void resumeRecording()}
          onStop={() => void stopRecording()}
          onDiscard={handleDiscard}
        />
        {discardConfirmOpen ? (
          <NavGuardDialog
            open={discardConfirmOpen}
            onClose={() => setDiscardConfirmOpen(false)}
            onStopAndSave={() => {
              setDiscardConfirmOpen(false);
              void stopRecording();
            }}
            onDiscard={confirmDiscard}
          />
        ) : null}
      </div>
    );
  }

  if (selectedId) {
    return (
      <TranscriptView
        jobs={jobs}
        selectedJobId={selectedId}
        patchJob={patchJob}
      />
    );
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto">
        {jobs.length === 0 ? <RecordEmptyState /> : <RecordList jobs={jobs} />}
      </div>

      <RecordFab onClick={handleStart} />

      <NavGuardDialog
        open={navPromptOpen}
        onClose={closeNavPrompt}
        onStopAndSave={() => void confirmNavStop()}
        onDiscard={() => void confirmNavDiscard()}
      />
    </div>
  );
}
