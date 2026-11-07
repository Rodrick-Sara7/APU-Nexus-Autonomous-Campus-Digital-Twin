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
} from "lucide-react";
import { publishIotVibration } from "@/lib/firebase_setup";

export default function MobileIotSensorPage() {
  const [active, setActive] = useState(false);
  const [permissionState, setPermissionState] = useState("idle"); // idle | granted | denied | unsupported
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

  const motionRef = useRef(motionData);
  motionRef.current = motionData;

  const shakeIntervalRef = useRef(null);

  // Send packet to both HTTP bridge & Firebase
  const transmitTelemetry = useCallback(async (payload) => {
    const startTime = performance.now();
    try {
      await publishIotVibration(payload);
      const rtt = Math.round(performance.now() - startTime);
      setLatencyMs(rtt > 0 ? rtt : 12);
      setStreamCount((prev) => prev + 1);
      setLastSentTime(new Date().toLocaleTimeString());
    } catch (err) {
      console.warn("Telemetry transmission error:", err);
    }
  }, []);

  // Hardware motion handler
  const handleDeviceMotion = useCallback(
    (event) => {
      if (isHoldingShake) return; // Touch override takes priority during manual simulation

      const acc = event.accelerationIncludingGravity || event.acceleration;
      if (!acc) return;

      const rawX = acc.x ?? 0;
      const rawY = acc.y ?? 0;
      const rawZ = acc.z ?? 9.81;

      // Calculate Net G-Force Magnitude
      const netMag = Math.sqrt(rawX * rawX + rawY * rawY + rawZ * rawZ) / 9.81;
      const roundedMag = Number(netMag.toFixed(2));
      const isAlert = roundedMag > 2.2;

      const packet = {
        x: Number(rawX.toFixed(2)),
        y: Number(rawY.toFixed(2)),
        z: Number(rawZ.toFixed(2)),
        magnitude: roundedMag,
        seismic_alert: isAlert,
        source: "hardware_accelerometer",
      };

      setMotionData({ ...packet, isAlert });

      // Immediate broadcast on critical spike
      if (isAlert) {
        transmitTelemetry(packet);
      }
    },
    [isHoldingShake, transmitTelemetry]
  );

  // Request iOS 17+ / Android Motion Permission & Start Listening
  const handleActivateAccelerometer = async () => {
    if (typeof window === "undefined") return;

    if (
      typeof DeviceMotionEvent !== "undefined" &&
      typeof DeviceMotionEvent.requestPermission === "function"
    ) {
      try {
        const response = await DeviceMotionEvent.requestPermission();
        if (response === "granted") {
          setPermissionState("granted");
          setActive(true);
          window.addEventListener("devicemotion", handleDeviceMotion);
        } else {
          setPermissionState("denied");
        }
      } catch (err) {
        console.warn("Motion permission exception:", err);
        setPermissionState("denied");
      }
    } else if (typeof window.DeviceMotionEvent !== "undefined") {
      // Standard Android or Desktop Chrome
      setPermissionState("granted");
      setActive(true);
      window.addEventListener("devicemotion", handleDeviceMotion);
    } else {
      setPermissionState("unsupported");
    }
  };

  // Regular 1-second telemetry broadcast heartbeat
  useEffect(() => {
    const timer = setInterval(() => {
      transmitTelemetry({
        x: motionRef.current.x,
        y: motionRef.current.y,
        z: motionRef.current.z,
        magnitude: motionRef.current.magnitude,
        seismic_alert: motionRef.current.magnitude > 2.2,
        source: motionRef.current.source || "standby_heartbeat",
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [transmitTelemetry]);

  // Touch Simulator: G-Force Slider change
  const handleSliderChange = (e) => {
    const val = Number(parseFloat(e.target.value).toFixed(1));
    setSliderG(val);

    const isAlert = val > 2.2;
    const packet = {
      x: Number((val * 3.2).toFixed(2)),
      y: Number((val * 2.8).toFixed(2)),
      z: 9.81,
      magnitude: val,
      seismic_alert: isAlert,
      source: "touch_slider",
    };

    setMotionData({ ...packet, isAlert });
    transmitTelemetry(packet);
  };

  // Touch Simulator: Hold-to-Shake Violent Seismic Spike (8.4G)
  const startShakeSimulation = () => {
    setIsHoldingShake(true);

    const emitSpike = () => {
      const jitterX = Number((4.5 + (Math.random() * 2 - 1) * 1.5).toFixed(2));
      const jitterY = Number((5.2 + (Math.random() * 2 - 1) * 1.5).toFixed(2));
      const mag = Number((8.4 + (Math.random() * 2 - 1) * 0.4).toFixed(2));

      const packet = {
        x: jitterX,
        y: jitterY,
        z: 9.81,
        magnitude: mag,
        seismic_alert: true,
        source: "violent_shake_button",
      };

      setMotionData({ ...packet, isAlert: true });
      transmitTelemetry(packet);
    };

    emitSpike();
    shakeIntervalRef.current = setInterval(emitSpike, 400);
  };

  const stopShakeSimulation = () => {
    setIsHoldingShake(false);
    if (shakeIntervalRef.current) {
      clearInterval(shakeIntervalRef.current);
      shakeIntervalRef.current = null;
    }

    const relaxedPacket = {
      x: 0.1,
      y: 0.2,
      z: 9.81,
      magnitude: 1.0,
      seismic_alert: false,
      source: "stabilized",
    };
    setMotionData({ ...relaxedPacket, isAlert: false });
    setSliderG(1.0);
    transmitTelemetry(relaxedPacket);
  };

  const isAlert = motionData.magnitude > 2.2;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 flex flex-col justify-between font-sans">
      <div className="max-w-md w-full mx-auto space-y-5">
        {/* TOP HEADER */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" />
            Central NOC Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-[11px] font-mono text-emerald-400">EDGE BRIDGE ACTIVE</span>
          </div>
        </div>

        {/* DEVICE CARD */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white tracking-tight">
                  Mobile IoT Edge Node
                </h1>
                <p className="text-[11px] text-slate-400">
                  APU Accelerometer & Seismic Sensor
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              RTT: {latencyMs}ms
            </span>
          </div>

          {/* G-FORCE READOUT HERO */}
          <div
            className={`mt-4 p-5 rounded-xl border text-center transition-all ${
              isAlert
                ? "bg-rose-950/40 border-rose-500 shadow-lg shadow-rose-500/20 animate-pulse"
                : "bg-slate-950/70 border-slate-800"
            }`}
          >
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-1">
              Live Net G-Force Magnitude
            </span>
            <div className="flex items-baseline justify-center gap-1.5">
              <span
                className={`text-5xl font-black font-mono tracking-tight ${
                  isAlert ? "text-rose-400" : "text-cyan-400"
                }`}
              >
                {motionData.magnitude.toFixed(2)}
              </span>
              <span className="text-xl font-bold font-mono text-slate-400">G</span>
            </div>

            <div className="mt-3 flex items-center justify-center gap-2 text-xs font-semibold">
              <span
                className={`inline-block w-2.5 h-2.5 rounded-full ${
                  isAlert ? "bg-rose-500 animate-ping" : "bg-emerald-400"
                }`}
              />
              <span className={isAlert ? "text-rose-400" : "text-emerald-400"}>
                {isAlert
                  ? "CRITICAL SEISMIC VIBRATION TRANSMITTED!"
                  : "NORMAL AMBIENT STABILITY"}
              </span>
            </div>
          </div>

          {/* X, Y, Z ACCELEROMETER BARS */}
          <div className="mt-4 space-y-2.5 text-xs">
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1 font-mono">
                <span>X-Axis (Lateral Shear)</span>
                <span className="text-white font-bold">{motionData.x} m/s²</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-cyan-500 h-1.5 rounded-full transition-all duration-200"
                  style={{ width: `${Math.min(Math.abs(motionData.x) * 10, 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1 font-mono">
                <span>Y-Axis (Longitudinal)</span>
                <span className="text-white font-bold">{motionData.y} m/s²</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-indigo-500 h-1.5 rounded-full transition-all duration-200"
                  style={{ width: `${Math.min(Math.abs(motionData.y) * 10, 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1 font-mono">
                <span>Z-Axis (Vertical Earth Gravity)</span>
                <span className="text-white font-bold">{motionData.z} m/s²</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full transition-all duration-200"
                  style={{ width: `${Math.min(Math.abs(motionData.z) * 10, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* PERMISSION / ACTIVATE HARDWARE BUTTON */}
          <div className="mt-5">
            {!active ? (
              <button
                onClick={handleActivateAccelerometer}
                className="w-full py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-lg shadow-cyan-500/20 active:scale-98"
              >
                <Zap className="w-4 h-4" />
                Activate Mobile IoT Accelerometer
              </button>
            ) : (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center gap-2 text-emerald-300 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Physical Sensor Streaming Live (Shake Phone to Test)
              </div>
            )}
          </div>
        </div>

        {/* FAIL-SAFE TOUCH G-FORCE PAD & EMERGENCY SHAKE BUTTON (FOR ON-STAGE DEMO SAFETY) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Touch G-Force & Seismic Pad
              </h2>
            </div>
            <span className="text-[10px] text-amber-400/80 font-mono">
              Zero-Setup Fallback
            </span>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            If your mobile browser blocks physical motion over local Wi-Fi, use these
            interactive controls to test live streaming to the main laptop dashboard:
          </p>

          {/* Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Simulate G-Force Vector:</span>
              <span className="text-amber-300 font-bold">{sliderG.toFixed(1)} G</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="9.5"
              step="0.1"
              value={sliderG}
              onChange={handleSliderChange}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>1.0G (Calm)</span>
              <span>2.2G (Alert Threshold)</span>
              <span>9.5G (Seismic)</span>
            </div>
          </div>

          {/* Hold to Shake Button */}
          <button
            onMouseDown={startShakeSimulation}
            onMouseUp={stopShakeSimulation}
            onTouchStart={startShakeSimulation}
            onTouchEnd={stopShakeSimulation}
            className={`w-full py-4 rounded-xl border font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition select-none active:scale-95 ${
              isHoldingShake
                ? "bg-rose-600 border-rose-400 text-white shadow-xl shadow-rose-600/40 animate-pulse"
                : "bg-rose-950/40 hover:bg-rose-900/50 border-rose-500/50 text-rose-200"
            }`}
          >
            <Flame className="w-4 h-4 text-rose-400" />
            {isHoldingShake
              ? "TRANSMITTING 8.4G VIOLENT SEISMIC SPIKE..."
              : "HOLD TO SIMULATE VIOLENT SEISMIC SHAKE (8.4G)"}
          </button>
        </div>

        {/* PACKET COUNTER & STATUS */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 px-2 font-mono">
          <span>Packets Sent: {streamCount}</span>
          <span>Last Sync: {lastSentTime || "Pending"}</span>
        </div>
      </div>
    </div>
  );
}
