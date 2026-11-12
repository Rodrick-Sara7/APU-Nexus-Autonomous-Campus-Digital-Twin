// ==============================================================================
// APU-Nexus: Multi-Agent Gemini AI Brain
// 5-Agent Orchestration Pipeline:
// 1. Telemetry Agent -> 2. Gemini Diagnostic Agent -> 3. Resolution Architect Agent
// -> 4. Cloud Execution Agent -> 5. Audit & FinOps Agent
// Implements Graceful Hybrid Dual-Mode (Live Gemini 1.5/2.0 API or Deterministic Multi-Agent Heuristics)
// Includes Terraform / Kubernetes Infrastructure-as-Code (IaC) Synthesis (Phase 2, 3 & 4)
// Includes Discord Webhook Alerts & Real-Time Rich Embed Telemetry
// Includes Edge Vision Security Sabotage & Camera Tampering (Phase 4)
// ==============================================================================

import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Dispatches color-coded Discord Rich Embed alerts for crisis detection and autonomous resolution
 * @param {Object} crisisData - Telemetry or diagnosis data
 * @param {Object} resolutionData - Optional resolution data (green embed if provided, red if detection)
 * @returns {Promise<Object>}
 */
export async function sendDiscordAlert(crisisData, resolutionData = null) {
  const webhookUrl =
    process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_URL ||
    process.env.DISCORD_WEBHOOK_URL ||
    "";

  const isResolution = Boolean(resolutionData);
  // Color: Red for critical detection (0xef4444 = 15679796), Green for resolution (0x10b981 = 1096065)
  const color = isResolution ? 0x10b981 : 0xef4444;

  const isCameraSabotage =
    crisisData?.type === "CAMERA_TAMPERING" ||
    crisisData?.anomaly_type?.includes("Camera") ||
    crisisData?.root_cause?.includes("Camera") ||
    crisisData?.active_crisis === "CAMERA_TAMPERING";

  let title = isResolution
    ? `✅ [APU-Nexus Resolved]: ${crisisData?.anomaly_type || "Incident Remediated"}`
    : `🚨 [APU-Nexus Alert]: ${crisisData?.anomaly_type || "Critical Anomaly Detected"}`;

  if (!isResolution && isCameraSabotage) {
    title = "🚨 [APU-Nexus Alert]: Camera Lens Obscured / Sabotage Detected";
  }

  const fields = [
    {
      name: "📍 Affected Zone",
      value: crisisData?.affected_zone || crisisData?.zone || "Server Room Core",
      inline: true,
    },
    {
      name: "⚡ Status",
      value: isResolution ? "REMEDIATED" : (crisisData?.status?.toUpperCase() || "CRITICAL"),
      inline: true,
    },
    {
      name: "🎯 Root Cause",
      value: isCameraSabotage && !isResolution
        ? "Camera Lens Obscured / Sabotage Detected: Optical luminance dropped below threshold (<15/255) on surveillance node CCTV-SRV-01. Physical security breach in progress."
        : String(crisisData?.root_cause || "Anomaly detected in campus telemetry").substring(0, 1024),
    },
  ];

  if (isResolution && resolutionData) {
    fields.push(
      {
        name: "🛠️ Cloud & Physical Remediation",
        value: String(resolutionData?.cloud_action_taken || "Autonomous fix deployed").substring(0, 1024),
      },
      {
        name: "💰 FinOps Cost Avoidance",
        value: `RM ${resolutionData?.estimated_savings_myr || 680}.00 / month`,
        inline: true,
      }
    );

    if (resolutionData?.iac_manifest) {
      const codeSnippet = resolutionData.iac_manifest.split("\n").slice(0, 12).join("\n");
      fields.push({
        name: "📄 Synthesized IaC Snippet",
        value: `\`\`\`hcl\n${codeSnippet}\n\`\`\``.substring(0, 1024),
      });
    }
  }

  const payload = {
    content: isCameraSabotage
      ? "@here 🚨 **APU-Nexus Alert: Camera Lens Obscured / Sabotage Detected in Server Room Core!**"
      : "@here 🚨 **APU-Nexus Autonomous Incident Sentinel**",
    embeds: [
      {
        title,
        color,
        fields,
        timestamp: new Date().toISOString(),
        footer: {
          text: "APU-Nexus Autonomous Campus Digital Twin • Phase 4 True Edge Production",
        },
      },
    ],
  };

  if (!webhookUrl) {
    return { success: false, reason: "No webhook URL configured", payload };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return { success: response.ok, status: response.status, payload };
  } catch (err) {
    console.warn("[APU-Nexus Discord] Webhook delivery failed:", err.message);
    return { success: false, error: err.message, payload };
  }
}

