// ==============================================================================
// APU-Nexus: Multi-Zone IoT, Cloud & Network Telemetry Simulator
// Tracks real-time campus metrics across 4 APU zones with crisis injection
// and self-healing autonomous remediation logic.
// Includes Mobile IoT Accelerometer Seismic / Vibration Telemetry (Phase 2)
// ==============================================================================

export const ZONE_NAMES = [
  "Block B - AI Labs",
  "APU Library Level 2",
  "Main Auditorium",
  "Server Room Core",
];

export const CRISIS_TYPES = {
  NETWORK_STORM: "NETWORK_STORM",
  IOT_THERMAL_RUNAWAY: "IOT_THERMAL_RUNAWAY",
  ENERGY_WASTE_ANOMALY: "ENERGY_WASTE_ANOMALY",
  SEISMIC_ANOMALY: "SEISMIC_ANOMALY",
};

/**
 * Creates the initial baseline campus digital twin state
 */
export function createInitialCampusState() {
  const timestamp = 1730976000000;
  const zones = {
    "Block B - AI Labs": {
      name: "Block B - AI Labs",
      code: "ZONE-B-AILAB",
      wifi_load: 45.2,
      packet_loss: 0.15,
      latency_ms: 18.4,
      server_cpu: 41.5,
      cloud_instances: 4,
      ac_temp_c: 22.0,
      power_usage_kw: 38.5,
      occupancy_count: 65,
      vibration_g: 1.01,
      status: "HEALTHY",
      active_alert: null,
    },
    "APU Library Level 2": {
      name: "APU Library Level 2",
      code: "ZONE-LIB-LVL2",
      wifi_load: 38.6,
      packet_loss: 0.08,
      latency_ms: 14.8,
      server_cpu: 24.8,
      cloud_instances: 2,
      ac_temp_c: 23.5,
      power_usage_kw: 22.4,
      occupancy_count: 84,
      vibration_g: 0.99,
      status: "HEALTHY",
      active_alert: null,
    },
    "Main Auditorium": {
      name: "Main Auditorium",
      code: "ZONE-AUD-MAIN",
      wifi_load: 18.5,
      packet_loss: 0.04,
      latency_ms: 12.1,
      server_cpu: 18.0,
      cloud_instances: 2,
      ac_temp_c: 24.2,
      power_usage_kw: 14.8,
      occupancy_count: 12,
      vibration_g: 1.0,
      status: "HEALTHY",
      active_alert: null,
    },
    "Server Room Core": {
      name: "Server Room Core",
      code: "ZONE-SRV-CORE",
      wifi_load: 14.2,
      packet_loss: 0.01,
      latency_ms: 4.2,
      server_cpu: 54.0,
      cloud_instances: 6,
      ac_temp_c: 19.8,
      power_usage_kw: 64.5,
      occupancy_count: 1,
      vibration_g: 1.02,
      status: "HEALTHY",
      active_alert: null,
    },
  };

  return computeAggregateState(zones, {
    timestamp,
    overall_status: "STABLE",
    active_crisis: null,
    resolved_incidents_count: 14,
    uptime_sla: 99.98,
    monthly_savings_myr: 4850,
    last_remediation: null,
  });
}

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

function randomDelta(range) {
  return (Math.random() * 2 - 1) * range;
}

/**
 * Recomputes aggregate high-level stats from zone telemetry
 */
function computeAggregateState(zones, metadata = {}) {
  const zoneList = Object.values(zones);
  const count = zoneList.length || 1;

  const avg_wifi_load = Number(
    (zoneList.reduce((acc, z) => acc + z.wifi_load, 0) / count).toFixed(1)
  );
  const avg_latency_ms = Number(
    (zoneList.reduce((acc, z) => acc + z.latency_ms, 0) / count).toFixed(1)
  );
  const avg_packet_loss = Number(
    (zoneList.reduce((acc, z) => acc + z.packet_loss, 0) / count).toFixed(2)
  );
  const avg_server_cpu = Number(
    (zoneList.reduce((acc, z) => acc + z.server_cpu, 0) / count).toFixed(1)
  );
  const total_cloud_instances = zoneList.reduce((acc, z) => acc + z.cloud_instances, 0);
  const total_power_kw = Number(
    zoneList.reduce((acc, z) => acc + z.power_usage_kw, 0).toFixed(1)
  );
  const total_occupancy = zoneList.reduce((acc, z) => acc + z.occupancy_count, 0);

  const hasCritical = zoneList.some((z) => z.status === "CRITICAL");
  const hasRemediating = zoneList.some((z) => z.status === "REMEDIATING");
  const hasWarning = zoneList.some((z) => z.status === "WARNING");

  let overall_status = metadata.overall_status || "STABLE";
  if (hasCritical) {
    overall_status = "CRITICAL";
  } else if (hasRemediating) {
    overall_status = "REMEDIATING";
  } else if (hasWarning) {
    overall_status = "WARNING";
  } else if (metadata.active_crisis === null && overall_status !== "REMEDIATED") {
    overall_status = "STABLE";
  }

  return {
    timestamp: metadata.timestamp !== undefined ? metadata.timestamp : 1730976000000,
    overall_status,
    active_crisis: metadata.active_crisis || null,
    resolved_incidents_count: metadata.resolved_incidents_count ?? 14,
    uptime_sla: metadata.uptime_sla ?? 99.98,
    monthly_savings_myr: metadata.monthly_savings_myr ?? 4850,
    last_remediation: metadata.last_remediation || null,
    avg_wifi_load,
    avg_latency_ms,
    avg_packet_loss,
    avg_server_cpu,
    total_cloud_instances,
    total_power_kw,
    total_occupancy,
    zones,
  };
}

