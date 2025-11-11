import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, WifiOff, X } from "lucide-react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { Button } from "./components/ui/button";

export function PWABadge() {
  const period = 60 * 60 * 1000; // check every hour

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      if (period <= 0) return;
      if (r?.active?.state === "activated") {
        registerPeriodicSync(period, swUrl, r);
      } else if (r?.installing) {
        r.installing.addEventListener("statechange", (e) => {
          const sw = e.target as ServiceWorker;
          if (sw.state === "activated") registerPeriodicSync(period, swUrl, r);
        });
      }
    },
  });

  function close() {
    setOfflineReady(false);
    setNeedRefresh(false);
  }

  return (
    <>
      {(offlineReady || needRefresh) && (
        <div className="fixed bottom-6 right-6 z-50">
          <Card className="shadow-xl border border-muted bg-background/90 backdrop-blur-md max-w-sm">
            <CardContent className="flex flex-col gap-3 p-4">
              <div className="flex items-center gap-2">
                {offlineReady ? (
                  <WifiOff className="h-5 w-5 text-green-500" />
                ) : (
                  <RefreshCw className="h-5 w-5 text-blue-500 animate-spin-slow" />
                )}
                <p className="text-sm font-medium">
                  {offlineReady
                    ? "App ready to work offline."
                    : "New content available — reload to update."}
                </p>
              </div>

              <div className="flex justify-end gap-2">
                {needRefresh && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => updateServiceWorker(true)}
                  >
                    Reload
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={close}
                  className="flex items-center gap-1"
                >
                  <X className="h-4 w-4" /> Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

export default PWABadge;

// 🔁 Helper function: periodic SW update check
function registerPeriodicSync(
  period: number,
  swUrl: string,
  r: ServiceWorkerRegistration
) {
  if (period <= 0) return;

  setInterval(async () => {
    if ("onLine" in navigator && !navigator.onLine) return;

    const resp = await fetch(swUrl, {
      cache: "no-store",
      headers: {
        cache: "no-store",
        "cache-control": "no-cache",
      },
    });

    if (resp?.status === 200) await r.update();
  }, period);
}