/**
 * Builds deterministic multi-agent root-cause diagnosis fallback
 */
function buildDeterministicMultiAgentDiagnosis(telemetrySnapshot, crisisType) {
  const now = new Date().toISOString().substring(11, 19);

  // Detect crisis from explicit argument or telemetry inspection
  const effectiveCrisis =
    crisisType ||
    (telemetrySnapshot?.active_crisis) ||
    (telemetrySnapshot?.type === "CAMERA_TAMPERING" ? "CAMERA_TAMPERING" : null) ||
    (telemetrySnapshot?.camera_tampered ? "CAMERA_TAMPERING" : null) ||
    (telemetrySnapshot?.zones?.["Server Room Core"]?.vibration_g > 3.0 ? "SEISMIC_ANOMALY" : null) ||
    (telemetrySnapshot?.zones?.["Block B - AI Labs"]?.wifi_load > 85 ? "NETWORK_STORM" : null) ||
    (telemetrySnapshot?.zones?.["Server Room Core"]?.ac_temp_c > 30 ? "IOT_THERMAL_RUNAWAY" : null) ||
    (telemetrySnapshot?.zones?.["APU Library Level 2"]?.power_usage_kw > 100 ? "ENERGY_WASTE_ANOMALY" : null) ||
    "NOMINAL";

  if (effectiveCrisis === "CAMERA_TAMPERING" || effectiveCrisis === "SECURITY_BREACH") {
    return {
      status: "critical",
      anomaly_type: "Camera Lens Obscured / Sabotage Detected",
      affected_zone: "Server Room Core",
      root_cause:
        "Camera Lens Obscured / Sabotage Detected on edge surveillance node CCTV-SRV-01 in Server Room Core. Optical luminance dropped below threshold (<15/255). Physical security breach in progress.",
      confidence_score: 0.99,
      agent_chain: [
        {
          agent: "1. Telemetry Ingestion Agent",
          thought:
            "Vision edge sensor CCTV-SRV-01 registered sudden total optical black-level (<15/255 luminance) indicating intentional physical occlusion / lens tampering.",
          timestamp: `${now} +000ms`,
        },
        {
          agent: "2. Gemini Diagnostic Agent",
          thought:
            "Correlated optical telemetry drop with PIR perimeter triggers. Confirmed physical security breach: Camera lens obscured / sabotage detected in Server Room Core.",
          timestamp: `${now} +160ms`,
        },
        {
          agent: "3. Resolution Architect Agent",
          thought:
            "Synthesized emergency physical lockdown IaC manifest: Lock down magnetic doors and dispatch security drone to quarantine Server Room Core perimeter.",
          timestamp: `${now} +370ms`,
        },
        {
          agent: "4. Cloud Execution Agent",
          thought:
            "Actuating BACnet maglocks to sealed state and routing APU Autonomous Security Drone-04 to Server Room Core perimeter door.",
          timestamp: `${now} +590ms`,
        },
        {
          agent: "5. Audit & FinOps Agent",
          thought:
            "Perimeter breach neutralized. Secured campus core data center and avoided intellectual property loss. Projected asset loss avoidance: RM 2,400.00.",
          timestamp: `${now} +790ms`,
        },
      ],
      remediation_command:
        "bacnet-cli door-lock --facility=SRV-CORE --override=emergency-lockdown && drone-dispatch --waypoint=SRV-CORE-DOOR-A --mode=intercept",
      cloud_action_taken:
        "Lock down magnetic doors and dispatch security drone to Server Room Core perimeter.",
      estimated_savings_myr: 2400,
      iac_manifest: `\`\`\`terraform
# Terraform: Lock down magnetic doors and dispatch security drone
resource "google_cloudiot_device" "srv_core_maglocks" {
  name     = "srv-core-maglock-controller"
  registry = "apu-physical-security-registry"

  metadata = {
    door_state          = "EMERGENCY_LOCKDOWN"
    magnetic_locks      = "ENGAGED"
    biometric_override  = "REVOKED"
    security_drone_id   = "APU-DRONE-SENTINEL-04"
    drone_action        = "DISPATCH_AND_INTERCEPT"
    drone_waypoint      = "SRV-CORE-PERIMETER-DOOR"
  }
}

resource "google_compute_security_policy" "physical_sabotage_quarantine" {
  name        = "cctv-sabotage-perimeter-quarantine"
  description = "Lock down magnetic doors and dispatch security drone for perimeter security"
}
\`\`\``,
    };
  }

  if (effectiveCrisis === "SEISMIC_ANOMALY") {
    return {
      status: "critical",
      anomaly_type: "Seismic Shock & High-Voltage Grid Disturbance",
      affected_zone: "Server Room Core",
      root_cause:
        "Critical 8.4G seismic/structural vibration detected via Mobile IoT Accelerometer Telemetry in Server Room Core; high risk of rack PSU failure and transformer short-circuit.",
      confidence_score: 0.99,
      agent_chain: [
        {
          agent: "1. Telemetry Ingestion Agent",
          thought:
            "Mobile IoT edge sensor registered severe 8.4G structural vibration spike with concurrent 162kW grid surge in Server Room Core substation.",
          timestamp: `${now} +000ms`,
        },
        {
          agent: "2. Gemini Diagnostic Agent",
          thought:
            "Cross-correlated physical accelerometer G-force vector with rack vibration curves. Diagnosed high risk of mechanical blade dislocation and transformer arcing.",
          timestamp: `${now} +170ms`,
        },
        {
          agent: "3. Resolution Architect Agent",
          thought:
            "Synthesized emergency power isolation protocol: Trip high-voltage substation breaker SRV-CORE-HV1, transfer load to UPS-GRID-B, and dispatch DR cloud instance failover.",
          timestamp: `${now} +380ms`,
        },
        {
          agent: "4. Cloud Execution Agent",
          thought:
            "Executing gcloud compute failover cluster replacement in asia-southeast1-b and dispatching BACnet actuator isolate breaker commands.",
          timestamp: `${now} +610ms`,
        },
        {
          agent: "5. Audit & FinOps Agent",
          thought:
            "Physical infrastructure secured. Prevented transformer blowout and enterprise hardware loss. Projected catastrophic damage avoidance: RM 1,850.00.",
          timestamp: `${now} +800ms`,
        },
      ],
      remediation_command:
        "gcloud compute instance-groups managed rolling-action replace apu-core-cluster --zone=asia-southeast1-b && bacnet-cli breaker-isolate --substation=SRV-CORE-HV1 --reroute=UPS-GRID-B",
      cloud_action_taken:
        "Isolated high-voltage substation breaker SRV-CORE-HV1, engaged redundant UPS grid, and triggered automated multi-region DR workload evacuation to GCP asia-southeast1-b.",
      estimated_savings_myr: 1850,
      iac_manifest: `\`\`\`terraform
# Terraform: Emergency Regional Disaster Recovery Failover
resource "google_compute_region_instance_group_manager" "apu_dr_cluster" {
  name               = "apu-core-dr-asia-se1-b"
  base_instance_name = "apu-core-dr"
  region             = "asia-southeast1"
  target_size        = 6

  version {
    instance_template = google_compute_instance_template.apu_core_template.id
  }

  auto_healing_policies {
    health_check      = google_compute_health_check.seismic_health_check.id
    initial_delay_sec = 10
  }
}

resource "google_compute_firewall" "isolate_seismic_substation" {
  name    = "isolate-srv-core-hv1-breaker"
  network = "apu-campus-mesh-vpc"

  deny {
    protocol = "all"
  }

  target_tags = ["srv-core-hv1", "rack-unstable-power"]
}
\`\`\``,
    };
  }

  if (effectiveCrisis === "NETWORK_STORM") {
    return {
      status: "critical",
      anomaly_type: "Network Storm & Cloud Compute Saturation",
      affected_zone: "Block B - AI Labs",
      root_cause:
        "L3 broadcast packet storm coupled with flash AI laboratory benchmark traffic exceeding AP-102 throughput thresholds by 240%, starving containerized workloads and inducing cascade queue backpressure on Cloud Run ingress.",
      confidence_score: 0.98,
      agent_chain: [
        {
          agent: "1. Telemetry Ingestion Agent",
          thought:
            "Flagged severe telemetry deviation in Block B: Wi-Fi load @ 99.0%, packet loss spiked to 18.0%, round-trip latency at 420ms, and edge CPU at 96.0%.",
          timestamp: `${now} +000ms`,
        },
        {
          agent: "2. Gemini Diagnostic Agent",
          thought:
            "Correlated network ingress telemetry with Google Cloud Run service apu-portal container utilization. Diagnosed layer-2 broadcast storm compounding severe cloud replica starvation.",
          timestamp: `${now} +180ms`,
        },
        {
          agent: "3. Resolution Architect Agent",
          thought:
            "Formulated dual-tier remediation plan: Dynamically re-route local VLAN traffic via SD-WAN backup trunk, and scale Cloud Run minimum instances from 2 to 8 in asia-southeast1.",
          timestamp: `${now} +390ms`,
        },
        {
          agent: "4. Cloud Execution Agent",
          thought:
            "Executing gcloud command to scale Cloud Run service and dispatching SDN openflow rule to isolate rogue broadcast MAC addresses.",
          timestamp: `${now} +620ms`,
        },
        {
          agent: "5. Audit & FinOps Agent",
          thought:
            "Remediation validated. Prevented estimated 45-minute campus network outage. Projected operational and SLA penalty savings: RM 680.00.",
          timestamp: `${now} +790ms`,
        },
      ],
      remediation_command:
        "gcloud run services update apu-portal --min-instances=8 --max-instances=16 --region=asia-southeast1 && apu-sdn-ctl vlan isolate --port=eth4/2 --divert=trunk-backup",
      cloud_action_taken:
        "Scaled Cloud Run replicas 2 -> 8; Activated SD-WAN dynamic traffic rerouting and applied Cloud Armor rate-limiting.",
      estimated_savings_myr: 680,
      iac_manifest: `\`\`\`terraform
# Terraform: Google Cloud Run Auto-Scaler & Cloud Armor Policy
resource "google_cloudrun_v2_service" "apu_portal_scaler" {
  name     = "apu-portal"
  location = "asia-southeast1"

  template {
    scaling {
      min_instance_count = 8
      max_instance_count = 16
    }
    containers {
      image = "asia-southeast1-docker.pkg.dev/apu-nexus/portal:latest"
      resources {
        limits = { cpu = "4", memory = "8Gi" }
      }
    }
  }
}

resource "google_compute_security_policy" "block_b_rate_limit" {
  name = "sdn-vlan-storm-mitigation"
  rule {
    action   = "rate_based_ban"
    priority = 1000
    match {
      versioned_expr = "SRC_IPS_V1"
      config { src_ip_ranges = ["10.24.102.0/24"] }
    }
  }
}
\`\`\``,
    };
  }

  if (effectiveCrisis === "IOT_THERMAL_RUNAWAY") {
    return {
      status: "critical",
      anomaly_type: "IoT HVAC Chiller Fault & Thermal Runaway",
      affected_zone: "Server Room Core",
      root_cause:
        "Primary Inverter Chiller #2 thermal safety trip triggered ambient server rack temperature rise to 34.5°C, approaching thermal throttling threshold for high-density APU AI Research rack #4.",
      confidence_score: 0.97,
      agent_chain: [
        {
          agent: "1. Telemetry Ingestion Agent",
          thought:
            "BACnet environmental sensors in Server Room Core triggered amber alert: Ambient temperature reached 34.5°C, power draw at 98.0kW.",
          timestamp: `${now} +000ms`,
        },
        {
          agent: "2. Gemini Diagnostic Agent",
          thought:
            "Analyzed HVAC telemetry against historical thermal cooling curves. Diagnosed compressor lock in Chiller #2 with zero airflow on secondary ventilation dampers.",
          timestamp: `${now} +210ms`,
        },
        {
          agent: "3. Resolution Architect Agent",
          thought:
            "Synthesized emergency cooling protocol: Fire BACnet command to auxiliary chiller unit #1, cycle ventilation fans to 100%, and shift non-essential compute to Google Cloud Vertex spot instances.",
          timestamp: `${now} +420ms`,
        },
        {
          agent: "4. Cloud Execution Agent",
          thought:
            "Dispatched BACnet actuator commands to chiller subsystem and activated dynamic workload thermal migration.",
          timestamp: `${now} +640ms`,
        },
        {
          agent: "5. Audit & FinOps Agent",
          thought:
            "Server rack temperature returning to nominal 21.5°C. Averted server thermal damage and hardware downtime. Projected savings: RM 1,250.00.",
          timestamp: `${now} +800ms`,
        },
      ],
      remediation_command:
        "bacnet-cli set-point --unit=CHILLER-AUX-02 --temp=18.0C --fan=100 && ipmi-chassis-power --profile=eco-balance --racks=SRV-RACK-04",
      cloud_action_taken:
        "Auxiliary BACnet chiller activated; non-critical batch training jobs offloaded to Google Cloud Vertex AI instances.",
      estimated_savings_myr: 1250,
      iac_manifest: `\`\`\`yaml
# Kubernetes: Workload Evacuation & Thermal Pod Disruption
apiVersion: apps/v1
kind: Deployment
metadata:
  name: apu-ai-batch-workloads
  namespace: apu-compute
spec:
  replicas: 2
  template:
    spec:
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
            - matchExpressions:
              - key: cloud.google.com/gke-spot
                operator: In
                values: ["true"]
      containers:
      - name: batch-inference
        image: gcr.io/apu-nexus/vertex-spot-worker:v2
        resources:
          requests: { cpu: "2", memory: "4Gi" }
\`\`\``,
    };
  }

  if (effectiveCrisis === "ENERGY_WASTE_ANOMALY") {
    return {
      status: "warning",
      anomaly_type: "Smart-Campus Energy Inefficiency Anomaly",
      affected_zone: "APU Library Level 2",
      root_cause:
        "Full 145.0 kW commercial HVAC cooling and high-lux lighting array operating at maximum chill (17.0°C) despite PIR and camera occupancy detection reporting only 3 active occupants during off-peak hours.",
      confidence_score: 0.95,
      agent_chain: [
        {
          agent: "1. Telemetry Ingestion Agent",
          thought:
            "Identified extreme divergence between Library Level 2 occupancy (3 students) and power consumption (145.0 kW at 17.0°C AC temp).",
          timestamp: `${now} +000ms`,
        },
        {
          agent: "2. Gemini Diagnostic Agent",
          thought:
            "Heuristic evaluation indicates building management schedule override left from previous university event, causing severe thermal and electrical energy waste.",
          timestamp: `${now} +190ms`,
        },
        {
          agent: "3. Resolution Architect Agent",
          thought:
            "Formulated occupancy-adaptive remediation: Re-tune smart VRF HVAC to Eco-Comfort 23.5°C and reduce DALI zone lighting brightness to 30%.",
          timestamp: `${now} +380ms`,
        },
        {
          agent: "4. Cloud Execution Agent",
          thought:
            "Sent IoT MQTT payload to APU Smart Building Gateway: Set HVAC temp to 23.5°C and dimmed perimeter lighting zones.",
          timestamp: `${now} +590ms`,
        },
        {
          agent: "5. Audit & FinOps Agent",
          thought:
            "Energy consumption dropped from 145.0 kW to 21.0 kW. Carbon footprint reduced by 84 kg CO2e. Projected monthly electrical savings: RM 820.00.",
          timestamp: `${now} +780ms`,
        },
      ],
      remediation_command:
        "iot-bacnet-hvac --zone=LIB-LVL2 --set-temp=23.5C --mode=eco && dali-lighting-ctl --zone=LIB-LVL2 --dim=30",
      cloud_action_taken:
        "Calibrated smart VRF thermostats to Eco-Comfort (23.5°C) and adjusted DALI lighting controllers to low-occupancy mode.",
      estimated_savings_myr: 820,
      iac_manifest: `\`\`\`terraform
# Terraform: Smart Building VRF & Lighting Energy Optimization
resource "google_cloudiot_device" "lib_lvl2_vrf" {
  name     = "apu-lib-lvl2-thermostat"
  registry = "apu-campus-iot-registry"

  gateway_config {
    gateway_type = "MASTER"
  }

  metadata = {
    target_temperature_c = "23.5"
    hvac_mode            = "eco_occupancy"
    dali_lighting_dim    = "30"
    pir_sensor_override  = "active"
  }
}

resource "google_pubsub_topic" "energy_anomaly_telemetry" {
  name = "apu-energy-optimization-events"
}
\`\`\``,
    };
  }

  // Nominal / Remediated State
  return {
    status: telemetrySnapshot?.overall_status === "REMEDIATED" ? "remediated" : "stable",
    anomaly_type: "Nominal Operations & Autonomous Equilibrium",
    affected_zone: "All APU Zones",
    root_cause:
      "All campus IoT nodes, SDN gateways, and Google Cloud Run infrastructure are functioning within nominal SLA thresholds (Uptime: 99.98%).",
    confidence_score: 0.99,
    agent_chain: [
      {
        agent: "1. Telemetry Ingestion Agent",
        thought:
          "Continuous telemetry ingestion active across 4 campus zones. Network, compute, and HVAC metrics are within standard operating tolerances.",
        timestamp: `${now} +000ms`,
      },
      {
        agent: "2. Gemini Diagnostic Agent",
        thought:
          "Zero critical anomalies detected. Multi-zone variance index is nominal (< 3.2%).",
        timestamp: `${now} +150ms`,
      },
      {
        agent: "3. Resolution Architect Agent",
        thought:
          "All auto-healing triggers are primed in standby mode. Predictive health scores remain above 98.5%.",
        timestamp: `${now} +300ms`,
      },
      {
        agent: "4. Cloud Execution Agent",
        thought:
          "Cloud Run replicas and SD-WAN routing tables are stable and optimized for current student traffic.",
        timestamp: `${now} +460ms`,
      },
      {
        agent: "5. Audit & FinOps Agent",
        thought:
          "Total autonomous optimizations accrued this cycle: RM 4,850.00 / month across compute and energy footprints.",
        timestamp: `${now} +610ms`,
      },
    ],
    remediation_command:
      "apu-nexus-agent --mode=continuous-monitor --interval=2500ms --telemetry-health=optimal",
    cloud_action_taken:
      "Continuous health monitoring active. Zero manual intervention required.",
    estimated_savings_myr: 450,
    iac_manifest: `\`\`\`terraform
# Terraform: APU-Nexus Campus Cloud Baseline Infrastructure
resource "google_compute_network" "apu_mesh_vpc" {
  name                    = "apu-campus-mesh-vpc"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "apu_edge_subnets" {
  name          = "apu-asia-se1-subnet"
  ip_cidr_range = "10.10.0.0/16"
  region        = "asia-southeast1"
  network       = google_compute_network.apu_mesh_vpc.id
}
\`\`\``,
  };
}

