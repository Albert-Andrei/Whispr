export const RELEASES_URL = "https://github.com/Albert-Andrei/Whispr/releases";
export const UPDATE_DISMISS_KEY = "whispr.update.dismissed";

export function isUpdateDismissed(latestVersion: string): boolean {
  try {
    return localStorage.getItem(UPDATE_DISMISS_KEY) === latestVersion;
  } catch {
    return false;
  }
}

export function dismissUpdate(latestVersion: string) {
  try {
    localStorage.setItem(UPDATE_DISMISS_KEY, latestVersion);
  } catch {
    /* ignore */
  }
}