/**
 * Generates natural tick-to-tick realistic telemetry fluctuations
 * @param {Object} currentState - Current campus state or null
 * @returns {Object} Updated state
 */
export function generateNormalTick(currentState) {
  const state = currentState ? JSON.parse(JSON.stringify(currentState)) : createInitialCampusState();
  const zones = { ...state.zones };

  for (const zoneName of Object.keys(zones)) {
    const z = { ...zones[zoneName] };

    // If zone is in critical crisis mode, maintain elevated state with slight variance
    if (z.status === "CRITICAL") {
      if (state.active_crisis === CRISIS_TYPES.NETWORK_STORM && zoneName === "Block B - AI Labs") {
        z.wifi_load = Number(clamp(z.wifi_load + randomDelta(0.5), 97.5, 99.9).toFixed(1));
        z.packet_loss = Number(clamp(z.packet_loss + randomDelta(0.4), 16.0, 22.0).toFixed(2));
        z.latency_ms = Number(clamp(z.latency_ms + randomDelta(10), 390, 480).toFixed(0));
        z.server_cpu = Number(clamp(z.server_cpu + randomDelta(1.0), 94.0, 99.0).toFixed(1));
      } else if (state.active_crisis === CRISIS_TYPES.IOT_THERMAL_RUNAWAY && zoneName === "Server Room Core") {
        z.ac_temp_c = Number(clamp(z.ac_temp_c + randomDelta(0.2), 33.8, 35.8).toFixed(1));
        z.power_usage_kw = Number(clamp(z.power_usage_kw + randomDelta(1.0), 96.0, 102.0).toFixed(1));
        z.server_cpu = Number(clamp(z.server_cpu + randomDelta(1.0), 86.0, 94.0).toFixed(1));
      } else if (state.active_crisis === CRISIS_TYPES.ENERGY_WASTE_ANOMALY && zoneName === "APU Library Level 2") {
        z.power_usage_kw = Number(clamp(z.power_usage_kw + randomDelta(1.5), 140.0, 149.0).toFixed(1));
        z.ac_temp_c = Number(clamp(z.ac_temp_c + randomDelta(0.2), 16.5, 17.5).toFixed(1));
      } else if (state.active_crisis === CRISIS_TYPES.SEISMIC_ANOMALY) {
        if (zoneName === "Server Room Core") {
          z.vibration_g = Number(clamp(z.vibration_g + randomDelta(0.15), 8.1, 8.8).toFixed(2));
          z.server_cpu = Number(clamp(z.server_cpu + randomDelta(0.4), 96.0, 99.0).toFixed(1));
          z.power_usage_kw = Number(clamp(z.power_usage_kw + randomDelta(1.5), 158.0, 166.0).toFixed(1));
        } else if (zoneName === "Block B - AI Labs") {
          z.packet_loss = Number(clamp(z.packet_loss + randomDelta(0.4), 22.0, 26.0).toFixed(2));
        }
      }
    } else {
      // Normal healthy fluctuation
      z.wifi_load = Number(clamp(z.wifi_load + randomDelta(1.5), 12.0, 68.0).toFixed(1));
      z.packet_loss = Number(clamp(z.packet_loss + randomDelta(0.02), 0.01, 0.8).toFixed(2));
      z.latency_ms = Number(clamp(z.latency_ms + randomDelta(0.8), 8.0, 28.0).toFixed(1));
      z.server_cpu = Number(clamp(z.server_cpu + randomDelta(1.8), 15.0, 62.0).toFixed(1));
      z.ac_temp_c = Number(clamp(z.ac_temp_c + randomDelta(0.15), 20.0, 24.5).toFixed(1));
      z.power_usage_kw = Number(clamp(z.power_usage_kw + randomDelta(0.8), 12.0, 75.0).toFixed(1));
      z.occupancy_count = Math.round(clamp(z.occupancy_count + randomDelta(2), 0, 130));
      z.vibration_g = Number(clamp((z.vibration_g || 1.0) + randomDelta(0.01), 0.96, 1.08).toFixed(2));
    }

    zones[zoneName] = z;
  }

  return computeAggregateState(zones, state);
}

