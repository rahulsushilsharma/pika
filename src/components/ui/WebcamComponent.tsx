import Cat, { Paw, type CatMood } from "@/components/ui/Cat";
import EffectPicker from "@/components/ui/EffectPicker";
import LayoutPicker, {
  DEFAULT_LAYOUT,
  type LayoutTemplate,
} from "@/components/ui/LayoutPicker";
import ThemePicker from "@/components/ui/ThemePicker";
import {
  DEFAULT_EFFECT,
  DEFAULT_THEME,
  type BoothTheme,
  type PhotoEffect,
} from "@/lib/themes";
import { Camera, Download, RefreshCw, Share2 } from "lucide-react";
import {
  trackAppInstalled,
  trackBoothStarted,
  trackCollageCreated,
  trackCollageDownloaded,
  trackCollageShared,
  trackEffectChanged,
  trackPhotoCaptured,
  trackRetake,
  trackThemeChanged,
} from "@/lib/firebase";
import { useInstallPrompt } from "@/lib/useInatallPrompt";
import { useCallback, useEffect, useRef, useState } from "react";

// ── Audio ─────────────────────────────────────────────────

function playShutterSound() {
  let ctx: AudioContext | undefined;
  try {
    ctx = new AudioContext();
    const bufferSize = ctx.sampleRate * 0.08;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] =
        (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.012));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1200;
    filter.Q.value = 0.8;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.6, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
    noise.stop(ctx.currentTime + 0.08);
    noise.onended = () => ctx?.close();
  } catch {
    ctx?.close();
  }
}

// ── Helpers ───────────────────────────────────────────────

function captureFrame(video: HTMLVideoElement): string {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg");
}

function countdown(
  seconds: number,
  onTick: (n: number) => void,
): Promise<void> {
  return new Promise((resolve) => {
    onTick(seconds);
    const id = setInterval(() => {
      seconds -= 1;
      if (seconds <= 0) {
        clearInterval(id);
        onTick(0);
        resolve();
      } else {
        onTick(seconds);
      }
    }, 1000);
  });
}

async function buildCollage(
  canvas: HTMLCanvasElement,
  rawPhotos: string[],
  gridSize: number,
  theme: BoothTheme,
  effect: PhotoEffect,
): Promise<string> {
  const ctx = canvas.getContext("2d")!;

  const loaded = await Promise.all(
    rawPhotos.map(
      (src) =>
        new Promise<HTMLImageElement>((res, rej) => {
          const img = new Image();
          img.onload = () => res(img);
          img.onerror = rej;
          img.src = src;
        }),
    ),
  );

  const imgW = loaded[0].width;
  const imgH = loaded[0].height;
  const cols = gridSize;
  const rows = Math.ceil(loaded.length / cols);
  // theme sizes are tuned for a 640px-wide shot; scale for HD webcams
  const s = imgW / 640;
  const padding = theme.padding * s;
  const gap = theme.gap * s;
  const frameWidth = theme.frameWidth * s;
  const { frameColor } = theme;
  const bandH = 96 * s;

  canvas.width = cols * imgW + (cols - 1) * gap + padding * 2;
  canvas.height = rows * imgH + (rows - 1) * gap + padding * 2 + bandH;

  // Background
  if (theme.backgroundGradient) {
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, theme.backgroundGradient[0]);
    grad.addColorStop(1, theme.backgroundGradient[1]);
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = theme.backgroundColor;
  }
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Photos + effect + frame border
  loaded.forEach((img, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = padding + col * (imgW + gap);
    const y = padding + row * (imgH + gap);

    ctx.drawImage(img, x, y, imgW, imgH);
    effect.apply(ctx, x, y, imgW, imgH);

    // Frame border
    ctx.save();
    ctx.strokeStyle = frameColor;
    ctx.lineWidth = frameWidth;
    ctx.strokeRect(
      x - frameWidth / 2,
      y - frameWidth / 2,
      imgW + frameWidth,
      imgH + frameWidth,
    );
    ctx.restore();
    theme.decorate?.(ctx, x, y, imgW, imgH, i, s);
  });

  await drawWatermark(ctx, canvas.width, canvas.height - bandH - padding / 2, bandH, s, isDark(theme.backgroundColor));

  return canvas.toDataURL("image/jpeg", 0.92);
}

