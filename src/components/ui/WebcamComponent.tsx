import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useRef, useState } from "react";
import "../../App.css";

// =======================
// 🔢 Timer Overlay
// =======================
function TimerOverlay({ timer }: { timer: number }) {
  const [animatingNumber, setAnimatingNumber] = useState<number | null>(null);

  useEffect(() => {
    if (timer > 0) {
      setAnimatingNumber(timer);
      const timeout = setTimeout(() => setAnimatingNumber(null), 900);
      return () => clearTimeout(timeout);
    }
  }, [timer]);

  if (!animatingNumber) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
      <span className="animate-countdown text-white text-[10rem] font-extrabold drop-shadow-xl select-none">
        {animatingNumber}
      </span>
    </div>
  );
}

// =======================
// 🧩 Image rendering logic
// =======================
interface RenderOptions {
  gridSize?: number;
  gap?: number;
  backgroundImage?: HTMLImageElement | null;
  frameImage?: HTMLImageElement | null;
  backgroundColor?: string;
  padding?: number;
}

async function renderImages(
  ctx: CanvasRenderingContext2D,
  loadedImages: HTMLImageElement[],
  imgWidth: number,
  imgHeight: number,
  options: RenderOptions
) {
  const {
    gridSize = 2,
    gap = 20,
    backgroundImage = null,
    frameImage = null,
    backgroundColor = "#000",
    padding = 30,
  } = options;

  const totalImages = loadedImages.length;
  const cols = gridSize;
  const rows = Math.ceil(totalImages / cols);

  const totalWidth = cols * imgWidth + (cols - 1) * gap + padding * 2;
  const totalHeight = rows * imgHeight + (rows - 1) * gap + padding * 2;

  ctx.canvas.width = totalWidth;
  ctx.canvas.height = totalHeight;

  // Background
  if (backgroundImage) {
    ctx.drawImage(backgroundImage, 0, 0, ctx.canvas.width, ctx.canvas.height);
  } else {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }

  // Draw each image + frame
  loadedImages.forEach((img, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = padding + col * (imgWidth + gap);
    const y = padding + row * (imgHeight + gap);

    ctx.drawImage(img, x, y, imgWidth, imgHeight);

    // Add frame overlay if available
    if (frameImage) {
      ctx.drawImage(frameImage, x - 5, y - 5, imgWidth + 10, imgHeight + 10);
    }
  });
}

// =======================
// 🎥 Main Component
// =======================
export default function PhotoBooth() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [timer, setTimer] = useState(0);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const [numPhotos, setNumPhotos] = useState(4);
  const [gridSize, setGridSize] = useState(3);
  const [background, setBackground] = useState<HTMLImageElement | null>(null);
  const [frame, setFrame] = useState<HTMLImageElement | null>(null);

  // 🎨 Load default frame and background
  useEffect(() => {
    const loadImage = (src: string): Promise<HTMLImageElement> =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });

    // Replace with your own assets
    loadImage("/assets/frames/golden-frame.png")
      .then(setFrame)
      .catch(() => {});
    loadImage("/assets/backgrounds/booth-bg.jpg")
      .then(setBackground)
      .catch(() => {});
  }, []);

  // 🧠 Start camera
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Error accessing webcam:", err);
      }
    };
    startCamera();
    const video = videoRef.current;
    return () => {
      if (video?.srcObject) {
        (video.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // 🧮 Countdown logic
  async function startTimer(
    seconds: number,
    interval: number
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      setTimer(seconds);
      const timerId = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timerId);
            const video = videoRef.current;
            if (!video) {
              reject("No video element");
              return 0;
            }

            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              reject("Canvas context missing");
              return 0;
            }

            // Flip horizontally (selfie)
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            ctx.setTransform(1, 0, 0, 1, 0, 0);

            resolve(canvas.toDataURL("image/jpeg"));
            return 0;
          }
          return prev - 1;
        });
      }, interval);
    });
  }

  // 📸 Take multiple photos
  async function takePhotoSequence(count: number) {
    const photos: string[] = [];
    for (let i = 0; i < count; i++) {
      try {
        const imgData = await startTimer(3, 1000);
        photos.push(imgData);
      } catch (e) {
        console.error(e);
      }
    }
    await mergePhotos(photos);
  }

  // 🧩 Merge into final layout
  async function mergePhotos(photos: string[]) {
    if (!canvasRef.current || photos.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const loadedImages = await Promise.all(
      photos.map(
        (src) =>
          new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
          })
      )
    );

    const imgWidth = loadedImages[0].width;
    const imgHeight = loadedImages[0].height;

    await renderImages(ctx, loadedImages, imgWidth, imgHeight, {
      gridSize,
      gap: 20,
      backgroundImage: background,
      frameImage: frame,
      backgroundColor: "#111",
      padding: 40,
    });

    setCapturedImage(canvas.toDataURL("image/jpeg"));
  }

  return (
    <div className="flex flex-col items-center p-6 gap-4 relative">
      <TimerOverlay timer={timer} />

      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="rounded-2xl shadow-lg w-[640px] h-[480px] bg-black object-cover scale-x-[-1]"
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Controls */}
      <div className="flex gap-4 mt-4 items-center">
        <Select
          onValueChange={(v: string) => setNumPhotos(parseInt(v))}
          defaultValue="4"
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Photos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2">2 Photos</SelectItem>
            <SelectItem value="4">4 Photos</SelectItem>
            <SelectItem value="9">9 Photos</SelectItem>
          </SelectContent>
        </Select>

        <Select
          onValueChange={(v: string) => setGridSize(parseInt(v))}
          defaultValue="2"
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Grid" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2">2 x 2</SelectItem>
            <SelectItem value="3">3 x 3</SelectItem>
          </SelectContent>
        </Select>

        <Button
          onClick={() => takePhotoSequence(numPhotos)}
          className="bg-primary text-white"
        >
          Start Booth
        </Button>
      </div>

      {capturedImage && (
        <div className="mt-6 flex flex-col items-center">
          <p className="text-lg font-semibold mb-3">
            Your Photo Booth Collage 🎉
          </p>
          <img
            src={capturedImage}
            alt="Captured Grid"
            className="rounded-lg border shadow-md max-w-md"
          />
          <Button
            variant="outline"
            className="mt-3"
            onClick={() => {
              const link = document.createElement("a");
              link.href = capturedImage;
              link.download = "photobooth.jpg";
              link.click();
            }}
          >
            Download
          </Button>
        </div>
      )}
    </div>
  );
}
