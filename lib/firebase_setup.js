import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase, ref, set, onValue } from "firebase/database";

let app = null;
let db = null;
let isFirebaseLive = false;

// Internal in-memory pub-sub store for Graceful Hybrid Fallback
const listeners = new Set();
let latestTelemetryCache = null;

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

try {
  // Validate if API Key and Database URL are provided and non-placeholder
  const hasValidConfig =
    Boolean(firebaseConfig.apiKey) &&
    Boolean(firebaseConfig.databaseURL) &&
    !firebaseConfig.apiKey.includes("your_") &&
    firebaseConfig.apiKey.length > 10;

  if (hasValidConfig) {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    db = getDatabase(app);
    isFirebaseLive = true;
    console.info("[APU-Nexus] Firebase Realtime Database connected successfully.");
  } else {
    isFirebaseLive = false;
    console.info("[APU-Nexus] Hybrid Mode: Running local in-memory pub-sub engine.");
  }
} catch (error) {
  isFirebaseLive = false;
  console.warn("[APU-Nexus] Firebase init fallback triggered:", error.message);
}

/**
 * Publishes campus telemetry data to Firebase RTDB or local memory store
 * @param {Object} data - Snapshot of multi-zone campus telemetry
 */
export async function publishTelemetry(data) {
  latestTelemetryCache = { ...data, _lastUpdated: Date.now() };

  // Always broadcast locally to in-memory subscribers
  for (const callback of listeners) {
    try {
      callback(latestTelemetryCache);
    } catch (err) {
      console.error("[APU-Nexus] Local listener notification error:", err);
    }
  }

  // Also sync to Firebase RTDB if live
  if (isFirebaseLive && db) {
    try {
      const telemetryRef = ref(db, "campus_telemetry/current");
      await set(telemetryRef, latestTelemetryCache);
    } catch (firebaseErr) {
      console.warn("[APU-Nexus] Firebase write failed, retaining local sync:", firebaseErr.message);
    }
  }

  return latestTelemetryCache;
}

/**
 * Subscribes to real-time campus telemetry changes
 * @param {Function} callback - Callback function receiving the latest telemetry snapshot
 * @returns {Function} Unsubscribe function
 */
export function subscribeTelemetry(callback) {
  if (typeof callback !== "function") {
    return () => {};
  }

  listeners.add(callback);

  // Immediately dispatch current cache if present
  if (latestTelemetryCache) {
    try {
      callback(latestTelemetryCache);
    } catch (err) {
      console.error("[APU-Nexus] Immediate listener error:", err);
    }
  }

  let firebaseUnsubscribe = null;

  if (isFirebaseLive && db) {
    try {
      const telemetryRef = ref(db, "campus_telemetry/current");
      firebaseUnsubscribe = onValue(
        telemetryRef,
        (snapshot) => {
          const val = snapshot.val();
          if (val) {
            latestTelemetryCache = val;
            callback(val);
          }
        },
        (error) => {
          console.warn("[APU-Nexus] Firebase subscription warning:", error.message);
        }
      );
    } catch (subErr) {
      console.warn("[APU-Nexus] Failed to attach Firebase RTDB listener:", subErr.message);
    }
  }

  return () => {
    listeners.delete(callback);
    if (firebaseUnsubscribe) {
      try {
        firebaseUnsubscribe();
      } catch {
        // ignore cleanup error
      }
    }
  };
}

export { db, isFirebaseLive };
export default {
  db,
  isFirebaseLive,
  publishTelemetry,
  subscribeTelemetry,
};
