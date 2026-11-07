// Module-level singleton state for cross-device mobile IoT bridge
if (!globalThis.__apuIotState) {
  globalThis.__apuIotState = {
    x: 0.0,
    y: 0.0,
    z: 9.8,
    magnitude: 1.0,
    seismic_alert: false,
    device_connected: false,
    last_updated: null,
    source: "idle",
  };
}

/**
 * GET /api/iot
 * Returns the latest mobile IoT accelerometer telemetry
 */
export async function GET() {
  // If no updates in the last 15 seconds, mark device as idle
  const now = Date.now();
  if (
    globalThis.__apuIotState.last_updated &&
    now - globalThis.__apuIotState.last_updated > 15000
  ) {
    globalThis.__apuIotState.device_connected = false;
  }

  return Response.json(globalThis.__apuIotState, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

/**
 * POST /api/iot
 * Ingests live telemetry from the mobile accelerometer or touch simulator
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      x = 0.0,
      y = 0.0,
      z = 9.8,
      magnitude = 1.0,
      seismic_alert = false,
      source = "mobile_sensor",
    } = body;

    const magNumber = Number(Number(magnitude).toFixed(2));
    const isAlert = Boolean(seismic_alert || magNumber > 2.2);

    globalThis.__apuIotState = {
      x: Number(Number(x).toFixed(2)),
      y: Number(Number(y).toFixed(2)),
      z: Number(Number(z).toFixed(2)),
      magnitude: magNumber,
      seismic_alert: isAlert,
      device_connected: true,
      last_updated: Date.now(),
      source,
    };

    return Response.json(globalThis.__apuIotState, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    return Response.json(
      { error: "Failed to ingest IoT telemetry", details: error.message },
      { status: 500 }
    );
  }
}
