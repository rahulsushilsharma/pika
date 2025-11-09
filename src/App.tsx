import "./App.css";
import { useInstallPrompt } from "./lib/useInatallPrompt";

function App() {
  const { canInstall, install } = useInstallPrompt();
  return (
    <>
      {canInstall && <button onClick={install}>Install App</button>}
      <img src="logo.svg" className="w-32 h-32 " alt="logo" />
    </>
  );
}

export default App;
