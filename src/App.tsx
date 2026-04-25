import "./App.css";
import PhotoBooth from "./components/ui/WebcamComponent.tsx";
import PWABadge from "./PWABadge.tsx";

function App() {
  return (
    <>
      <PhotoBooth />
      <PWABadge />
    </>
  );
}

export default App;
