import { initializeApp } from "firebase/app";
import { getAnalytics, logEvent } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCZ3VllKIGNQkoBqYahguQPlZnd0bcSy1Y",
  authDomain: "rahul-sushil-sharma.firebaseapp.com",
  projectId: "rahul-sushil-sharma",
  storageBucket: "rahul-sushil-sharma.firebasestorage.app",
  messagingSenderId: "817826509214",
  appId: "1:817826509214:web:a7788304fd6f9d7ec4a68f",
  measurementId: "G-6BEE8GEZCB",
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// ── Custom events ─────────────────────────────────────────

export function trackBoothStarted(params: { layout_id: string; photo_count: number; cols: number; rows: number }) {
  logEvent(analytics, "booth_started", params);
}

export function trackPhotoCaptured(params: { shot_index: number; total: number }) {
  logEvent(analytics, "photo_captured", params);
}

export function trackCollageCreated(params: { layout_id: string; theme_id: string; effect_id: string; photo_count: number }) {
  logEvent(analytics, "collage_created", params);
}

export function trackThemeChanged(params: { theme_id: string; theme_name: string }) {
  logEvent(analytics, "theme_changed", params);
}

export function trackEffectChanged(params: { effect_id: string; effect_name: string }) {
  logEvent(analytics, "effect_changed", params);
}

export function trackCollageDownloaded(params: { theme_id: string; effect_id: string; layout_id: string }) {
  logEvent(analytics, "collage_downloaded", params);
}

export function trackRetake() {
  logEvent(analytics, "retake_clicked");
}

export function trackAppInstalled() {
  logEvent(analytics, "app_installed");
}
