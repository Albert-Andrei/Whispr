import { isTauri } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dashboard } from "../app/dashboard/Dashboard";
import { NewTranscriptionModal } from "../app/import/NewTranscriptionModal";
import { Media } from "../app/media/Media";
import { Record } from "../app/record/Record";
import { useRecordStore } from "../app/record/store";
import { Settings } from "../app/settings/Settings";
import { SetupScreen } from "../app/setup/SetupScreen";
import { useTranscriptionStore } from "../app/dashboard/store";
import type { AppUpdateHandle } from "../hooks/useAppUpdate";
import { prefetchBinaryHealth } from "../hooks/useBinaryHealth";
import { useIsMacTauri } from "../hooks/useIsMacTauri";
import { getConfig } from "../lib/db";
import { windowDragPointerDown } from "../lib/windowDrag";
import type { NewImportStep, SidebarView } from "../types";
import { AppFileDropLayer } from "./AppFileDropLayer";
import { AppToasts } from "./AppToasts";
import { Header } from "./Header";
import { readInitialSidebarWidth, Sidebar } from "./Sidebar";

const DRAG_STRIP_PX = 20;

function headerTitle(view: SidebarView, t: (key: string) => string): string {
  switch (view) {
    case "history":
      return t("common:nav.transcriptions");
    case "settings":
      return "";
    case "record":
      return t("common:nav.record");
    case "media":
      return t("common:nav.media");
  }
}

type SetupGate = "loading" | "setup" | "ready";

type AppShellProps = {
  appUpdate: AppUpdateHandle;
};

export function AppShell({ appUpdate }: AppShellProps) {
  const { t } = useTranslation(["common", "app"]);
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
  const renameJob = useTranscriptionStore((state) => state.renameJob);
  const removeJob = useTranscriptionStore((state) => state.removeJob);

  const loadRecordJobs = useRecordStore((state) => state.loadJobs);
  const initRecordListeners = useRecordStore((state) => state.initRecordListeners);
  const recordSelectedId = useRecordStore((state) => state.selectedJobId);
  const recordJobs = useRecordStore((state) => state.jobs);
  const setRecordSelectedJob = useRecordStore((state) => state.setSelectedJob);
  const requestRecordNavigation = useRecordStore((state) => state.requestNavigation);

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
    void initRecordListeners();
    void refreshMaxConcurrent();
    void loadJobs();
    void loadRecordJobs();
    prefetchBinaryHealth();
  }, [
    setupGate,
    initPipelineListeners,
    initRecordListeners,
    refreshMaxConcurrent,
    loadJobs,
    loadRecordJobs,
  ]);

  useEffect(() => {
    const onNavigate = (ev: Event) => {
      const detail = (ev as CustomEvent<SidebarView>).detail;
      if (
        detail === "history" ||
        detail === "settings" ||
        detail === "media"
      ) {
        setView(detail);
        if (detail === "history") setSelectedJob(null);
        setRecordSelectedJob(null);
      }
    };
    window.addEventListener("whispr:navigate", onNavigate);
    return () => window.removeEventListener("whispr:navigate", onNavigate);
  }, [setSelectedJob, setRecordSelectedJob]);

  const openModal = (focus?: NewImportStep | null) => {
    setModalInitialFocus(focus ?? null);
    setModalOpen(true);
  };

  if (setupGate === "loading" && isTauri()) {
    return (
      <div className="flex h-dvh items-center justify-center bg-zinc-50 text-sm text-zinc-600 dark:bg-zinc-950 dark:text-zinc-400">
        {t("app:components.appShell.loading")}
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
              if (newView !== "record" && view === "record") {
                const allowed = requestRecordNavigation(newView);
                if (!allowed) return;
              }
              if (newView === "history") setSelectedJob(null);
              if (newView !== "record") setRecordSelectedJob(null);
              setView(newView);
            }}
            width={sidebarWidth}
            onWidthChange={setSidebarWidth}
            mainColumnDragStripPx={DRAG_STRIP_PX}
            trafficInset={isMac}
            updateAvailable={appUpdate.status === "available"}
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
                  title={headerTitle(view, t)}
                  onNewTranscription={
                    view === "history" ? () => openModal() : undefined
                  }
                  hideNew={view === "record" || view === "media"}
                  transcriptDetail={
                    view === "history" && selectedJobId
                      ? {
                          fileName:
                            jobs.find((job) => job.id === selectedJobId)
                              ?.filename ?? "",
                          onBack: () => setSelectedJob(null),
                          onRename: (filename) => {
                            void renameJob(selectedJobId, filename);
                          },
                          onDelete: () => {
                            void removeJob(selectedJobId);
                          },
                        }
                      : view === "record" && recordSelectedId
                        ? {
                            fileName:
                              recordJobs.find((job) => job.id === recordSelectedId)
                                ?.filename ?? "",
                            onBack: () => setRecordSelectedJob(null),
                            onRename: (filename) => {
                              void renameJob(recordSelectedId, filename).then(() =>
                                loadRecordJobs(),
                              );
                            },
                            onDelete: () => {
                              void removeJob(recordSelectedId).then(() =>
                                loadRecordJobs(),
                              );
                              setRecordSelectedJob(null);
                            },
                          }
                        : undefined
                  }
                />
              ) : null}

              <main
                className={
                  view === "settings"
                    ? "flex min-h-0 flex-1 flex-col overflow-hidden"
                    : view === "record" ||
                        (view === "history" && selectedJobId)
                      ? "flex min-h-0 flex-1 overflow-hidden"
                      : "min-h-0 flex-1 overflow-y-auto"
                }
              >
                {view === "history" ? <Dashboard /> : null}
                {view === "settings" ? (
                  <Settings appUpdate={appUpdate} />
                ) : null}
                {view === "record" ? <Record /> : null}
                {view === "media" ? <Media /> : null}
              </main>
            </div>
          </div>
        </div>
      </div>

      <AppFileDropLayer
        enabled={setupGate === "ready"}
        modalOpen={modalOpen}
        onLocalFiles={addLocalFiles}
        onLocalFilePaths={addLocalFilePaths}
        onDropped={() => {
          setModalOpen(false);
          if (view === "record") {
            setRecordSelectedJob(null);
            setView("history");
          }
        }}
      />

      <AppToasts />

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
