import { useRegisterSW } from "virtual:pwa-register/react";

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
        <div
          role="status"
          className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-6 sm:bottom-6 z-50 sm:max-w-xs bg-card border-2 border-ink rounded-2xl p-4 shadow-[0_4px_0_var(--ink)] animate-slide-up"
        >
          <p className="text-sm font-bold text-pretty">
            {offlineReady
              ? "pika works offline now. The cat stays with you."
              : "A new version of pika is ready."}
          </p>
          <div className="flex justify-end gap-2 mt-3">
            <button onClick={close} className="btn-sticker px-3 py-1.5 rounded-xl text-xs font-bold bg-card">
              {needRefresh ? "later" : "got it"}
            </button>
            {needRefresh && (
              <button
                onClick={() => updateServiceWorker(true)}
                className="btn-sticker px-3 py-1.5 rounded-xl text-xs font-bold bg-ginger"
              >
                update now
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default PWABadge;

// 🔁 Helper function: periodic SW update check
let syncInterval: ReturnType<typeof setInterval> | null = null;

function registerPeriodicSync(
  period: number,
  swUrl: string,
  r: ServiceWorkerRegistration
) {
  if (period <= 0) return;
  if (syncInterval) clearInterval(syncInterval);

  syncInterval = setInterval(async () => {
    if ("onLine" in navigator && !navigator.onLine) return;
    try {
      const resp = await fetch(swUrl, {
        cache: "no-store",
        headers: { "cache-control": "no-cache" },
      });
      if (resp?.status === 200) await r.update();
    } catch {
      // network unavailable — skip this cycle
    }
  }, period);
}
