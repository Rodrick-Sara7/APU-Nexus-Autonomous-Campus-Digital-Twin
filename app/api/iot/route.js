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

    if (type === "RESET") {
      current = {
        type: "NOMINAL",
        status: "HEALTHY",
        zone: "All APU Zones",
        anomaly: null,
        active_crisis: null,
        crisis_type: null,
        flag: "NORMAL",
        x: 0.0,
        y: 0.0,
        z: 9.8,
        magnitude: 1.0,
        seismic_alert: false,
        camera_tampered: false,
        camera_luminance: 120,
        device_connected: current.device_connected,
        cctv_connected: current.cctv_connected,
        last_updated: now,
        source: source || "autonomous_remediation_reset",
      };
    } else if (
      type === "CAMERA_TAMPERING" ||
      type === "SECURITY_BREACH" ||
      source?.startsWith("cctv_") ||
      luminance !== undefined
    ) {
      const isCritical =
        (type === "CAMERA_TAMPERING" || type === "SECURITY_BREACH") &&
        (status === "critical" || status === "CRITICAL" || !status);
      const effectiveAnomaly = isCritical
        ? "CAMERA_TAMPERING"
        : current.seismic_alert
        ? "SEISMIC_ANOMALY"
        : null;

      current = {
        ...current,
        type: effectiveAnomaly || "NOMINAL",
        status: isCritical ? "critical" : current.seismic_alert ? "critical" : "healthy",
        zone: zone || "Server Room Core",
        anomaly: effectiveAnomaly,
        active_crisis: effectiveAnomaly,
        crisis_type: effectiveAnomaly,
        flag: effectiveAnomaly || "NORMAL",
        camera_tampered: isCritical,
        camera_luminance: luminance !== undefined ? Number(luminance) : isCritical ? 8 : 120,
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
      const isPassiveHeartbeat =
        source === "standby_heartbeat" || source === "stabilized";
      const isRecentSeismicLatch =
        Boolean(current.seismic_alert) &&
        Boolean(current.last_updated) &&
        now - current.last_updated < 60000;

      const isAlert = Boolean(
        seismic_alert ||
          type === "SEISMIC_ANOMALY" ||
          magNumber >= 3.5 ||
          (isPassiveHeartbeat && isRecentSeismicLatch)
      );
      const effectiveMag =
        isPassiveHeartbeat && isRecentSeismicLatch && magNumber < 3.5
          ? current.magnitude
          : magNumber;

      // Preserve active camera tampering if CCTV sabotage is still active
      const effectiveAnomaly = isAlert
        ? "SEISMIC_ANOMALY"
        : current.camera_tampered
        ? "CAMERA_TAMPERING"
        : null;

      current = {
        ...current,
        type: isAlert ? "SEISMIC_ANOMALY" : current.camera_tampered ? "CAMERA_TAMPERING" : type || "NOMINAL",
        status: isAlert ? status || "SEISMIC_ANOMALY" : current.camera_tampered ? "critical" : "HEALTHY",
        zone: zone || (isAlert ? "Block B - AI Labs" : current.zone),
        anomaly: effectiveAnomaly,
        active_crisis: effectiveAnomaly,
        crisis_type: effectiveAnomaly,
        flag: isAlert ? "SEISMIC_ANOMALY" : current.camera_tampered ? "CAMERA_TAMPERING" : "NORMAL",
        magnitude: effectiveMag,
        seismic_alert: isAlert,
        x: Number(Number(x).toFixed(2)),
        y: Number(Number(y).toFixed(2)),
        z: Number(Number(z).toFixed(2)),
        device_connected: true,
        last_updated: isPassiveHeartbeat && isRecentSeismicLatch ? current.last_updated : now,
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
