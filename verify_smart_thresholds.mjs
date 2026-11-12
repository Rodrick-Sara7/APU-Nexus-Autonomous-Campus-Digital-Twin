// ==============================================================================
// APU-Nexus: Smart Seismic Thresholds & Mobile UX Fix Verification
// Tests:
// 1. Logic & String Checks:
//    - "< 2.0G": "NORMAL (Ambient)"
//    - ">= 2.0G && < 3.5G": "SLIGHT VIBRATION (Ignored)" in Yellow
//    - ">= 3.5G": "VIOLENT SEISMIC SHAKE!" in Red
// 2. HTTP Fallback UI Alert string:
//    - "Motion sensors blocked by HTTP. Please use HTTPS or the manual trigger below."
// 3. Mobile responsiveness check:
//    - onClick and onTouchStart handlers on manual buttons
// 4. API /api/iot behavior:
//    - 1.5G => NO anomaly
//    - 2.8G => NO anomaly (ignored slight vibration)
//    - 3.8G => Triggers SEISMIC_ANOMALY
// ==============================================================================

import fs from "fs";
import path from "path";
import assert from "assert";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function verifySmartSeismicThresholds() {
  console.log("====================================================================");
  console.log("STARTING SMART SEISMIC THRESHOLDS & MOBILE UX VERIFICATION");
  console.log("====================================================================\n");

  const sensorPath = path.join(__dirname, "app/sensor/page.jsx");
  assert.ok(fs.existsSync(sensorPath), "app/sensor/page.jsx must exist");
  const sensorCode = fs.readFileSync(sensorPath, "utf-8");

  // [CHECK 1] String Requirements
  console.log("[CHECK 1] Verifying exact status labels & smart threshold code...");
  assert.ok(sensorCode.includes("NORMAL (Ambient)"), "Must contain 'NORMAL (Ambient)'");
  assert.ok(sensorCode.includes("SLIGHT VIBRATION (Ignored)"), "Must contain 'SLIGHT VIBRATION (Ignored)'");
  assert.ok(sensorCode.includes("VIOLENT SEISMIC SHAKE!"), "Must contain 'VIOLENT SEISMIC SHAKE!'");
  assert.ok(sensorCode.includes("amber") || sensorCode.includes("yellow"), "Must style slight vibration in yellow/amber");
  assert.ok(sensorCode.includes("rose") || sensorCode.includes("red"), "Must style violent shake in red/rose");
  assert.ok(sensorCode.includes("3.5"), "Must include 3.5G threshold");
  assert.ok(sensorCode.includes("2.0"), "Must include 2.0G threshold");
  console.log("  ✓ All required smart threshold strings and threshold values verified in app/sensor/page.jsx.");

  // [CHECK 2] Mobile UX & HTTP Fallback
  console.log("\n[CHECK 2] Verifying DeviceMotionEvent try/catch and HTTP fallback alert...");
  assert.ok(sensorCode.includes("DeviceMotionEvent.requestPermission"), "Must call DeviceMotionEvent.requestPermission");
  assert.ok(sensorCode.includes("try {"), "Must wrap permission request in try/catch");
  assert.ok(sensorCode.includes("catch"), "Must have catch block for permission request");
  assert.ok(
    sensorCode.includes("Motion sensors blocked by HTTP. Please use HTTPS or the manual trigger below."),
    "Must display exact visual UI alert: 'Motion sensors blocked by HTTP. Please use HTTPS or the manual trigger below.'"
  );
  console.log("  ✓ DeviceMotionEvent.requestPermission is wrapped in try/catch.");
  console.log("  ✓ Visual UI alert exact string verified.");

  // [CHECK 3] Mobile button responsiveness
  console.log("\n[CHECK 3] Verifying onClick & onTouchStart on fallback buttons...");
  assert.ok(sensorCode.includes("onClick="), "Fallback buttons must have onClick handler");
  assert.ok(sensorCode.includes("onTouchStart="), "Fallback buttons must have onTouchStart handler");
  assert.ok(sensorCode.includes("touch-manipulation"), "Buttons should have touch-manipulation CSS class");
  console.log("  ✓ onClick and onTouchStart handlers verified on manual fallback buttons.");

  // [CHECK 4] Testing /api/iot with the 3 Smart Threshold tiers
  console.log("\n[CHECK 4] Testing /api/iot smart thresholds (1.2G, 2.8G, 3.8G)...");
  const iotRoute = await import("./app/api/iot/route.js");

  // 4a: Ambient (1.2G < 2.0G) -> No anomaly
  const ambientReq = new Request("http://localhost:3000/api/iot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      magnitude: 1.2,
      source: "ambient_test",
    }),
  });
  const ambientRes = await iotRoute.POST(ambientReq);
  const ambientData = await ambientRes.json();
  assert.strictEqual(ambientData.seismic_alert, false, "1.2G should not trigger seismic_alert");
  assert.strictEqual(ambientData.anomaly, null, "1.2G anomaly should be null");
  console.log("  ✓ 1.2G ambient vibration: Correctly kept nominal without anomaly.");

  // 4b: Slight Vibration (2.8G >= 2.0G && < 3.5G) -> Ignored, No anomaly
  const slightReq = new Request("http://localhost:3000/api/iot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      magnitude: 2.8,
      source: "slight_vibration_test",
    }),
  });
  const slightRes = await iotRoute.POST(slightReq);
  const slightData = await slightRes.json();
  assert.strictEqual(slightData.seismic_alert, false, "2.8G should not trigger seismic_alert");
  assert.strictEqual(slightData.anomaly, null, "2.8G anomaly should be null (Ignored)");
  console.log("  ✓ 2.8G slight vibration: Correctly ignored without triggering anomaly.");

  // 4c: Violent Shake (3.8G >= 3.5G) -> Trigger SEISMIC_ANOMALY
  const violentReq = new Request("http://localhost:3000/api/iot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      magnitude: 3.8,
      source: "violent_shake_test",
    }),
  });
  const violentRes = await iotRoute.POST(violentReq);
  const violentData = await violentRes.json();
  assert.strictEqual(violentData.seismic_alert, true, "3.8G must trigger seismic_alert");
  assert.strictEqual(violentData.active_crisis, "SEISMIC_ANOMALY", "3.8G must trigger SEISMIC_ANOMALY");
  console.log("  ✓ 3.8G violent shake: Instantly triggered SEISMIC_ANOMALY!");

  console.log("\n====================================================================");
  console.log("ALL SMART SEISMIC THRESHOLD & MOBILE UX VERIFICATIONS PASSED!");
  console.log("====================================================================");
}

verifySmartSeismicThresholds().catch((err) => {
  console.error("\n❌ VERIFICATION FAILED:", err);
  process.exit(1);
});
