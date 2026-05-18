import { isTauri } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { Dashboard } from "../app/dashboard/Dashboard";
import { NewTranscriptionModal } from "../app/import/NewTranscriptionModal";
import { Record } from "../app/record/Record";
import { Settings } from "../app/settings/Settings";
import { SetupScreen } from "../app/setup/SetupScreen";
import { useTranscriptionStore } from "../app/dashboard/store";
import { useIsMacTauri } from "../hooks/useIsMacTauri";
import { getConfig } from "../lib/db";
import { windowDragPointerDown } from "../lib/windowDrag";
import type { NewImportStep, SidebarView } from "../types";
import { Header } from "./Header";
import { readInitialSidebarWidth, Sidebar } from "./Sidebar";

const DRAG_STRIP_PX = 20;

function headerTitle(view: SidebarView): string {
  switch (view) {
    case "history":
      return "Transcriptions";
    case "settings":
      return "";
    case "record":
      return "Record";
  }
}

type SetupGate = "loading" | "setup" | "ready";

export function AppShell() {
  const [view, setView] = useState<SidebarView>("history");
  const [sidebarWidth, setSidebarWidth] = useState(() =>
    readInitialSidebarWidth(),
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitialFocus, setModalInitialFocus] =
    useState<NewImportStep | null>(null);
  const [setupGate, setSetupGate] = useState<SetupGate>(() =>
    isTauri() ? "loading" : "ready",
  );
  const isMac = useIsMacTauri();

  const loadJobs = useTranscriptionStore((state) => state.loadJobs);
  const initPipelineListeners = useTranscriptionStore(
    (state) => state.initPipelineListeners,
  );
  const refreshMaxConcurrent = useTranscriptionStore(
    (state) => state.refreshMaxConcurrent,
  );
  const addLocalFiles = useTranscriptionStore((state) => state.addLocalFiles);
  const addLocalFilePaths = useTranscriptionStore(
    (state) => state.addLocalFilePaths,
  );
  const addUrlImport = useTranscriptionStore((state) => state.addUrlImport);
  const selectedJobId = useTranscriptionStore((state) => state.selectedJobId);
  const jobs = useTranscriptionStore((state) => state.jobs);
  const setSelectedJob = useTranscriptionStore((state) => state.setSelectedJob);

  useEffect(() => {
    if (!isTauri()) return;
    void (async () => {
      const done = await getConfig("setup_completed");
      setSetupGate(done === "true" ? "ready" : "setup");
    })();
  }, []);

  useEffect(() => {
    if (!isTauri()) {
      void loadJobs();
      return;
    }
    if (setupGate !== "ready") return;
    void initPipelineListeners();
    void refreshMaxConcurrent();
    void loadJobs();
  }, [setupGate, initPipelineListeners, refreshMaxConcurrent, loadJobs]);

  const openModal = (focus?: NewImportStep | null) => {
    setModalInitialFocus(focus ?? null);
    setModalOpen(true);
  };

  if (setupGate === "loading" && isTauri()) {
    return (
      <div className="flex h-dvh items-center justify-center bg-zinc-50 text-sm text-zinc-600 dark:bg-zinc-950 dark:text-zinc-400">
        Loading…
      </div>
    );
  }

  if (setupGate === "setup" && isTauri()) {
    return (
      <SetupScreen
        onComplete={() => {
          setSetupGate("ready");
        }}
      />
    );
  }

  return (
    <>
      <div className="flex h-dvh min-h-0 flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1 gap-2 overflow-hidden p-2">
          <Sidebar
            active={view}
            onChange={(newView) => {
              if (newView === "history") setSelectedJob(null);
              setView(newView);
            }}
            width={sidebarWidth}
            onWidthChange={setSidebarWidth}
            mainColumnDragStripPx={DRAG_STRIP_PX}
            trafficInset={isMac}
          />

          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <div
              data-tauri-drag-region
              onPointerDown={windowDragPointerDown}
              className="chrome-bg w-full shrink-0 select-none"
              style={{ height: DRAG_STRIP_PX }}
              aria-hidden
            />
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-[var(--color-content-bg-dark)] dark:bg-[var(--color-content-bg-dark)] dark:shadow-none">
              {view !== "settings" ? (
                <Header
                  title={headerTitle(view)}
                  onNewTranscription={() => openModal()}
                  transcriptDetail={
                    view === "history" && selectedJobId
                      ? {
                          fileName:
                            jobs.find((job) => job.id === selectedJobId)
                              ?.filename ?? "",
                          onBack: () => setSelectedJob(null),
                        }
                      : undefined
                  }
                />
              ) : null}

              <main
                className={
                  view === "settings"
                    ? "flex min-h-0 flex-1 flex-col overflow-hidden"
                    : selectedJobId
                      ? "flex min-h-0 flex-1 overflow-hidden"
                      : "min-h-0 flex-1 overflow-y-auto"
                }
              >
                {view === "history" ? <Dashboard /> : null}
                {view === "settings" ? <Settings /> : null}
                {view === "record" ? <Record /> : null}
              </main>
            </div>
          </div>
        </div>
      </div>

      <NewTranscriptionModal
        open={modalOpen}
        initialFocus={modalInitialFocus}
        onOpenChange={setModalOpen}
        onLocalFiles={addLocalFiles}
        onLocalFilePaths={addLocalFilePaths}
        onUrl={addUrlImport}
      />
    </>
  );
}
