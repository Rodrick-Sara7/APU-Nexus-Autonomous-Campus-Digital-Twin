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

  const crisisThermal = simulator.triggerCrisisMode("IOT_THERMAL_RUNAWAY", normalTick);
  if (crisisThermal.zones["Server Room Core"].ac_temp_c !== 34.5) {
    throw new Error("CRITICAL: IOT_THERMAL_RUNAWAY ac_temp_c did not spike to 34.5°C.");
  }

  const crisisEnergy = simulator.triggerCrisisMode("ENERGY_WASTE_ANOMALY", normalTick);
  if (crisisEnergy.zones["APU Library Level 2"].power_usage_kw !== 145) {
    throw new Error("CRITICAL: ENERGY_WASTE_ANOMALY power_usage_kw did not spike to 145kW.");
  }

  const fixedNetwork = simulator.applyAutonomousFix("NETWORK_STORM", crisis1);
  if (fixedNetwork.zones["Block B - AI Labs"].status !== "HEALTHY") {
    throw new Error("CRITICAL: applyAutonomousFix failed for NETWORK_STORM.");
  }

  const fixedThermal = simulator.applyAutonomousFix("IOT_THERMAL_RUNAWAY", crisisThermal);
  if (fixedThermal.zones["Server Room Core"].status !== "HEALTHY") {
    throw new Error("CRITICAL: applyAutonomousFix failed for IOT_THERMAL_RUNAWAY.");
  }

  const fixedEnergy = simulator.applyAutonomousFix("ENERGY_WASTE_ANOMALY", crisisEnergy);
  if (fixedEnergy.zones["APU Library Level 2"].status !== "HEALTHY") {
    throw new Error("CRITICAL: applyAutonomousFix failed for ENERGY_WASTE_ANOMALY.");
  }

  const fixedSeismic = simulator.applyAutonomousFix("SEISMIC_ANOMALY", crisisSeismic);
  if (fixedSeismic.zones["Server Room Core"].vibration_g > 2) {
    throw new Error("CRITICAL: applyAutonomousFix failed to restore Server Room vibration.");
  }

  const fixedCamera = simulator.applyAutonomousFix("CAMERA_TAMPERING", crisisCamera);
  if (fixedCamera.zones["Server Room Core"].status !== "HEALTHY") {
    throw new Error("CRITICAL: applyAutonomousFix failed for CAMERA_TAMPERING.");
  }

  console.log("  ✓ triggerCrisisMode verified for all 5 crisis modes (NETWORK_STORM, IOT_THERMAL_RUNAWAY, ENERGY_WASTE_ANOMALY, SEISMIC_ANOMALY, CAMERA_TAMPERING).");
  console.log("  ✓ applyAutonomousFix verified for all 5 crisis modes with healthy baseline restoration.");

  // 5. Multi-Agent Gemini Brain & IaC Synthesis Check
  console.log("\n[CHECK 5] Verifying /lib/gemini_agent.js 5-Agent pipeline, Discord alerts & IaC synthesis across all modes...");
  const agentModule = await import("./lib/gemini_agent.js");
  if (typeof agentModule.sendDiscordAlert !== "function") {
    throw new Error("CRITICAL: sendDiscordAlert is not exported from lib/gemini_agent.js");
  }

  const testModes = [
    "CAMERA_TAMPERING",
    "SEISMIC_ANOMALY",
    "NETWORK_STORM",
    "IOT_THERMAL_RUNAWAY",
    "ENERGY_WASTE_ANOMALY",
    null,
  ];

  for (const mode of testModes) {
    const diag = await agentModule.analyzeCampusTelemetry({ active_crisis: mode }, mode);
    if (
      !diag ||
      !diag.root_cause ||
      !Array.isArray(diag.agent_chain) ||
      diag.agent_chain.length !== 5 ||
      !diag.remediation_command ||
      !diag.iac_manifest
    ) {
      throw new Error(`CRITICAL: analyzeCampusTelemetry failed schema validation for mode: ${mode}`);
    }
  }
  console.log("  ✓ analyzeCampusTelemetry verified across all 6 diagnostic branches (5 crisis modes + nominal).");

  // 6. Firebase Setup & Mobile IoT Vibration Stream Check
  console.log("\n[CHECK 6] Verifying /lib/firebase_setup.js pub-sub & IoT vibration bridge...");
  const firebaseModule = await import("./lib/firebase_setup.js");
  if (typeof firebaseModule.publishIotVibration !== "function" || typeof firebaseModule.subscribeIotVibration !== "function") {
    throw new Error("CRITICAL: publishIotVibration or subscribeIotVibration is not a function.");
  }

  let receivedTelemetry = null;
  const unsubTel = firebaseModule.subscribeTelemetry((data) => {
    receivedTelemetry = data;
  });
  await firebaseModule.publishTelemetry(baseline);
  unsubTel();
  if (!receivedTelemetry || !receivedTelemetry.zones) {
    throw new Error("CRITICAL: publishTelemetry / subscribeTelemetry failed.");
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
  console.log("  ✓ publishTelemetry, subscribeTelemetry, publishIotVibration, and subscribeIotVibration verified.");

  // 7. Cross-Device Edge Isolation & Reset Verification (/api/iot)
  console.log("\n[CHECK 7] Verifying /api/iot CCTV + Sensor isolation and RESET command...");
  // Trigger CCTV sabotage
  await iotRoute.POST(
    new Request("http://localhost:3000/api/iot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "CAMERA_TAMPERING", status: "critical", luminance: 4 }),
    })
  );
  // Send a normal 1.0G sensor heartbeat while CCTV is tampered
  const heartbeatAfterTamperRes = await iotRoute.POST(
    new Request("http://localhost:3000/api/iot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ magnitude: 1.0, seismic_alert: false, source: "standby_heartbeat" }),
    })
  );
  const heartbeatState = await heartbeatAfterTamperRes.json();
  if (!heartbeatState.camera_tampered || heartbeatState.active_crisis !== "CAMERA_TAMPERING") {
    throw new Error("CRITICAL: Normal sensor heartbeat overwrote active CCTV camera_tampered state!");
  }
  console.log("  ✓ Verified sensor heartbeat does not overwrite active CCTV sabotage state.");

  // Verify CCTV restoration clears camera_tampered
  const cctvRestoreRes = await iotRoute.POST(
    new Request("http://localhost:3000/api/iot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "NOMINAL", status: "healthy", luminance: 128, source: "cctv_optical_sensor_restored" }),
    })
  );
  const cctvRestoredState = await cctvRestoreRes.json();
  if (cctvRestoredState.camera_tampered !== false || cctvRestoredState.active_crisis !== null) {
    throw new Error("CRITICAL: CCTV restoration failed to clear camera_tampered flag!");
  }
  console.log("  ✓ Verified CCTV optical restoration cleanly clears camera_tampered flag.");

  // Verify RESET action clears all alerts and passive heartbeat preserves seismic_alert latch
  await iotRoute.POST(
    new Request("http://localhost:3000/api/iot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ magnitude: 8.4, seismic_alert: true, source: "simulated_8.4G_tap" }),
    })
  );
  const passiveAfterShakeRes = await iotRoute.POST(
    new Request("http://localhost:3000/api/iot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ magnitude: 1.0, seismic_alert: false, source: "standby_heartbeat" }),
    })
  );
  const passiveAfterShakeState = await passiveAfterShakeRes.json();
  if (!passiveAfterShakeState.seismic_alert || passiveAfterShakeState.active_crisis !== "SEISMIC_ANOMALY") {
    throw new Error("CRITICAL: Passive standby_heartbeat prematurely cleared active seismic_alert latch before dashboard navigation!");
  }
  const resetRes = await iotRoute.POST(
    new Request("http://localhost:3000/api/iot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "RESET" }),
    })
  );
  const resetState = await resetRes.json();
  if (resetState.seismic_alert !== false || resetState.camera_tampered !== false || resetState.active_crisis !== null) {
    throw new Error("CRITICAL: POST /api/iot RESET failed to clear active hardware alerts!");
  }
  console.log("  ✓ Verified seismic_alert latch across passive heartbeats and POST /api/iot RESET nominal restoration.");

  // 8. Final Hackathon Winning Polish Verification (HITL, Voice, Open-Meteo, Commander, Export)
  console.log("\n[CHECK 8] Verifying 5 Hackathon Winning Polish features...");
  if (typeof agentModule.answerCommanderQuery !== "function") {
    throw new Error("CRITICAL: answerCommanderQuery is not exported from lib/gemini_agent.js");
  }

  const commanderPrompts = [
    "Which campus zone has the highest carbon & power load right now?",
    "Generate an executive risk & FinOps summary for campus IT",
    "Explain how the 5-Agent pipeline mitigates CCTV & seismic threats",
  ];
  const sampleWeather = { temperature_2m: 31.4, relative_humidity_2m: 78 };

  for (const prompt of commanderPrompts) {
    const cmdRes = await agentRoute.POST(
      new Request("http://localhost:3000/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telemetry: crisisEnergy,
          userQuery: prompt,
          weather: sampleWeather,
        }),
      })
    );
    const cmdData = await cmdRes.json();
    if (cmdData.status !== "ok" || !cmdData.commander_reply || cmdData.commander_reply.length < 30) {
      throw new Error(`CRITICAL: /api/agent userQuery failed for prompt: ${prompt}`);
    }
  }
  // Ensure Crisis Energy top zone (145 kW in APU Library Level 2) is cited dynamically
  const livePowerRes = await agentRoute.POST(
    new Request("http://localhost:3000/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        telemetry: crisisEnergy,
        userQuery: commanderPrompts[0],
        weather: sampleWeather,
      }),
    })
  );
  const livePowerData = await livePowerRes.json();
  if (!livePowerData.commander_reply.includes("APU Library Level 2") || !livePowerData.commander_reply.includes("145.0 kW")) {
    throw new Error("CRITICAL: Ask APU-Nexus Commander reply did not cite dynamic peak load from live telemetry!");
  }
  console.log("  ✓ Verified POST /api/agent Ask APU-Nexus Commander responses cite live telemetry.");

  // Ensure standard crisis analysis path still works when userQuery is omitted
  const diagRes = await agentRoute.POST(
    new Request("http://localhost:3000/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telemetry: crisisCamera, crisisType: "CAMERA_TAMPERING" }),
    })
  );
  const diagJson = await diagRes.json();
  if (!diagJson.iac_manifest || diagJson.affected_zone !== "Server Room Core") {
    throw new Error("CRITICAL: POST /api/agent regression on diagnosis mode!");
  }
  console.log("  ✓ Verified POST /api/agent 5-Agent diagnosis mode intact.");

  const requiredPageContracts = [
    "Mode: Full Autonomous (Auto-Heal)",
    "Mode: Co-Pilot Governance (Hold for Approval)",
    "Approve &amp; Execute Autonomous Remediation",
    "announceNOC",
    "speechSynthesis",
    "https://api.open-meteo.com/v1/forecast?latitude=3.0554&longitude=101.7005&current=temperature_2m,relative_humidity_2m",
    "APU Bukit Jalil Live Ambient:",
    "Export Audit &amp; ESG Report",
    "APU-Nexus-Compliance-Report.md",
    "incidentAuditLog",
  ];
  for (const snippet of requiredPageContracts) {
    if (!pageContent.includes(snippet)) {
      throw new Error(`CRITICAL: Missing required Hackathon Polish feature snippet in app/page.jsx: ${snippet}`);
    }
  }
  console.log("  ✓ Verified HITL Co-Pilot Governance, Voice NOC, Open-Meteo Weather, Commander Bar, and Audit Export in app/page.jsx.");

  console.log("\n====================================================================");
  console.log("ALL MASTER VERIFICATION CHECKS PASSED (100% HEALTHY)");
  console.log("====================================================================");
}

runVerification().catch((err) => {
  console.error("\n❌ VERIFICATION FAILED:", err);
  process.exit(1);
});