function isDark(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) < 128;
}

/** Brand band under the photos: cat face + "pika" left, date + url right. */
async function drawWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  top: number,
  height: number,
  s: number,
  dark: boolean,
) {
  await Promise.all([
    document.fonts.load(`800 ${44 * s}px Sniglet`),
    document.fonts.load(`700 ${18 * s}px "M PLUS Rounded 1c"`),
  ]).catch(() => {});

  const ink = dark ? "#ffffff" : "#2e2240";
  const pad = 56 * s;
  const mid = top + height / 2;

  // cat face
  const r = 22 * s;
  const cx = pad + r;
  ctx.save();
  ctx.fillStyle = "#ffa94d";
  ctx.strokeStyle = "#2e2240";
  ctx.lineWidth = 3 * s;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.95, mid - r * 0.2);
  ctx.lineTo(cx - r * 0.85, mid - r * 1.35);
  ctx.lineTo(cx - r * 0.2, mid - r * 0.85);
  ctx.lineTo(cx + r * 0.2, mid - r * 0.85);
  ctx.lineTo(cx + r * 0.85, mid - r * 1.35);
  ctx.lineTo(cx + r * 0.95, mid - r * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(cx, mid, r * 1.1, r * 0.9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#2e2240";
  for (const ex of [-0.4, 0.4]) {
    ctx.beginPath();
    ctx.ellipse(cx + ex * r, mid - r * 0.05, r * 0.11, r * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = ink;
  ctx.textBaseline = "middle";
  ctx.font = `800 ${44 * s}px Sniglet, sans-serif`;
  ctx.fillText("pika", cx + r * 1.6, mid + 2 * s);

  ctx.textAlign = "right";
  ctx.font = `700 ${18 * s}px "M PLUS Rounded 1c", sans-serif`;
  const date = new Date().toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  ctx.globalAlpha = 0.75;
  ctx.fillText(date, width - pad, mid - 12 * s);
  ctx.globalAlpha = 1;
  ctx.fillText("pika.rahulsharma.app", width - pad, mid + 13 * s);
  ctx.restore();
}

// ── Timer Overlay ─────────────────────────────────────────

function TimerOverlay({ timer }: { timer: number }) {
  const [visible, setVisible] = useState<number | null>(null);

  useEffect(() => {
    if (timer > 0) {
      setVisible(timer);
      const t = setTimeout(() => setVisible(null), 900);
      return () => clearTimeout(t);
    }
  }, [timer]);

  if (!visible) return null;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-50 overflow-hidden">
      <div className="absolute inset-0 bg-ink/25" />
      <div key={visible} className="animate-countdown relative z-10 text-white drop-shadow-[0_4px_0_var(--ink)]">
        <Paw size={180} className="w-36 h-36 sm:w-44 sm:h-44">
          <text
            x="50"
            y="70"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="var(--ink)"
            fontFamily="Sniglet"
            fontWeight="800"
            fontSize="34"
          >
            {visible}
          </text>
        </Paw>
      </div>
      <p className="relative z-10 text-white text-xl font-display mt-1 drop-shadow-[0_2px_0_var(--ink)]">
        say cheese
      </p>
    </div>
  );
}

// ── Progress paws ─────────────────────────────────────────

function PhotoProgress({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 text-ginger" role="progressbar" aria-valuenow={current} aria-valuemax={total}>
      {Array.from({ length: total }).map((_, i) => (
        <Paw
          key={i}
          size={18}
          filled={i < current}
          className={i === current ? "animate-paw text-ink" : i < current ? "" : "text-border"}
        />
      ))}
    </div>
  );
}

// ── Polaroid strip ────────────────────────────────────────

const ROTATIONS = [-4, 3, -2, 5, -3, 2, -5, 4, -1];

function PolaroidStrip({ thumbs, total }: { thumbs: string[]; total: number }) {
  return (
    <div className="w-full max-w-2xl overflow-x-auto scrollbar-none px-2">
      <ol className="flex items-end justify-start sm:justify-center gap-3 w-max sm:w-full mx-auto py-2">
        {Array.from({ length: total }).map((_, i) => {
          const src = thumbs[i];
          return (
            <li
              key={i}
              className="shrink-0"
              style={
                src
                  ? {
                      transform: `rotate(${ROTATIONS[i % ROTATIONS.length]}deg)`,
                      animation: "polaroid-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both",
                    }
                  : undefined
              }
            >
              {src ? (
                <div className="bg-white p-1.5 pb-5 sm:p-2 sm:pb-6 rounded-md border-2 border-ink shadow-[0_3px_0_var(--ink)]">
                  <img
                    src={src}
                    alt={`Shot ${i + 1}`}
                    className="w-16 h-12 sm:w-20 sm:h-16 object-cover block rounded-sm"
                  />
                </div>
              ) : (
                <div className="w-[80px] h-[78px] sm:w-[100px] sm:h-[100px] rounded-md border-2 border-dashed border-ink/25 flex items-center justify-center text-ink/20">
                  <Paw size={18} />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────

export default function PhotoBooth() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shootingRef = useRef(false);
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [timer, setTimer] = useState(0);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [rawPhotos, setRawPhotos] = useState<string[]>([]);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [shooting, setShooting] = useState(false);
  const [shotCount, setShotCount] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [flash, setFlash] = useState(false);
  const [thumbs, setThumbs] = useState<string[]>([]);
  const [rerendering, setRerendering] = useState(false);

  const [layout, setLayout] = useState<LayoutTemplate>(DEFAULT_LAYOUT);

  const [activeTheme, setActiveTheme] = useState<BoothTheme>(DEFAULT_THEME);
  const [activeEffect, setActiveEffect] = useState<PhotoEffect>(DEFAULT_EFFECT);

  // Camera init
  useEffect(() => {
    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => setCameraReady(true);
        }
      } catch (err) {
        setCameraError(
          err instanceof Error ? err.message : "Camera access denied",
        );
      }
    };
    start();
    const video = videoRef.current;
    return () => {
      if (video?.srcObject) {
        (video.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
        video.srcObject = null;
      }
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    };
  }, []);

  // Re-render collage when theme or effect changes
  const rerenderCollage = useCallback(
    async (photos: string[], theme: BoothTheme, effect: PhotoEffect) => {
      if (!canvasRef.current || photos.length === 0) return;
      setRerendering(true);
      try {
        const result = await buildCollage(canvasRef.current, photos, layout.cols, theme, effect);
        setCapturedImage(result);
      } catch (e) {
        console.error("Failed to render collage:", e);
      } finally {
        setRerendering(false);
      }
    },
    [layout],
  );

  useEffect(() => {
    if (rawPhotos.length > 0)
      rerenderCollage(rawPhotos, activeTheme, activeEffect);
  }, [activeTheme, activeEffect, rawPhotos, rerenderCollage]);

  async function takePhotoSequence() {
    if (!videoRef.current || shootingRef.current) return;
    shootingRef.current = true;

    const effective = layout.cols * layout.rows;
    trackBoothStarted({ layout_id: layout.id, photo_count: effective, cols: layout.cols, rows: layout.rows });

    setShooting(true);
    setShotCount(0);
    setCapturedImage(null);
    setRawPhotos([]);
    setThumbs([]);
    const photos: string[] = [];

    try {
      for (let i = 0; i < effective; i++) {
        await countdown(3, setTimer);
        playShutterSound();
        setFlash(true);
        if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
        flashTimeoutRef.current = setTimeout(() => setFlash(false), 350);
        const captured = videoRef.current ? captureFrame(videoRef.current) : "";
        if (captured) photos.push(captured);
        setThumbs((prev) => [...prev, captured]);
        setShotCount(i + 1);
        trackPhotoCaptured({ shot_index: i, total: effective });
      }

      if (canvasRef.current && photos.length > 0) {
        const result = await buildCollage(canvasRef.current, photos, layout.cols, activeTheme, activeEffect);
        setRawPhotos(photos);
        setCapturedImage(result);
        trackCollageCreated({ layout_id: layout.id, theme_id: activeTheme.id, effect_id: activeEffect.id, photo_count: photos.length });
      }
    } catch (e) {
      console.error("Photo sequence failed:", e);
    } finally {
      setShooting(false);
      setShotCount(0);
      shootingRef.current = false;
    }
  }

  function handleRetake() {
    trackRetake();
    setCapturedImage(null);
    setRawPhotos([]);
    setThumbs([]);
  }

  function handleThemeChange(theme: BoothTheme) {
    trackThemeChanged({ theme_id: theme.id, theme_name: theme.name });
    setActiveTheme(theme);
  }

  function handleEffectChange(effect: PhotoEffect) {
    trackEffectChanged({ effect_id: effect.id, effect_name: effect.name });
    setActiveEffect(effect);
  }

  function handleDownload() {
    if (!capturedImage) return;
    trackCollageDownloaded({
      theme_id: activeTheme.id,
      effect_id: activeEffect.id,
      layout_id: layout.id,
    });
    const link = document.createElement("a");
    link.href = capturedImage;
    link.download = "pika-booth.jpg";
    link.click();
  }

  async function handleShare() {
    if (!capturedImage) return;
    const blob = await (await fetch(capturedImage)).blob();
    const file = new File([blob], "pika-booth.jpg", { type: "image/jpeg" });
    if (!navigator.canShare?.({ files: [file] })) return handleDownload();
    try {
      await navigator.share({ files: [file], text: "made with pika 🐱 pika.rahulsharma.app" });
      trackCollageShared({ theme_id: activeTheme.id, effect_id: activeEffect.id, layout_id: layout.id });
    } catch (e) {
      if ((e as Error).name !== "AbortError") handleDownload();
    }
  }

  async function handleInstall() {
    try {
      const outcome = await install();
      if (outcome === "accepted") trackAppInstalled();
    } catch (e) {
      console.error("PWA install failed:", e);
    }
  }

  const effective = layout.cols * layout.rows;
  const { canInstall, install } = useInstallPrompt();
  const catMood: CatMood = flash ? "snap" : shooting ? "count" : capturedImage ? "done" : "idle";

  return (
    <div className="min-h-dvh flex flex-col items-center px-4 py-6 sm:py-10 gap-5 sm:gap-8">
      {/* Header */}
      <header className="flex flex-col items-center gap-1 relative w-full max-w-2xl">
        <h1 className="text-5xl sm:text-6xl font-display font-extrabold tracking-tight">pika</h1>
        <p className="text-muted-foreground text-sm font-bold">your tiny cat photo booth</p>
        {canInstall && (
          <button
            onClick={handleInstall}
            className="absolute right-0 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-full text-xs font-bold bg-card btn-sticker"
          >
            install
          </button>
        )}
      </header>

      {/* Stage: the camera, or the finished strip. The cat sits on whichever is showing. */}
      <main className={`w-full relative mt-14 sm:mt-16 ${capturedImage ? "max-w-4xl" : "max-w-2xl"}`}>
        <div className="absolute left-5 sm:left-8 bottom-full -mb-[7px] z-20">
          <Cat mood={catMood} tick={timer} />
        </div>

        {/* video stays mounted while the result shows, so retake is instant */}
        <div className={`relative rounded-[28px] overflow-hidden border-[3px] border-ink bg-ink ${capturedImage ? "hidden" : ""}`}>
          {cameraError ? (
            <div className="w-full aspect-[3/4] sm:aspect-[4/3] bg-muted flex flex-col items-center justify-center gap-3 text-center p-8">
              <Camera className="w-8 h-8 text-destructive" />
              <p className="font-bold">The camera is blocked</p>
              <p className="text-sm text-muted-foreground max-w-xs text-pretty">
                Allow camera access in your browser&apos;s site settings, then reload the page. ({cameraError})
              </p>
            </div>
          ) : (
            <>
              {!cameraReady && (
                <div className="absolute inset-0 z-10 bg-muted flex flex-col items-center justify-center gap-3 text-ink">
                  <Paw size={28} className="animate-paw" />
                  <p className="text-sm font-bold text-muted-foreground">waking up the camera…</p>
                </div>
              )}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full aspect-[3/4] sm:aspect-[4/3] object-cover bg-ink scale-x-[-1] block"
              />
            </>
          )}

          {flash && (
            <div
              className="absolute inset-0 z-50 pointer-events-none bg-white"
              style={{ animation: "shutter-flash 0.35s ease-out forwards" }}
            />
          )}

          <TimerOverlay timer={timer} />

          {shooting && (
            <div className="absolute top-4 right-4 z-40 bg-card text-ink text-sm font-bold px-3 py-1 rounded-full border-2 border-ink tabular-nums">
              {shotCount + 1} of {effective}
            </div>
          )}
        </div>

        {capturedImage && (
          <div className="animate-slide-up bg-card border-[3px] border-ink rounded-[28px] p-4 sm:p-6 grid gap-5 sm:gap-7 sm:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] sm:items-start">
            <div className="relative rounded-2xl overflow-hidden border-2 border-ink bg-muted">
              <img
                src={capturedImage}
                alt="Your photo strip"
                className={`w-full object-contain block transition-opacity duration-300 ${rerendering ? "opacity-40" : "opacity-100"}`}
              />
              {rerendering && (
                <div className="absolute inset-0 flex items-center justify-center text-ink">
                  <Paw size={32} className="animate-paw" />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-5 min-w-0">
              <div>
                <h2 className="font-display font-extrabold text-3xl leading-none tracking-tight">your strip is ready</h2>
                <p className="text-sm text-muted-foreground mt-2 text-pretty">Try a frame or an effect, then send it to someone.</p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleShare}
                  className="btn-sticker basis-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-display font-extrabold text-lg bg-ginger text-ink"
                >
                  <Share2 className="w-5 h-5" strokeWidth={2.5} />
                  share
                </button>
                <button
                  onClick={handleDownload}
                  className="btn-sticker flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-sm bg-card"
                >
                  <Download className="w-4 h-4" strokeWidth={2.5} />
                  save
                </button>
                <button
                  onClick={handleRetake}
                  className="btn-sticker flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-sm bg-card"
                >
                  <RefreshCw className="w-4 h-4" strokeWidth={2.5} />
                  retake
                </button>
              </div>

              <div className="flex flex-col gap-4 pt-4 border-t-2 border-dashed border-border">
                <ThemePicker active={activeTheme.id} onChange={handleThemeChange} />
                <EffectPicker active={activeEffect.id} onChange={handleEffectChange} />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Polaroid strip */}
      {(shooting || (thumbs.length > 0 && !capturedImage)) && (
        <PolaroidStrip thumbs={thumbs} total={effective} />
      )}

      {/* Controls */}
      {!capturedImage && (
        <div className="w-full max-w-2xl bg-card border-2 border-ink rounded-3xl p-4 sm:p-6">
          {shooting ? (
            <div className="flex flex-col items-center gap-3 py-1">
              <p className="text-sm font-bold text-muted-foreground">hold still, the cat is counting</p>
              <PhotoProgress current={shotCount} total={effective} />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <p className="text-sm font-bold pl-0.5">pick a layout</p>
                <LayoutPicker active={layout.id} onChange={setLayout} />
              </div>

              <button
                onClick={takePhotoSequence}
                disabled={!!cameraError || !cameraReady}
                className="btn-sticker w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-display font-extrabold text-lg bg-ginger text-ink disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Camera className="w-5 h-5" strokeWidth={2.5} />
                take {effective} {effective === 1 ? "photo" : "photos"}
              </button>
            </div>
          )}
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      <footer className="mt-auto pt-4 text-xs font-bold text-muted-foreground text-center">
        your photos never leave your device 🐾
      </footer>
    </div>
  );
}
