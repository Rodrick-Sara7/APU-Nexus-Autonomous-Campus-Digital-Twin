// Module-level singleton state for cross-device mobile IoT bridge & CCTV Vision Edge
if (!globalThis.__campusState) {
  globalThis.__campusState = {
    type: "NOMINAL",
    status: "HEALTHY",
    zone: "All APU Zones",
    anomaly: null,
    active_crisis: null,
    crisis_type: null,
    flag: "NORMAL",
    // Accelerometer Telemetry
    x: 0.0,
    y: 0.0,
    z: 9.8,
    magnitude: 1.0,
    seismic_alert: false,
    // CCTV Vision Telemetry
    camera_tampered: false,
    camera_luminance: 120,
    // Connectivity
    device_connected: false,
    cctv_connected: false,
    last_updated: null,
    source: "idle",
  };
}

// Keep __apuIotState aliased to __campusState for seamless backwards compatibility
globalThis.__apuIotState = globalThis.__campusState;

/**
 * GET /api/iot
 * Returns the latest real-time edge telemetry state (Accelerometer & Vision Security)
 */
export async function GET() {
  const now = Date.now();
  if (
    globalThis.__campusState.last_updated &&
    now - globalThis.__campusState.last_updated > 25000
  ) {
    globalThis.__campusState.device_connected = false;
    globalThis.__campusState.cctv_connected = false;
  }

  return Response.json(globalThis.__campusState, {
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
 * Ingests live telemetry from mobile accelerometer or vision security edge node
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      type,
      status,
      zone,
      magnitude,
      x = 0.0,
      y = 0.0,
      z = 9.8,
      seismic_alert = false,
      luminance,
      source,
    } = body;

    const now = Date.now();
    let current = { ...globalThis.__campusState };

    if (type === "CAMERA_TAMPERING" || type === "SECURITY_BREACH") {
      const isCritical = status === "critical" || status === "CRITICAL" || !status;
      current = {
        ...current,
        type: "CAMERA_TAMPERING",
        status: isCritical ? "critical" : "healthy",
        zone: zone || "Server Room Core",
        anomaly: isCritical ? "CAMERA_TAMPERING" : null,
        active_crisis: isCritical ? "CAMERA_TAMPERING" : null,
        crisis_type: isCritical ? "CAMERA_TAMPERING" : null,
        flag: isCritical ? "CAMERA_TAMPERING" : "NORMAL",
        camera_tampered: isCritical,
        camera_luminance: luminance !== undefined ? Number(luminance) : (isCritical ? 8 : 120),
        cctv_connected: true,
        last_updated: now,
        source: source || "cctv_edge_node",
      };
    } else {
      // Accelerometer or general telemetry
      const magNumber =
        magnitude !== undefined
          ? Number(Number(magnitude).toFixed(2))
          : current.magnitude;
      const isAlert = Boolean(
        seismic_alert ||
        type === "SEISMIC_ANOMALY" ||
        magNumber >= 3.5
      );
      const anomalyFlag = isAlert ? "SEISMIC_ANOMALY" : null;

      current = {
        ...current,
        type: isAlert ? "SEISMIC_ANOMALY" : (type || "NOMINAL"),
        status: isAlert ? (status || "SEISMIC_ANOMALY") : "HEALTHY",
        zone: zone || (isAlert ? "Block B - AI Labs" : current.zone),
        anomaly: anomalyFlag,
        active_crisis: anomalyFlag,
        crisis_type: anomalyFlag,
        flag: isAlert ? "SEISMIC_ANOMALY" : "NORMAL",
        magnitude: magNumber,
        seismic_alert: isAlert,
        x: Number(Number(x).toFixed(2)),
        y: Number(Number(y).toFixed(2)),
        z: Number(Number(z).toFixed(2)),
        device_connected: true,
        last_updated: now,
        source: source || (type === "SEISMIC_ANOMALY" ? "mobile_hardware" : "mobile_sensor"),
      };
    }

    globalThis.__campusState = current;
    globalThis.__apuIotState = current;

    return Response.json(current, {
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
