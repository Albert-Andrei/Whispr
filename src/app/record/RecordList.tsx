import { FileList } from "../dashboard/FileList";
import type { TranscriptionJob } from "../dashboard/types";
import { useRecordStore } from "./store";

type RecordListProps = {
  jobs: TranscriptionJob[];
};

export function RecordList({ jobs }: RecordListProps) {
  const setSelected = useRecordStore((s) => s.setSelectedJob);
  const loadRecordJobs = useRecordStore((s) => s.loadJobs);

  return (
    <FileList
      jobs={jobs}
      setSelectedJob={setSelected}
      onJobsChanged={() => void loadRecordJobs()}
      className="px-5 py-6 pb-24"
    />
  );
}
