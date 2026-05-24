import type { TFunction } from "i18next";
import type { JobStatus, SourceType } from "../app/dashboard/types";

export function jobStatusLabel(t: TFunction, status: JobStatus): string {
  return t(`backend:jobStatus.${status}`);
}

export function pipelineStageLabel(
  t: TFunction,
  stage: string | null,
): string | null {
  if (!stage) return null;
  const key = `backend:pipelineStage.${stage}`;
  if (t(key) === key) return stage;
  return t(key);
}

export function diskCategoryLabel(t: TFunction, categoryId: string): string {
  const key = `backend:disk.${categoryId}`;
  if (t(key) === key) return categoryId;
  return t(key);
}

export function sourceTypeLabel(
  t: TFunction,
  sourceType: SourceType | string | null,
): string {
  if (!sourceType) return t("backend:sourceType.unknown");
  const key = `backend:sourceType.${sourceType}`;
  if (t(key) === key) return sourceType;
  return t(key);
}

export function mediaSourceLabel(
  t: TFunction,
  sourceType: string | null,
): string {
  if (sourceType === "record") return t("backend:sourceType.record");
  if (sourceType === "url") return t("backend:sourceType.urlImport");
  if (sourceType === "local") return t("backend:sourceType.local");
  return t("backend:sourceType.transcription");
}
