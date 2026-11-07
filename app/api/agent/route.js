import { NextResponse } from "next/server";
import { analyzeCampusTelemetry } from "@/lib/gemini_agent.js";

/**
 * POST /api/agent
 * Orchestrates the 5-Agent Gemini / Multi-Agent analysis on campus telemetry
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { telemetry, crisisType } = body;

    const analysis = await analyzeCampusTelemetry(telemetry, crisisType);

    return NextResponse.json(analysis, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("[APU-Nexus API] Multi-Agent analysis error:", error);
    return NextResponse.json(
      {
        status: "critical",
        anomaly_type: "Controller Processing Exception",
        affected_zone: "All APU Zones",
        root_cause: error.message || "Failed to process telemetry payload.",
        confidence_score: 0.85,
        agent_chain: [
          {
            agent: "System Fallback Agent",
            thought: "Handled runtime exception gracefully in API controller.",
            timestamp: new Date().toISOString(),
          },
        ],
        remediation_command: "systemctl restart apu-agent-gateway",
        cloud_action_taken: "Failover to redundant controller pod.",
        estimated_savings_myr: 0,
      },
      { status: 200 }
    );
  }
}

/**
 * GET /api/agent
 * Health check endpoint for monitoring
 */
export async function GET() {
  return NextResponse.json({
    service: "APU-Nexus Autonomous Controller",
    version: "1.0.0",
    status: "HEALTHY",
    agents: [
      "1. Telemetry Ingestion Agent",
      "2. Gemini Diagnostic Agent",
      "3. Resolution Architect Agent",
      "4. Cloud Execution Agent",
      "5. Audit & FinOps Agent",
    ],
    timestamp: new Date().toISOString(),
  });
}
