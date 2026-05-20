import { AppShell } from "./components/AppShell";
import { UpdateAvailablePopover } from "./components/UpdateAvailablePopover";
import { useAppUpdate } from "./hooks/useAppUpdate";

function App() {
  const appUpdate = useAppUpdate();

  return (
    <>
      <AppShell appUpdate={appUpdate} />
      <UpdateAvailablePopover update={appUpdate} />
    </>
  );
}

export default App;