/**
 * Triggers one of the 4 crisis scenarios for demonstration
 * @param {string} crisisType - 'NETWORK_STORM' | 'IOT_THERMAL_RUNAWAY' | 'ENERGY_WASTE_ANOMALY' | 'SEISMIC_ANOMALY'
 * @param {Object} currentState - Current state or null
 * @returns {Object} Crisis state
 */
export function triggerCrisisMode(crisisType, currentState) {
  const state = currentState ? JSON.parse(JSON.stringify(currentState)) : createInitialCampusState();
  const zones = { ...state.zones };

  if (crisisType === CRISIS_TYPES.NETWORK_STORM || crisisType === "NETWORK_STORM") {
    // Spikes Block B wifi_load to 99%, packet_loss to 18%, latency_ms to 420ms, server_cpu to 96%
    const target = zones["Block B - AI Labs"] || { name: "Block B - AI Labs" };
    zones["Block B - AI Labs"] = {
      ...target,
      wifi_load: 99.0,
      packet_loss: 18.0,
      latency_ms: 420.0,
      server_cpu: 96.0,
      cloud_instances: 2,
      status: "CRITICAL",
      active_alert: "CRITICAL: Wi-Fi Access Point Saturated & Cloud Run Under-provisioned (DDOS/Burst)",
    };
    state.active_crisis = CRISIS_TYPES.NETWORK_STORM;
    state.overall_status = "CRITICAL";
  } else if (crisisType === CRISIS_TYPES.IOT_THERMAL_RUNAWAY || crisisType === "IOT_THERMAL_RUNAWAY") {
    // Spikes Server Room ac_temp_c to 34.5°C and power_usage_kw to 98% capacity
    const target = zones["Server Room Core"] || { name: "Server Room Core" };
    zones["Server Room Core"] = {
      ...target,
      ac_temp_c: 34.5,
      power_usage_kw: 98.0,
      server_cpu: 89.5,
      status: "CRITICAL",
      active_alert: "CRITICAL: HVAC Compressor Unit 2 Tripped - Thermal Runaway Risk",
    };
    state.active_crisis = CRISIS_TYPES.IOT_THERMAL_RUNAWAY;
    state.overall_status = "CRITICAL";
  } else if (crisisType === CRISIS_TYPES.ENERGY_WASTE_ANOMALY || crisisType === "ENERGY_WASTE_ANOMALY") {
    // Sets Library occupancy_count to 3 students while keeping power_usage_kw at peak 145kW and ac_temp_c at 17°C
    const target = zones["APU Library Level 2"] || { name: "APU Library Level 2" };
    zones["APU Library Level 2"] = {
      ...target,
      occupancy_count: 3,
      power_usage_kw: 145.0,
      ac_temp_c: 17.0,
      status: "CRITICAL",
      active_alert: "WARNING: High-load HVAC & Lighting Active in Near-Empty Zone (Energy Anomaly)",
    };
    state.active_crisis = CRISIS_TYPES.ENERGY_WASTE_ANOMALY;
    state.overall_status = "CRITICAL";
  } else if (crisisType === CRISIS_TYPES.SEISMIC_ANOMALY || crisisType === "SEISMIC_ANOMALY") {
    // Spikes Server Room vibration to 8.4G, CPU to 98%, power to 162kW, and Block B packet loss to 24%
    const targetServer = zones["Server Room Core"] || { name: "Server Room Core" };
    zones["Server Room Core"] = {
      ...targetServer,
      vibration_g: 8.4,
      server_cpu: 98.0,
      power_usage_kw: 162.0,
      status: "CRITICAL",
      active_alert: "CRITICAL: Severe 8.4G Seismic/Structural Vibration Detected in Server Room Core",
    };

    const targetBlockB = zones["Block B - AI Labs"] || { name: "Block B - AI Labs" };
    zones["Block B - AI Labs"] = {
      ...targetBlockB,
      packet_loss: 24.0,
      status: "CRITICAL",
      active_alert: "CRITICAL: Power fluctuation induced switch packet loss in Block B",
    };

    state.active_crisis = CRISIS_TYPES.SEISMIC_ANOMALY;
    state.overall_status = "CRITICAL";
  }

  return computeAggregateState(zones, state);
}

