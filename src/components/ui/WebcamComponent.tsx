import EffectPicker from "@/components/ui/EffectPicker";
import ThemePicker from "@/components/ui/ThemePicker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DEFAULT_EFFECT,
  DEFAULT_THEME,
  type BoothTheme,
  type PhotoEffect,
} from "@/lib/themes";
import { Camera, Download, RefreshCw, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

// ── Audio ─────────────────────────────────────────────────

function playShutterSound() {
  try {
    const ctx = new AudioContext();
    const bufferSize = ctx.sampleRate * 0.08;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.012));
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
    noise.onended = () => ctx.close();
  } catch {
    // silent fail
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

function countdown(seconds: number, onTick: (n: number) => void): Promise<void> {
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

function clampPhotos(num: number, grid: number) {
  return Math.min(num, grid * grid);
}

async function buildCollage(
  canvas: HTMLCanvasElement,
  rawPhotos: string[],
  gridSize: number,
  theme: BoothTheme,
  effect: PhotoEffect
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
        })
    )
  );

  const imgW = loaded[0].width;
  const imgH = loaded[0].height;
  const cols = gridSize;
  const rows = Math.ceil(loaded.length / cols);
  const { padding, gap, frameColor, frameWidth } = theme;

  canvas.width = cols * imgW + (cols - 1) * gap + padding * 2;
  canvas.height = rows * imgH + (rows - 1) * gap + padding * 2;

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
    ctx.strokeRect(x - frameWidth / 2, y - frameWidth / 2, imgW + frameWidth, imgH + frameWidth);
    ctx.restore();
  });

  return canvas.toDataURL("image/jpeg", 0.92);
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
    <div className="absolute inset-0 flex flex-col items-center justify-center z-50 rounded-3xl overflow-hidden">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      <span
        className="animate-countdown relative z-10 text-white font-black select-none"
        style={{
          fontSize: "clamp(6rem, 20vw, 10rem)",
          textShadow:
            "0 0 40px oklch(0.65 0.22 0 / 0.8), 0 0 80px oklch(0.65 0.22 0 / 0.4)",
        }}
      >
        {visible}
      </span>
      <p className="relative z-10 text-white/80 text-lg font-medium mt-2 tracking-wide animate-pulse">
        get ready ✨
      </p>
    </div>
  );
}

// ── Decorative blobs ──────────────────────────────────────

