// ==============================================================================
// APU-Nexus: Automated Verification Script (verify_project.mjs)
// Verifies file integrity, anti-laziness rules, simulation engines, and agent pipelines.
// ==============================================================================

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runVerification() {
  console.log("====================================================================");
  console.log("STARTING APU-NEXUS PRODUCTION AUDIT & VERIFICATION");
  console.log("====================================================================\n");

  const requiredFiles = [
    "lib/firebase_setup.js",
    "lib/data_simulator.js",
    "lib/gemini_agent.js",
    "app/api/agent/route.js",
    "app/page.jsx",
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

  // 2. /app/page.jsx Specific Checks
  console.log("\n[CHECK 2] Validating /app/page.jsx complexity floor & client directive...");
  const pagePath = path.join(__dirname, "app/page.jsx");
  const pageContent = fs.readFileSync(pagePath, "utf-8");
  const lines = pageContent.split("\n");

  if (!lines[0].includes('"use client"') && !lines[0].includes("'use client'")) {
    throw new Error('CRITICAL: /app/page.jsx must begin with "use client" on line 1.');
  }

  if (lines.length < 250) {
    throw new Error(
      `CRITICAL: /app/page.jsx must exceed 250 lines of code. Current line count: ${lines.length}`
    );
  }
  console.log(`  ✓ /app/page.jsx begins with "use client" on line 1.`);
  console.log(`  ✓ /app/page.jsx has ${lines.length} lines of code (exceeds floor of 250+).`);

  // 3. Telemetry Simulator Execution Check
  console.log("\n[CHECK 3] Verifying /lib/data_simulator.js execution & crisis triggers...");
  const simulator = await import("./lib/data_simulator.js");
  const baseline = simulator.createInitialCampusState();
  if (!baseline || !baseline.zones || Object.keys(baseline.zones).length !== 4) {
    throw new Error("CRITICAL: Initial campus state does not contain 4 zones.");
  }

  const normalTick = simulator.generateNormalTick(baseline);
  if (typeof normalTick.avg_wifi_load !== "number" || typeof normalTick.total_power_kw !== "number") {
    throw new Error("CRITICAL: generateNormalTick produced invalid numerical telemetry.");
  }

  const crisis1 = simulator.triggerCrisisMode("NETWORK_STORM", normalTick);
  if (crisis1.zones["Block B - AI Labs"].wifi_load !== 99) {
    throw new Error("CRITICAL: NETWORK_STORM wifi_load did not spike to 99%.");
  }

  const fixed1 = simulator.applyAutonomousFix("NETWORK_STORM", crisis1);
  if (fixed1.zones["Block B - AI Labs"].wifi_load > 50) {
    throw new Error("CRITICAL: applyAutonomousFix failed to restore Block B wifi_load.");
  }
  console.log("  ✓ createInitialCampusState() initialized 4 APU zones correctly.");
  console.log("  ✓ generateNormalTick() verified with continuous natural jitter.");
  console.log("  ✓ triggerCrisisMode('NETWORK_STORM') verified.");
  console.log("  ✓ applyAutonomousFix('NETWORK_STORM') verified with healthy restoration.");

  // 4. Multi-Agent Gemini Brain Execution Check
  console.log("\n[CHECK 4] Verifying /lib/gemini_agent.js 5-Agent pipeline & fallback...");
  const agentModule = await import("./lib/gemini_agent.js");
  const testPayload = {
    active_crisis: "NETWORK_STORM",
    zones: {
      "Block B - AI Labs": {
        wifi_load: 99,
        server_cpu: 96,
        latency_ms: 420,
        packet_loss: 18,
      },
    },
  };

  const diagnosis = await agentModule.analyzeCampusTelemetry(testPayload, "NETWORK_STORM");
  if (!diagnosis || typeof diagnosis !== "object") {
    throw new Error("CRITICAL: analyzeCampusTelemetry did not return a valid object.");
  }

  if (
    !["stable", "warning", "critical", "remediated"].includes(diagnosis.status) ||
    !diagnosis.root_cause ||
    !Array.isArray(diagnosis.agent_chain) ||
    diagnosis.agent_chain.length < 5 ||
    !diagnosis.remediation_command ||
    typeof diagnosis.estimated_savings_myr !== "number"
  ) {
    throw new Error(
      "CRITICAL: analyzeCampusTelemetry returned schema that violates required structure."
    );
  }
  console.log(`  ✓ analyzeCampusTelemetry returned status: ${diagnosis.status}`);
  console.log(`  ✓ 5-Agent pipeline generated ${diagnosis.agent_chain.length} autonomous thoughts.`);
  console.log(`  ✓ Generated remediation command: ${diagnosis.remediation_command}`);
  console.log(`  ✓ Estimated savings calculated: RM ${diagnosis.estimated_savings_myr}`);

  // 5. Firebase Setup Hybrid Engine Check
  console.log("\n[CHECK 5] Verifying /lib/firebase_setup.js pub-sub engine...");
  const firebaseModule = await import("./lib/firebase_setup.js");
  if (typeof firebaseModule.publishTelemetry !== "function") {
    throw new Error("CRITICAL: publishTelemetry is not a function.");
  }
  if (typeof firebaseModule.subscribeTelemetry !== "function") {
    throw new Error("CRITICAL: subscribeTelemetry is not a function.");
  }

  let receivedValue = null;
  const unsub = firebaseModule.subscribeTelemetry((data) => {
    receivedValue = data;
  });
  await firebaseModule.publishTelemetry({ test_probe: 42 });
  unsub();

  if (!receivedValue || receivedValue.test_probe !== 42) {
    throw new Error("CRITICAL: Local pub-sub fallback store did not dispatch published data.");
  }
  console.log("  ✓ publishTelemetry and subscribeTelemetry verified in local fallback mode.");

  console.log("\n====================================================================");
  console.log("ALL VERIFICATION CHECKS PASSED");
  console.log("====================================================================");
}

runVerification().catch((err) => {
  console.error("\n❌ VERIFICATION FAILED:", err);
  process.exit(1);
});