/**
 * Applies autonomous self-healing remediation and brings metrics back to healthy green levels
 * @param {string} crisisType - The crisis being resolved
 * @param {Object} currentState - Current state
 * @returns {Object} Remediated state
 */
export function applyAutonomousFix(crisisType, currentState) {
  const state = currentState ? JSON.parse(JSON.stringify(currentState)) : createInitialCampusState();
  const zones = { ...state.zones };

  const effectiveCrisis = crisisType || state.active_crisis || CRISIS_TYPES.NETWORK_STORM;
  let savingsDelta = 450;
  let remediationDetails = "";

  if (effectiveCrisis === CRISIS_TYPES.NETWORK_STORM || effectiveCrisis === "NETWORK_STORM") {
    const target = zones["Block B - AI Labs"];
    if (target) {
      zones["Block B - AI Labs"] = {
        ...target,
        wifi_load: 42.0,
        packet_loss: 0.15,
        latency_ms: 19.0,
        server_cpu: 38.0,
        cloud_instances: 8,
        status: "HEALTHY",
        active_alert: null,
      };
    }
    savingsDelta = 680;
    remediationDetails = "Autoscaled Cloud Run instances to 8, rerouted Block B VLAN via SD-WAN backup pipe.";
  } else if (effectiveCrisis === CRISIS_TYPES.IOT_THERMAL_RUNAWAY || effectiveCrisis === "IOT_THERMAL_RUNAWAY") {
    const target = zones["Server Room Core"];
    if (target) {
      zones["Server Room Core"] = {
        ...target,
        ac_temp_c: 21.5,
        power_usage_kw: 62.0,
        server_cpu: 52.0,
        status: "HEALTHY",
        active_alert: null,
      };
    }
    savingsDelta = 1250;
    remediationDetails = "Activated Auxiliary Chiller BACnet actuator; rebalanced core blade workloads.";
  } else if (effectiveCrisis === CRISIS_TYPES.ENERGY_WASTE_ANOMALY || effectiveCrisis === "ENERGY_WASTE_ANOMALY") {
    const target = zones["APU Library Level 2"];
    if (target) {
      zones["APU Library Level 2"] = {
        ...target,
        ac_temp_c: 23.5,
        power_usage_kw: 21.0,
        occupancy_count: 3,
        status: "HEALTHY",
        active_alert: null,
      };
    }
    savingsDelta = 820;
    remediationDetails = "Throttled smart VRF AC units to Eco Mode (23.5°C) & dimmed Zone L2 lighting to 30%.";
  } else if (effectiveCrisis === CRISIS_TYPES.SEISMIC_ANOMALY || effectiveCrisis === "SEISMIC_ANOMALY") {
    const targetServer = zones["Server Room Core"];
    if (targetServer) {
      zones["Server Room Core"] = {
        ...targetServer,
        vibration_g: 1.02,
        server_cpu: 44.0,
        power_usage_kw: 58.0,
        status: "HEALTHY",
        active_alert: null,
      };
    }
    const targetBlockB = zones["Block B - AI Labs"];
    if (targetBlockB) {
      zones["Block B - AI Labs"] = {
        ...targetBlockB,
        packet_loss: 0.12,
        status: "HEALTHY",
        active_alert: null,
      };
    }
    savingsDelta = 1850;
    remediationDetails = "Isolated high-voltage substation breaker SRV-CORE-HV1, engaged redundant UPS grid, and migrated critical AI workloads to GCP asia-southeast1-b.";
  }

  state.active_crisis = null;
  state.overall_status = "REMEDIATED";
  state.resolved_incidents_count = (state.resolved_incidents_count || 14) + 1;
  state.monthly_savings_myr = (state.monthly_savings_myr || 4850) + savingsDelta;
  state.last_remediation = {
    crisis: effectiveCrisis,
    timestamp: Date.now(),
    details: remediationDetails,
    savings_myr: savingsDelta,
  };

  return computeAggregateState(zones, state);
}

export default {
  ZONE_NAMES,
  CRISIS_TYPES,
  createInitialCampusState,
  generateNormalTick,
  triggerCrisisMode,
  applyAutonomousFix,
};
