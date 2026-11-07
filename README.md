# 🌐 APU-Nexus: Autonomous Campus Digital Twin
### *When Cloud, IoT, and Network Converge (Phase 2 Enterprise Prototype)*
> **Track:** Intelligent Automation & Digital Transformation  
> **Platform:** Next.js 16 (App Router), Tailwind CSS v4, Recharts, Lucide, Google Gemini AI, Firebase RTDB & Mobile Accelerometer Hardware Bridge

---

## 🏛️ Executive Summary

**APU-Nexus** is an autonomous campus infrastructure digital twin engineered for **Asia Pacific University of Technology & Innovation (APU)**. Built to solve high-frequency campus operational bottlenecks, APU-Nexus converges **Software-Defined Networking (SDN)**, **IoT Building Management (BACnet/MQTT)**, **Mobile Accelerometer Hardware Sensors**, and **Cloud Infrastructure (Google Cloud Run / DR Instance Groups)** into a unified real-time telemetry engine governed by an autonomous **5-Agent Multi-Agent Gemini AI Controller** with dynamic **Terraform Infrastructure-as-Code (IaC)** synthesis.

When network storms, server room thermal runaway, energy anomalies, or physical seismic shocks occur, APU-Nexus detects, diagnoses root causes, and deploys self-healing remediation in **under 4 seconds** with zero human intervention.

---

## 🚀 Key Architectural Highlights

### 1. Cross-Device Mobile IoT Hardware Bridge (`/sensor`)
- **Real Accelerometer Streaming:** Connect any mobile phone by navigating to `/sensor`. It hooks into the device's physical accelerometer via `DeviceMotionEvent` (supporting iOS 17+ permission handshake and Android).
- **Dual-Mode Transmission:** Telemetry streams simultaneously via **Firebase Realtime Database** and an in-memory **HTTP State Bridge (`/api/iot`)**, allowing immediate cross-device communication between a presenter's phone and laptop on the local Wi-Fi with zero setup.
- **Fail-Safe Touch Seismic Simulator:** If running on non-HTTPS local IP where mobile browsers restrict motion sensors, presenters can use the interactive **G-Force Slider (1.0G - 9.5G)** or the **[HOLD TO SIMULATE VIOLENT SEISMIC SHAKE]** button to reliably demonstrate the live edge-to-cloud trigger.

### 2. 2D Spatial Campus Digital Twin Topology Map (SVG)
- An architectural visualizer of the 4 APU zones interconnected by animated optical mesh lines and power conduits.
- Dynamic visual feedback: Emerald (Healthy), Pulsing Red (Active Crisis), Cyan (Self-Healing / Re-routing).
- Clickable zone floor nodes that instantly filter telemetry analytics.

### 3. Dynamic Terraform & Kubernetes IaC Engine
- During each incident remediation, the AI controller doesn't just execute CLI commands—it synthesizes production-grade **Terraform (`.tf`)** and **Kubernetes (`deployment.yaml`)** manifests.
- Accessible directly on the dashboard via the **[Generated IaC / Terraform]** inspector tab with a one-click **[Copy IaC]** button.

### 4. 5-Agent Autonomous Orchestration Pipeline
```
[Stage 01: IoT Telemetry Ingestion Agent]
               │ (Sub-second threshold detection & mobile G-force tracking)
               ▼
[Stage 02: Gemini Root-Cause Diagnostic Agent]
               │ (Cross-correlates SDN packet loss, CPU starvation, HVAC temps & seismic vectors)
               ▼
[Stage 03: Resolution Architect Agent]
               │ (Synthesizes zero-downtime execution payload & Terraform / Cloud Run manifests)
               ▼
[Stage 04: Cloud & Edge Execution Agent]
               │ (Dispatches gcloud CLI, BACnet set-points & high-voltage breaker isolation)
               ▼
[Stage 05: Audit & FinOps Compliance Agent]
               │ (Verifies SLA recovery & calculates exact campus savings in MYR)
               ▼
[Autonomous Campus Equilibrium Restored]
```

---

## 🏢 Monitored Campus Zones

| Zone Identifier | Zone Code | Monitored Telemetry | Target Operational Baseline |
| :--- | :--- | :--- | :--- |
| **Block B - AI Labs** | `ZONE-B-AILAB` | Wi-Fi load, packet drop, latency, edge vCPU, Cloud Run replicas | 40-50% Wi-Fi, <0.2% drop, 18ms latency |
| **APU Library Level 2** | `ZONE-LIB-LVL2` | Occupancy (PIR/vision), Smart VRF AC temp, lighting power (kW) | Eco-comfort 23.5°C, dynamic lighting dimming |
| **Main Auditorium** | `ZONE-AUD-MAIN` | Wi-Fi saturation, event power feed, sound/AC load | Nominal low-power standby during non-events |
| **Server Room Core** | `ZONE-SRV-CORE` | Inverter chiller temp (°C), high-density rack power, vibration G-force | Rack temp 19.5°C - 21.5°C, <1.1G vibration, chiller redundancy |

---

## 🎯 Judges' Live Demo Crisis Scenarios

The dashboard features an interactive **Crisis Injection Bar** built specifically for live hackathon presentations:

