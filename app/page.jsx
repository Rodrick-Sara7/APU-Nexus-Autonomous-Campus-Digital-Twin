"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Activity,
  Server,
  Wifi,
  Cpu,
  Thermometer,
  ShieldCheck,
  AlertTriangle,
  Zap,
  CheckCircle2,
  Play,
  RefreshCw,
  Terminal as TerminalIcon,
  Layers,
  DollarSign,
  Database,
  Radio,
  Flame,
  Clock,
  Sparkles,
  ArrowUpRight,
  TrendingDown,
  Lock,
  ChevronRight,
  Sliders,
  Check,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  ZONE_NAMES,
  CRISIS_TYPES,
  createInitialCampusState,
  generateNormalTick,
  triggerCrisisMode,
  applyAutonomousFix,
} from "@/lib/data_simulator";
import {
  isFirebaseLive,
  publishTelemetry,
  subscribeTelemetry,
} from "@/lib/firebase_setup";

export default function APUNexusDashboard() {
  const [mounted, setMounted] = useState(false);
  const [campusState, setCampusState] = useState(() => createInitialCampusState());
  const [selectedZone, setSelectedZone] = useState("Block B - AI Labs");
  const [telemetryHistory, setTelemetryHistory] = useState([]);
  const [autoHealEnabled, setAutoHealEnabled] = useState(true);
  const [isRemediating, setIsRemediating] = useState(false);
  const [activeAgentIndex, setActiveAgentIndex] = useState(0);
  const [selectedMetric, setSelectedMetric] = useState("all");
  const [terminalLogs, setTerminalLogs] = useState([]);
  const [currentDiagnosis, setCurrentDiagnosis] = useState(null);
  const [auditLog, setAuditLog] = useState([
    {
      id: "AUD-901",
      timestamp: "10:02:14 AM",
      zone: "Main Auditorium",
      crisis: "Bandwidth Contention",
      remediation: "Dynamic QoS throttle applied via APU SDN gateway",
      savings: "RM 320",
      status: "RESOLVED",
    },
    {
      id: "AUD-900",
      timestamp: "09:41:05 AM",
      zone: "Server Room Core",
      crisis: "Chiller Fan Fluctuation",
      remediation: "BACnet PID loop auto-calibrated to 20.5°C",
      savings: "RM 540",
      status: "RESOLVED",
    },
  ]);

  const logsEndRef = useRef(null);
  const stateRef = useRef(campusState);
  stateRef.current = campusState;

  const autoHealRef = useRef(autoHealEnabled);
  autoHealRef.current = autoHealEnabled;

  const appendLog = useCallback((message, type = "INFO") => {
    const time = new Date().toLocaleTimeString();
    setTerminalLogs((prev) => [
      ...prev.slice(-40),
      { id: `${Date.now()}-${Math.random()}`, time, message, type },
    ]);
  }, []);

  // Initialize client mount & subscription
  useEffect(() => {
    setMounted(true);
    appendLog("APU-Nexus Autonomous Controller initialized.", "INFO");
    appendLog(
      isFirebaseLive
        ? "Connected to Firebase Realtime Database cloud stream."
        : "Graceful Hybrid Engine active: In-Memory Twin Engine pub-sub running.",
      "SYSTEM"
    );

    // Initial history sample
    const initialSamples = [];
    let stateCursor = createInitialCampusState();
    for (let i = 10; i >= 0; i--) {
      stateCursor = generateNormalTick(stateCursor);
      const timeStr = new Date(Date.now() - i * 2500).toLocaleTimeString([], {
        minute: "2-digit",
        second: "2-digit",
      });
      initialSamples.push({
        time: timeStr,
        wifi_load: stateCursor.avg_wifi_load,
        server_cpu: stateCursor.avg_server_cpu,
        power_usage_kw: stateCursor.total_power_kw,
      });
    }
    setTelemetryHistory(initialSamples);

    const unsubscribe = subscribeTelemetry((updatedData) => {
      if (updatedData && updatedData.zones) {
        setCampusState(updatedData);
      }
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [appendLog]);

  // Keep terminal scrolled
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [terminalLogs]);

  // Autonomous Healing Workflow orchestrator
  const handleTriggerAnalysisAndHeal = useCallback(
    async (crisisType, snapshot) => {
      setIsRemediating(true);
      setActiveAgentIndex(1); // Telemetry Agent
      appendLog(
        `[CRISIS TRIGGERED]: ${crisisType}. Telemetry Ingestion Agent dispatched.`,
        "WARN"
      );

      try {
        // Step 1: Telemetry Ingested
        await new Promise((r) => setTimeout(r, 600));
        setActiveAgentIndex(2); // Diagnostic Agent
        appendLog(
          "Gemini Diagnostic Agent correlating multi-zone anomaly telemetry...",
          "AGENT"
        );

        // Fetch diagnosis from API route or internal AI brain
        const res = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ telemetry: snapshot, crisisType }),
        });

        const diagnosis = await res.json();
        setCurrentDiagnosis(diagnosis);

        appendLog(
          `Diagnostic isolated root cause (Confidence: ${(diagnosis.confidence_score * 100).toFixed(0)}%): ${diagnosis.root_cause.substring(0, 85)}...`,
          "GEMINI"
        );

        // Step 2: Resolution Architect
        await new Promise((r) => setTimeout(r, 700));
        setActiveAgentIndex(3);
        appendLog(
          `Resolution Architect synthesized remediation: ${diagnosis.remediation_command}`,
          "AGENT"
        );

        // Step 3: Cloud Execution Agent
        await new Promise((r) => setTimeout(r, 800));
        setActiveAgentIndex(4);
        appendLog(
          `Cloud Execution Agent deploying: ${diagnosis.cloud_action_taken}`,
          "ACTION"
        );

        // Step 4: Apply autonomous fix to campus state
        const remediated = applyAutonomousFix(crisisType, stateRef.current);
        setCampusState(remediated);
        publishTelemetry(remediated);

        // Step 5: Audit & FinOps Agent
        await new Promise((r) => setTimeout(r, 700));
        setActiveAgentIndex(5);
        appendLog(
          `FinOps Agent logged SLA compliance. Prevented campus outage. Projected savings: RM ${diagnosis.estimated_savings_myr}.00/mo.`,
          "FINOPS"
        );

        // Add to audit log
        const newAuditEntry = {
          id: `AUD-${Math.floor(100 + Math.random() * 900)}`,
          timestamp: new Date().toLocaleTimeString(),
          zone: diagnosis.affected_zone || "Multi-Zone",
          crisis: diagnosis.anomaly_type || crisisType,
          remediation: diagnosis.cloud_action_taken || "Autonomous Cloud & SDN Remediation",
          savings: `RM ${diagnosis.estimated_savings_myr || 680}`,
          status: "RESOLVED",
        };
        setAuditLog((prev) => [newAuditEntry, ...prev.slice(0, 9)]);

        // Reset agent pipeline indicator after stabilization
        await new Promise((r) => setTimeout(r, 1200));
        setIsRemediating(false);
        setActiveAgentIndex(0);
        appendLog("Campus digital twin restored to autonomous equilibrium.", "INFO");
      } catch (err) {
        console.error("Autonomous healing error:", err);
        appendLog(`Autonomous remediation fallback: ${err.message}`, "WARN");
        setIsRemediating(false);
        setActiveAgentIndex(0);
      }
    },
    [appendLog]
  );

  // Periodic Telemetry Tick Loop (every 2.5s)
  useEffect(() => {
    const timer = setInterval(() => {
      setCampusState((prev) => {
        const nextState = generateNormalTick(prev);
        publishTelemetry(nextState);

        // Update history chart (keep last 20 entries)
        const timeStr = new Date().toLocaleTimeString([], {
          minute: "2-digit",
          second: "2-digit",
        });
        setTelemetryHistory((hist) => [
          ...hist.slice(-19),
          {
            time: timeStr,
            wifi_load: nextState.avg_wifi_load,
            server_cpu: nextState.avg_server_cpu,
            power_usage_kw: nextState.total_power_kw,
          },
        ]);

        return nextState;
      });
    }, 2500);

    return () => clearInterval(timer);
  }, []);

  // Trigger Crisis Mode handler
  const handleTriggerCrisis = (type) => {
    if (isRemediating) return;
    const crisisState = triggerCrisisMode(type, campusState);
    setCampusState(crisisState);
    publishTelemetry(crisisState);

    appendLog(
      `CRISIS INJECTED: ${type} across ${
        type === "NETWORK_STORM"
          ? "Block B - AI Labs"
          : type === "IOT_THERMAL_RUNAWAY"
          ? "Server Room Core"
          : "APU Library Level 2"
      }.`,
      "CRITICAL"
    );

    if (autoHealRef.current) {
      appendLog("Auto-Heal Mode: ON. Engaging 5-Agent pipeline in 1.2s...", "SYSTEM");
      setTimeout(() => {
        handleTriggerAnalysisAndHeal(type, crisisState);
      }, 1200);
    } else {
      appendLog(
        "Auto-Heal Mode: OFF. Awaiting manual administrator remediation command.",
        "WARN"
      );
    }
  };

  // Manual Remediation Execution
  const handleManualRemediate = () => {
    if (isRemediating) return;
    const activeCrisis = campusState.active_crisis || CRISIS_TYPES.NETWORK_STORM;
    handleTriggerAnalysisAndHeal(activeCrisis, campusState);
  };

  // Reset to Healthy Baseline
  const handleResetBaseline = () => {
    const cleanState = createInitialCampusState();
    setCampusState(cleanState);
    publishTelemetry(cleanState);
    setCurrentDiagnosis(null);
    setIsRemediating(false);
    setActiveAgentIndex(0);
    appendLog("Campus infrastructure reset to nominal baseline state.", "INFO");
  };

  const currentZoneData =
    campusState.zones[selectedZone] || campusState.zones["Block B - AI Labs"];

  const isCrisisActive = Boolean(campusState.active_crisis);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 1. TOP COMMAND HEADER */}
      <header className="border-b border-slate-800/80 bg-slate-900/50 backdrop-blur sticky top-0 z-50 px-4 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 shadow-lg shadow-cyan-500/20">
            <Radio className="w-5 h-5 text-white animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                APU-Nexus
                <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono">
                  v2.4-PROD
                </span>
              </h1>
              <span className="hidden sm:inline-block text-xs text-slate-400 font-medium">
                Autonomous Campus Digital Twin
              </span>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Track: Intelligent Automation (Cloud, IoT & Network Convergence)
            </p>
          </div>
        </div>

        {/* Status Indicators & Live FinOps Counter */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-4">
          {/* Status Badge */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold tracking-wide transition-all ${
              isRemediating
                ? "bg-amber-500/10 border-amber-500/40 text-amber-300 animate-pulse"
                : isCrisisActive
                ? "bg-rose-500/10 border-rose-500/40 text-rose-300 animate-bounce"
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isRemediating
                  ? "bg-amber-400"
                  : isCrisisActive
                  ? "bg-rose-500"
                  : "bg-emerald-400"
              }`}
            />
            {isRemediating
              ? "REMEDIATING VIA MULTI-AGENT AI..."
              : isCrisisActive
              ? `CRISIS DETECTED: ${campusState.active_crisis}`
              : "AUTONOMOUS SELF-HEALING ACTIVE"}
          </div>

          {/* Connection Mode Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs font-mono text-slate-300">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              {isFirebaseLive ? "Firebase Cloud Sync" : "Local Twin Engine (Pub-Sub)"}
            </span>
          </div>

          {/* FinOps Counter */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-950/60 to-cyan-950/40 border border-emerald-500/30 text-xs font-mono text-emerald-300 shadow-sm">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="text-[10px] text-emerald-400/80 block uppercase tracking-wider">
                Autonomous Savings
              </span>
              <span className="font-bold text-emerald-300">
                RM {campusState.monthly_savings_myr.toLocaleString()}/mo
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. DEMO CRISIS INJECTION BAR (FOR JUDGES) */}
      <section className="bg-slate-900/90 border-b border-slate-800 px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Judges Live Crisis Injection:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleTriggerCrisis(CRISIS_TYPES.NETWORK_STORM)}
              disabled={isRemediating}
              className="px-3 py-1.5 rounded-md bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/50 hover:border-rose-400 text-rose-200 text-xs font-medium transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5 text-rose-400" />
              Simulate Block B Wi-Fi & Cloud Storm
            </button>

            <button
              onClick={() => handleTriggerCrisis(CRISIS_TYPES.IOT_THERMAL_RUNAWAY)}
              disabled={isRemediating}
              className="px-3 py-1.5 rounded-md bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/50 hover:border-amber-400 text-amber-200 text-xs font-medium transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              Simulate Server Thermal Runaway
            </button>

            <button
              onClick={() => handleTriggerCrisis(CRISIS_TYPES.ENERGY_WASTE_ANOMALY)}
              disabled={isRemediating}
              className="px-3 py-1.5 rounded-md bg-blue-950/40 hover:bg-blue-900/60 border border-blue-500/50 hover:border-blue-400 text-blue-200 text-xs font-medium transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              Simulate Library HVAC Energy Waste
            </button>
          </div>

          <div className="flex items-center gap-2 border-t md:border-t-0 pt-2 md:pt-0 border-slate-800 w-full md:w-auto justify-end">
            {/* Auto-Heal Mode Toggle */}
            <button
              onClick={() => setAutoHealEnabled(!autoHealEnabled)}
              className={`px-3 py-1.5 rounded-md border text-xs font-medium transition flex items-center gap-1.5 ${
                autoHealEnabled
                  ? "bg-cyan-950/50 border-cyan-500/60 text-cyan-300"
                  : "bg-slate-800/80 border-slate-700 text-slate-400"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Auto-Heal: {autoHealEnabled ? "ON" : "OFF"}
            </button>

            {/* Manual Execute Fix */}
            <button
              onClick={handleManualRemediate}
              disabled={isRemediating || !isCrisisActive}
              className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-40 disabled:hover:bg-emerald-600 shadow-sm shadow-emerald-500/20"
            >
              <Play className="w-3.5 h-3.5" />
              Manual Execute Fix
            </button>

            {/* Baseline Reset */}
            <button
              onClick={handleResetBaseline}
              disabled={isRemediating}
              title="Reset to Healthy Baseline"
              className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition disabled:opacity-50"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* MAIN DASHBOARD CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-6">
        {/* 3. 4-CARD REAL-TIME TELEMETRY KPI ROW */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Network Wi-Fi & Latency */}
          <div
            className={`p-4 rounded-xl border bg-slate-900/60 backdrop-blur transition-all ${
              campusState.avg_wifi_load > 85
                ? "border-rose-500/80 shadow-lg shadow-rose-500/10 animate-pulse"
                : "border-slate-800 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Wi-Fi Load & Network
              </span>
              <Wifi
                className={`w-4 h-4 ${
                  campusState.avg_wifi_load > 85 ? "text-rose-400" : "text-cyan-400"
                }`}
              />
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono tracking-tight text-white">
                {campusState.avg_wifi_load}%
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {campusState.avg_latency_ms} ms RTT
              </span>
            </div>
            <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  campusState.avg_wifi_load > 85 ? "bg-rose-500" : "bg-cyan-500"
                }`}
                style={{ width: `${Math.min(campusState.avg_wifi_load, 100)}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
              <span>Avg Packet Drop: {campusState.avg_packet_loss}%</span>
              <span
                className={
                  campusState.avg_wifi_load > 85 ? "text-rose-400 font-semibold" : "text-emerald-400"
                }
              >
                {campusState.avg_wifi_load > 85 ? "Congested" : "Optimal"}
              </span>
            </div>
          </div>

          {/* Card 2: Cloud Compute & Server CPU */}
          <div
            className={`p-4 rounded-xl border bg-slate-900/60 backdrop-blur transition-all ${
              campusState.avg_server_cpu > 80
                ? "border-rose-500/80 shadow-lg shadow-rose-500/10 animate-pulse"
                : "border-slate-800 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Cloud Compute & CPU
              </span>
              <Server
                className={`w-4 h-4 ${
                  campusState.avg_server_cpu > 80 ? "text-rose-400" : "text-indigo-400"
                }`}
              />
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono tracking-tight text-white">
                {campusState.avg_server_cpu}%
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono">
                {campusState.total_cloud_instances} Cloud Run Nodes
              </span>
            </div>
            <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  campusState.avg_server_cpu > 80 ? "bg-rose-500" : "bg-indigo-500"
                }`}
                style={{ width: `${Math.min(campusState.avg_server_cpu, 100)}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
              <span>asia-southeast1 (MY-SG)</span>
              <span className="text-emerald-400 font-mono">Autoscale Ready</span>
            </div>
          </div>

          {/* Card 3: IoT HVAC & Thermal */}
          <div
            className={`p-4 rounded-xl border bg-slate-900/60 backdrop-blur transition-all ${
              campusState.zones["Server Room Core"]?.ac_temp_c > 30 ||
              campusState.zones["APU Library Level 2"]?.power_usage_kw > 100
                ? "border-amber-500/80 shadow-lg shadow-amber-500/10 animate-pulse"
                : "border-slate-800 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                IoT HVAC & Power
              </span>
              <Thermometer className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono tracking-tight text-white">
                {campusState.total_power_kw} kW
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {campusState.zones["Server Room Core"]?.ac_temp_c}°C Core
              </span>
            </div>
            <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-1.5 rounded-full bg-emerald-500 transition-all duration-500"
                style={{
                  width: `${Math.min((campusState.total_power_kw / 250) * 100, 100)}%`,
                }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
              <span>Campus Occupancy: {campusState.total_occupancy}</span>
              <span className="text-emerald-400">BACnet Loop Active</span>
            </div>
          </div>

          {/* Card 4: SLA & Autonomous Remediations */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                SLA Uptime & Auto-Fixes
              </span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono tracking-tight text-emerald-400">
                {campusState.uptime_sla}%
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">
                {campusState.resolved_incidents_count} Auto-Resolved
              </span>
            </div>
            <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div className="h-1.5 rounded-full bg-emerald-400 w-[99.9%]" />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
              <span>Mean Time To Remediate</span>
              <span className="text-cyan-400 font-mono">&lt; 3.8s MTTR</span>
            </div>
          </div>
        </section>

        {/* 4. MULTI-ZONE SELECTOR & ZONE DETAILS */}
        <section className="bg-slate-900/60 rounded-xl border border-slate-800 p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-semibold tracking-wide text-white uppercase">
                APU Campus Zone Digital Twins
              </h2>
            </div>
            {/* Zone Pills */}
            <div className="flex flex-wrap gap-1.5">
              {ZONE_NAMES.map((name) => {
                const zone = campusState.zones[name];
                const isSelected = selectedZone === name;
                const isCritical = zone?.status === "CRITICAL";

                return (
                  <button
                    key={name}
                    onClick={() => setSelectedZone(name)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-2 ${
                      isSelected
                        ? "bg-cyan-500 text-slate-950 font-semibold shadow-md shadow-cyan-500/20"
                        : "bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isCritical
                          ? "bg-rose-500 animate-ping"
                          : isSelected
                          ? "bg-slate-950"
                          : "bg-emerald-400"
                      }`}
                    />
                    {name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detailed Zone Telemetry Card */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2 border-t border-slate-800/80 text-xs">
            <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Wi-Fi Load</span>
              <span className="font-mono text-base font-bold text-white mt-1 block">
                {currentZoneData.wifi_load}%
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Loss: {currentZoneData.packet_loss}%
              </span>
            </div>

            <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Latency</span>
              <span className="font-mono text-base font-bold text-white mt-1 block">
                {currentZoneData.latency_ms} ms
              </span>
              <span className="text-[10px] text-slate-400 font-mono">RTT L3 Edge</span>
            </div>

            <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Server CPU</span>
              <span className="font-mono text-base font-bold text-white mt-1 block">
                {currentZoneData.server_cpu}%
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {currentZoneData.cloud_instances} Instances
              </span>
            </div>

            <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Ambient AC Temp</span>
              <span className="font-mono text-base font-bold text-white mt-1 block">
                {currentZoneData.ac_temp_c}°C
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Smart VRF Thermostat</span>
            </div>

            <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Power Usage</span>
              <span className="font-mono text-base font-bold text-white mt-1 block">
                {currentZoneData.power_usage_kw} kW
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Substation Feeder</span>
            </div>

            <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Zone Occupancy</span>
              <span className="font-mono text-base font-bold text-white mt-1 block">
                {currentZoneData.occupancy_count} Students
              </span>
              <span className="text-[10px] text-slate-400 font-mono">PIR / Vision Count</span>
            </div>
          </div>

          {currentZoneData.active_alert && (
            <div className="mt-3 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-300 text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="font-mono">{currentZoneData.active_alert}</span>
            </div>
          )}
        </section>

        {/* 5. 5-NODE MULTI-AGENT VISUAL PIPELINE */}
        <section className="bg-slate-900/60 rounded-xl border border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-semibold tracking-wide text-white uppercase">
                5-Agent Autonomous Orchestration Pipeline
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Google Gemini Flash + Distributed SDN/BACnet Agents
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
            {[
              {
                index: 1,
                name: "Telemetry Agent",
                role: "IoT / SDN Ingestion",
                desc: "Sub-second multi-zone anomaly thresholding",
              },
              {
                index: 2,
                name: "Gemini Diagnostic",
                role: "Root-Cause AI Brain",
                desc: "LLM correlation across Cloud, IoT & Network",
              },
              {
                index: 3,
                name: "Resolution Architect",
                role: "Remediation Engine",
                desc: "Synthesizes zero-downtime execution payload",
              },
              {
                index: 4,
                name: "Cloud Execution Agent",
                role: "Infrastructure Actuator",
                desc: "Dispatches gcloud / BACnet / SDN commands",
              },
              {
                index: 5,
                name: "Audit & FinOps Agent",
                role: "SLA & Cost Compliance",
                desc: "Calculates cost avoidance & logs SLA",
              },
            ].map((node) => {
              const isActive = activeAgentIndex === node.index;
              const isPast = activeAgentIndex > node.index;

              return (
                <div
                  key={node.index}
                  className={`p-3.5 rounded-xl border transition-all relative ${
                    isActive
                      ? "bg-cyan-950/60 border-cyan-400 shadow-lg shadow-cyan-500/20 scale-102"
                      : isPast
                      ? "bg-slate-900/80 border-emerald-500/50 text-slate-300"
                      : "bg-slate-950/40 border-slate-800 text-slate-400"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      Stage 0{node.index}
                    </span>
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isActive
                          ? "bg-cyan-400 animate-ping"
                          : isPast
                          ? "bg-emerald-400"
                          : "bg-slate-700"
                      }`}
                    />
                  </div>
                  <h3 className="text-xs font-bold text-white tracking-tight">{node.name}</h3>
                  <p className="text-[11px] text-cyan-400 font-mono mt-0.5">{node.role}</p>
                  <p className="text-[10px] text-slate-400 mt-1 leading-snug">{node.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* 6. CHARTS & TERMINAL (2-COLUMN GRID) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Time Series Telemetry Charts (7 Cols) */}
          <div className="lg:col-span-7 bg-slate-900/60 rounded-xl border border-slate-800 p-5 flex flex-col justify-between">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold tracking-wide text-white uppercase">
                  Real-Time Campus Telemetry Stream
                </h3>
              </div>
              {/* Metric filter buttons */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                {["all", "network", "compute", "energy"].map((m) => (
                  <button
                    key={m}
                    onClick={() => setSelectedMetric(m)}
                    className={`px-2.5 py-1 rounded text-[11px] capitalize transition ${
                      selectedMetric === m
                        ? "bg-cyan-500 text-slate-950 font-bold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Recharts Area Container with mounted guard */}
            <div className="h-[280px] w-full pt-2">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={telemetryHistory}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="wifiColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="cpuColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="powerColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} domain={[0, "auto"]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#020617",
                        borderColor: "#334155",
                        borderRadius: "8px",
                        fontSize: "11px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                    {(selectedMetric === "all" || selectedMetric === "network") && (
                      <Area
                        type="monotone"
                        dataKey="wifi_load"
                        name="Wi-Fi Load (%)"
                        stroke="#06b6d4"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#wifiColor)"
                      />
                    )}
                    {(selectedMetric === "all" || selectedMetric === "compute") && (
                      <Area
                        type="monotone"
                        dataKey="server_cpu"
                        name="Server CPU (%)"
                        stroke="#818cf8"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#cpuColor)"
                      />
                    )}
                    {(selectedMetric === "all" || selectedMetric === "energy") && (
                      <Area
                        type="monotone"
                        dataKey="power_usage_kw"
                        name="Power (kW)"
                        stroke="#10b981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#powerColor)"
                      />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                  Loading Telemetry Canvas...
                </div>
              )}
            </div>
          </div>

          {/* Live Agent Monospace Terminal & CLI Command Viewer (5 Cols) */}
          <div className="lg:col-span-5 bg-slate-900/90 rounded-xl border border-slate-800 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <TerminalIcon className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
                  Autonomous Agent Terminal
                </h3>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono">LIVE EXECUTION</span>
            </div>

            {/* Terminal Log Output Window */}
            <div className="h-[200px] overflow-y-auto bg-slate-950 rounded-lg p-3 font-mono text-[11px] space-y-1.5 border border-slate-800/80 selection:bg-cyan-500/30">
              {terminalLogs.length === 0 ? (
                <div className="text-slate-500 italic">Listening for autonomous events...</div>
              ) : (
                terminalLogs.map((log) => (
                  <div key={log.id} className="leading-relaxed">
                    <span className="text-slate-500 mr-1.5">[{log.time}]</span>
                    <span
                      className={`font-semibold mr-1.5 ${
                        log.type === "CRITICAL"
                          ? "text-rose-400"
                          : log.type === "WARN"
                          ? "text-amber-400"
                          : log.type === "GEMINI"
                          ? "text-cyan-300 font-bold"
                          : log.type === "ACTION"
                          ? "text-indigo-300"
                          : log.type === "FINOPS"
                          ? "text-emerald-300"
                          : "text-slate-300"
                      }`}
                    >
                      [{log.type}]
                    </span>
                    <span className="text-slate-200">{log.message}</span>
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>

            {/* Generated CLI Remediation Payload View */}
            <div className="mt-3 pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span>Executed Cloud/IoT Remediation Command:</span>
                <span className="text-cyan-400 font-mono">gcloud / BACnet</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-cyan-900/40 font-mono text-[11px] text-cyan-300 overflow-x-auto whitespace-pre select-all">
                {currentDiagnosis?.remediation_command ||
                  "apu-nexus-agent --mode=continuous-monitor --interval=2500ms --telemetry-health=optimal"}
              </div>
            </div>
          </div>
        </section>

        {/* 7. INTERACTIVE AUDIT LOG & FINOPS COMPLIANCE */}
        <section className="bg-slate-900/60 rounded-xl border border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-semibold tracking-wide text-white uppercase">
                Autonomous Incident Remediation & FinOps Audit Log
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Immutable SLA Record & Campus Cost Avoidance
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono">
                  <th className="py-2.5 px-3">INCIDENT ID</th>
                  <th className="py-2.5 px-3">TIMESTAMP</th>
                  <th className="py-2.5 px-3">ZONE</th>
                  <th className="py-2.5 px-3">ANOMALY TRIGGER</th>
                  <th className="py-2.5 px-3">AUTONOMOUS REMEDIATION ACTION</th>
                  <th className="py-2.5 px-3 text-right">SAVINGS (MYR)</th>
                  <th className="py-2.5 px-3 text-center">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {auditLog.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-2.5 px-3 font-mono text-cyan-400 font-medium">
                      {item.id}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono">{item.timestamp}</td>
                    <td className="py-2.5 px-3 font-medium text-white">{item.zone}</td>
                    <td className="py-2.5 px-3 text-slate-300">{item.crisis}</td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                      {item.remediation}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                      {item.savings}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-mono">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 px-4 lg:px-8 mt-auto text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span>APU-Nexus Autonomous Campus Infrastructure</span>
          <span>•</span>
          <span>Asia Pacific University Hackathon MVP</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-mono">
          <span className="flex items-center gap-1 text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Cloud: Google Cloud Run
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            Brain: Gemini 1.5/2.0 Flash
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
            IoT: BACnet & SD-WAN
          </span>
        </div>
      </footer>
    </div>
  );
}