/**
 * Analyzes campus telemetry using Gemini AI or fallback multi-agent heuristic engine
 * @param {Object} telemetrySnapshot - Current campus metrics
 * @param {string} crisisType - Optional explicit crisis type
 * @returns {Promise<Object>} Structured JSON matching required schema
 */
export async function analyzeCampusTelemetry(telemetrySnapshot, crisisType = null) {
  const apiKey = process.env.GEMINI_API_KEY;
  const isKeyValid =
    Boolean(apiKey) &&
    !apiKey.includes("your_") &&
    apiKey.length > 15;

  let diagnosisResult = null;

  if (isKeyValid) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      });

      const prompt = `
You are the APU-Nexus Self-Healing Autonomous Controller for Asia Pacific University (APU).
You represent a 5-Agent Collaborative AI Pipeline:
1. Telemetry Ingestion Agent
2. Gemini Diagnostic Agent
3. Resolution Architect Agent
4. Cloud Execution Agent
5. Audit & FinOps Agent

Campus Telemetry Snapshot:
${JSON.stringify(telemetrySnapshot || {}, null, 2)}

Active Crisis Injection: ${crisisType || "None (Evaluate from metrics)"}

CRITICAL IAC FORMATTING RULE:
The "iac_manifest" field MUST contain EXACT, syntactically correct Terraform (.tf) or Kubernetes (deployment.yaml) files enclosed strictly inside Markdown code blocks (\`\`\`terraform ... \`\`\` or \`\`\`yaml ... \`\`\`).
You are FORBIDDEN from including any conversational filler, chatter, or introductory text (e.g. NEVER output "Here is the code").
Output ONLY valid JSON strictly following this schema:
{
  "status": "stable" | "warning" | "critical" | "remediated",
  "anomaly_type": string,
  "affected_zone": string,
  "root_cause": string,
  "confidence_score": number,
  "agent_chain": [
    { "agent": string, "thought": string, "timestamp": string }
  ],
  "remediation_command": string,
  "cloud_action_taken": string,
  "estimated_savings_myr": number,
  "iac_manifest": string
}
Ensure exactly 5 agents in "agent_chain" representing the 5 pipeline stages.
The "iac_manifest" field must contain 15-25 lines of realistic Terraform (# Terraform: ...) or Kubernetes code.
`;

      const result = await model.generateContent(prompt);
      const textResponse = result.response.text();
      const parsed = JSON.parse(textResponse);

      // Verify required fields
      if (
        parsed.status &&
        parsed.root_cause &&
        Array.isArray(parsed.agent_chain) &&
        parsed.remediation_command &&
        parsed.iac_manifest
      ) {
        diagnosisResult = parsed;
      }
    } catch (err) {
      console.warn("[APU-Nexus] Gemini API call fell back to heuristic engine:", err.message);
    }
  }

  if (!diagnosisResult) {
    // Graceful simulated reasoning delay for hackathon UX realism
    await new Promise((resolve) => setTimeout(resolve, 800));
    diagnosisResult = buildDeterministicMultiAgentDiagnosis(telemetrySnapshot, crisisType);
  }

  // Trigger Discord Webhook Notification asynchronously
  if (diagnosisResult.status === "critical" || diagnosisResult.status === "warning") {
    sendDiscordAlert(diagnosisResult, null).catch(() => {});
  } else if (diagnosisResult.status === "remediated") {
    sendDiscordAlert(diagnosisResult, diagnosisResult).catch(() => {});
  }

  return diagnosisResult;
}

export default {
  analyzeCampusTelemetry,
  sendDiscordAlert,
};