### Scenario 1: Wi-Fi Storm & Cloud Compute Starvation
- **Trigger:** Click `[Simulate Block B Wi-Fi & Cloud Storm]`
- **Anomaly Injected:** Spikes Block B `wifi_load` to **99.0%**, `packet_loss` to **18.0%**, latency to **420ms**, and server CPU to **96.0%**.
- **Gemini Diagnosis:** Identifies layer-2 broadcast storm compounding Cloud Run replica ceiling starvation.
- **Autonomous Remediation:** 
  `gcloud run services update apu-portal --min-instances=8 --max-instances=16 --region=asia-southeast1 && apu-sdn-ctl vlan isolate --port=eth4/2 --divert=trunk-backup`
- **Result:** Wi-Fi drops to ~42%, latency normalizes to 19ms, instances scale from 2 to 8. **RM 680 saved.**

### Scenario 2: Server Room Core Thermal Runaway
- **Trigger:** Click `[Simulate Server Thermal Runaway]`
- **Anomaly Injected:** Spikes Server Room temperature to **34.5°C** and rack power to **98.0 kW**.
- **Gemini Diagnosis:** Inverter Chiller #2 safety trip detected; high-density GPU cluster rack at risk of thermal shutdown.
- **Autonomous Remediation:**
  `bacnet-cli set-point --unit=CHILLER-AUX-02 --temp=18.0C --fan=100 && ipmi-chassis-power --profile=eco-balance --racks=SRV-RACK-04`
- **Result:** Auxiliary chiller engaged, batch workloads shifted to Google Cloud Vertex spot instances, temperature restored to 21.5°C. **RM 1,250 saved.**

### Scenario 3: Smart-Campus Library HVAC Energy Waste
- **Trigger:** Click `[Simulate Library HVAC Energy Waste]`
- **Anomaly Injected:** Detects 3 students in Library Level 2 while HVAC chills at **17.0°C** consuming peak **145.0 kW**.
- **Gemini Diagnosis:** Occupancy/cooling mismatch caused by lingering event schedule override.
- **Autonomous Remediation:**
  `iot-bacnet-hvac --zone=LIB-LVL2 --set-temp=23.5C --mode=eco && dali-lighting-ctl --zone=LIB-LVL2 --dim=30`
- **Result:** Power consumption drops from 145 kW to 21 kW, saving 84 kg CO2e. **RM 820 saved.**

### Scenario 4: Seismic Structural Shock & High-Voltage Disturbance
- **Trigger:** Click `[Simulate Seismic Power Anomaly (8.4G)]` or shake your mobile phone via `/sensor`.
- **Anomaly Injected:** Detects **8.4G** structural vibration spike, Server Room CPU surges to **98.0%**, power jumps to **162.0 kW**, and Block B suffers **24.0%** packet loss.
- **Gemini Diagnosis:** Severe physical vibration detected; risk of rack mechanical dislocation and transformer arcing.
- **Autonomous Remediation:**
  `gcloud compute instance-groups managed rolling-action replace apu-core-cluster --zone=asia-southeast1-b && bacnet-cli breaker-isolate --substation=SRV-CORE-HV1 --reroute=UPS-GRID-B`
- **Result:** High-voltage substation breaker tripped, load shifted to UPS battery grid, workloads evacuated to GCP disaster recovery cluster in `asia-southeast1-b`. **RM 1,850 saved.**

---

## 🛠️ Getting Started & Installation

### 1. Installation
```bash
git clone https://github.com/Rodrick-Sara7/APU-Nexus-Autonomous-Campus-Digital-Twin.git
cd APU-Nexus-Autonomous-Campus-Digital-Twin
npm install
```

### 2. Running Development Server
```bash
npm run dev
```
- Open Central NOC Dashboard: **[http://localhost:3000](http://localhost:3000)**
- Open Mobile IoT Edge Sensor: **[http://localhost:3000/sensor](http://localhost:3000/sensor)** (or on mobile phone using your computer's local IP address e.g. `http://192.168.x.x:3000/sensor`)

### 3. Automated Audit Verification
```bash
node verify_project.mjs
```

### 4. Production Build
```bash
npm run build
npm run start
```

---

## 📊 Project Structure

```
├── app/
│   ├── api/
│   │   ├── agent/
│   │   │   └── route.js        # 5-Agent Gemini controller API endpoint
│   │   └── iot/
│   │       └── route.js        # Cross-device server in-memory IoT bridge
│   ├── favicon.ico
│   ├── globals.css             # Tailwind dark theme styles
│   ├── layout.js               # Root layout & Geist font
│   ├── page.jsx                # Enterprise NOC Dashboard (1,500+ lines of client React)
│   └── sensor/
│       └── page.jsx            # Mobile IoT Accelerometer & Seismic Sensor App
├── lib/
│   ├── data_simulator.js       # Multi-zone IoT, network & cloud telemetry simulator
│   ├── firebase_setup.js       # Hybrid Firebase RTDB & Pub-Sub vibration bridge
│   └── gemini_agent.js         # 5-Agent Gemini AI brain & Terraform IaC synthesizer
├── postcss.config.mjs          # PostCSS Tailwind CSS plugin config
├── verify_project.mjs          # End-to-end programmatic verification script
└── README.md                   # Full platform and demo documentation
```
