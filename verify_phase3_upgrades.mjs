// ==============================================================================
// APU-Nexus Phase 3: Automated Multi-Stage Verification Script (verify_phase3_upgrades.mjs)
// Tests:
// 1. IoT Endpoint Validation (8.5G vibration -> SEISMIC_ANOMALY)
// 2. GitHub GitOps API Syntax Check (AST/Regex check for fetch, POST, Tree, Commit, PR)
// 3. FinOps & ESG Calculation Accuracy (carbon_kg_co2e strictly equals power_usage_kw * 0.4)
// 4. Discord Webhook Logic Presence (embeds with title, color, fields)
// 5. UI & Build Integrity (Deploy to GitHub button, dynamic SVG <rect>/<path> with fill-red-500)
// ==============================================================================

import fs from "fs";
import path from "path";
import assert from "assert";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runPhase3Verification() {
  console.log("====================================================================");
  console.log("STARTING APU-NEXUS PHASE 3 ENTERPRISE REALITY POLISH AUDIT");
  console.log("====================================================================\n");

  // -------------------------------------------------------------------------
  // TEST 1: IoT Endpoint Validation
  // -------------------------------------------------------------------------
  console.log("[TEST 1] Testing IoT Endpoint Validation (/api/iot)...");
  const iotRoute = await import("./app/api/iot/route.js");
  if (typeof iotRoute.POST !== "function") {
    throw new Error("FAIL: /api/iot route does not export a POST function.");
  }

  const mockIotRequest = new Request("http://localhost:3000/api/iot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      magnitude: 8.5,
      x: 4.8,
      y: 5.2,
      z: 9.8,
      source: "verify_phase3_test_sensor",
    }),
  });

  const iotResponse = await iotRoute.POST(mockIotRequest);
  assert.strictEqual(iotResponse.status, 200, "IoT route must respond with status 200");
  const iotData = await iotResponse.json();

  const isSeismicAnomalyFlagged =
    iotData.anomaly === "SEISMIC_ANOMALY" ||
    iotData.active_crisis === "SEISMIC_ANOMALY" ||
    iotData.status === "SEISMIC_ANOMALY" ||
    iotData.crisis_type === "SEISMIC_ANOMALY" ||
    iotData.flag === "SEISMIC_ANOMALY" ||
    JSON.stringify(iotData).includes("SEISMIC_ANOMALY");

  assert.ok(
    isSeismicAnomalyFlagged,
    `FAIL: /api/iot failed to flag SEISMIC_ANOMALY on 8.5G vibration. Received: ${JSON.stringify(iotData)}`
  );
  assert.strictEqual(iotData.seismic_alert, true, "seismic_alert must be true for 8.5G");
  console.log("  ✓ Mock 8.5G vibration POST triggered SEISMIC_ANOMALY flag successfully.");
  console.log(`  ✓ IoT telemetry output: magnitude=${iotData.magnitude}G, status=${iotData.status}, anomaly=${iotData.anomaly}`);

  // -------------------------------------------------------------------------
  // TEST 2: GitHub GitOps API Syntax Check
  // -------------------------------------------------------------------------
  console.log("\n[TEST 2] Testing GitHub GitOps API Syntax Check (app/api/github/route.js)...");
  const githubRoutePath = path.join(__dirname, "app/api/github/route.js");
  assert.ok(fs.existsSync(githubRoutePath), "FAIL: app/api/github/route.js does not exist");

  const githubRouteContent = fs.readFileSync(githubRoutePath, "utf-8");

  // Check fetch to GitHub API
  assert.ok(
    githubRouteContent.includes("https://api.github.com") &&
      githubRouteContent.includes("fetch"),
    "FAIL: fetch to https://api.github.com/... must be present in app/api/github/route.js"
  );

  // Check POST method
  assert.ok(
    githubRouteContent.includes("POST") || githubRouteContent.includes('"POST"'),
    "FAIL: POST method must be present in app/api/github/route.js"
  );

  // Check Git Trees payload structure: base_tree & tree array
  assert.ok(
    githubRouteContent.includes("base_tree") && githubRouteContent.includes("tree"),
    "FAIL: JSON payload for Git Tree creation (base_tree and tree array) must be present"
  );

  // Check Git Commit payload structure: message & tree & parents
  assert.ok(
    githubRouteContent.includes("message") && githubRouteContent.includes("parents"),
    "FAIL: JSON payload for Commit creation (message, tree, parents) must be present"
  );

  // Check Pull Request payload structure: title & head & base & body
  assert.ok(
    githubRouteContent.includes("title") &&
      githubRouteContent.includes("head") &&
      githubRouteContent.includes("base") &&
      githubRouteContent.includes("body"),
    "FAIL: JSON payload for PR creation (title, head, base, body) must be present"
  );

  // Verify export of POST handler
  const githubModule = await import("./app/api/github/route.js");
  assert.strictEqual(typeof githubModule.POST, "function", "FAIL: app/api/github/route.js must export POST");

  console.log("  ✓ app/api/github/route.js exists and exports POST handler.");
  console.log("  ✓ Verified presence of fetch('https://api.github.com/...') calls.");
  console.log("  ✓ Verified JSON payload structures for Tree, Commit, and Pull Request creation.");

  // -------------------------------------------------------------------------
  // TEST 3: FinOps & ESG Calculation Accuracy
  // -------------------------------------------------------------------------
  console.log("\n[TEST 3] Testing FinOps & ESG Calculation Accuracy (lib/data_simulator.js)...");
  const simulator = await import("./lib/data_simulator.js");

  // Run initial state and simulation loop
  let testState = simulator.createInitialCampusState();
  assert.ok(testState, "FAIL: createInitialCampusState() returned null/undefined");

  // Verify strict equality: carbon_kg_co2e strictly equals power_usage_kw * 0.4
  assert.strictEqual(
    testState.carbon_kg_co2e,
    testState.power_usage_kw * 0.4,
    `FAIL: Baseline carbon_kg_co2e (${testState.carbon_kg_co2e}) does not strictly equal power_usage_kw * 0.4 (${testState.power_usage_kw * 0.4})`
  );

  // Verify in simulation tick loop
  for (let i = 0; i < 5; i++) {
    testState = simulator.generateNormalTick(testState);
    assert.strictEqual(
      testState.carbon_kg_co2e,
      testState.power_usage_kw * 0.4,
      `FAIL: Tick ${i} carbon_kg_co2e (${testState.carbon_kg_co2e}) does not strictly equal power_usage_kw * 0.4 (${testState.power_usage_kw * 0.4})`
    );

    // Verify each individual zone has carbon_kg_co2e === power_usage_kw * 0.4
    for (const [zName, zone] of Object.entries(testState.zones)) {
      assert.strictEqual(
        zone.carbon_kg_co2e,
        zone.power_usage_kw * 0.4,
        `FAIL: Zone ${zName} carbon_kg_co2e does not strictly equal power_usage_kw * 0.4`
      );
    }
  }

  // Assert projected trajectory variables exist in output object
  assert.ok(
    testState.projected_power_kw !== undefined,
    "FAIL: projected_power_kw missing from simulation output"
  );
  assert.ok(
    testState.projected_carbon_kg_co2e !== undefined,
    "FAIL: projected_carbon_kg_co2e missing from simulation output"
  );
  assert.ok(
    testState.projected_carbon_trajectory !== undefined,
    "FAIL: projected_carbon_trajectory missing from simulation output"
  );
  assert.ok(
    testState.projected_trajectory !== undefined,
    "FAIL: projected_trajectory missing from simulation output"
  );
  assert.ok(
    testState.total_co2e_saved !== undefined || testState.carbon_saved_kg_co2e !== undefined,
    "FAIL: total_co2e_saved or carbon_saved_kg_co2e missing from simulation output"
  );

  console.log(`  ✓ Verified strict equality: carbon_kg_co2e === power_usage_kw * 0.4 (${testState.carbon_kg_co2e} kg CO2e)`);
  console.log(`  ✓ Verified projected trajectory variables: projected_carbon=${testState.projected_carbon_kg_co2e} kg, projected_power=${testState.projected_power_kw} kW`);
  console.log(`  ✓ Verified ESG savings tracking: total_co2e_saved=${testState.total_co2e_saved} kg CO2e`);

  // -------------------------------------------------------------------------
  // TEST 4: Discord Webhook Logic Presence
  // -------------------------------------------------------------------------
  console.log("\n[TEST 4] Testing Discord Webhook Logic Presence (lib/gemini_agent.js)...");
  const agentPath = path.join(__dirname, "lib/gemini_agent.js");
  const agentContent = fs.readFileSync(agentPath, "utf-8");

  // Check that sendDiscordAlert exists
  const geminiModule = await import("./lib/gemini_agent.js");
  assert.strictEqual(
    typeof geminiModule.sendDiscordAlert,
    "function",
    "FAIL: sendDiscordAlert function not exported from lib/gemini_agent.js"
  );

  // Assert fetch is called with embeds array containing title, color, and fields
  assert.ok(
    agentContent.includes("embeds") &&
      agentContent.includes("title") &&
      agentContent.includes("color") &&
      agentContent.includes("fields"),
    "FAIL: Discord webhook payload must contain embeds array with title, color, and fields"
  );

  assert.ok(
    agentContent.includes("fetch(") || agentContent.includes("fetch ("),
    "FAIL: fetch call missing in lib/gemini_agent.js for Discord webhook"
  );

  // Test sendDiscordAlert execution in standalone mode
  const discordResult = await geminiModule.sendDiscordAlert(
    {
      anomaly_type: "Seismic Shock (8.4G)",
      affected_zone: "Server Room Core",
      root_cause: "High-voltage transformer arc detected",
      status: "critical",
    },
    {
      cloud_action_taken: "Failover cluster deployed in asia-southeast1-b",
      estimated_savings_myr: 1850,
      iac_manifest: "resource \"google_compute_firewall\" \"isolate\" {}",
    }
  );

  assert.ok(discordResult.payload, "FAIL: sendDiscordAlert did not generate a payload");
  assert.ok(Array.isArray(discordResult.payload.embeds), "FAIL: payload must have embeds array");
  assert.ok(discordResult.payload.embeds[0].title, "FAIL: embed must have title");
  assert.ok(typeof discordResult.payload.embeds[0].color === "number", "FAIL: embed must have numeric color");
  assert.ok(Array.isArray(discordResult.payload.embeds[0].fields), "FAIL: embed must have fields array");

  console.log("  ✓ sendDiscordAlert function exported and verified.");
  console.log("  ✓ fetch is called with Rich Embed containing title, color, and fields.");
  console.log(`  ✓ Discord embed title: "${discordResult.payload.embeds[0].title}", color: 0x${discordResult.payload.embeds[0].color.toString(16)}`);

  // -------------------------------------------------------------------------
  // TEST 5: UI & Build Integrity
  // -------------------------------------------------------------------------
  console.log("\n[TEST 5] Testing UI & Build Integrity (app/page.jsx)...");
  const pagePath = path.join(__dirname, "app/page.jsx");
  const pageContent = fs.readFileSync(pagePath, "utf-8");

  // Check Deploy to GitHub text/button
  assert.ok(
    pageContent.includes("Deploy to GitHub") || pageContent.includes("[Deploy to GitHub]"),
    "FAIL: Deploy to GitHub button/text missing in app/page.jsx"
  );

  // Check SVG components <path> or <rect> with dynamic Tailwind color logic
  assert.ok(
    pageContent.includes("<rect") && pageContent.includes("<path"),
    "FAIL: SVG <rect> and <path> components missing in app/page.jsx"
  );

  assert.ok(
    pageContent.includes("fill-red-500"),
    "FAIL: Dynamic fill-red-500 Tailwind logic missing in SVG components"
  );

  assert.ok(
    pageContent.includes("animate-pulse"),
    "FAIL: Dynamic animate-pulse Tailwind logic missing in SVG components"
  );

  assert.ok(
    pageContent.includes("zone.status === 'critical'") ||
      pageContent.includes("zone.status === \"critical\"") ||
      pageContent.includes("zone.status === 'CRITICAL'"),
    "FAIL: Dynamic condition for zone.status === 'critical' missing in SVG components"
  );

  // Check Recharts predictive dotted line (strokeDasharray="5 5")
  assert.ok(
    pageContent.includes('strokeDasharray="5 5"'),
    "FAIL: Predictive dotted line (strokeDasharray=\"5 5\") missing in Recharts"
  );

  // Check "Total CO2e Saved" KPI card
  assert.ok(
    pageContent.includes("Total CO2e Saved"),
    "FAIL: 'Total CO2e Saved' green KPI card missing in app/page.jsx"
  );

  console.log("  ✓ Deploy to GitHub button confirmed in app/page.jsx.");
  console.log("  ✓ Interactive 2D Spatial Campus Map contains <rect> and <path> with dynamic Tailwind color logic (fill-red-500, animate-pulse).");
  console.log("  ✓ Recharts predictive dotted line (strokeDasharray=\"5 5\") confirmed.");
  console.log("  ✓ 'Total CO2e Saved' green KPI card confirmed.");

  console.log("\n====================================================================");
  console.log("ALL PHASE 3 VERIFICATION TESTS PASSED (5 / 5)");
  console.log("====================================================================");
}

runPhase3Verification().catch((err) => {
  console.error("\n❌ PHASE 3 VERIFICATION FAILED:", err);
  process.exit(1);
});
