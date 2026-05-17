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
      return "Settings";
    case "record":
      return "Record";
  }
}

type SetupGate = "loading" | "setup" | "ready";

export function AppShell() {
  const [view, setView] = useState<SidebarView>("history");
  const [sidebarWidth, setSidebarWidth] = useState(() => readInitialSidebarWidth());
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitialFocus, setModalInitialFocus] =
    useState<NewImportStep | null>(null);
  const [setupGate, setSetupGate] = useState<SetupGate>(() =>
    isTauri() ? "loading" : "ready",
  );
  const isMac = useIsMacTauri();

  const loadJobs = useTranscriptionStore((s) => s.loadJobs);
  const initPipelineListeners = useTranscriptionStore(
    (s) => s.initPipelineListeners,
  );
  const refreshMaxConcurrent = useTranscriptionStore(
    (s) => s.refreshMaxConcurrent,
  );
  const addLocalFiles = useTranscriptionStore((s) => s.addLocalFiles);
  const addLocalFilePaths = useTranscriptionStore((s) => s.addLocalFilePaths);
  const addUrlImport = useTranscriptionStore((s) => s.addUrlImport);

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
            onChange={setView}
            width={sidebarWidth}
            onWidthChange={setSidebarWidth}
            mainColumnDragStripPx={DRAG_STRIP_PX}
            trafficInset={isMac}
          />

          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div
              data-tauri-drag-region
              onPointerDown={windowDragPointerDown}
              className="chrome-bg w-full shrink-0 select-none"
              style={{height: DRAG_STRIP_PX}}
              aria-hidden
            />
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-none">
              <Header
                title={headerTitle(view)}
                onNewTranscription={() => openModal()}
              />

              <main className="min-h-0 flex-1 overflow-auto">
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
