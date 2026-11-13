"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Video,
  VideoOff,
  ShieldAlert,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertTriangle,
  ArrowLeft,
  Activity,
  Zap,
  Radio,
  Lock,
  RefreshCw,
  Sliders,
  CheckCircle2,
} from "lucide-react";

export default function SecurityCameraEdgeNode() {
  const [cameraActive, setCameraActive] = useState(false);
  const [permissionState, setPermissionState] = useState("idle"); // idle | active | denied | unsupported
  const [luminance, setLuminance] = useState(128);
  const [isTampered, setIsTampered] = useState(false);
  const [isSimulatingCover, setIsSimulatingCover] = useState(false);
  const [streamFps, setStreamFps] = useState(0);
  const [lastSentTime, setLastSentTime] = useState(null);
  const [postCount, setPostCount] = useState(0);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const isTamperedRef = useRef(false);
  isTamperedRef.current = isTampered;

  const isSimulatingCoverRef = useRef(isSimulatingCover);
  isSimulatingCoverRef.current = isSimulatingCover;

  // Transmit security event to the APU-Nexus central bridge
  const transmitSecurityEvent = useCallback(async (payload) => {
    try {
      const res = await fetch("/api/iot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setPostCount((prev) => prev + 1);
        setLastSentTime(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.warn("[CCTV Edge] Telemetry transmission error:", err);
    }
  }, []);

  // Request camera access and start video stream
  const startCamera = async () => {
    if (typeof window === "undefined" || !navigator?.mediaDevices?.getUserMedia) {
      setPermissionState("unsupported");
      return;
    }

    try {
      setPermissionState("requesting");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "environment" },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setCameraActive(true);
      setPermissionState("active");
    } catch (err) {
      console.error("[CCTV Edge] Camera access failed:", err);
      setPermissionState("denied");
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setPermissionState("idle");
  };

  // Frame processing loop: Capture frame every 500ms and analyze luminance
  useEffect(() => {
    const interval = setInterval(() => {
      // If manual cover simulation is forced
      if (isSimulatingCoverRef.current) {
        const simulatedLuminance = 4;
        setLuminance(simulatedLuminance);
        setStreamFps(2);

        if (!isTamperedRef.current) {
          setIsTampered(true);
          transmitSecurityEvent({
            type: "CAMERA_TAMPERING",
            status: "critical",
            zone: "Server Room Core",
            luminance: simulatedLuminance,
            source: "cctv_optical_sensor_lens_obscured",
          });
        }
        return;
      }

      if (!videoRef.current || !canvasRef.current || !cameraActive) {
        if (isTamperedRef.current) {
          setIsTampered(false);
          setLuminance(128);
          setStreamFps(0);
          transmitSecurityEvent({
            type: "NOMINAL",
            status: "healthy",
            zone: "Server Room Core",
            luminance: 128,
            source: "cctv_optical_sensor_restored",
          });
        }
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video.readyState !== 4) return; // HAVE_ENOUGH_DATA

      const width = 160;
      const height = 120;
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, width, height);

      try {
        const frameData = ctx.getImageData(0, 0, width, height);
        const data = frameData.data;
        let sum = 0;
        const totalPixels = data.length / 4;

        // Sample every pixel's RGB luminance: (R + G + B) / 3
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          sum += (r + g + b) / 3;
        }

        const avgBrightness = Math.round(sum / totalPixels);
        setLuminance(avgBrightness);
        setStreamFps(2);

        // The Trigger: If average brightness drops below critical threshold (< 15 out of 255), someone covered the camera
        const isCovered = avgBrightness < 15;

        if (isCovered && !isTamperedRef.current) {
          setIsTampered(true);
          transmitSecurityEvent({
            type: "CAMERA_TAMPERING",
            status: "critical",
            zone: "Server Room Core",
            luminance: avgBrightness,
            source: "cctv_optical_sensor_lens_obscured",
          });
        } else if (!isCovered && isTamperedRef.current) {
          setIsTampered(false);
          transmitSecurityEvent({
            type: "NOMINAL",
            status: "healthy",
            zone: "Server Room Core",
            luminance: avgBrightness,
            source: "cctv_optical_sensor_restored",
          });
        }
      } catch (err) {
        console.warn("[CCTV Edge] Image processing exception:", err);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [cameraActive, transmitSecurityEvent]);

  // Clean up media tracks on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* HEADER */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-50 px-4 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-rose-400 animate-pulse" />
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              Vision Edge Node: CCTV-SRV-01
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30 font-mono">
                Server Room Core
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold transition ${
              isTampered
                ? "bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse"
                : cameraActive
                ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                : "bg-slate-800/60 border-slate-700 text-slate-400"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isTampered
                  ? "bg-rose-500 animate-ping"
                  : cameraActive
                  ? "bg-emerald-400"
                  : "bg-slate-500"
              }`}
            />
            <span>
              {isTampered
                ? "SABOTAGE DETECTED (COVERED)"
                : cameraActive
                ? "SURVEILLANCE ACTIVE"
                : "STANDBY"}
            </span>
          </div>
        </div>
      </header>

      {/* FLASHING SABOTAGE WARNING BANNER */}
      {isTampered && (
        <div className="bg-rose-600 text-white px-4 py-3 text-xs font-bold font-mono tracking-wide flex items-center justify-between shadow-xl animate-pulse">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 animate-bounce" />
            <span>
              [SECURITY BREACH DETECTED]: CAMERA LENS OBSCURED / LUMINANCE CRITICAL (&lt;15/255)
              IN SERVER ROOM CORE. DISPATCHING LOCKDOWN SIGNAL TO CAMPUS CONTROLLER!
            </span>
          </div>
          <span className="bg-white/20 px-2.5 py-1 rounded text-[11px]">
            BACNET MAGLOCKS SEALING
          </span>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 lg:p-8 space-y-6">
        {/* CAMERA FEED & METRICS CONTAINER */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CAMERA FEED (2 COLS) */}
          <div className="lg:col-span-2 bg-slate-900/80 rounded-2xl border border-slate-800 p-5 flex flex-col space-y-4 relative overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-rose-400" />
                Live Optical Feed (1080p Optical Stream)
              </span>
              <span className="text-xs font-mono text-cyan-400">
                {streamFps > 0 ? `${streamFps} FPS Analysis` : "Sensor Offline"}
              </span>
            </div>

            {/* VIDEO CANVAS CONTAINER */}
            <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  cameraActive ? (isSimulatingCover ? "opacity-0" : "opacity-100") : "opacity-0"
                }`}
              />

              {/* Invisible processing canvas */}
              <canvas ref={canvasRef} className="hidden" />

              {/* If camera is not active and not simulating cover */}
              {!cameraActive && !isSimulatingCover && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3 bg-slate-950/90">
                  <VideoOff className="w-12 h-12 text-slate-600" />
                  <p className="text-sm font-semibold text-slate-300">
                    Camera Stream Inactive
                  </p>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Click &quot;Enable Surveillance Camera&quot; below to grant permission and start the optical frame luminance analysis engine.
                  </p>
                  <button
                    onClick={startCamera}
                    className="mt-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-rose-500/20"
                  >
                    <Video className="w-4 h-4" />
                    Enable Surveillance Camera
                  </button>
                </div>
              )}

              {/* Simulated cover black overlay */}
              {isSimulatingCover && (
                <div className="absolute inset-0 bg-black flex flex-col items-center justify-center text-center p-6 space-y-2">
                  <EyeOff className="w-12 h-12 text-rose-500 animate-pulse" />
                  <span className="text-sm font-bold text-rose-400 font-mono">
                    PHYSICAL LENS COVERED (BLACKOUT)
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Luminance: 4 / 255 (&lt; 15 threshold)
                  </span>
                </div>
              )}

              {/* Tampering overlay indicator */}
              {cameraActive && isTampered && !isSimulatingCover && (
                <div className="absolute inset-0 bg-rose-950/60 border-4 border-rose-500/80 flex flex-col items-center justify-center text-center p-6 space-y-2 backdrop-blur-xs animate-pulse">
                  <ShieldAlert className="w-14 h-14 text-rose-400 animate-bounce" />
                  <span className="text-base font-bold text-white font-mono uppercase tracking-wider">
                    Optical Blackout / Lens Obscured!
                  </span>
                  <span className="text-xs text-rose-200 font-mono bg-rose-900/80 px-3 py-1 rounded-md">
                    Luminance: {luminance} / 255 • Critical Threshold Triggered
                  </span>
                </div>
              )}

              {/* Live HUD crosshairs */}
              {cameraActive && !isTampered && (
                <div className="absolute top-3 left-3 text-[10px] font-mono text-emerald-400/80 bg-slate-950/70 px-2.5 py-1 rounded border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  REC [00:SURVEILLANCE_ACTIVE]
                </div>
              )}
            </div>

            {/* CONTROLS BAR */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                {cameraActive ? (
                  <button
                    onClick={stopCamera}
                    className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center gap-1.5"
                  >
                    <VideoOff className="w-3.5 h-3.5" />
                    Stop Camera
                  </button>
                ) : (
                  <button
                    onClick={startCamera}
                    className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-rose-600/30"
                  >
                    <Video className="w-3.5 h-3.5" />
                    Enable Camera
                  </button>
                )}

                {/* Instant lens cover simulator button (for testing without physical occlusion) */}
                <button
                  type="button"
                  onClick={() => {
                    const nextCover = !isSimulatingCover;
                    isSimulatingCoverRef.current = nextCover;
                    setIsSimulatingCover(nextCover);
                    if (nextCover) {
                      isTamperedRef.current = true;
                      setIsTampered(true);
                      setLuminance(4);
                      setStreamFps(2);
                      transmitSecurityEvent({
                        type: "CAMERA_TAMPERING",
                        status: "critical",
                        zone: "Server Room Core",
                        luminance: 4,
                        source: "cctv_optical_sensor_lens_obscured",
                      });
                    } else {
                      isTamperedRef.current = false;
                      setIsTampered(false);
                      setLuminance(128);
                      if (!cameraActive) setStreamFps(0);
                      transmitSecurityEvent({
                        type: "NOMINAL",
                        status: "healthy",
                        zone: "Server Room Core",
                        luminance: 128,
                        source: "cctv_optical_sensor_restored",
                      });
                    }
                  }}
                  className={`px-3.5 py-2 rounded-lg border text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                    isSimulatingCover
                      ? "bg-rose-600 border-rose-500 text-white animate-pulse"
                      : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300"
                  }`}
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  {isSimulatingCover ? "Release Lens Cover" : "Simulate Cover Lens (<15)"}
                </button>
              </div>

              <div className="text-xs text-slate-400 font-mono">
                Packets: <span className="text-white font-bold">{postCount}</span> • Last:{" "}
                <span className="text-cyan-400">{lastSentTime || "None"}</span>
              </div>
            </div>
          </div>

          {/* TELEMETRY & THRESHOLD METRICS (1 COL) */}
          <div className="space-y-4">
            {/* LUMINANCE GAUGE CARD */}
            <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 space-y-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Optical Luminance (Brightness)
              </span>
              <div className="flex items-baseline justify-between">
                <span
                  className={`text-3xl font-extrabold font-mono tracking-tight ${
                    luminance < 15 ? "text-rose-400 animate-pulse" : "text-white"
                  }`}
                >
                  {luminance}
                  <span className="text-sm font-normal text-slate-400 ml-1">/ 255</span>
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${
                    luminance < 15
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  }`}
                >
                  {luminance < 15 ? "TAMPERED" : "CLEAR"}
                </span>
              </div>

              {/* Progress bar with critical zone highlighted */}
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden relative">
                <div
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    luminance < 15 ? "bg-rose-500" : "bg-cyan-500"
                  }`}
                  style={{ width: `${Math.min((luminance / 255) * 100, 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span className="text-rose-400">0 (Sabotage)</span>
                <span className="text-amber-400">Threshold: &lt;15</span>
                <span className="text-emerald-400">255 (Bright)</span>
              </div>
            </div>

            {/* EDGE ACTUATION STATUS */}
            <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 space-y-3 text-xs">
              <span className="font-semibold text-slate-400 uppercase tracking-wider block">
                Edge Node Specs
              </span>
              <div className="space-y-2 font-mono text-[11px]">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Hardware Node:</span>
                  <span className="text-white">CCTV-SRV-CORE-01</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Target Zone:</span>
                  <span className="text-rose-400 font-bold">Server Room Core</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Capture Cadence:</span>
                  <span className="text-cyan-300">500ms Pixel Canvas</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Bridge Target:</span>
                  <span className="text-emerald-400">POST /api/iot</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">AI Actuation:</span>
                  <span className="text-purple-300">Lock doors & dispatch drone</span>
                </div>
              </div>
            </div>

            {/* QUICK LINK TO DASHBOARD */}
            <Link
              href="/"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-cyan-500/20"
            >
              <Activity className="w-4 h-4" />
              View Central Digital Twin Dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
