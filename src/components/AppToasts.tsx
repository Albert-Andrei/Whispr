import { Toast } from "@base-ui-components/react/toast";
import { appToastManager } from "../lib/toastManager";
import "./AppToasts.css";

function IconCheck() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="shrink-0 text-zinc-500 dark:text-zinc-400"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function ToastList() {
  const { toasts } = Toast.useToastManager();

  return (
    <Toast.Portal>
      <Toast.Viewport className="whispr-toast-viewport">
        {toasts.map((toast) => (
          <Toast.Root key={toast.id} toast={toast} className="whispr-toast">
            <Toast.Content className="whispr-toast-content">
              <div className="whispr-toast-body group">
                {toast.type === "success" ? <IconCheck /> : null}
                <Toast.Title className="whispr-toast-title" />
                <Toast.Close
                  className="whispr-toast-close"
                  aria-label="Dismiss notification"
                >
                  ×
                </Toast.Close>
              </div>
            </Toast.Content>
          </Toast.Root>
        ))}
      </Toast.Viewport>
    </Toast.Portal>
  );
}

export function AppToasts() {
  return (
    <Toast.Provider toastManager={appToastManager} limit={3} timeout={2500}>
      <ToastList />
    </Toast.Provider>
  );
}
