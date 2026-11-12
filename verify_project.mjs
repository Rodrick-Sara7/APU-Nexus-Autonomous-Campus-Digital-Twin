// ==============================================================================
// APU-Nexus: Automated Master Verification Script (verify_project.mjs)
// Verifies file integrity, anti-laziness rules, simulation engines,
// multi-agent pipelines, Mobile IoT bridge, GitOps PR automation,
// Edge Vision CCTV sabotage, Discord alerts, and Terraform IaC synthesis.
// ==============================================================================

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runVerification() {
  console.log("====================================================================");
  console.log("STARTING APU-NEXUS MASTER ENTERPRISE PRODUCTION AUDIT");
  console.log("====================================================================\n");

  const requiredFiles = [
    "lib/firebase_setup.js",
    "lib/data_simulator.js",
    "lib/gemini_agent.js",
    "app/api/agent/route.js",
    "app/api/iot/route.js",
    "app/api/github/route.js",
    "app/page.jsx",
    "app/sensor/page.jsx",
    "app/cctv/page.jsx",
  ];

  const forbiddenStrings = ["TODO", "implement logic here", "...rest of code"];

  // 1. File Existence and Forbidden Strings Check
  console.log("[CHECK 1] Validating required files and zero-placeholder policy...");
  for (const relPath of requiredFiles) {
    const fullPath = path.join(__dirname, relPath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`CRITICAL: Required file does not exist: ${relPath}`);
    }

    const content = fs.readFileSync(fullPath, "utf-8");
    for (const forbidden of forbiddenStrings) {
      if (content.includes(forbidden)) {
        throw new Error(`CRITICAL: Forbidden placeholder '${forbidden}' found in ${relPath}`);
      }
    }
    console.log(`  ✓ ${relPath} exists and has zero placeholders.`);
  }

  // 2. Client Directives & Complexity Floors
  console.log("\n[CHECK 2] Validating client directives and complexity floors...");
  const pagePath = path.join(__dirname, "app/page.jsx");
  const pageContent = fs.readFileSync(pagePath, "utf-8");
  const pageLines = pageContent.split("\n");

  if (!pageLines[0].includes('"use client"') && !pageLines[0].includes("'use client'")) {
    throw new Error('CRITICAL: /app/page.jsx must begin with "use client" on line 1.');
  }
  if (pageLines.length < 350) {
    throw new Error(
      `CRITICAL: /app/page.jsx must exceed 350 lines of code. Current line count: ${pageLines.length}`
    );
  }
  console.log(`  ✓ /app/page.jsx begins with "use client" on line 1 (${pageLines.length} lines).`);

  const sensorPath = path.join(__dirname, "app/sensor/page.jsx");
  const sensorContent = fs.readFileSync(sensorPath, "utf-8");
  const sensorLines = sensorContent.split("\n");

  if (!sensorLines[0].includes('"use client"') && !sensorLines[0].includes("'use client'")) {
    throw new Error('CRITICAL: /app/sensor/page.jsx must begin with "use client" on line 1.');
  }
  console.log(`  ✓ /app/sensor/page.jsx begins with "use client" on line 1 (${sensorLines.length} lines).`);

  const cctvPath = path.join(__dirname, "app/cctv/page.jsx");
  const cctvContent = fs.readFileSync(cctvPath, "utf-8");
  const cctvLines = cctvContent.split("\n");

  if (!cctvLines[0].includes('"use client"') && !cctvLines[0].includes("'use client'")) {
    throw new Error('CRITICAL: /app/cctv/page.jsx must begin with "use client" on line 1.');
  }
  console.log(`  ✓ /app/cctv/page.jsx begins with "use client" on line 1 (${cctvLines.length} lines).`);

  // 3. API Route Exports Check
  console.log("\n[CHECK 3] Validating API Route Exports (/api/iot, /api/github, /api/agent)...");
  const iotRoute = await import("./app/api/iot/route.js");
  if (typeof iotRoute.GET !== "function" || typeof iotRoute.POST !== "function") {
    throw new Error("CRITICAL: /app/api/iot/route.js missing GET or POST export.");
  }
  console.log("  ✓ /app/api/iot/route.js exports GET and POST handlers.");

  const githubRoute = await import("./app/api/github/route.js");
  if (typeof githubRoute.GET !== "function" || typeof githubRoute.POST !== "function") {
    throw new Error("CRITICAL: /app/api/github/route.js missing GET or POST export.");
  }
  console.log("  ✓ /app/api/github/route.js exports GET and POST handlers.");

  const agentRoute = await import("./app/api/agent/route.js");
  if (typeof agentRoute.POST !== "function") {
    throw new Error("CRITICAL: /app/api/agent/route.js missing POST export.");
  }
  console.log("  ✓ /app/api/agent/route.js exports POST handler.");

  // 4. Telemetry Simulator Execution & Crisis Triggers Check
  console.log("\n[CHECK 4] Verifying /lib/data_simulator.js execution & all crisis triggers...");
  const simulator = await import("./lib/data_simulator.js");
  const baseline = simulator.createInitialCampusState();
  if (!baseline || !baseline.zones || Object.keys(baseline.zones).length !== 4) {
    throw new Error("CRITICAL: Initial campus state does not contain 4 zones.");
  }

  const normalTick = simulator.generateNormalTick(baseline);
  if (typeof normalTick.avg_wifi_load !== "number" || typeof normalTick.total_power_kw !== "number") {
    throw new Error("CRITICAL: generateNormalTick produced invalid numerical telemetry.");
  }

  // ESG Calculation Check
  for (const z of Object.values(normalTick.zones)) {
    if (Math.abs(z.carbon_kg_co2e - z.power_usage_kw * 0.4) > 0.001) {
      throw new Error(`CRITICAL: Zone ${z.name} carbon_kg_co2e does not match power_usage_kw * 0.4`);
    }
  }
  console.log("  ✓ ESG carbon calculation strictly verified (carbon_kg_co2e === power_usage_kw * 0.4).");

  const crisis1 = simulator.triggerCrisisMode("NETWORK_STORM", normalTick);
  if (crisis1.zones["Block B - AI Labs"].wifi_load !== 99) {
    throw new Error("CRITICAL: NETWORK_STORM wifi_load did not spike to 99%.");
  }

  const crisisSeismic = simulator.triggerCrisisMode("SEISMIC_ANOMALY", normalTick);
  if (crisisSeismic.zones["Server Room Core"].vibration_g !== 8.4) {
    throw new Error("CRITICAL: SEISMIC_ANOMALY vibration did not spike to 8.4G.");
  }

  const crisisCamera = simulator.triggerCrisisMode("CAMERA_TAMPERING", normalTick);
  if (crisisCamera.zones["Server Room Core"].status !== "CRITICAL") {
    throw new Error("CRITICAL: CAMERA_TAMPERING did not mark Server Room status as CRITICAL.");
  }

  const fixedSeismic = simulator.applyAutonomousFix("SEISMIC_ANOMALY", crisisSeismic);
  if (fixedSeismic.zones["Server Room Core"].vibration_g > 2) {
    throw new Error("CRITICAL: applyAutonomousFix failed to restore Server Room vibration.");
  }
  console.log("  ✓ triggerCrisisMode verified for NETWORK_STORM, SEISMIC_ANOMALY, and CAMERA_TAMPERING.");
  console.log("  ✓ applyAutonomousFix verified with healthy baseline restoration.");

  // 5. Multi-Agent Gemini Brain & IaC Synthesis Check
  console.log("\n[CHECK 5] Verifying /lib/gemini_agent.js 5-Agent pipeline, Discord alerts & IaC synthesis...");
  const agentModule = await import("./lib/gemini_agent.js");
  if (typeof agentModule.sendDiscordAlert !== "function") {
    throw new Error("CRITICAL: sendDiscordAlert is not exported from lib/gemini_agent.js");
  }

  const testPayload = {
    active_crisis: "CAMERA_TAMPERING",
    zones: {
      "Server Room Core": {
        ac_temp_c: 21.0,
        server_cpu: 60,
        power_usage_kw: 65,
      },
    },
  };

  const diagnosis = await agentModule.analyzeCampusTelemetry(testPayload, "CAMERA_TAMPERING");
  if (!diagnosis || typeof diagnosis !== "object") {
    throw new Error("CRITICAL: analyzeCampusTelemetry did not return a valid object.");
  }

  if (
    !diagnosis.root_cause ||
    !Array.isArray(diagnosis.agent_chain) ||
    diagnosis.agent_chain.length < 5 ||
    !diagnosis.remediation_command ||
    !diagnosis.iac_manifest
  ) {
    throw new Error("CRITICAL: analyzeCampusTelemetry returned schema that violates required structure.");
  }
  console.log(`  ✓ analyzeCampusTelemetry returned status: ${diagnosis.status}`);
  console.log(`  ✓ 5-Agent pipeline generated ${diagnosis.agent_chain.length} autonomous thoughts.`);
  console.log(`  ✓ Generated remediation command: ${diagnosis.remediation_command}`);
  console.log(`  ✓ Synthesized IaC manifest verified (${diagnosis.iac_manifest.split("\n").length} lines).`);
  console.log(`  ✓ Estimated savings calculated: RM ${diagnosis.estimated_savings_myr}`);

  // 6. Firebase Setup & Mobile IoT Vibration Stream Check
  console.log("\n[CHECK 6] Verifying /lib/firebase_setup.js pub-sub & IoT vibration bridge...");
  const firebaseModule = await import("./lib/firebase_setup.js");
  if (typeof firebaseModule.publishIotVibration !== "function" || typeof firebaseModule.subscribeIotVibration !== "function") {
    throw new Error("CRITICAL: publishIotVibration or subscribeIotVibration is not a function.");
  }

  let receivedIot = null;
  const unsub = firebaseModule.subscribeIotVibration((data) => {
    receivedIot = data;
  });
  await firebaseModule.publishIotVibration({ magnitude: 8.4, seismic_alert: true });
  unsub();

  if (!receivedIot || receivedIot.magnitude !== 8.4) {
    throw new Error("CRITICAL: Local IoT vibration pub-sub store did not dispatch published data.");
  }
  console.log("  ✓ publishIotVibration and subscribeIotVibration verified in local fallback mode.");

  console.log("\n====================================================================");
  console.log("ALL MASTER VERIFICATION CHECKS PASSED (100% HEALTHY)");
  console.log("====================================================================");
}

runVerification().catch((err) => {
  console.error("\n❌ VERIFICATION FAILED:", err);
  process.exit(1);
});
