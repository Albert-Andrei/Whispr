import { useEffect, useState } from "react";
import { Dashboard } from "../app/dashboard/Dashboard";
import { NewTranscriptionModal } from "../app/import/NewTranscriptionModal";
import { Record } from "../app/record/Record";
import { Settings } from "../app/settings/Settings";
import { useTranscriptionStore } from "../app/dashboard/store";
import { useIsMacTauri } from "../hooks/useIsMacTauri";
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

export function AppShell() {
  const [view, setView] = useState<SidebarView>("history");
  const [sidebarWidth, setSidebarWidth] = useState(() => readInitialSidebarWidth());
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitialStep, setModalInitialStep] =
    useState<NewImportStep>("choose");
  const isMac = useIsMacTauri();

  const loadJobs = useTranscriptionStore((s) => s.loadJobs);
  const addLocalFiles = useTranscriptionStore((s) => s.addLocalFiles);
  const addUrlImport = useTranscriptionStore((s) => s.addUrlImport);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  const openModal = (step: NewImportStep = "choose") => {
    setModalInitialStep(step);
    setModalOpen(true);
  };

  return (
    <>
      <div className="flex h-[100dvh] min-h-0 flex-col overflow-hidden">
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
                onNewTranscription={() => openModal("choose")}
              />

              <main className="min-h-0 flex-1 overflow-auto">
                {view === "history" ? (
                  <Dashboard
                    onRequestImport={(step) => {
                      openModal(step);
                    }}
                  />
                ) : null}
                {view === "settings" ? <Settings /> : null}
                {view === "record" ? <Record /> : null}
              </main>
            </div>
          </div>
        </div>
      </div>

      <NewTranscriptionModal
        open={modalOpen}
        initialStep={modalInitialStep}
        onOpenChange={setModalOpen}
        onLocalFiles={addLocalFiles}
        onUrl={addUrlImport}
      />
    </>
  );
}
