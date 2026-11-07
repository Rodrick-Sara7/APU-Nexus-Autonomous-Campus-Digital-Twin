import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase, ref, set, onValue } from "firebase/database";

let app = null;
let db = null;
let isFirebaseLive = false;

// Internal in-memory pub-sub store for Graceful Hybrid Fallback
const listeners = new Set();
const iotListeners = new Set();
let latestTelemetryCache = null;
let latestIotCache = {
  x: 0.0,
  y: 0.0,
  z: 9.8,
  magnitude: 1.0,
  seismic_alert: false,
  device_connected: false,
  last_updated: null,
  source: "idle",
};

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

/**
 * Publishes mobile IoT accelerometer and vibration data
 * Sends to both /api/iot (for cross-device server in-memory bridge) and Firebase RTDB
 * @param {Object} payload - { x, y, z, magnitude, seismic_alert, source }
 */
export async function publishIotVibration(payload) {
  latestIotCache = {
    ...payload,
    device_connected: true,
    last_updated: Date.now(),
  };

  // Broadcast to local pub-sub listeners
  for (const callback of iotListeners) {
    try {
      callback(latestIotCache);
    } catch (err) {
      console.error("[APU-Nexus] Local IoT listener error:", err);
    }
  }

  // Sync to HTTP server bridge so mobile and laptop communicate without Firebase credentials
  if (typeof fetch === "function") {
    try {
      fetch("/api/iot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(latestIotCache),
      }).catch(() => {
        // Ignore network failure gracefully
      });
    } catch {
      // Ignore fetch error in SSR/Node
    }
  }

  // Also sync to Firebase RTDB if live
  if (isFirebaseLive && db) {
    try {
      const iotRef = ref(db, "live_iot_vibration/current");
      await set(iotRef, latestIotCache);
    } catch (firebaseErr) {
      console.warn("[APU-Nexus] Firebase IoT write failed:", firebaseErr.message);
    }
  }

  return latestIotCache;
}

/**
 * Subscribes to real-time mobile IoT accelerometer/vibration data
 * @param {Function} callback - Callback receiving the latest vibration telemetry
 * @returns {Function} Unsubscribe function
 */
export function subscribeIotVibration(callback) {
  if (typeof callback !== "function") {
    return () => {};
  }

  iotListeners.add(callback);

  if (latestIotCache) {
    try {
      callback(latestIotCache);
    } catch (err) {
      console.error("[APU-Nexus] Immediate IoT listener error:", err);
    }
  }

  let firebaseUnsubscribe = null;

  if (isFirebaseLive && db) {
    try {
      const iotRef = ref(db, "live_iot_vibration/current");
      firebaseUnsubscribe = onValue(
        iotRef,
        (snapshot) => {
          const val = snapshot.val();
          if (val) {
            latestIotCache = val;
            callback(val);
          }
        },
        (error) => {
          console.warn("[APU-Nexus] Firebase IoT subscription warning:", error.message);
        }
      );
    } catch (subErr) {
      console.warn("[APU-Nexus] Failed to attach Firebase IoT listener:", subErr.message);
    }
  }

  return () => {
    iotListeners.delete(callback);
    if (firebaseUnsubscribe) {
      try {
        firebaseUnsubscribe();
      } catch {
        // ignore
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
  publishIotVibration,
  subscribeIotVibration,
};
