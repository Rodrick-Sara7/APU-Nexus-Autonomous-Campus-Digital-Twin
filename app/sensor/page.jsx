"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Activity,
  Radio,
  Zap,
  Flame,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  Smartphone,
  Gauge,
  Sliders,
  CheckCircle2,
  RefreshCw,
  Send,
  Lock,
  Compass,
} from "lucide-react";
import { publishIotVibration } from "@/lib/firebase_setup";

export default function MobileIotSensorPage() {
  const [active, setActive] = useState(false);
  const [permissionState, setPermissionState] = useState("idle"); // idle | requesting | granted | denied | unsupported
  const [httpAlert, setHttpAlert] = useState(false);
  const [motionData, setMotionData] = useState({
    x: 0.0,
    y: 0.0,
    z: 9.81,
    magnitude: 1.0,
    isAlert: false,
    source: "idle",
  });
  const [sliderG, setSliderG] = useState(1.0);
  const [isHoldingShake, setIsHoldingShake] = useState(false);
  const [streamCount, setStreamCount] = useState(0);
  const [latencyMs, setLatencyMs] = useState(18);
  const [lastSentTime, setLastSentTime] = useState(null);
  const [fps, setFps] = useState(60);

  // High-frequency 60fps hardware accelerometer coordinates
  const [liveCoords, setLiveCoords] = useState({ x: 0.0, y: 0.0, z: 9.81, mag: 1.0 });

  const rawAccelRef = useRef({ x: 0.0, y: 0.0, z: 9.81 });
  const motionRef = useRef(motionData);
  motionRef.current = motionData;

  const shakeIntervalRef = useRef(null);
  const lastCriticalPostRef = useRef(0);
  const tapTimeoutRef = useRef(null);
  const touchStartTimeRef = useRef(0);

  // Smart Threshold Evaluator:
  // - G-Force < 2.0G: Display "NORMAL (Ambient)"
  // - G-Force >= 2.0G && < 3.5G: Display "SLIGHT VIBRATION (Ignored)" in Yellow. Do NOT trigger anomaly.
  // - G-Force >= 3.5G: Display "VIOLENT SEISMIC SHAKE!" in Red and instantly POST to /api/iot (SEISMIC_ANOMALY).
  const getSeismicStatus = useCallback(
    (mag) => {
      if (mag >= 3.5) {
        return {
          level: "violent",
          label: "VIOLENT SEISMIC SHAKE!",
          color: "red",
          badgeClass: "bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse",
          textClass: "text-rose-400",
          dotClass: "bg-rose-500 animate-ping",
          cardClass: "border-rose-500 bg-rose-950/30 shadow-lg shadow-rose-500/20 animate-pulse",
        };
      }
      if (mag >= 2.0) {
        return {
          level: "slight",
          label: "SLIGHT VIBRATION (Ignored)",
          color: "yellow",
          badgeClass: "bg-amber-500/20 border-amber-500/60 text-amber-300",
          textClass: "text-amber-400",
          dotClass: "bg-amber-400",
          cardClass: "border-amber-500/50 bg-amber-950/20 shadow-lg shadow-amber-500/10",
        };
      }
      return {
        level: "normal",
        label: "NORMAL (Ambient)",
        color: "emerald",
        badgeClass: active
          ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
          : "bg-slate-800/60 border-slate-700 text-slate-400",
        textClass: "text-emerald-400",
        dotClass: active ? "bg-emerald-400" : "bg-slate-500",
        cardClass: "border-slate-800",
      };
    },
    [active]
  );

  const currentStatus = getSeismicStatus(liveCoords.mag);

  // Send packet to both HTTP bridge & Firebase
  const transmitTelemetry = useCallback(async (payload) => {
    const startTime = performance.now();
    try {
      // 1. Post directly to /api/iot
      fetch("/api/iot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => {});

      // 2. Publish to Firebase pub-sub stream
      await publishIotVibration(payload);
      const rtt = Math.round(performance.now() - startTime);
      setLatencyMs(rtt > 0 ? rtt : 12);
      setStreamCount((prev) => prev + 1);
      setLastSentTime(new Date().toLocaleTimeString());
    } catch (err) {
      console.warn("Telemetry transmission error:", err);
    }
  }, []);

  // 60FPS Render Loop using requestAnimationFrame
  useEffect(() => {
    let animId;
    let lastTime = performance.now();
    let frameCount = 0;

    const renderLoop = (time) => {
      frameCount++;
      if (time - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = time;
      }

      const { x, y, z } = rawAccelRef.current;
      const netMag = Math.sqrt(x * x + y * y + z * z) / 9.81;

      setLiveCoords({
        x: Number(x.toFixed(2)),
        y: Number(y.toFixed(2)),
        z: Number(z.toFixed(2)),
        mag: Number(netMag.toFixed(2)),
      });

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Hardware motion handler (runs at native hardware rate)
  const handleDeviceMotion = useCallback(
    (event) => {
      if (isHoldingShake) return;

      const acc = event.accelerationIncludingGravity || event.acceleration;
      if (!acc) return;

      const rawX = acc.x ?? 0;
      const rawY = acc.y ?? 0;
      const rawZ = acc.z ?? 9.81;

      rawAccelRef.current = { x: rawX, y: rawY, z: rawZ };

      // Calculate net G-Force Magnitude
      const netMag = Math.sqrt(rawX * rawX + rawY * rawY + rawZ * rawZ) / 9.81;
      const roundedMag = Number(netMag.toFixed(2));

      // SMART THRESHOLDS:
      // < 2.0G: NORMAL (Ambient)
      // >= 2.0G && < 3.5G: SLIGHT VIBRATION (Ignored) - Do NOT trigger anomaly
      // >= 3.5G: VIOLENT SEISMIC SHAKE! - Instantly trigger SEISMIC_ANOMALY (elevated from >3.0G)
      const isViolentShake = roundedMag >= 3.5;
      const isSlightVibration = roundedMag >= 2.0 && roundedMag < 3.5;

      const packet = {
        type: isViolentShake ? "SEISMIC_ANOMALY" : "NOMINAL",
        magnitude: roundedMag,
        status: isViolentShake ? "critical" : isSlightVibration ? "slight_vibration" : "healthy",
        zone: "Block B - AI Labs",
        x: Number(rawX.toFixed(2)),
        y: Number(rawY.toFixed(2)),
        z: Number(rawZ.toFixed(2)),
        seismic_alert: isViolentShake,
        source: "mobile_hardware_accelerometer",
      };

      setMotionData({ ...packet, isAlert: isViolentShake });

      // If G-Force spikes >= 3.5G, automatically POST to /api/iot instantly
      const now = Date.now();
      if (isViolentShake && now - lastCriticalPostRef.current > 400) {
        lastCriticalPostRef.current = now;
        transmitTelemetry({
          type: "SEISMIC_ANOMALY",
          magnitude: roundedMag,
          status: "critical",
          zone: "Block B - AI Labs",
          x: Number(rawX.toFixed(2)),
          y: Number(rawY.toFixed(2)),
          z: Number(rawZ.toFixed(2)),
          seismic_alert: true,
          source: "mobile_violent_shake_hardware",
        });
      }
    },
    [isHoldingShake, transmitTelemetry]
  );

  // Request iOS 13+ / Android Motion Permission & Start Listening
  // Wrap DeviceMotionEvent.requestPermission() in try/catch with visual HTTP fallback alert
  const handleActivateAccelerometer = async () => {
    if (typeof window === "undefined") return;

    setPermissionState("requesting");
    setHttpAlert(false);

    const isInsecureContext =
      typeof window !== "undefined" &&
      (window.isSecureContext === false ||
        (location.protocol !== "https:" &&
          location.hostname !== "localhost" &&
          location.hostname !== "127.0.0.1"));

    try {
      // Standard iOS 13+ DeviceMotionEvent.requestPermission
      if (
        typeof DeviceMotionEvent !== "undefined" &&
        typeof DeviceMotionEvent.requestPermission === "function"
      ) {
        try {
          const response = await DeviceMotionEvent.requestPermission();
          if (response === "granted") {
            setPermissionState("granted");
            setActive(true);
            setHttpAlert(false);
            window.addEventListener("devicemotion", handleDeviceMotion);
          } else {
            setPermissionState("denied");
            if (isInsecureContext || location.protocol !== "https:") {
              setHttpAlert(true);
            }
          }
        } catch (err) {
          console.warn("DeviceMotionEvent.requestPermission exception:", err);
          setPermissionState("denied");
          setHttpAlert(true);
        }
      } else if (typeof window.DeviceMotionEvent !== "undefined") {
        // Standard Android or Desktop Chrome
        if (isInsecureContext) {
          setHttpAlert(true);
        }
        setPermissionState("granted");
        setActive(true);
        window.addEventListener("devicemotion", handleDeviceMotion);
      } else {
        setPermissionState("unsupported");
        setHttpAlert(true);
      }
    } catch (err) {
      console.warn("Motion activation exception:", err);
      setPermissionState("denied");
      setHttpAlert(true);
    }
  };

  // Regular 1-second telemetry broadcast heartbeat
  useEffect(() => {
    const timer = setInterval(() => {
      const mag = motionRef.current.magnitude;
      const isViolent = mag >= 3.5;
      transmitTelemetry({
        x: motionRef.current.x,
        y: motionRef.current.y,
        z: motionRef.current.z,
        magnitude: mag,
        seismic_alert: isViolent,
        source: motionRef.current.source || "standby_heartbeat",
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [transmitTelemetry]);

  // Touch Simulator: G-Force Slider change (Desktop / Mobile fallback)
  const handleSliderChange = (e) => {
    const val = Number(parseFloat(e.target.value).toFixed(1));
    setSliderG(val);

    const isViolent = val >= 3.5;
    const isSlight = val >= 2.0 && val < 3.5;
    const packet = {
      type: isViolent ? "SEISMIC_ANOMALY" : "NOMINAL",
      magnitude: val,
      status: isViolent ? "critical" : isSlight ? "slight_vibration" : "healthy",
      zone: "Block B - AI Labs",
      x: Number((val * 3.2).toFixed(2)),
      y: Number((val * 2.8).toFixed(2)),
      z: 9.81,
      seismic_alert: isViolent,
      source: "touch_slider",
    };

    rawAccelRef.current = { x: packet.x, y: packet.y, z: packet.z };
    setMotionData({ ...packet, isAlert: isViolent });
    transmitTelemetry(packet);
  };

  // Immediate seismic spike dispatcher
  const triggerSpike = useCallback(
    (targetG = 8.4) => {
      const isViolent = targetG >= 3.5;
      const isSlight = targetG >= 2.0 && targetG < 3.5;
      const jitterX = isViolent
        ? Number((4.5 + (Math.random() * 2 - 1) * 1.5).toFixed(2))
        : isSlight
        ? Number((1.2 + (Math.random() * 0.4 - 0.2)).toFixed(2))
        : 0.1;
      const jitterY = isViolent
        ? Number((5.2 + (Math.random() * 2 - 1) * 1.5).toFixed(2))
        : isSlight
        ? Number((1.4 + (Math.random() * 0.4 - 0.2)).toFixed(2))
        : 0.2;
      const mag = Number(targetG.toFixed(2));

      rawAccelRef.current = { x: jitterX, y: jitterY, z: 9.81 };

      const packet = {
        type: isViolent ? "SEISMIC_ANOMALY" : "NOMINAL",
        magnitude: mag,
        status: isViolent ? "critical" : isSlight ? "slight_vibration" : "healthy",
        zone: "Block B - AI Labs",
        x: jitterX,
        y: jitterY,
        z: 9.81,
        seismic_alert: isViolent,
        source: "manual_trigger_button",
      };

      setMotionData({ ...packet, isAlert: isViolent });
      transmitTelemetry(packet);
    },
    [transmitTelemetry]
  );

  // Touch Simulator: Sustained Hold Vibration
  const startShakeSimulation = (mag = 8.4) => {
    setIsHoldingShake(true);
    triggerSpike(mag);

    if (shakeIntervalRef.current) clearInterval(shakeIntervalRef.current);
    shakeIntervalRef.current = setInterval(() => {
      triggerSpike(mag);
    }, 350);
  };

  const stopShakeSimulation = () => {
    setIsHoldingShake(false);
    if (shakeIntervalRef.current) {
      clearInterval(shakeIntervalRef.current);
      shakeIntervalRef.current = null;
    }

    rawAccelRef.current = { x: 0.1, y: 0.2, z: 9.81 };
    const relaxedPacket = {
      type: "NOMINAL",
      x: 0.1,
      y: 0.2,
      z: 9.81,
      magnitude: 1.0,
      seismic_alert: false,
      status: "healthy",
      zone: "Block B - AI Labs",
      source: "stabilized",
    };

    setMotionData({ ...relaxedPacket, isAlert: false });
    transmitTelemetry(relaxedPacket);
  };

  // High-responsiveness Mobile Tapping & Holding Handlers
  const handleSimulateTap = (mag = 8.4, e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    triggerSpike(mag);
    setIsHoldingShake(true);

    if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
    tapTimeoutRef.current = setTimeout(() => {
      stopShakeSimulation();
    }, 1800);
  };

  const handleTouchStart = (mag = 8.4) => {
    if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
    touchStartTimeRef.current = Date.now();
    startShakeSimulation(mag);
  };

  const handleTouchEnd = () => {
    const elapsed = Date.now() - (touchStartTimeRef.current || 0);
    if (elapsed < 350) {
      // Quick mobile tap: keep active for 1.8s so edge anomaly and UI are cleanly registered
      if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
      tapTimeoutRef.current = setTimeout(() => {
        stopShakeSimulation();
      }, 1800);
    } else {
      stopShakeSimulation();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      {/* HEADER */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-50 px-4 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition touch-manipulation cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-cyan-400 animate-pulse" />
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              True Hardware Accelerometer Edge Node
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono">
                60 FPS Edge
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-cyan-400">
            {fps} FPS Telemetry
          </span>
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold transition ${currentStatus.badgeClass}`}
          >
            <span className={`w-2 h-2 rounded-full ${currentStatus.dotClass}`} />
            <span>{currentStatus.label}</span>
          </div>
        </div>
      </header>

      {/* FLASHING SEISMIC EMERGENCY BANNER */}
      {currentStatus.level === "violent" && (
        <div className="bg-rose-600 text-white px-4 py-3 text-xs font-bold font-mono tracking-wide flex items-center justify-between shadow-xl animate-pulse">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 animate-bounce shrink-0" />
            <span>
              [VIOLENT SEISMIC SHAKE!]: {liveCoords.mag}G DETECTED ON PHYSICAL ACCELEROMETER!
              TRANSMITTING SEISMIC_ANOMALY TO CAMPUS DIGITAL TWIN CONTROLLER.
            </span>
          </div>
          <span className="bg-white/20 px-2.5 py-1 rounded text-[11px] shrink-0 ml-2">
            FAILOVER PRIMED
          </span>
        </div>
      )}

      {/* FILTERED SLIGHT VIBRATION BANNER */}
      {currentStatus.level === "slight" && (
        <div className="bg-amber-500/20 border-b border-amber-500/40 text-amber-200 px-4 py-2.5 text-xs font-mono font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              [FILTERED]: {liveCoords.mag}G SLIGHT VIBRATION (Ignored) — Below 3.5G violent anomaly threshold. No alert dispatched.
            </span>
          </div>
          <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
            FILTER ACTIVE
          </span>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 lg:p-8 space-y-6">
        {/* HTTP RESTRICTION VISUAL UI ALERT */}
        {httpAlert && (
          <div className="bg-amber-950/40 border-2 border-amber-500 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-xl shadow-amber-500/10 text-amber-200">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-bounce" />
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-amber-300 uppercase tracking-wide flex items-center gap-2">
                Mobile Sensor HTTP Restriction
              </h3>
              <p className="text-xs sm:text-sm font-bold text-white">
                Motion sensors blocked by HTTP. Please use HTTPS or the manual trigger below.
              </p>
              <p className="text-[11px] text-amber-300/80">
                Mobile browsers restrict physical accelerometer access when testing over HTTP (e.g. 192.168.x.x). Use the responsive tap triggers or slider below to simulate seismic shock.
              </p>
            </div>
          </div>
        )}

        {/* PROMINENT "ENABLE SENSORS" ACTIVATION HERO */}
        {!active && (
          <div className="bg-gradient-to-r from-cyan-950/60 via-slate-900 to-indigo-950/60 rounded-2xl border border-cyan-500/40 p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h2 className="text-base font-bold text-white flex items-center gap-2 justify-center sm:justify-start">
                <Compass className="w-5 h-5 text-cyan-400 animate-spin" />
                Physical Mobile Hardware Accelerometer (iOS 13+ & Android)
              </h2>
              <p className="text-xs text-slate-300">
                Grant gyroscope and accelerometer permission to drive the digital twin with your real phone motion.
              </p>
            </div>
            <button
              onClick={handleActivateAccelerometer}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-sm transition flex items-center gap-2 shadow-lg shadow-cyan-500/25 shrink-0 touch-manipulation cursor-pointer active:scale-95"
            >
              <Smartphone className="w-4 h-4" />
              Enable Sensors
            </button>
          </div>
        )}

        {/* 60FPS REAL-TIME VECTOR READOUT GRID */}
        <section className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {/* NET G-FORCE */}
          <div
            className={`p-5 rounded-2xl border bg-slate-900/80 backdrop-blur transition-all ${currentStatus.cardClass}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Net G-Force
              </span>
              <Gauge className={`w-4 h-4 ${currentStatus.textClass}`} />
            </div>
            <div className="mt-2 text-3xl font-extrabold font-mono text-white tracking-tight flex items-baseline justify-between">
              <div>
                {liveCoords.mag} <span className="text-sm font-normal text-slate-400">G</span>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">Status:</span>
              <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${currentStatus.badgeClass}`}>
                {currentStatus.label}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-1.5">
              Anomaly Trigger: &ge;3.5G (Elevated from &gt;3.0G)
            </p>
          </div>

          {/* X AXIS */}
          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              X Axis (Lateral)
            </span>
            <div className="mt-2 text-3xl font-extrabold font-mono text-cyan-300 tracking-tight">
              {liveCoords.x} <span className="text-sm font-normal text-slate-500">m/s²</span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-1">Pitch / Tilt Roll</p>
          </div>

          {/* Y AXIS */}
          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Y Axis (Longitudinal)
            </span>
            <div className="mt-2 text-3xl font-extrabold font-mono text-indigo-300 tracking-tight">
              {liveCoords.y} <span className="text-sm font-normal text-slate-500">m/s²</span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-1">Surge Acceleration</p>
          </div>

          {/* Z AXIS */}
          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Z Axis (Vertical)
            </span>
            <div className="mt-2 text-3xl font-extrabold font-mono text-emerald-300 tracking-tight">
              {liveCoords.z} <span className="text-sm font-normal text-slate-500">m/s²</span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-1">Earth Gravity (1G = 9.81)</p>
          </div>
        </section>

        {/* PHYSICAL SHAKE INSTRUCTIONS & TOUCH FALLBACK CONTROLS */}
        <section className="bg-slate-900/70 rounded-2xl border border-slate-800 p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                Hardware Shake Trigger & Manual Controls
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Auto-dispatches to /api/iot on &ge;3.5G (previously &gt;3.0G)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* HOLD OR TAP TO SHAKE SIMULATOR BUTTON */}
            <div className="bg-slate-950 p-4 rounded-xl border border-purple-900/40 flex flex-col justify-between space-y-3">
              <div>
                <span className="text-xs font-bold text-purple-300 uppercase block">
                  Simulated Violent Shake Test
                </span>
                <p className="text-xs text-slate-400 mt-1">
                  Tap or hold down to emit violent 8.4G seismic shock telemetry to trigger the earthquake anomaly instantly.
                </p>
              </div>

              <button
                type="button"
                onClick={(e) => handleSimulateTap(8.4, e)}
                onTouchStart={() => handleTouchStart(8.4)}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={stopShakeSimulation}
                onMouseDown={() => startShakeSimulation(8.4)}
                onMouseUp={stopShakeSimulation}
                onMouseLeave={stopShakeSimulation}
                className={`w-full py-4 px-4 rounded-xl font-mono font-bold text-sm transition-all shadow-lg select-none cursor-pointer active:scale-95 touch-manipulation ${
                  isHoldingShake
                    ? "bg-rose-600 text-white shadow-rose-500/50 scale-98 animate-pulse"
                    : "bg-purple-600/30 hover:bg-purple-600/50 active:bg-purple-700/60 text-purple-200 border border-purple-500/50"
                }`}
              >
                {isHoldingShake ? "💥 HOLDING VIOLENT SHAKE (8.4G)!" : "HOLD OR TAP TO SHAKE (8.4G SPIKE)"}
              </button>

              {/* QUICK ONE-TAP THRESHOLD PRESETS */}
              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-[11px] font-mono text-slate-400 block mb-1.5">
                  One-Tap Threshold Verification:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleSimulateTap(1.0, e)}
                    onTouchStart={() => handleTouchStart(1.0)}
                    onTouchEnd={handleTouchEnd}
                    className="py-2 px-1 rounded-lg text-[11px] font-mono font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-center active:scale-95 transition cursor-pointer touch-manipulation"
                  >
                    1.0G Normal
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleSimulateTap(2.5, e)}
                    onTouchStart={() => handleTouchStart(2.5)}
                    onTouchEnd={handleTouchEnd}
                    className="py-2 px-1 rounded-lg text-[11px] font-mono font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 text-center active:scale-95 transition cursor-pointer touch-manipulation"
                  >
                    2.5G Slight (Ignored)
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleSimulateTap(4.5, e)}
                    onTouchStart={() => handleTouchStart(4.5)}
                    onTouchEnd={handleTouchEnd}
                    className="py-2 px-1 rounded-lg text-[11px] font-mono font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/40 text-center active:scale-95 transition cursor-pointer touch-manipulation"
                  >
                    4.5G Violent (Alert)
                  </button>
                </div>
              </div>
            </div>

            {/* MANUAL SLIDER */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-300 uppercase">
                    Manual G-Force Override
                  </span>
                  <span className={`font-mono font-bold ${currentStatus.textClass}`}>
                    {sliderG} G
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Slide past 3.5G to trigger anomaly. 2.0G-3.4G is ignored as slight vibration.
                </p>
              </div>

              <input
                type="range"
                min="0.5"
                max="6.0"
                step="0.1"
                value={sliderG}
                onChange={handleSliderChange}
                className="w-full accent-cyan-400 cursor-pointer touch-manipulation py-2"
              />

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800/80">
                <span>0.5G Ambient</span>
                <span className="text-amber-400">2.0G Slight</span>
                <span className="text-rose-400">&ge;3.5G Violent</span>
                <span>6.0G Max</span>
              </div>
            </div>
          </div>
        </section>

        {/* TRANSMISSION TELEMETRY AUDIT FOOTER */}
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex flex-wrap items-center justify-between text-xs font-mono text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span>Target: POST /api/iot (SEISMIC_ANOMALY on &ge;3.5G, elevated from &gt;3.0G)</span>
          </div>
          <div>Packets Sent: {streamCount}</div>
          <div>Latency: {latencyMs}ms</div>
          <div>Last Event: {lastSentTime || "Idle"}</div>
        </div>
      </main>
    </div>
  );
}
