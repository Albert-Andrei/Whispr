/** Media picked for import, shown in the clip editor before a job is created. */
export type ImportSource =
  | { kind: "url"; url: string }
  | { kind: "local"; path: string; name: string };
