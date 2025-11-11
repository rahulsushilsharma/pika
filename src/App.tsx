import "./App.css";
import WebcamCapture from "./components/ui/WebcamComponent.tsx";
import PWABadge from "./PWABadge.tsx";

function App() {
  return (
    <>
      <WebcamCapture />
      <PWABadge />
    </>
  );
}

export default App;
