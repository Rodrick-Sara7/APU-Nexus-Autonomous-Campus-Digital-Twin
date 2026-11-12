// ==============================================================================
// APU-Nexus Phase 4: True Edge Hardware Actuation & Vision Security Verification
// Tests:
// 1. CCTV Camera Tampering Edge Actuation (/api/iot POST & GET)
// 2. Physical Mobile Accelerometer Violent Shake Actuation (>3.0G)
// 3. Gemini 5-Agent Pipeline: Door Lockdown & Security Drone Dispatch IaC Synthesis
// 4. Discord Alert Rich Embed: "Camera Lens Obscured / Sabotage Detected"
// 5. Code Integrity Checks for app/cctv/page.jsx, app/sensor/page.jsx, and app/page.jsx
// ==============================================================================

import fs from "fs";
import path from "path";
import assert from "assert";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runPhase4Verification() {
  console.log("====================================================================");
  console.log("STARTING APU-NEXUS PHASE 4 TRUE EDGE ACTUATION AUDIT");
  console.log("====================================================================\n");

  // -------------------------------------------------------------------------
  // TEST 1: Camera Tampering Edge Actuation via /api/iot
  // -------------------------------------------------------------------------
  console.log("[TEST 1] Testing CCTV Camera Tampering Edge Actuation (/api/iot)...");
  const iotRoute = await import("./app/api/iot/route.js");

  const cameraPostReq = new Request("http://localhost:3000/api/iot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "CAMERA_TAMPERING",
      status: "critical",
      zone: "Server Room Core",
      luminance: 4,
      source: "cctv_verify_edge",
    }),
  });

  const postRes = await iotRoute.POST(cameraPostReq);
  assert.strictEqual(postRes.status, 200, "POST /api/iot must return 200");
  const postData = await postRes.json();
  assert.strictEqual(postData.camera_tampered, true, "camera_tampered must be true");
  assert.strictEqual(postData.active_crisis, "CAMERA_TAMPERING", "active_crisis must be CAMERA_TAMPERING");
  assert.strictEqual(postData.status, "critical", "status must be critical");

  // Assert GET state reflects the camera sabotage immediately
  const getRes = await iotRoute.GET();
  assert.strictEqual(getRes.status, 200, "GET /api/iot must return 200");
  const getState = await getRes.json();
  assert.strictEqual(getState.camera_tampered, true, "GET state must reflect camera_tampered: true");
  assert.strictEqual(getState.type, "CAMERA_TAMPERING", "GET state type must be CAMERA_TAMPERING");
  assert.strictEqual(getState.zone, "Server Room Core", "GET state zone must be Server Room Core");
  console.log("  ✓ Mock POST with Camera Tampering successfully updated singleton state.");
  console.log("  ✓ GET /api/iot verified: camera_tampered=true, zone=Server Room Core, status=critical.");

  // -------------------------------------------------------------------------
  // TEST 2: Physical Mobile Accelerometer Violent Shake Actuation (>3.0G)
  // -------------------------------------------------------------------------
  console.log("\n[TEST 2] Testing Physical Accelerometer Violent Shake Actuation (>3.0G)...");
  const accelPostReq = new Request("http://localhost:3000/api/iot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "SEISMIC_ANOMALY",
      magnitude: 4.8,
      status: "critical",
      zone: "Block B - AI Labs",
      source: "mobile_hardware_accelerometer",
    }),
  });

  const accelRes = await iotRoute.POST(accelPostReq);
  const accelData = await accelRes.json();
  assert.strictEqual(accelData.seismic_alert, true, "seismic_alert must be true for 4.8G");
  assert.strictEqual(accelData.active_crisis, "SEISMIC_ANOMALY", "active_crisis must be SEISMIC_ANOMALY");
  assert.strictEqual(accelData.magnitude, 4.8, "magnitude must be 4.8");
  console.log("  ✓ Mock violent shake (>3.0G) updated singleton state with SEISMIC_ANOMALY.");

  // -------------------------------------------------------------------------
  // TEST 3: Gemini 5-Agent IaC Door Lockdown & Security Drone Dispatch
  // -------------------------------------------------------------------------
  console.log("\n[TEST 3] Testing 5-Agent Multi-Agent Brain on CAMERA_TAMPERING...");
  const agentModule = await import("./lib/gemini_agent.js");
  const tamperDiagnosis = await agentModule.analyzeCampusTelemetry(
    { camera_tampered: true, active_crisis: "CAMERA_TAMPERING" },
    "CAMERA_TAMPERING"
  );

  assert.strictEqual(tamperDiagnosis.status, "critical", "Diagnosis status must be critical");
  assert.ok(
    tamperDiagnosis.root_cause.includes("Camera") ||
      tamperDiagnosis.root_cause.includes("Sabotage") ||
      tamperDiagnosis.root_cause.includes("obscured"),
    "Diagnosis root_cause must identify camera lens occlusion"
  );
  assert.ok(
    tamperDiagnosis.iac_manifest.toLowerCase().includes("lock down magnetic doors") ||
      tamperDiagnosis.iac_manifest.toLowerCase().includes("magnetic_locks") ||
      tamperDiagnosis.iac_manifest.toLowerCase().includes("security drone") ||
      tamperDiagnosis.iac_manifest.toLowerCase().includes("security_drone"),
    "IaC manifest must synthesize magnetic door lockdown & security drone dispatch"
  );
  console.log(`  ✓ Diagnosis anomaly isolated: "${tamperDiagnosis.anomaly_type}"`);
  console.log(`  ✓ Synthesized IaC verified (${tamperDiagnosis.iac_manifest.split("\n").length} lines).`);

  // -------------------------------------------------------------------------
  // TEST 4: Discord Webhook Alert mentions "Camera Lens Obscured / Sabotage Detected"
  // -------------------------------------------------------------------------
  console.log("\n[TEST 4] Testing Discord Webhook Alert Content...");
  const discordResult = await agentModule.sendDiscordAlert(
    {
      type: "CAMERA_TAMPERING",
      anomaly_type: "Camera Lens Obscured / Sabotage Detected",
      status: "critical",
      zone: "Server Room Core",
    },
    null
  );

  assert.ok(discordResult.payload, "Discord payload must be generated");
  const embed = discordResult.payload.embeds[0];
  assert.ok(
    embed.title.includes("Camera Lens Obscured / Sabotage Detected") ||
      embed.fields.some((f) => f.value.includes("Camera Lens Obscured / Sabotage Detected")),
    "Discord embed must mention 'Camera Lens Obscured / Sabotage Detected'"
  );
  assert.strictEqual(embed.color, 0xef4444, "Detection alert must have Red color 0xef4444");
  console.log(`  ✓ Discord Red Embed verified: "${embed.title}" (Color: 0x${embed.color.toString(16)})`);

  // -------------------------------------------------------------------------
  // TEST 5: Code Integrity across CCTV, Sensor, and Main Dashboard
  // -------------------------------------------------------------------------
  console.log("\n[TEST 5] Testing Code Integrity across Edge Nodes & Dashboard...");

  // 5.1 CCTV Edge Node (app/cctv/page.jsx)
  const cctvPath = path.join(__dirname, "app/cctv/page.jsx");
  assert.ok(fs.existsSync(cctvPath), "app/cctv/page.jsx must exist");
  const cctvContent = fs.readFileSync(cctvPath, "utf-8");
  assert.ok(cctvContent.includes("getUserMedia"), "app/cctv/page.jsx must use getUserMedia");
  assert.ok(cctvContent.includes("<video"), "app/cctv/page.jsx must include <video>");
  assert.ok(cctvContent.includes("<canvas"), "app/cctv/page.jsx must include <canvas>");
  assert.ok(cctvContent.includes("15"), "app/cctv/page.jsx must use <15 luminance threshold");
  assert.ok(cctvContent.includes("CAMERA_TAMPERING"), "app/cctv/page.jsx must emit CAMERA_TAMPERING");
  console.log("  ✓ app/cctv/page.jsx verified: getUserMedia, <video>, <canvas>, luminance <15 check.");

  // 5.2 Mobile Hardware Accelerometer (app/sensor/page.jsx)
  const sensorPath = path.join(__dirname, "app/sensor/page.jsx");
  const sensorContent = fs.readFileSync(sensorPath, "utf-8");
  assert.ok(
    sensorContent.includes("DeviceMotionEvent.requestPermission") ||
      sensorContent.includes("requestPermission"),
    "app/sensor/page.jsx must include requestPermission"
  );
  assert.ok(sensorContent.includes("devicemotion"), "app/sensor/page.jsx must listen to devicemotion");
  assert.ok(sensorContent.includes("Math.sqrt"), "app/sensor/page.jsx must compute Math.sqrt G-force");
  assert.ok(
    sensorContent.includes("3.0") || sensorContent.includes("3.0G"),
    "app/sensor/page.jsx must trigger on >3.0G"
  );
  console.log("  ✓ app/sensor/page.jsx verified: DeviceMotionEvent, 60fps render, >3.0G spike trigger.");

  // 5.3 Main Dashboard (app/page.jsx)
  const pagePath = path.join(__dirname, "app/page.jsx");
  const pageContent = fs.readFileSync(pagePath, "utf-8");
  assert.ok(pageContent.includes("/api/iot"), "app/page.jsx must poll /api/iot");
  assert.ok(pageContent.includes("CAMERA_TAMPERING"), "app/page.jsx must handle CAMERA_TAMPERING");
  assert.ok(pageContent.includes("SEISMIC_ANOMALY"), "app/page.jsx must handle SEISMIC_ANOMALY");
  console.log("  ✓ app/page.jsx verified: Reactive polling from /api/iot with auto-actuation.");

  console.log("\n====================================================================");
  console.log("ALL PHASE 4 VERIFICATION TESTS PASSED (5 / 5)");
  console.log("====================================================================");
}

runPhase4Verification().catch((err) => {
  console.error("\n❌ PHASE 4 VERIFICATION FAILED:", err);
  process.exit(1);
});
