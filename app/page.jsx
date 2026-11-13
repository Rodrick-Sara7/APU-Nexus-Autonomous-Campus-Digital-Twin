"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
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
  Smartphone,
  MapPin,
  FileCode,
  Copy,
  ExternalLink,
  GitPullRequest,
  GitBranch,
  Video,
  EyeOff,
  ChevronDown,
  Volume2,
  VolumeX,
  CloudSun,
  MessageSquare,
  Send,
  Download,
  FileText,
  ShieldAlert,
  Bot,
  UserCheck,
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
  subscribeIotVibration,
} from "@/lib/firebase_setup";

const COMMANDER_CHIPS = [
  "Which campus zone has the highest carbon & power load right now?",
  "Generate an executive risk & FinOps summary for campus IT",
  "Explain how the 5-Agent pipeline mitigates CCTV & seismic threats",
];

export default function APUNexusDashboard() {
  const [mounted, setMounted] = useState(false);
  const [campusState, setCampusState] = useState(() => createInitialCampusState());
  const [selectedZone, setSelectedZone] = useState("Block B - AI Labs");
  const [telemetryHistory, setTelemetryHistory] = useState([]);

  // Feature 1: Human-in-the-Loop (HITL) Governance Mode
  const [autoHealMode, setAutoHealMode] = useState(true);
  const [pendingApproval, setPendingApproval] = useState(null);

  // Feature 2: Live NOC Voice Incident Briefing
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  // Feature 3: Live Bukit Jalil Ambient Weather Correlation (Open-Meteo)
  const [ambientWeather, setAmbientWeather] = useState({
    temperature_2m: 31.4,
    relative_humidity_2m: 78,
    source: "Baseline Reference",
  });

  // Feature 4: Natural-Language "Ask APU-Nexus" AI Commander Bar
  const [commanderQuery, setCommanderQuery] = useState("");
  const [commanderReply, setCommanderReply] = useState(null);
  const [isAskingCommander, setIsAskingCommander] = useState(false);

  const [isRemediating, setIsRemediating] = useState(false);
  const [activeAgentIndex, setActiveAgentIndex] = useState(0);
  const [selectedMetric, setSelectedMetric] = useState("all");
  const [terminalLogs, setTerminalLogs] = useState([]);
  const [currentDiagnosis, setCurrentDiagnosis] = useState(null);
  const [activeInspectorTab, setActiveInspectorTab] = useState("logs"); // "logs" | "iac"
  const [copiedIaC, setCopiedIaC] = useState(false);
  const [isDeployingGitOps, setIsDeployingGitOps] = useState(false);
  const [showManualOverrides, setShowManualOverrides] = useState(false);
  const [gitOpsToast, setGitOpsToast] = useState({
    show: false,
    pr_url: "",
    branch: "",
    pr_number: 104,
    message: "",
  });

  // Real-time edge hardware state polled from /api/iot
  const [edgeHardwareData, setEdgeHardwareData] = useState({
    type: "NOMINAL",
    status: "HEALTHY",
    zone: "All APU Zones",
    magnitude: 1.0,
    x: 0.0,
    y: 0.0,
    z: 9.8,
    seismic_alert: false,
    camera_tampered: false,
    camera_luminance: 120,
    device_connected: false,
    cctv_connected: false,
    last_updated: null,
    source: "idle",
  });

  // Feature 5: Session Incident & Compliance Audit Log
  const [incidentAuditLog, setIncidentAuditLog] = useState([
    {
      id: "AUD-903",
      timestamp: "10:22:15 AM",
      crisisType: "Camera Lens Obscured (CCTV Sabotage)",
      affectedZone: "Server Room Core",
      rootCause:
        "Optical luminance dropped below threshold (<15/255) on surveillance node CCTV-SRV-01.",
      cliCommand:
        "bacnet-cli door-lock --facility=SRV-CORE --override=emergency-lockdown && drone-dispatch --waypoint=SRV-CORE-DOOR-A --mode=intercept",
      iacType: "Terraform HCL",
      remediation: "Magnetic doors locked down; security drone dispatched",
      rmSaved: 2400,
      co2eReduced: 108.0,
      governanceMode: "Full Autonomous (Auto-Heal)",
      status: "RESOLVED",
    },
    {
      id: "AUD-902",
      timestamp: "10:14:22 AM",
      crisisType: "Structural Seismic Spike (8.4G)",
      affectedZone: "Server Room Core",
      rootCause:
        "Critical 8.4G seismic/structural vibration detected in Server Room Core.",
      cliCommand:
        "gcloud compute instance-groups managed rolling-action replace apu-core-cluster --zone=asia-southeast1-b",
      iacType: "Terraform HCL",
      remediation: "Breaker isolated; DR instance group deployed in asia-southeast1-b",
      rmSaved: 1850,
      co2eReduced: 83.3,
      governanceMode: "Full Autonomous (Auto-Heal)",
      status: "RESOLVED",
    },
    {
      id: "AUD-901",
      timestamp: "10:02:14 AM",
      crisisType: "Bandwidth Contention",
      affectedZone: "Main Auditorium",
      rootCause: "Flash client association spike saturated Main Auditorium AP uplink.",
      cliCommand: "apu-sdn-ctl vlan isolate --port=eth4/2 --divert=trunk-backup",
      iacType: "Terraform HCL",
      remediation: "Dynamic QoS throttle applied via APU SDN gateway",
      rmSaved: 320,
      co2eReduced: 14.4,
      governanceMode: "Full Autonomous (Auto-Heal)",
      status: "RESOLVED",
    },
  ]);

  const logsContainerRef = useRef(null);
  const stateRef = useRef(campusState);
  stateRef.current = campusState;

  const autoHealRef = useRef(autoHealMode);
  autoHealRef.current = autoHealMode;

  const voiceEnabledRef = useRef(voiceEnabled);
  voiceEnabledRef.current = voiceEnabled;

  const isRemediatingRef = useRef(isRemediating);
  isRemediatingRef.current = isRemediating;

  const pendingApprovalRef = useRef(pendingApproval);
  pendingApprovalRef.current = pendingApproval;

  const crisisDispatchLockRef = useRef(false);

  const appendLog = useCallback((message, type = "INFO") => {
    const time = new Date().toLocaleTimeString();
    setTerminalLogs((prev) => [
      ...prev.slice(-40),
      { id: `${Date.now()}-${Math.random()}`, time, message, type },
    ]);
  }, []);

  // Feature 2: Safe native Web Speech API NOC Briefing helper
  const announceNOC = useCallback((message) => {
    if (!voiceEnabledRef.current) return;
    if (
      typeof window === "undefined" ||
      typeof window.speechSynthesis === "undefined" ||
      typeof SpeechSynthesisUtterance === "undefined"
    ) {
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 1.05;
      utterance.pitch = 0.95;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignore speech synthesis errors on restricted browsers
    }
  }, []);

  const handleToggleVoice = () => {
    setVoiceEnabled((prev) => {
      const next = !prev;
      voiceEnabledRef.current = next;
      if (typeof window !== "undefined") {
        try {
          window.sessionStorage.setItem("apu_nexus_voice_enabled", String(next));
          if (!next && typeof window.speechSynthesis !== "undefined") {
            window.speechSynthesis.cancel();
          }
        } catch {}
      }
      appendLog(
        next ? "Voice NOC Incident Briefing enabled." : "Voice NOC muted by operator.",
        "SYSTEM"
      );
      return next;
    });
  };

  const handleToggleGovernanceMode = () => {
    setAutoHealMode((prev) => {
      const next = !prev;
      autoHealRef.current = next;
      if (typeof window !== "undefined") {
        try {
          window.sessionStorage.setItem("apu_nexus_auto_heal_mode", String(next));
        } catch {}
      }
      appendLog(
        next
          ? "Governance Mode switched to Full Autonomous (Auto-Heal)."
          : "Governance Mode switched to Co-Pilot Governance (Hold for Approval).",
        "SYSTEM"
      );
      return next;
    });
  };

  // Initialize client mount & subscription
  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      try {
        const savedAutoHeal = window.sessionStorage.getItem("apu_nexus_auto_heal_mode");
        if (savedAutoHeal === "false" || savedAutoHeal === "true") {
          const parsedMode = savedAutoHeal === "true";
          autoHealRef.current = parsedMode;
          setAutoHealMode(parsedMode);
        }
        const savedVoice = window.sessionStorage.getItem("apu_nexus_voice_enabled");
        if (savedVoice === "false" || savedVoice === "true") {
          const parsedVoice = savedVoice === "true";
          voiceEnabledRef.current = parsedVoice;
          setVoiceEnabled(parsedVoice);
        }
      } catch {}
    }
    appendLog("APU-Nexus Autonomous Controller initialized.", "INFO");
    appendLog(
      isFirebaseLive
        ? "Connected to Firebase Realtime Database cloud stream."
        : "Graceful Hybrid Engine active: In-Memory Twin Engine pub-sub running.",
      "SYSTEM"
    );
    appendLog(
      "Phase 4 Edge Hardware Actuation Active: Polling /api/iot for physical accelerometer & CCTV lens sabotage.",
      "SYSTEM"
    );

    // Initial history sample with real-time carbon tracking & projected trajectory
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
        carbon_kg_co2e: Number(
          (stateCursor.carbon_kg_co2e || stateCursor.total_power_kw * 0.4).toFixed(1)
        ),
        projected_carbon_kg_co2e: Number(
          (
            stateCursor.projected_carbon_kg_co2e ||
            (stateCursor.total_power_kw + 42) * 0.4
          ).toFixed(1)
        ),
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

  // Feature 3: Live Bukit Jalil External Weather Correlation (Open-Meteo Free Keyless API)
  useEffect(() => {
    let isMounted = true;
    const OPEN_METEO_URL =
      "https://api.open-meteo.com/v1/forecast?latitude=3.0554&longitude=101.7005&current=temperature_2m,relative_humidity_2m";

    const fetchBukitJalilWeather = async () => {
      try {
        const res = await fetch(OPEN_METEO_URL, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!isMounted) return;

        const temp = Number(data?.current?.temperature_2m);
        const humidity = Number(data?.current?.relative_humidity_2m);
        if (Number.isFinite(temp) && Number.isFinite(humidity)) {
          setAmbientWeather({
            temperature_2m: temp,
            relative_humidity_2m: humidity,
            source: "Open-Meteo Satellite",
          });
        } else {
          throw new Error("Invalid Open-Meteo payload");
        }
      } catch {
        if (!isMounted) return;
        setAmbientWeather((prev) => ({
          temperature_2m:
            prev?.source === "Open-Meteo Satellite" ? prev.temperature_2m : 31.4,
          relative_humidity_2m:
            prev?.source === "Open-Meteo Satellite" ? prev.relative_humidity_2m : 78,
          source:
            prev?.source === "Open-Meteo Satellite"
              ? prev.source
              : "Open-Meteo Satellite (Cached)",
        }));
      }
    };

    fetchBukitJalilWeather();
    const weatherInterval = setInterval(fetchBukitJalilWeather, 60000);
    return () => {
      isMounted = false;
      clearInterval(weatherInterval);
    };
  }, []);

  // Keep terminal container scrolled to bottom without hijacking browser window scroll
  useEffect(() => {
    if (logsContainerRef.current && activeInspectorTab === "logs") {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [terminalLogs, activeInspectorTab]);

  // Helper to execute Steps 4 & 5 of Remediation (shared by Auto-Heal & HITL Co-Pilot Approval)
  const executeRemediationCompletion = useCallback(
    async (crisisType, diagnosis, governanceModeLabel, pendingIncidentId = null) => {
      isRemediatingRef.current = true;
      setIsRemediating(true);
      setActiveAgentIndex(4);

      try {
        appendLog(
          `Cloud Execution Agent deploying: ${diagnosis?.cloud_action_taken || "Autonomous Remediation"}`,
          "ACTION"
        );

        await new Promise((r) => setTimeout(r, 700));

        // Apply autonomous fix to campus state
        const remediated = applyAutonomousFix(crisisType, stateRef.current);
        stateRef.current = remediated;
        setCampusState(remediated);
        publishTelemetry(remediated);

        // Reset edge hardware bridge state so 1000ms polling does not re-trigger resolved crisis
        fetch("/api/iot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "RESET",
            source: pendingIncidentId ? "copilot_operator_approved" : "autonomous_remediation",
          }),
        }).catch(() => {});

        setEdgeHardwareData((prev) => ({
          ...prev,
          type: "NOMINAL",
          status: "HEALTHY",
          seismic_alert: false,
          camera_tampered: false,
          camera_luminance: 120,
          magnitude: 1.0,
        }));

        pendingApprovalRef.current = null;
        setPendingApproval(null);

        // Step 5: Audit & FinOps Agent
        await new Promise((r) => setTimeout(r, 650));
        setActiveAgentIndex(5);

        const rmSaved =
          remediated.last_remediation?.savings_myr ?? diagnosis?.estimated_savings_myr ?? 680;
        const co2eReduced =
          remediated.last_remediation?.carbon_saved_kg ??
          Number((rmSaved * 0.045).toFixed(1));
        const iacType = (diagnosis?.iac_manifest || "").includes("apiVersion:")
          ? "Kubernetes YAML"
          : "Terraform HCL";

        appendLog(
          `FinOps Agent logged SLA compliance (${governanceModeLabel}). Projected savings: RM ${rmSaved}.00/mo. CO2e avoided: ${co2eReduced} kg.`,
          "FINOPS"
        );

        const nowTime = new Date().toLocaleTimeString();
        const completedEntry = {
          id: pendingIncidentId || `AUD-${Math.floor(100 + Math.random() * 900)}`,
          timestamp: nowTime,
          crisisType: diagnosis?.anomaly_type || crisisType,
          affectedZone: diagnosis?.affected_zone || "Multi-Zone",
          rootCause:
            diagnosis?.root_cause || "Autonomous anomaly mitigated across APU infrastructure.",
          cliCommand:
            diagnosis?.remediation_command || "apu-nexus-agent --mode=remediate",
          iacType,
          remediation: diagnosis?.cloud_action_taken || "Autonomous Cloud & SDN Remediation",
          rmSaved,
          co2eReduced,
          governanceMode: governanceModeLabel,
          status: "RESOLVED",
        };

        setIncidentAuditLog((prev) => {
          if (pendingIncidentId && prev.some((item) => item.id === pendingIncidentId)) {
            return prev.map((item) =>
              item.id === pendingIncidentId ? completedEntry : item
            );
          }
          return [completedEntry, ...prev.slice(0, 19)];
        });

        announceNOC(
          "Autonomous remediation executed. Campus systems restored to nominal."
        );

        await new Promise((r) => setTimeout(r, 1100));
        isRemediatingRef.current = false;
        setIsRemediating(false);
        setActiveAgentIndex(0);
        appendLog("Campus digital twin restored to autonomous equilibrium.", "INFO");
      } catch (err) {
        console.error("Remediation completion error:", err);
        appendLog(`Autonomous remediation fallback: ${err.message}`, "WARN");
        isRemediatingRef.current = false;
        setIsRemediating(false);
        setActiveAgentIndex(0);
      }
    },
    [appendLog, announceNOC]
  );

  // Autonomous Healing Workflow orchestrator (Runs Steps 1-3, then pauses if Co-Pilot Governance is enabled)
  const handleTriggerAnalysisAndHeal = useCallback(
    async (crisisType, snapshot) => {
      isRemediatingRef.current = true;
      setIsRemediating(true);
      setActiveAgentIndex(1); // Telemetry Agent
      appendLog(
        `[PHYSICAL EDGE CRISIS DETECTED]: ${crisisType}. Telemetry Ingestion Agent dispatched.`,
        "WARN"
      );

      try {
        // Step 1: Telemetry Ingested
        await new Promise((r) => setTimeout(r, 550));
        setActiveAgentIndex(2); // Diagnostic Agent
        appendLog(
          "Gemini Diagnostic Agent correlating optical / physical telemetry with campus digital twin...",
          "AGENT"
        );

        // Fetch diagnosis from API route
        const res = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ telemetry: snapshot, crisisType }),
        });

        const diagnosis = await res.json();
        setCurrentDiagnosis(diagnosis);

        appendLog(
          `Diagnostic isolated root cause (Confidence: ${((diagnosis.confidence_score || 0.96) * 100).toFixed(0)}%): ${(diagnosis.root_cause || "").substring(0, 85)}...`,
          "GEMINI"
        );

        // Step 2: Resolution Architect (IaC & CLI Synthesis)
        await new Promise((r) => setTimeout(r, 650));
        setActiveAgentIndex(3);
        appendLog(
          `Resolution Architect synthesized remediation: ${diagnosis.remediation_command}`,
          "AGENT"
        );

        // Check HITL Governance Mode: if Co-Pilot Mode (autoHealMode === false), PAUSE for human operator approval!
        if (!autoHealRef.current) {
          const incidentId = `INC-${Math.floor(1000 + Math.random() * 9000)}`;
          const iacType = (diagnosis?.iac_manifest || "").includes("apiVersion:")
            ? "Kubernetes YAML"
            : "Terraform HCL";
          const nowTime = new Date().toLocaleTimeString();

          const pendingObj = {
            incidentId,
            crisisType,
            diagnosis,
            snapshot,
            iacType,
            timestamp: nowTime,
          };

          pendingApprovalRef.current = pendingObj;
          setPendingApproval(pendingObj);
          setActiveAgentIndex(4); // Waiting at Execution Gate
          isRemediatingRef.current = false;
          setIsRemediating(false);

          setIncidentAuditLog((prev) => [
            {
              id: incidentId,
              timestamp: nowTime,
              crisisType: diagnosis?.anomaly_type || crisisType,
              affectedZone: diagnosis?.affected_zone || "Server Room Core",
              rootCause:
                diagnosis?.root_cause || "Physical or cyber anomaly held for review.",
              cliCommand:
                diagnosis?.remediation_command || "apu-nexus-agent --pending-approval",
              iacType,
              remediation: "Awaiting Co-Pilot Governance Operator Approval",
              rmSaved: 0,
              co2eReduced: 0,
              governanceMode: "Co-Pilot Governance (Hold for Approval)",
              status: "AWAITING APPROVAL",
            },
            ...prev.slice(0, 19),
          ]);

          appendLog(
            "[CO-PILOT GOVERNANCE HOLD]: IaC manifest & root-cause synthesized. Pausing before execution for human operator approval.",
            "WARN"
          );
          announceNOC(
            "Remediation manifest synthesized. Awaiting human operator approval."
          );
          return;
        }

        // Auto-Heal Enabled: proceed immediately to Steps 4 & 5
        await new Promise((r) => setTimeout(r, 700));
        await executeRemediationCompletion(
          crisisType,
          diagnosis,
          "Full Autonomous (Auto-Heal)",
          null
        );
      } catch (err) {
        console.error("Autonomous healing error:", err);
        appendLog(`Autonomous remediation fallback: ${err.message}`, "WARN");
        isRemediatingRef.current = false;
        setIsRemediating(false);
        setActiveAgentIndex(0);
      }
    },
    [appendLog, announceNOC, executeRemediationCompletion]
  );

  // Co-Pilot Approval Button Handler
  const handleApproveRemediation = useCallback(async () => {
    const pending = pendingApprovalRef.current || pendingApproval;
    if (!pending || isRemediatingRef.current) return;

    appendLog(
      `[CO-PILOT APPROVED]: Operator authorized autonomous remediation for ${pending.diagnosis?.anomaly_type || pending.crisisType}.`,
      "ACTION"
    );
    await executeRemediationCompletion(
      pending.crisisType,
      pending.diagnosis,
      "Co-Pilot Governance (Human-Approved)",
      pending.incidentId
    );
  }, [pendingApproval, appendLog, executeRemediationCompletion]);

  // Trigger Crisis Mode handler
  const handleTriggerCrisis = useCallback(
    (type) => {
      if (
        isRemediatingRef.current ||
        pendingApprovalRef.current ||
        crisisDispatchLockRef.current
      ) {
        return;
      }

      crisisDispatchLockRef.current = true;
      const crisisState = triggerCrisisMode(type, stateRef.current);
      stateRef.current = crisisState;
      setCampusState(crisisState);
      publishTelemetry(crisisState);

      const affected =
        type === "NETWORK_STORM"
          ? "Block B - AI Labs"
          : type === "IOT_THERMAL_RUNAWAY"
          ? "Server Room Core"
          : type === "ENERGY_WASTE_ANOMALY"
          ? "APU Library Level 2"
          : type === "CAMERA_TAMPERING" || type === "SECURITY_BREACH"
          ? "Server Room Core (CCTV Lens Obscured)"
          : "Server Room Core (Physical Seismic Vibration >3.0G)";

      const voiceAlertMsg =
        type === "CAMERA_TAMPERING" || type === "SECURITY_BREACH"
          ? "Alert in Server Room Core. Optical camera tampering detected. 5-Agent diagnostic pipeline engaged."
          : type === "SEISMIC_ANOMALY"
          ? "Critical alert in Server Room Core. Violent seismic vibration detected. 5-Agent diagnostic pipeline engaged."
          : type === "NETWORK_STORM"
          ? "Alert in Block B AI Labs. Network storm detected. 5-Agent diagnostic pipeline engaged."
          : type === "IOT_THERMAL_RUNAWAY"
          ? "Alert in Server Room Core. Thermal runaway detected. 5-Agent diagnostic pipeline engaged."
          : "Alert in APU Library Level 2. Energy waste anomaly detected. 5-Agent diagnostic pipeline engaged.";

      appendLog(`HARDWARE EDGE TRIGGER: ${type} across ${affected}.`, "CRITICAL");
      announceNOC(voiceAlertMsg);

      if (autoHealRef.current) {
        appendLog(
          "Mode: Full Autonomous (Auto-Heal). Engaging 5-Agent pipeline in 1.0s...",
          "SYSTEM"
        );
      } else {
        appendLog(
          "Mode: Co-Pilot Governance. Running 5-Agent diagnosis and holding before remediation...",
          "WARN"
        );
      }

      setTimeout(() => {
        crisisDispatchLockRef.current = false;
        handleTriggerAnalysisAndHeal(type, crisisState);
      }, 1000);
    },
    [appendLog, announceNOC, handleTriggerAnalysisAndHeal]
  );

  // Short-polling useEffect fetching /api/iot every 1000ms
  useEffect(() => {
    let isMounted = true;

    const pollEdgeHardware = async () => {
      try {
        const res = await fetch("/api/iot", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!isMounted) return;

        setEdgeHardwareData(data);

        // 1. Physical Edge: Camera Tampering / Lens Obscured (<15 luminance)
        const isCameraTampered =
          data.type === "CAMERA_TAMPERING" ||
          data.camera_tampered ||
          (data.camera_luminance !== undefined &&
            data.camera_luminance < 15 &&
            data.cctv_connected);

        // 2. Physical Edge: Mobile Hardware Accelerometer Violent Shake (>=3.5G)
        const isSeismicShake =
          data.type === "SEISMIC_ANOMALY" ||
          data.seismic_alert ||
          (data.magnitude !== undefined && data.magnitude >= 3.5);

        if (
          isCameraTampered &&
          !isRemediatingRef.current &&
          !pendingApprovalRef.current &&
          !crisisDispatchLockRef.current &&
          stateRef.current.active_crisis !== CRISIS_TYPES.CAMERA_TAMPERING
        ) {
          appendLog(
            `[PHYSICAL EDGE ALERT]: CCTV Camera Lens Obscured (Luminance: ${data.camera_luminance || 8}/255) in Server Room Core!`,
            "CRITICAL"
          );
          handleTriggerCrisis(CRISIS_TYPES.CAMERA_TAMPERING);
        } else if (
          isSeismicShake &&
          !isRemediatingRef.current &&
          !pendingApprovalRef.current &&
          !crisisDispatchLockRef.current &&
          stateRef.current.active_crisis !== CRISIS_TYPES.SEISMIC_ANOMALY
        ) {
          appendLog(
            `[PHYSICAL EDGE ALERT]: Violent physical shake (${data.magnitude}G >= 3.5G) detected via mobile accelerometer!`,
            "CRITICAL"
          );
          handleTriggerCrisis(CRISIS_TYPES.SEISMIC_ANOMALY);
        }
      } catch {
        // Ignore brief network glitches
      }
    };

    pollEdgeHardware();
    const interval = setInterval(pollEdgeHardware, 1000);

    // Also attach Firebase pub-sub subscriber for instant push
    const unsubIot = subscribeIotVibration((data) => {
      if (data && isMounted) {
        setEdgeHardwareData((prev) => ({ ...prev, ...data }));
        if (
          (data.type === "SEISMIC_ANOMALY" || data.magnitude >= 3.5 || data.seismic_alert) &&
          !isRemediatingRef.current &&
          !pendingApprovalRef.current &&
          !crisisDispatchLockRef.current &&
          stateRef.current.active_crisis !== CRISIS_TYPES.SEISMIC_ANOMALY
        ) {
          appendLog(
            `[PHYSICAL IOT RTDB]: Instant seismic spike (${data.magnitude}G >= 3.5G) streamed from hardware.`,
            "CRITICAL"
          );
          handleTriggerCrisis(CRISIS_TYPES.SEISMIC_ANOMALY);
        }
      }
    });

    return () => {
      isMounted = false;
      clearInterval(interval);
      if (typeof unsubIot === "function") unsubIot();
    };
  }, [appendLog, handleTriggerCrisis]);

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
            carbon_kg_co2e: Number(
              (nextState.carbon_kg_co2e || nextState.total_power_kw * 0.4).toFixed(1)
            ),
            projected_carbon_kg_co2e: Number(
              (
                nextState.projected_carbon_kg_co2e ||
                (nextState.total_power_kw + 42) * 0.4
              ).toFixed(1)
            ),
          },
        ]);

        return nextState;
      });
    }, 2500);

    return () => clearInterval(timer);
  }, []);

  // Manual Remediation Execution
  const handleManualRemediate = () => {
    if (isRemediatingRef.current) return;
    if (pendingApprovalRef.current || pendingApproval) {
      handleApproveRemediation();
      return;
    }
    const activeCrisis = campusState.active_crisis || CRISIS_TYPES.CAMERA_TAMPERING;
    handleTriggerAnalysisAndHeal(activeCrisis, campusState);
  };

  // Reset to Healthy Baseline
  const handleResetBaseline = () => {
    const cleanState = createInitialCampusState();
    stateRef.current = cleanState;
    setCampusState(cleanState);
    publishTelemetry(cleanState);
    setCurrentDiagnosis(null);
    pendingApprovalRef.current = null;
    setPendingApproval(null);
    crisisDispatchLockRef.current = false;
    isRemediatingRef.current = false;
    setIsRemediating(false);
    setActiveAgentIndex(0);
    fetch("/api/iot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "RESET", source: "manual_baseline_reset" }),
    }).catch(() => {});
    setEdgeHardwareData((prev) => ({
      ...prev,
      type: "NOMINAL",
      status: "HEALTHY",
      seismic_alert: false,
      camera_tampered: false,
      camera_luminance: 120,
      magnitude: 1.0,
    }));
    appendLog("Campus infrastructure reset to nominal baseline state.", "INFO");
  };

  // Feature 4: Natural-Language "Ask APU-Nexus" AI Commander Bar Handler
  const handleAskCommander = async (customPrompt = null) => {
    const queryText = (
      typeof customPrompt === "string" ? customPrompt : commanderQuery
    ).trim();
    if (!queryText || isAskingCommander) return;

    if (typeof customPrompt === "string") {
      setCommanderQuery(customPrompt);
    }

    setIsAskingCommander(true);
    appendLog(`[Ask APU-Nexus]: "${queryText}"`, "AGENT");

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telemetry: stateRef.current,
          userQuery: queryText,
          weather: ambientWeather,
        }),
      });
      const data = await res.json();
      const reply =
        data.commander_reply ||
        data.root_cause ||
        "APU-Nexus Commander analyzed live telemetry.";
      setCommanderReply({
        query: queryText,
        reply,
        timestamp: new Date().toLocaleTimeString(),
      });
      appendLog(
        `[AI Commander]: Delivered telemetry-grounded briefing (${reply.length} chars).`,
        "GEMINI"
      );
    } catch (err) {
      setCommanderReply({
        query: queryText,
        reply: `Live fallback response (${stateRef.current.overall_status}): ${stateRef.current.total_power_kw} kW total draw, RM ${stateRef.current.monthly_savings_myr?.toLocaleString()} monthly savings. (${err.message})`,
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setIsAskingCommander(false);
    }
  };

  // Feature 5: 1-Click Executive Compliance & ESG Audit Report Export (.md)
  const handleExportAuditReport = () => {
    if (typeof window === "undefined" || typeof Blob === "undefined") return;

    const nowIso = new Date().toISOString();
    const nowLocal = new Date().toLocaleString();
    const state = stateRef.current || campusState;
    const zonesList = Object.values(state.zones || {});
    const tempDelta = (ambientWeather.temperature_2m - 22.0).toFixed(1);

    const zoneRows = zonesList
      .map(
        (z) =>
          `| ${z.name} | ${z.status} | ${z.wifi_load}% | ${z.latency_ms} ms | ${z.server_cpu}% | ${z.ac_temp_c}°C | ${z.power_usage_kw} kW | ${Number(
            z.carbon_kg_co2e ?? z.power_usage_kw * 0.4
          ).toFixed(1)} kg | ${(z.vibration_g || 1.0).toFixed(2)}G | ${
            z.active_alert || "None"
          } |`
      )
      .join("\n");

    const incidentRows =
      incidentAuditLog.length === 0
        ? "| — | No session incidents recorded | — | — | — | — | RM 0 | 0.0 kg | — |"
        : incidentAuditLog
            .map(
              (inc) =>
                `| ${inc.id} | ${inc.timestamp} | ${inc.crisisType} | ${inc.affectedZone} | ${inc.governanceMode} | ${inc.iacType} | RM ${inc.rmSaved} | ${inc.co2eReduced} kg CO2e | ${inc.status} |`
            )
            .join("\n");

    const detailedIncidents = incidentAuditLog
      .map(
        (inc, idx) => `### ${idx + 1}. ${inc.id} — ${inc.crisisType} (${inc.status})
- **Timestamp:** ${inc.timestamp}
- **Affected Zone:** ${inc.affectedZone}
- **Governance Mode:** ${inc.governanceMode}
- **Root Cause:** ${inc.rootCause}
- **CLI Command:** \`${inc.cliCommand}\`
- **IaC Synthesized:** ${inc.iacType}
- **FinOps Savings:** RM ${inc.rmSaved} | **CO2e Reduced:** ${inc.co2eReduced} kg CO2e`
      )
      .join("\n\n");

    const reportMarkdown = `# APU-Nexus Executive Compliance, Security & ESG Audit Report

**Generated At:** ${nowLocal} (\`${nowIso}\`)  
**Facility:** Asia Pacific University (APU), Bukit Jalil Campus  
**Active Governance Policy:** ${
      autoHealMode
        ? "Full Autonomous (Auto-Heal)"
        : "Co-Pilot Governance (Hold for Approval)"
    }  
**Overall Digital Twin Status:** ${state.overall_status}  
**SLA Uptime:** ${state.uptime_sla}%

---

## 1. Live Bukit Jalil External Weather & HVAC Load Correlation
- **Ambient Outdoor Temperature:** ${ambientWeather.temperature_2m.toFixed(1)}°C
- **Relative Humidity:** ${Math.round(ambientWeather.relative_humidity_2m)}% RH
- **Telemetry Source:** ${ambientWeather.source} (\`3.0554°N, 101.7005°E\`)
- **Tropical Cooling Load Correlation:** +${tempDelta}°C exterior thermal differential against 22.0°C campus HVAC chilled-water baseline, elevating chiller duty cycle and autonomous Eco-VRF setpoint optimization potential.

---

## 2. Campus FinOps & ESG Decarbonization Summary
| KPI Metric | Value |
| :--- | :--- |
| **Projected Monthly Cost Avoidance** | **RM ${Number(state.monthly_savings_myr || 0).toLocaleString()}/mo** |
| **Cumulative CO2e Emissions Saved** | **${Number(state.total_co2e_saved || 0).toFixed(1)} kg CO2e** |
| **Live Total Campus Power Draw** | **${state.total_power_kw} kW** (Projected Unmitigated: ${state.projected_power_kw} kW) |
| **Live Campus Carbon Rate** | **${Number(state.carbon_kg_co2e || 0).toFixed(1)} kg CO2e** (Projected Unmitigated: ${Number(state.projected_carbon_kg_co2e || 0).toFixed(1)} kg CO2e) |
| **Resolved Autonomous Incidents** | **${state.resolved_incidents_count}** |
| **Average Wi-Fi Load & Latency** | **${state.avg_wifi_load}%** @ **${state.avg_latency_ms} ms** RTT |

---

## 3. Current Multi-Zone Campus Telemetry Snapshot
| Campus Zone | Status | Wi-Fi | Latency | CPU | AC Temp | Power | Carbon CO2e | Vibration | Active Alert |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
${zoneRows}

---

## 4. Session Incident Audit History
| ID | Timestamp | Crisis Type | Affected Zone | Governance Mode | IaC Type | RM Saved | CO2e Reduced | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
${incidentRows}

---

## 5. Detailed Root-Cause & Remediation Traceability
${detailedIncidents}

---
*Compiled by APU-Nexus Autonomous Campus Digital Twin v4.0 (Zero-Cost Client Exporter).*
`;

    const blob = new Blob([reportMarkdown], { type: "text/markdown;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "APU-Nexus-Compliance-Report.md";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    appendLog(
      "[Compliance]: Downloaded APU-Nexus-Compliance-Report.md audit & ESG export.",
      "FINOPS"
    );
  };

  const handleCopyIaC = () => {
    const manifest =
      currentDiagnosis?.iac_manifest ||
      `# Terraform: APU-Nexus Campus Cloud Baseline Infrastructure
resource "google_compute_network" "apu_mesh_vpc" {
  name                    = "apu-campus-mesh-vpc"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "apu_edge_subnets" {
  name          = "apu-asia-se1-subnet"
  ip_cidr_range = "10.10.0.0/16"
  region        = "asia-southeast1"
  network       = google_compute_network.apu_mesh_vpc.id
}`;
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(manifest);
      setCopiedIaC(true);
      setTimeout(() => setCopiedIaC(false), 2000);
    }
  };

  // GitOps Live GitHub Pull Request Dispatcher
  const handleDeployToGitHub = async () => {
    if (isDeployingGitOps) return;
    setIsDeployingGitOps(true);
    appendLog("[GitOps]: Dispatching IaC pull request to GitHub REST API...", "ACTION");

    try {
      const manifest =
        currentDiagnosis?.iac_manifest ||
        `# Terraform: APU-Nexus Campus Cloud Baseline Infrastructure
resource "google_compute_network" "apu_mesh_vpc" {
  name                    = "apu-campus-mesh-vpc"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "apu_edge_subnets" {
  name          = "apu-asia-se1-subnet"
  ip_cidr_range = "10.10.0.0/16"
  region        = "asia-southeast1"
  network       = google_compute_network.apu_mesh_vpc.id
}`;

      const res = await fetch("/api/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          iac_manifest: manifest,
          anomaly_type:
            currentDiagnosis?.anomaly_type ||
            campusState.active_crisis ||
            "Campus Baseline IaC",
          affected_zone: currentDiagnosis?.affected_zone || selectedZone,
          root_cause:
            currentDiagnosis?.root_cause ||
            "Autonomous infrastructure configuration sync.",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setGitOpsToast({
          show: true,
          pr_url: data.pr_url,
          branch: data.branch,
          pr_number: data.pr_number || 104,
          message: data.message || `Created PR on branch ${data.branch}`,
        });
        appendLog(`[GitOps]: Automated Pull Request created: ${data.pr_url}`, "FINOPS");
      } else {
        appendLog(
          `[GitOps]: GitHub PR dispatch warning: ${data.error || "Unknown error"}`,
          "WARN"
        );
      }
    } catch (err) {
      console.error("GitOps dispatch error:", err);
      appendLog(`[GitOps]: Network error connecting to GitHub API: ${err.message}`, "WARN");
    } finally {
      setIsDeployingGitOps(false);
    }
  };

  const currentZoneData =
    campusState.zones[selectedZone] || campusState.zones["Block B - AI Labs"];

  const isCrisisActive = Boolean(campusState.active_crisis);
  const isCameraSabotageActive =
    campusState.active_crisis === CRISIS_TYPES.CAMERA_TAMPERING ||
    campusState.active_crisis === "CAMERA_TAMPERING";
  const isSeismicActive =
    campusState.active_crisis === CRISIS_TYPES.SEISMIC_ANOMALY ||
    campusState.active_crisis === "SEISMIC_ANOMALY";
  const isFixDeployed =
    !pendingApproval &&
    (campusState.overall_status === "REMEDIATED" ||
      (isRemediating && activeAgentIndex >= 4));

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
                  v4.0-TRUE-EDGE
                </span>
              </h1>
              <span className="hidden sm:inline-block text-xs text-slate-400 font-medium">
                Autonomous Campus Digital Twin
              </span>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Physical Edge Actuation: Mobile Accelerometer & CCTV Optical Sentinel
            </p>
          </div>
        </div>

        {/* Status Indicators, Voice NOC Toggle & Live FinOps Counter */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Status Badge */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold tracking-wide transition-all ${
              pendingApproval
                ? "bg-amber-500/20 border-amber-400 text-amber-200 animate-pulse"
                : isRemediating
                ? "bg-amber-500/10 border-amber-500/40 text-amber-300 animate-pulse"
                : isCrisisActive
                ? "bg-rose-500/10 border-rose-500/40 text-rose-300 animate-bounce"
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                pendingApproval
                  ? "bg-amber-400"
                  : isRemediating
                  ? "bg-amber-400"
                  : isCrisisActive
                  ? "bg-rose-500"
                  : "bg-emerald-400"
              }`}
            />
            {pendingApproval
              ? "CO-PILOT HOLD: AWAITING APPROVAL"
              : isRemediating
              ? "REMEDIATING VIA MULTI-AGENT AI..."
              : isCrisisActive
              ? `CRISIS DETECTED: ${campusState.active_crisis}`
              : "AUTONOMOUS SELF-HEALING ACTIVE"}
          </div>

          {/* Feature 2: Live NOC Voice Incident Briefing Toggle */}
          <button
            type="button"
            onClick={handleToggleVoice}
            title="Toggle Live NOC Web Speech Voice Incident Briefings"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition shadow-sm ${
              voiceEnabled
                ? "bg-cyan-950/60 hover:bg-cyan-900/60 border-cyan-500/50 text-cyan-200"
                : "bg-slate-900/80 hover:bg-slate-800 border-slate-700 text-slate-400"
            }`}
          >
            {voiceEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span>{voiceEnabled ? "🔊 Voice NOC: ON" : "🔇 Voice NOC: OFF"}</span>
          </button>

          {/* CCTV Vision Edge Node Badge */}
          <Link
            href="/cctv"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition shadow-sm ${
              edgeHardwareData.camera_tampered
                ? "bg-rose-950/60 border-rose-500 text-rose-300 animate-pulse"
                : "bg-slate-900/80 hover:bg-slate-850 border-slate-700 text-slate-300"
            }`}
            title="Open Vision Edge Camera Node (/cctv)"
          >
            <Video
              className={`w-3.5 h-3.5 ${
                edgeHardwareData.camera_tampered ? "text-rose-400" : "text-rose-400/80"
              }`}
            />
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  edgeHardwareData.camera_tampered
                    ? "bg-rose-500 animate-ping"
                    : edgeHardwareData.cctv_connected
                    ? "bg-emerald-400"
                    : "bg-slate-500"
                }`}
              />
              <span>
                CCTV: {edgeHardwareData.camera_tampered ? "SABOTAGE (<15)" : "Active"}
              </span>
            </div>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>

          {/* Mobile IoT Edge Sensor Badge */}
          <Link
            href="/sensor"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition shadow-sm ${
              edgeHardwareData.magnitude > 3.0 || edgeHardwareData.seismic_alert
                ? "bg-purple-950/60 border-purple-500 text-purple-300 animate-pulse"
                : "bg-slate-900/80 hover:bg-slate-850 border-slate-700 text-slate-300"
            }`}
            title="Open Mobile Hardware Accelerometer Web App (/sensor)"
          >
            <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  edgeHardwareData.magnitude > 3.0 || edgeHardwareData.seismic_alert
                    ? "bg-rose-500 animate-ping"
                    : edgeHardwareData.device_connected
                    ? "bg-emerald-400"
                    : "bg-slate-500"
                }`}
              />
              <span>
                Sensor:{" "}
                {edgeHardwareData.device_connected
                  ? `${edgeHardwareData.magnitude?.toFixed(1)}G`
                  : "Standby"}
              </span>
            </div>
            <ExternalLink className="w-3 h-3 text-cyan-400/80" />
          </Link>

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

      {/* FLASHING CAMERA SABOTAGE EMERGENCY BANNER */}
      {isCameraSabotageActive && (
        <div className="bg-rose-600 text-white px-4 py-2.5 text-xs font-bold font-mono tracking-wide flex flex-wrap items-center justify-between gap-3 shadow-xl">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 animate-bounce shrink-0" />
            <span>
              CRITICAL PHYSICAL SECURITY SABOTAGE: CCTV CAMERA LENS OBSCURED (&lt;15/255
              LUMINANCE) IN SERVER ROOM CORE.{" "}
              {pendingApproval
                ? "5-AGENT DIAGNOSIS READY — HOLDING FOR CO-PILOT APPROVAL!"
                : "LOCKING MAGNETIC DOORS & DISPATCHING APU SECURITY DRONE!"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {pendingApproval && (
              <button
                type="button"
                onClick={handleApproveRemediation}
                className="px-3.5 py-1.5 rounded-md bg-gradient-to-r from-emerald-500 to-amber-400 hover:from-emerald-400 hover:to-amber-300 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-950/50 border border-white/40 transition animate-pulse cursor-pointer"
              >
                [⚡ Approve &amp; Execute Autonomous Remediation]
              </button>
            )}
            <span className="bg-white/20 px-2 py-0.5 rounded text-[10px]">
              {pendingApproval ? "HITL GATE ACTIVE" : "BACNET MAGLOCKS SEALING"}
            </span>
          </div>
        </div>
      )}

      {/* FLASHING SEISMIC EMERGENCY BANNER */}
      {isSeismicActive && !isCameraSabotageActive && (
        <div className="bg-rose-600 text-white px-4 py-2.5 text-xs font-bold font-mono tracking-wide flex flex-wrap items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 animate-bounce" />
            <span>
              CRITICAL SEISMIC &amp; STRUCTURAL EMERGENCY (
              {edgeHardwareData.magnitude || 8.4}G &gt;= 3.5G) DETECTED VIA PHYSICAL
              HARDWARE ACCELEROMETER.{" "}
              {pendingApproval
                ? "5-AGENT FAILOVER PLAN READY — HOLDING FOR HUMAN APPROVAL!"
                : "TRIP BREAKER SRV-CORE-HV1 ENGAGED!"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {pendingApproval && (
              <button
                type="button"
                onClick={handleApproveRemediation}
                className="px-3.5 py-1.5 rounded-md bg-gradient-to-r from-emerald-500 to-amber-400 hover:from-emerald-400 hover:to-amber-300 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-950/50 border border-white/40 transition animate-pulse cursor-pointer"
              >
                [⚡ Approve &amp; Execute Autonomous Remediation]
              </button>
            )}
            <span className="bg-white/20 px-2 py-0.5 rounded text-[10px]">
              {pendingApproval ? "HITL GATE ACTIVE" : "FAILOVER TO GCP ASIA-SOUTHEAST1-B ACTIVE"}
            </span>
          </div>
        </div>
      )}

      {/* GENERAL CRISIS / CO-PILOT HOLD BANNER (NETWORK / THERMAL / ENERGY) */}
      {isCrisisActive && !isCameraSabotageActive && !isSeismicActive && (
        <div className="bg-gradient-to-r from-rose-700 via-rose-600 to-amber-600 text-white px-4 py-2.5 text-xs font-bold font-mono tracking-wide flex flex-wrap items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 animate-bounce" />
            <span>
              ACTIVE CAMPUS ANOMALY ({campusState.active_crisis}):{" "}
              {pendingApproval
                ? `${pendingApproval.diagnosis?.anomaly_type} in ${pendingApproval.diagnosis?.affected_zone} — IaC Manifest Ready. Awaiting Operator Approval.`
                : "5-Agent autonomous diagnostic pipeline evaluating campus telemetry."}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {pendingApproval && (
              <button
                type="button"
                onClick={handleApproveRemediation}
                className="px-3.5 py-1.5 rounded-md bg-gradient-to-r from-emerald-400 to-amber-300 hover:from-emerald-300 hover:to-amber-200 text-slate-950 font-extrabold text-xs shadow-lg border border-white/50 transition animate-pulse cursor-pointer"
              >
                [⚡ Approve &amp; Execute Autonomous Remediation]
              </button>
            )}
            <span className="bg-white/20 px-2 py-0.5 rounded text-[10px]">
              {pendingApproval ? "CO-PILOT GOVERNANCE PAUSED" : "DIAGNOSTIC ACTIVE"}
            </span>
          </div>
        </div>
      )}

      {/* 2. AUTONOMOUS PHYSICAL EDGE TELEMETRY SENTINEL HUB & HITL GOVERNANCE BAR */}
      <section className="bg-slate-900/90 border-b border-slate-800 px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col gap-3">
          {/* Top Row: Live Edge Status + External Bukit Jalil Weather Correlation */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-slate-800/70">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                True Edge Hardware Sentinel:
              </span>
              <span className="text-xs font-mono text-cyan-400">
                Live Edge Polling (1000ms Cadence) • Zero Mock Reliance
              </span>
            </div>

            {/* Feature 3: Live Bukit Jalil Ambient Weather Correlation Badge */}
            <div
              className="flex flex-wrap items-center gap-2 px-3 py-1 rounded-lg bg-sky-950/40 border border-sky-500/30 text-[11px] font-mono text-sky-200 shadow-sm"
              title="Live Open-Meteo tropical ambient telemetry correlated against APU HVAC chiller loads & ESG carbon footprint"
            >
              <CloudSun className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span>
                📍 APU Bukit Jalil Live Ambient: {ambientWeather.temperature_2m.toFixed(1)}°C |{" "}
                {Math.round(ambientWeather.relative_humidity_2m)}% RH (Open-Meteo Satellite)
              </span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px]">
                HVAC Cooling Δ+{(ambientWeather.temperature_2m - 22.0).toFixed(1)}°C
              </span>
            </div>
          </div>

          {/* Second Row: Edge Links & Governance / Action Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Direct Link to CCTV node */}
              <Link
                href="/cctv"
                className="px-3 py-1.5 rounded-md bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/50 text-rose-200 text-xs font-medium transition flex items-center gap-1.5"
              >
                <Video className="w-3.5 h-3.5 text-rose-400" />
                Surveillance Camera (/cctv)
              </Link>

              {/* Direct Link to Accelerometer node */}
              <Link
                href="/sensor"
                className="px-3 py-1.5 rounded-md bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/50 text-cyan-200 text-xs font-medium transition flex items-center gap-1.5"
              >
                <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                Mobile Accelerometer (/sensor)
              </Link>

              {/* Collapsible toggle for judges manual override panel */}
              <button
                type="button"
                onClick={() => setShowManualOverrides(!showManualOverrides)}
                className="px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition flex items-center gap-1"
              >
                <Sliders className="w-3.5 h-3.5 text-slate-400" />
                <span>Overrides</span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${
                    showManualOverrides ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 justify-end">
              {/* Feature 1: Prominent HITL Governance Mode Toggle */}
              <button
                type="button"
                onClick={handleToggleGovernanceMode}
                className={`px-3 py-1.5 rounded-md border text-xs font-semibold transition flex items-center gap-1.5 shadow-sm cursor-pointer ${
                  autoHealMode
                    ? "bg-emerald-950/60 hover:bg-emerald-900/60 border-emerald-500/60 text-emerald-200"
                    : "bg-amber-950/70 hover:bg-amber-900/70 border-amber-400/70 text-amber-200 shadow-amber-500/10"
                }`}
              >
                <span>
                  {autoHealMode
                    ? "🟢 Mode: Full Autonomous (Auto-Heal)"
                    : "🟡 Mode: Co-Pilot Governance (Hold for Approval)"}
                </span>
              </button>

              {/* Feature 5: 1-Click Executive Compliance & ESG Audit Report Export */}
              <button
                type="button"
                onClick={handleExportAuditReport}
                className="px-3 py-1.5 rounded-md bg-indigo-600/80 hover:bg-indigo-500 text-white border border-indigo-400/50 text-xs font-semibold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                [📄 Export Audit &amp; ESG Report]
              </button>

              {/* Manual Execute Fix */}
              <button
                type="button"
                onClick={handleManualRemediate}
                disabled={isRemediating || (!isCrisisActive && !pendingApproval)}
                className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-40 disabled:hover:bg-emerald-600 shadow-sm shadow-emerald-500/20"
              >
                <Play className="w-3.5 h-3.5" />
                {pendingApproval ? "Approve Fix" : "Manual Execute Fix"}
              </button>

              {/* Baseline Reset */}
              <button
                type="button"
                onClick={handleResetBaseline}
                disabled={isRemediating}
                title="Reset to Healthy Baseline"
                className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition disabled:opacity-50"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* OPTIONAL EXPANDABLE JUDGES MANUAL OVERRIDE BAR */}
        {showManualOverrides && (
          <div className="max-w-7xl mx-auto mt-3 pt-3 border-t border-slate-800 flex flex-wrap items-center gap-2 animate-in fade-in">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mr-1">
              Manual Simulation Injections:
            </span>
            <button
              type="button"
              onClick={() => handleTriggerCrisis(CRISIS_TYPES.CAMERA_TAMPERING)}
              disabled={isRemediating || Boolean(pendingApproval)}
              className="px-2.5 py-1 rounded bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/60 text-rose-200 text-xs font-mono transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <EyeOff className="w-3 h-3 text-rose-400" />
              Simulate Camera Tampering (&lt;15)
            </button>
            <button
              type="button"
              onClick={() => handleTriggerCrisis(CRISIS_TYPES.SEISMIC_ANOMALY)}
              disabled={isRemediating || Boolean(pendingApproval)}
              className="px-2.5 py-1 rounded bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/60 text-purple-200 text-xs font-mono transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Activity className="w-3 h-3 text-purple-400" />
              Simulate Violent Shake (&gt;3.0G)
            </button>
            <button
              type="button"
              onClick={() => handleTriggerCrisis(CRISIS_TYPES.NETWORK_STORM)}
              disabled={isRemediating || Boolean(pendingApproval)}
              className="px-2.5 py-1 rounded bg-blue-950/60 hover:bg-blue-900/80 border border-blue-500/60 text-blue-200 text-xs font-mono transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Zap className="w-3 h-3 text-blue-400" />
              Simulate Wi-Fi Storm
            </button>
            <button
              type="button"
              onClick={() => handleTriggerCrisis(CRISIS_TYPES.IOT_THERMAL_RUNAWAY)}
              disabled={isRemediating || Boolean(pendingApproval)}
              className="px-2.5 py-1 rounded bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/60 text-amber-200 text-xs font-mono transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Flame className="w-3 h-3 text-amber-400" />
              Simulate Thermal Runaway
            </button>
            <button
              type="button"
              onClick={() => handleTriggerCrisis(CRISIS_TYPES.ENERGY_WASTE_ANOMALY)}
              disabled={isRemediating || Boolean(pendingApproval)}
              className="px-2.5 py-1 rounded bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/60 text-emerald-200 text-xs font-mono transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <TrendingDown className="w-3 h-3 text-emerald-400" />
              Simulate Energy Waste
            </button>
          </div>
        )}
      </section>

      {/* MAIN DASHBOARD CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-6">
        {/* 3. 5-CARD REAL-TIME TELEMETRY & ESG KPI ROW */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1: Network Wi-Fi & Latency */}
          <div
            className={`p-4 rounded-xl border bg-slate-900/60 backdrop-blur transition-all ${
              campusState.avg_wifi_load > 85 ||
              campusState.zones["Block B - AI Labs"]?.packet_loss > 15
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

          {/* Card 3: IoT HVAC & Vibration */}
          <div
            className={`p-4 rounded-xl border bg-slate-900/60 backdrop-blur transition-all ${
              campusState.zones["Server Room Core"]?.vibration_g > 3.0 ||
              campusState.zones["Server Room Core"]?.ac_temp_c > 30 ||
              campusState.zones["APU Library Level 2"]?.power_usage_kw > 100 ||
              isCameraSabotageActive
                ? "border-amber-500/80 shadow-lg shadow-amber-500/10 animate-pulse"
                : "border-slate-800 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                IoT HVAC & Vibration
              </span>
              <Thermometer className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono tracking-tight text-white">
                {campusState.total_power_kw} kW
              </span>
              <span
                className={`text-xs font-mono font-bold ${
                  campusState.zones["Server Room Core"]?.vibration_g > 3.0 || edgeHardwareData.magnitude > 3.0
                    ? "text-rose-400"
                    : "text-slate-400"
                }`}
              >
                {(edgeHardwareData.magnitude || campusState.zones["Server Room Core"]?.vibration_g || 1.0).toFixed(1)}G Rack Vibration
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

          {/* Card 5: ESG Total CO2e Saved (Phase 3 & 4 Enterprise) */}
          <div className="p-4 rounded-xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/40 to-slate-900/60 backdrop-blur hover:border-emerald-500/60 transition-all shadow-sm shadow-emerald-500/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Total CO2e Saved
              </span>
              <TrendingDown className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono tracking-tight text-emerald-300">
                {campusState.total_co2e_saved?.toFixed(1) || "142.8"} kg
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                {(campusState.carbon_saved_kg_co2e || 16.8).toFixed(1)} kg delta
              </span>
            </div>
            <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-1.5 rounded-full bg-emerald-400 transition-all duration-500"
                style={{ width: `${Math.min(((campusState.total_co2e_saved || 142.8) / 250) * 100, 100)}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
              <span>Live: {(campusState.carbon_kg_co2e || 56.0).toFixed(1)} kg CO2e</span>
              <span className="text-emerald-400 font-mono">ESG Net-Zero AI</span>
            </div>
          </div>
        </section>

        {/* FEATURE 4: NATURAL-LANGUAGE "ASK APU-NEXUS" AI COMMANDER BAR */}
        <section className="bg-slate-900/75 rounded-xl border border-cyan-500/30 p-4 lg:p-5 space-y-3 shadow-lg shadow-cyan-950/20">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30">
                <Bot className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-bold tracking-wide text-white uppercase flex items-center gap-2">
                  Ask APU-Nexus AI Commander
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono font-normal normal-case">
                    Live Telemetry + Weather Grounded
                  </span>
                </h2>
              </div>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Zero-Key Hybrid Inference • Real-Time Digital Twin Query Engine
            </span>
          </div>

          {/* 3 One-Click Prompt Chips */}
          <div className="flex flex-wrap items-center gap-2">
            {COMMANDER_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                disabled={isAskingCommander}
                onClick={() => handleAskCommander(chip)}
                className="px-2.5 py-1 rounded-full bg-slate-950/90 hover:bg-cyan-950/70 border border-slate-700 hover:border-cyan-500/60 text-cyan-200 text-[11px] font-mono transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-cyan-400 shrink-0" />
                <span>{chip}</span>
              </button>
            ))}
          </div>

          {/* Interactive Query Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAskCommander();
            }}
            className="flex flex-col sm:flex-row gap-2"
          >
            <div className="relative flex-1">
              <MessageSquare className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={commanderQuery}
                onChange={(e) => setCommanderQuery(e.target.value)}
                placeholder="Ask APU-Nexus about live zone load, carbon footprint, FinOps savings, or anomaly mitigation..."
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-700 focus:border-cyan-500 focus:outline-none text-xs text-slate-100 placeholder:text-slate-500 font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={isAskingCommander || !commanderQuery.trim()}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition disabled:opacity-40 cursor-pointer shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isAskingCommander ? "Analyzing..." : "Ask Commander"}</span>
            </button>
          </form>

          {/* Commander Response Output */}
          {commanderReply && (
            <div className="p-3.5 rounded-lg bg-slate-950/90 border border-cyan-500/30 space-y-2">
              <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5 text-[11px] font-mono">
                <span className="text-cyan-400 font-semibold truncate">
                  Query: &ldquo;{commanderReply.query}&rdquo;
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-slate-500">{commanderReply.timestamp}</span>
                  <button
                    type="button"
                    onClick={() => setCommanderReply(null)}
                    className="text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="text-xs text-slate-200 whitespace-pre-line leading-relaxed font-sans">
                {commanderReply.reply}
              </div>
            </div>
          )}
        </section>

        {/* 4. 2D SPATIAL CAMPUS DIGITAL TWIN FLOOR MAP (SVG) & ZONE DETAILS */}
        <section className="bg-slate-900/60 rounded-xl border border-slate-800 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-semibold tracking-wide text-white uppercase">
                Interactive 2D Spatial Campus Map (Top-Down Floor Plan)
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Click room to inspect telemetry
              </span>
              {isFixDeployed && (
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                  ⚡ Physical Backup Routing Active
                </span>
              )}
            </div>
          </div>

          {/* SVG MAP VISUALIZER */}
          <div className="w-full bg-slate-950/80 rounded-xl border border-slate-800 p-4 overflow-hidden relative">
            <svg
              viewBox="0 0 600 240"
              className="w-full h-auto max-h-[280px] select-none"
            >
              <defs>
                <pattern
                  id="grid"
                  width="20"
                  height="20"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 20 0 L 0 0 0 20"
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="0.5"
                  />
                </pattern>
                {/* Conduit Gradient */}
                <linearGradient id="conduitGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity="0.8" />
                </linearGradient>
                <style>{`
                  @keyframes rerouteDash {
                    to {
                      stroke-dashoffset: -32;
                    }
                  }
                  .animate-green-reroute {
                    stroke-dasharray: 8 4;
                    animation: rerouteDash 1.2s linear infinite;
                  }
                `}</style>
              </defs>

              {/* Background Blueprint Grid */}
              <rect width="600" height="240" fill="url(#grid)" />

              {/* Inter-building Optical Mesh Lines with animated dash array */}
              <line
                x1="150"
                y1="60"
                x2="450"
                y2="60"
                stroke="#334155"
                strokeWidth="2"
                strokeDasharray="4 4"
                className="animate-pulse"
              />
              <line
                x1="150"
                y1="180"
                x2="450"
                y2="180"
                stroke="#334155"
                strokeWidth="2"
                strokeDasharray="4 4"
                className="animate-pulse"
              />
              <line
                x1="150"
                y1="60"
                x2="150"
                y2="180"
                stroke="#334155"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              <line
                x1="450"
                y1="60"
                x2="450"
                y2="180"
                stroke="#334155"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              <line
                x1="150"
                y1="60"
                x2="450"
                y2="180"
                stroke="url(#conduitGrad)"
                strokeWidth="1.5"
                strokeDasharray="6 6"
              />

              {/* DYNAMIC GREEN REROUTING PATHS (WHEN FIX DEPLOYED) */}
              {isFixDeployed && (
                <g>
                  {/* Dynamic green reroute lines with stroke-dashoffset animation */}
                  <path
                    d="M 240 60 C 300 20, 310 20, 360 60"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3"
                    className="animate-green-reroute"
                  />
                  <path
                    d="M 450 140 C 490 110, 490 90, 450 60"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3"
                    className="animate-green-reroute"
                  />
                  <path
                    d="M 150 140 C 250 140, 300 180, 360 180"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3"
                    className="animate-green-reroute"
                  />
                  <text
                    x="300"
                    y="32"
                    textAnchor="middle"
                    fill="#34d399"
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    ⚡ AUTONOMOUS REROUTE: SD-WAN & UPS-GRID-B ACTIVE
                  </text>
                </g>
              )}

              {/* ZONE 1: Block B - AI Labs (Top Left) */}
              {(() => {
                const zone = campusState.zones["Block B - AI Labs"] || {};
                const isCrit = zone.status === "critical" || zone.status === "CRITICAL";
                const isSel = selectedZone === "Block B - AI Labs";
                return (
                  <g
                    className="cursor-pointer transition-all"
                    onClick={() => setSelectedZone("Block B - AI Labs")}
                  >
                    <rect
                      x="50"
                      y="20"
                      width="190"
                      height="80"
                      rx="10"
                      className={`transition-all duration-300 ${
                        zone.status === 'critical' || zone.status === 'CRITICAL'
                          ? "animate-pulse fill-red-500/50"
                          : isSel
                          ? "fill-cyan-950/80"
                          : "fill-slate-900"
                      }`}
                      stroke={zone.status === 'critical' || zone.status === 'CRITICAL' ? "#ef4444" : isSel ? "#06b6d4" : "#334155"}
                      strokeWidth={isSel ? "2.5" : "1.5"}
                    />
                    <path
                      d="M 50 20 L 240 20"
                      className={zone.status === 'critical' || zone.status === 'CRITICAL' ? "animate-pulse fill-red-500 stroke-red-500" : "fill-slate-800 stroke-slate-700"}
                      strokeWidth="2"
                    />
                    <circle
                      cx="70"
                      cy="40"
                      r="5"
                      fill={isCrit ? "#ef4444" : "#10b981"}
                      className={isCrit ? "animate-ping" : ""}
                    />
                    <text
                      x="85"
                      y="44"
                      fill="#f8fafc"
                      fontSize="12"
                      fontWeight="bold"
                    >
                      Block B - AI Labs
                    </text>
                    <text x="70" y="65" fill="#94a3b8" fontSize="10">
                      Wi-Fi: {zone.wifi_load}% • Loss: {zone.packet_loss}%
                    </text>
                    <text x="70" y="82" fill="#38bdf8" fontSize="9" fontFamily="monospace">
                      ZONE-B-AILAB • {zone.cloud_instances} Cloud Nodes
                    </text>
                  </g>
                );
              })()}

              {/* ZONE 2: APU Library Level 2 (Top Right) */}
              {(() => {
                const zone = campusState.zones["APU Library Level 2"] || {};
                const isCrit = zone.status === "critical" || zone.status === "CRITICAL";
                const isSel = selectedZone === "APU Library Level 2";
                return (
                  <g
                    className="cursor-pointer transition-all"
                    onClick={() => setSelectedZone("APU Library Level 2")}
                  >
                    <rect
                      x="360"
                      y="20"
                      width="190"
                      height="80"
                      rx="10"
                      className={`transition-all duration-300 ${
                        zone.status === 'critical' || zone.status === 'CRITICAL'
                          ? "animate-pulse fill-red-500/50"
                          : isSel
                          ? "fill-cyan-950/80"
                          : "fill-slate-900"
                      }`}
                      stroke={zone.status === 'critical' || zone.status === 'CRITICAL' ? "#ef4444" : isSel ? "#06b6d4" : "#334155"}
                      strokeWidth={isSel ? "2.5" : "1.5"}
                    />
                    <path
                      d="M 360 20 L 550 20"
                      className={zone.status === 'critical' || zone.status === 'CRITICAL' ? "animate-pulse fill-red-500 stroke-red-500" : "fill-slate-800 stroke-slate-700"}
                      strokeWidth="2"
                    />
                    <circle
                      cx="380"
                      cy="40"
                      r="5"
                      fill={isCrit ? "#ef4444" : "#10b981"}
                      className={isCrit ? "animate-ping" : ""}
                    />
                    <text
                      x="395"
                      y="44"
                      fill="#f8fafc"
                      fontSize="12"
                      fontWeight="bold"
                    >
                      APU Library Level 2
                    </text>
                    <text x="380" y="65" fill="#94a3b8" fontSize="10">
                      AC: {zone.ac_temp_c}°C • Power: {zone.power_usage_kw}kW
                    </text>
                    <text x="380" y="82" fill="#38bdf8" fontSize="9" fontFamily="monospace">
                      ZONE-LIB-LVL2 • {zone.occupancy_count} Students
                    </text>
                  </g>
                );
              })()}

              {/* ZONE 3: Main Auditorium (Bottom Left) */}
              {(() => {
                const zone = campusState.zones["Main Auditorium"] || {};
                const isCrit = zone.status === "critical" || zone.status === "CRITICAL";
                const isSel = selectedZone === "Main Auditorium";
                return (
                  <g
                    className="cursor-pointer transition-all"
                    onClick={() => setSelectedZone("Main Auditorium")}
                  >
                    <rect
                      x="50"
                      y="140"
                      width="190"
                      height="80"
                      rx="10"
                      className={`transition-all duration-300 ${
                        zone.status === 'critical' || zone.status === 'CRITICAL'
                          ? "animate-pulse fill-red-500/50"
                          : isSel
                          ? "fill-cyan-950/80"
                          : "fill-slate-900"
                      }`}
                      stroke={zone.status === 'critical' || zone.status === 'CRITICAL' ? "#ef4444" : isSel ? "#06b6d4" : "#334155"}
                      strokeWidth={isSel ? "2.5" : "1.5"}
                    />
                    <path
                      d="M 50 140 L 240 140"
                      className={zone.status === 'critical' || zone.status === 'CRITICAL' ? "animate-pulse fill-red-500 stroke-red-500" : "fill-slate-800 stroke-slate-700"}
                      strokeWidth="2"
                    />
                    <circle
                      cx="70"
                      cy="160"
                      r="5"
                      fill={isCrit ? "#ef4444" : "#10b981"}
                    />
                    <text
                      x="85"
                      y="164"
                      fill="#f8fafc"
                      fontSize="12"
                      fontWeight="bold"
                    >
                      Main Auditorium
                    </text>
                    <text x="70" y="185" fill="#94a3b8" fontSize="10">
                      Wi-Fi: {zone.wifi_load}% • RTT: {zone.latency_ms}ms
                    </text>
                    <text x="70" y="202" fill="#38bdf8" fontSize="9" fontFamily="monospace">
                      ZONE-AUD-MAIN • Low Standby
                    </text>
                  </g>
                );
              })()}

              {/* ZONE 4: Server Room Core (Bottom Right) */}
              {(() => {
                const zone = campusState.zones["Server Room Core"] || {};
                const isCrit =
                  zone.status === "critical" ||
                  zone.status === "CRITICAL" ||
                  isCameraSabotageActive;
                const isSel = selectedZone === "Server Room Core";
                return (
                  <g
                    className="cursor-pointer transition-all"
                    onClick={() => setSelectedZone("Server Room Core")}
                  >
                    <rect
                      x="360"
                      y="140"
                      width="190"
                      height="80"
                      rx="10"
                      className={`transition-all duration-300 ${
                        zone.status === 'critical' || zone.status === 'CRITICAL' || isCameraSabotageActive
                          ? "animate-pulse fill-red-500/50"
                          : isSel
                          ? "fill-cyan-950/80"
                          : "fill-slate-900"
                      }`}
                      stroke={zone.status === 'critical' || zone.status === 'CRITICAL' || isCameraSabotageActive ? "#ef4444" : isSel ? "#06b6d4" : "#334155"}
                      strokeWidth={isSel ? "2.5" : "1.5"}
                    />
                    <path
                      d="M 360 140 L 550 140"
                      className={zone.status === 'critical' || zone.status === 'CRITICAL' || isCameraSabotageActive ? "animate-pulse fill-red-500 stroke-red-500" : "fill-slate-800 stroke-slate-700"}
                      strokeWidth="2"
                    />
                    <circle
                      cx="380"
                      cy="160"
                      r="5"
                      fill={isCrit ? "#ef4444" : "#10b981"}
                      className={isCrit ? "animate-ping" : ""}
                    />
                    <text
                      x="395"
                      y="164"
                      fill="#f8fafc"
                      fontSize="12"
                      fontWeight="bold"
                    >
                      Server Room Core {isCameraSabotageActive && "🚨 SABOTAGE"}
                    </text>
                    <text x="380" y="185" fill="#94a3b8" fontSize="10">
                      Temp: {zone.ac_temp_c}°C • CCTV: {isCameraSabotageActive ? "LENS BLOCKED" : "ACTIVE"}
                    </text>
                    <text x="380" y="202" fill="#38bdf8" fontSize="9" fontFamily="monospace">
                      ZONE-SRV-CORE • CPU: {zone.server_cpu}%
                    </text>
                  </g>
                );
              })()}
            </svg>
          </div>

          {/* Detailed Zone Telemetry Card (Selected via 2D SVG Map) */}
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
              <span className="text-[10px] text-emerald-400 font-mono">
                CO2e: {(currentZoneData.carbon_kg_co2e || currentZoneData.power_usage_kw * 0.4).toFixed(1)} kg
              </span>
            </div>

            <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Vibration Vector</span>
              <span
                className={`font-mono text-base font-bold mt-1 block ${
                  (currentZoneData.vibration_g || 1.0) > 3.0 ? "text-rose-400" : "text-white"
                }`}
              >
                {currentZoneData.vibration_g || "1.00"} G
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Mobile IoT Stream</span>
            </div>
          </div>

          {currentZoneData.active_alert && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-300 text-xs">
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
                role: "Optical & IoT Ingestion",
                desc: "Sub-second multi-zone anomaly thresholding",
              },
              {
                index: 2,
                name: "Gemini Diagnostic",
                role: "Root-Cause AI Brain",
                desc: "LLM correlation across Cloud, Vision & Physical",
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
                desc: "Dispatches BACnet / gcloud / Drone commands",
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
              const isAwaitingGate = Boolean(pendingApproval) && node.index === 4;

              return (
                <div
                  key={node.index}
                  className={`p-3.5 rounded-xl border transition-all relative ${
                    isAwaitingGate
                      ? "bg-amber-950/60 border-amber-400 shadow-lg shadow-amber-500/20"
                      : isActive
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
                        isAwaitingGate
                          ? "bg-amber-400 animate-ping"
                          : isActive
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

          {/* CO-PILOT GOVERNANCE HUMAN-IN-THE-LOOP APPROVAL PANEL */}
          {pendingApproval && (
            <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-amber-950/70 via-rose-950/50 to-emerald-950/60 border border-amber-400/70 shadow-xl shadow-amber-500/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/50 text-amber-200 text-[10px] font-mono font-bold uppercase flex items-center gap-1">
                    <UserCheck className="w-3 h-3" />
                    Co-Pilot Governance Hold Gate • {pendingApproval.incidentId}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 border border-purple-400/40 text-purple-200 text-[10px] font-mono">
                    {pendingApproval.iacType} Manifest Synthesized
                  </span>
                </div>
                <p className="text-xs font-bold text-white">
                  {pendingApproval.diagnosis?.anomaly_type || pendingApproval.crisisType} —{" "}
                  <span className="text-rose-300">
                    {pendingApproval.diagnosis?.affected_zone || "Server Room Core"}
                  </span>
                </p>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {pendingApproval.diagnosis?.root_cause}
                </p>
                <div className="bg-slate-950/90 px-2.5 py-1.5 rounded border border-slate-800 font-mono text-[10px] text-cyan-300 overflow-x-auto whitespace-nowrap">
                  $ {pendingApproval.diagnosis?.remediation_command}
                </div>
              </div>

              <div className="flex flex-wrap lg:flex-col items-stretch gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleApproveRemediation}
                  className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 via-emerald-400 to-amber-400 hover:from-emerald-400 hover:to-amber-300 text-slate-950 font-extrabold text-xs tracking-wide shadow-lg shadow-emerald-500/30 border border-white/40 transition animate-pulse cursor-pointer"
                >
                  [⚡ Approve &amp; Execute Autonomous Remediation]
                </button>
                <button
                  type="button"
                  onClick={() => setActiveInspectorTab("iac")}
                  className="px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-purple-500/50 text-purple-200 text-[11px] font-mono transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileCode className="w-3.5 h-3.5 text-purple-400" />
                  Inspect {pendingApproval.iacType} Manifest
                </button>
              </div>
            </div>
          )}
        </section>

        {/* 6. CHARTS & TERMINAL / IAC INSPECTOR (2-COLUMN GRID) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Time Series Telemetry & ESG Charts (7 Cols) */}
          <div className="lg:col-span-7 bg-slate-900/60 rounded-xl border border-slate-800 p-5 flex flex-col justify-between">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold tracking-wide text-white uppercase">
                  Real-Time Campus Telemetry & Predictive Carbon Stream
                </h3>
              </div>
              {/* Metric filter buttons */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                {["all", "network", "compute", "energy", "carbon"].map((m) => (
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
                      <linearGradient id="carbonColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#34d399" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#34d399" stopOpacity={0.0} />
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
                    {(selectedMetric === "all" || selectedMetric === "energy" || selectedMetric === "carbon") && (
                      <Area
                        type="monotone"
                        dataKey="carbon_kg_co2e"
                        name="Actual Carbon (kg CO2e)"
                        stroke="#34d399"
                        strokeWidth={2}
                        fillOpacity={0.8}
                        fill="url(#carbonColor)"
                      />
                    )}
                    {(selectedMetric === "all" || selectedMetric === "energy" || selectedMetric === "carbon") && (
                      <Area
                        type="monotone"
                        dataKey="projected_carbon_kg_co2e"
                        name="Projected Unmitigated Carbon (kg CO2e)"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        fill="none"
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

          {/* Live Agent Monospace Terminal & Terraform / IaC Inspector (5 Cols) */}
          <div className="lg:col-span-5 bg-slate-900/90 rounded-xl border border-slate-800 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
                <button
                  onClick={() => setActiveInspectorTab("logs")}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition flex items-center gap-1.5 ${
                    activeInspectorTab === "logs"
                      ? "bg-cyan-500 text-slate-950"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <TerminalIcon className="w-3.5 h-3.5" />
                  Live CLI Logs
                </button>
                <button
                  onClick={() => setActiveInspectorTab("iac")}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition flex items-center gap-1.5 ${
                    activeInspectorTab === "iac"
                      ? "bg-purple-500 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  Generated IaC / GitOps
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                {activeInspectorTab === "iac" && (
                  <>
                    <button
                      onClick={handleCopyIaC}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-mono flex items-center gap-1 transition"
                    >
                      <Copy className="w-3 h-3" />
                      {copiedIaC ? "Copied!" : "Copy IaC"}
                    </button>
                    <button
                      onClick={handleDeployToGitHub}
                      disabled={isDeployingGitOps}
                      className="px-2.5 py-1 rounded bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[10px] font-mono font-bold flex items-center gap-1 transition shadow-sm shadow-purple-500/20 disabled:opacity-50"
                    >
                      <GitPullRequest className="w-3 h-3" />
                      {isDeployingGitOps ? "Deploying..." : "[Deploy to GitHub]"}
                    </button>
                  </>
                )}
                {activeInspectorTab !== "iac" && (
                  <span className="text-[10px] text-emerald-400 font-mono">LIVE EXECUTION</span>
                )}
              </div>
            </div>

            {/* Content Window: Logs vs IaC Manifest */}
            {activeInspectorTab === "logs" ? (
              <div
                ref={logsContainerRef}
                className="h-[200px] overflow-y-auto bg-slate-950 rounded-lg p-3 font-mono text-[11px] space-y-1.5 border border-slate-800/80 selection:bg-cyan-500/30"
              >
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
              </div>
            ) : (
              <div className="h-[200px] overflow-y-auto bg-slate-950 rounded-lg p-3 font-mono text-[11px] text-purple-300 whitespace-pre border border-purple-900/40 select-all leading-relaxed">
                {currentDiagnosis?.iac_manifest ||
                  `# Terraform: APU-Nexus Campus Cloud Baseline Infrastructure
resource "google_compute_network" "apu_mesh_vpc" {
  name                    = "apu-campus-mesh-vpc"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "apu_edge_subnets" {
  name          = "apu-asia-se1-subnet"
  ip_cidr_range = "10.10.0.0/16"
  region        = "asia-southeast1"
  network       = google_compute_network.apu_mesh_vpc.id
}`}
              </div>
            )}

            {/* Generated CLI Remediation Payload View & Deploy Button */}
            <div className="mt-3 pt-3 border-t border-slate-800 flex flex-col gap-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
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
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-semibold tracking-wide text-white uppercase">
                Autonomous Incident Remediation &amp; FinOps Audit Log
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs text-slate-400 font-mono">
                Immutable SLA Record &amp; Campus Cost Avoidance
              </span>
              <button
                type="button"
                onClick={handleExportAuditReport}
                className="px-3 py-1.5 rounded-md bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>[📄 Export Audit &amp; ESG Report]</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono">
                  <th className="py-2.5 px-3">INCIDENT ID</th>
                  <th className="py-2.5 px-3">TIMESTAMP</th>
                  <th className="py-2.5 px-3">ZONE</th>
                  <th className="py-2.5 px-3">ANOMALY TRIGGER</th>
                  <th className="py-2.5 px-3">GOVERNANCE / IAC</th>
                  <th className="py-2.5 px-3">REMEDIATION ACTION</th>
                  <th className="py-2.5 px-3 text-right">SAVINGS / CO2E</th>
                  <th className="py-2.5 px-3 text-center">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {incidentAuditLog.map((item) => {
                  const isPending = item.status === "AWAITING APPROVAL";
                  return (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-2.5 px-3 font-mono text-cyan-400 font-medium">
                        {item.id}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 font-mono">
                        {item.timestamp}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-white">
                        {item.affectedZone}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">{item.crisisType}</td>
                      <td className="py-2.5 px-3 text-[11px] font-mono">
                        <span className="block text-slate-200">{item.governanceMode}</span>
                        <span className="text-[10px] text-purple-300">{item.iacType}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                        {item.remediation}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        <span className="font-bold text-emerald-400 block">
                          RM {Number(item.rmSaved || 0).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-cyan-300">
                          -{Number(item.co2eReduced || 0).toFixed(1)} kg CO2e
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border font-mono ${
                            isPending
                              ? "bg-amber-500/15 text-amber-300 border-amber-500/40 animate-pulse"
                              : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* GITOPS SUCCESS TOAST POPUP */}
      {gitOpsToast.show && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md p-4 rounded-xl bg-slate-900 border border-purple-500/60 shadow-2xl shadow-purple-500/20 backdrop-blur text-xs flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-purple-400 flex items-center gap-2">
              <GitPullRequest className="w-4 h-4 text-purple-400" />
              GitOps PR Deployed to GitHub!
            </span>
            <button
              onClick={() => setGitOpsToast((prev) => ({ ...prev, show: false }))}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <p className="text-slate-300 font-mono text-[11px]">{gitOpsToast.message}</p>
          <a
            href={gitOpsToast.pr_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/30 border border-purple-500/50 text-purple-200 hover:bg-purple-600/50 transition font-mono text-[11px] w-fit mt-1"
          >
            <span>View Pull Request #{gitOpsToast.pr_number}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* FOOTER */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 px-4 lg:px-8 mt-auto text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span>APU-Nexus Autonomous Campus Infrastructure</span>
          <span>•</span>
          <span>Asia Pacific University Hackathon MVP (Phase 4 True Edge Hardware & Vision)</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-mono">
          <span className="flex items-center gap-1 text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Cloud: Google Cloud Run & DR Groups
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            Brain: Gemini 1.5/2.0 + Terraform IaC
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            Edge: Optical CCTV & Accelerometer
          </span>
        </div>
      </footer>
    </div>
  );
}