function BlobBg({ accent }: { accent: string }) {
  return (
    <div
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
      aria-hidden
    >
      <div
        className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full opacity-20 transition-all duration-700"
        style={{ background: `radial-gradient(circle, ${accent} 0%, transparent 70%)` }}
      />
      <div
        className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full opacity-15 transition-all duration-700"
        style={{ background: `radial-gradient(circle, ${accent} 0%, transparent 70%)` }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full opacity-10 transition-all duration-700"
        style={{ background: `radial-gradient(ellipse, ${accent} 0%, transparent 70%)` }}
      />
    </div>
  );
}

// ── Progress dots ─────────────────────────────────────────

function PhotoProgress({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all duration-500 ${
            i < current
              ? "bg-primary w-6"
              : i === current
              ? "bg-primary/50 w-4 animate-pulse"
              : "bg-border w-4"
          }`}
        />
      ))}
    </div>
  );
}

// ── Polaroid strip ────────────────────────────────────────

const ROTATIONS = [-4, 3, -2, 5, -3, 2, -5, 4, -1];

function PolaroidStrip({ thumbs, total }: { thumbs: string[]; total: number }) {
  return (
    <div className="w-full max-w-2xl">
      <div className="flex items-end justify-center gap-3 px-4 min-h-[140px]">
        {Array.from({ length: total }).map((_, i) => {
          const src = thumbs[i];
          const rot = ROTATIONS[i % ROTATIONS.length];
          return (
            <div
              key={i}
              className="relative flex-shrink-0"
              style={{
                transform: src ? `rotate(${rot}deg)` : "rotate(0deg) translateY(16px)",
                opacity: src ? 1 : 0,
                animation: src ? "polaroid-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both" : "none",
              }}
            >
              {src ? (
                <div
                  className="bg-white p-2 pb-7 rounded-sm"
                  style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.18), 0 1px 3px rgba(0,0,0,0.12)" }}
                >
                  <img
                    src={src}
                    alt={`shot ${i + 1}`}
                    className="w-20 h-16 object-cover block rounded-[2px]"
                  />
                  <p className="absolute bottom-1.5 left-0 right-0 text-center text-[9px] font-medium text-gray-400 tracking-widest">
                    #{i + 1}
                  </p>
                </div>
              ) : (
                <div className="bg-white/40 border-2 border-dashed border-border w-[88px] h-[104px] rounded-sm flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full border-2 border-border/60" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────

export default function PhotoBooth() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  const [numPhotos, setNumPhotos] = useState(4);
  const [gridSize, setGridSize] = useState(2);

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
        setCameraError(err instanceof Error ? err.message : "Camera access denied");
      }
    };
    start();
    const video = videoRef.current;
    return () => {
      if (video?.srcObject)
        (video.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Re-render collage when theme or effect changes
  const rerenderCollage = useCallback(
    async (photos: string[], theme: BoothTheme, effect: PhotoEffect) => {
      if (!canvasRef.current || photos.length === 0) return;
      setRerendering(true);
      const result = await buildCollage(canvasRef.current, photos, gridSize, theme, effect);
      setCapturedImage(result);
      setRerendering(false);
    },
    [gridSize]
  );

  useEffect(() => {
    if (rawPhotos.length > 0) rerenderCollage(rawPhotos, activeTheme, activeEffect);
  }, [activeTheme, activeEffect, rawPhotos, rerenderCollage]);

  async function takePhotoSequence() {
    if (!videoRef.current) return;
    const effective = clampPhotos(numPhotos, gridSize);
    setShooting(true);
    setShotCount(0);
    setCapturedImage(null);
    setRawPhotos([]);
    setThumbs([]);
    const photos: string[] = [];

    for (let i = 0; i < effective; i++) {
      await countdown(3, setTimer);
      playShutterSound();
      setFlash(true);
      setTimeout(() => setFlash(false), 350);
      const captured = videoRef.current ? captureFrame(videoRef.current) : "";
      if (captured) photos.push(captured);
      setThumbs((prev) => [...prev, captured]);
      setShotCount(i + 1);
    }

    if (canvasRef.current && photos.length > 0) {
      const result = await buildCollage(canvasRef.current, photos, gridSize, activeTheme, activeEffect);
      setRawPhotos(photos);
      setCapturedImage(result);
    }

    setShooting(false);
    setShotCount(0);
  }

  function handleRetake() {
    setCapturedImage(null);
    setRawPhotos([]);
    setThumbs([]);
  }

  const effective = clampPhotos(numPhotos, gridSize);

  return (
    <>
      <BlobBg accent={activeTheme.accent} />

      <div
        className="min-h-dvh flex flex-col items-center px-4 py-10 gap-8"
        style={{ "--primary": activeTheme.accent } as React.CSSProperties}
      >
        {/* Header */}
        <header className="flex flex-col items-center gap-1">
          <h1
            className="text-5xl text-primary"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}
          >
            pika
          </h1>
          <p className="text-muted-foreground text-sm font-medium tracking-wide">
            your cute photo booth ✦
          </p>
        </header>

        {/* Camera card */}
        <div className="w-full max-w-2xl">
          <div
            className="relative rounded-3xl overflow-hidden"
            style={{
              boxShadow: shooting ? "var(--shadow-pink-lg)" : "var(--shadow-lg)",
              transition: "box-shadow 0.4s ease",
            }}
          >
            {cameraError ? (
              <div className="w-full aspect-[4/3] bg-gradient-to-br from-pink-50 to-rose-100 flex flex-col items-center justify-center gap-3 text-center p-8">
                <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
                  <Camera className="w-7 h-7 text-destructive" />
                </div>
                <p className="font-semibold text-destructive">Camera unavailable</p>
                <p className="text-sm text-muted-foreground">{cameraError}</p>
              </div>
            ) : (
              <>
                {!cameraReady && (
                  <div className="absolute inset-0 z-10 bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                      <p className="text-sm text-muted-foreground font-medium">
                        starting camera…
                      </p>
                    </div>
                  </div>
                )}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full aspect-[4/3] object-cover bg-black scale-x-[-1]"
                />
              </>
            )}

            {flash && (
              <div
                className="absolute inset-0 z-50 pointer-events-none"
                style={{ background: "white", animation: "shutter-flash 0.35s ease-out forwards" }}
              />
            )}

            <TimerOverlay timer={timer} />

            {shooting && (
              <div className="absolute top-4 right-4 z-40 bg-black/60 backdrop-blur-sm text-white text-sm font-semibold px-3 py-1.5 rounded-full flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                {shotCount + 1} / {effective}
              </div>
            )}
          </div>
        </div>

        {/* Polaroid strip */}
        {(shooting || (thumbs.length > 0 && !capturedImage)) && (
          <PolaroidStrip thumbs={thumbs} total={effective} />
        )}

        {/* Controls card */}
        <div className="w-full max-w-2xl">
          <div className="bg-card/80 backdrop-blur-md border border-border rounded-2xl p-5 shadow-sm">
            {shooting ? (
              <div className="flex flex-col items-center gap-3 py-1">
                <p className="text-sm font-medium text-muted-foreground">
                  shooting sequence
                </p>
                <PhotoProgress current={shotCount} total={effective} />
              </div>
            ) : (
              <div className="flex flex-wrap gap-3 items-end justify-between">
                <div className="flex gap-3 flex-wrap">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground pl-0.5">
                      photos
                    </label>
                    <Select onValueChange={(v) => setNumPhotos(parseInt(v))} defaultValue="4">
                      <SelectTrigger className="w-[130px] rounded-xl border-border bg-background focus-visible:ring-primary/40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="2">2 photos</SelectItem>
                        <SelectItem value="4">4 photos</SelectItem>
                        <SelectItem value="9">9 photos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground pl-0.5">
                      grid
                    </label>
                    <Select onValueChange={(v) => setGridSize(parseInt(v))} defaultValue="2">
                      <SelectTrigger className="w-[130px] rounded-xl border-border bg-background focus-visible:ring-primary/40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="2">2 × 2</SelectItem>
                        <SelectItem value="3">3 × 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <button
                  onClick={takePhotoSequence}
                  disabled={shooting || !!cameraError || !cameraReady}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] shimmer-btn"
                  style={{
                    background: `linear-gradient(135deg, ${activeTheme.accent} 0%, ${activeTheme.frameColor} 100%)`,
                    backgroundSize: "200% auto",
                    boxShadow: `0 4px 14px ${activeTheme.accent}55`,
                  }}
                >
                  <Camera className="w-4 h-4" />
                  start booth
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Result */}
        {capturedImage && (
          <div className="w-full max-w-2xl animate-slide-up">
            <div className="bg-card/80 backdrop-blur-md border border-border rounded-2xl p-5 shadow-sm flex flex-col items-center gap-5">
              <div className="flex flex-col items-center gap-1 text-center">
                <p className="font-semibold text-base">your collage is ready! 🎀</p>
                <p className="text-xs text-muted-foreground">
                  pick a theme or effect, then download
                </p>
              </div>

              {/* Theme + Effect pickers */}
              <div className="w-full flex flex-col gap-4">
                <ThemePicker active={activeTheme.id} onChange={setActiveTheme} />
                <EffectPicker active={activeEffect.id} onChange={setActiveEffect} />
              </div>

              {/* Preview */}
              <div
                className="rounded-2xl overflow-hidden animate-float relative"
                style={{ boxShadow: "var(--shadow-pink)" }}
              >
                <img
                  src={capturedImage}
                  alt="Photo Booth Collage"
                  className={`max-w-full max-h-[420px] object-contain block transition-opacity duration-300 ${rerendering ? "opacity-40" : "opacity-100"}`}
                />
                {rerendering && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = capturedImage;
                    link.download = "pika-booth.jpg";
                    link.click();
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: `linear-gradient(135deg, ${activeTheme.accent} 0%, ${activeTheme.frameColor} 100%)`,
                    boxShadow: `0 4px 14px ${activeTheme.accent}55`,
                  }}
                >
                  <Download className="w-4 h-4" />
                  download
                </button>

                <button
                  onClick={handleRetake}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm border border-border bg-background hover:bg-accent text-foreground transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <RefreshCw className="w-4 h-4" />
                  retake
                </button>
              </div>
            </div>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />

        <footer className="mt-auto pt-4 text-xs text-muted-foreground/60 text-center">
          made with ♥ · pika photo booth
        </footer>
      </div>
    </>
  );
}
