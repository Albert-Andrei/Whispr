import { Toast } from "@base-ui-components/react/toast";

export const appToastManager = Toast.createToastManager();

export function showAppToast(
  title: string,
  options?: { timeout?: number; type?: string },
): void {
  appToastManager.add({
    title,
    type: options?.type ?? "success",
    timeout: options?.timeout ?? 2500,
  });
}
