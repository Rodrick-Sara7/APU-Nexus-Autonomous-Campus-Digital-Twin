# 🌐 APU-Nexus: Autonomous Campus Digital Twin
### *True-Edge Hardware Sentinels, Multi-Agent AI Remediation & Human-in-the-Loop Governance*
> **Track:** Intelligent Automation & Digital Transformation  
> **Core Stack:** Next.js 16 (App Router), Tailwind CSS v4, Recharts, Lucide, Google Gemini AI, Firebase RTDB, WebRTC Optical Computer Vision (`/cctv`), & Mobile Hardware Accelerometer (`/sensor`)

---

## 🏛️ Executive Summary

**APU-Nexus** is an autonomous campus infrastructure digital twin engineered for **Asia Pacific University of Technology & Innovation (APU)**. Built to solve high-frequency campus operational bottlenecks, APU-Nexus converges **Software-Defined Networking (SDN)**, **IoT Building Management (BACnet/MQTT)**, **Dual True-Edge Hardware Sentinels (WebRTC Optical Computer Vision & Mobile Accelerometer)**, and **Cloud Infrastructure (Google Cloud Run / DR Instance Groups)** into a unified real-time telemetry engine governed by an autonomous **5-Agent Multi-Agent Gemini AI Controller** with dynamic **Terraform & Kubernetes Infrastructure-as-Code (IaC)** synthesis.

When optical camera sabotage, physical seismic shocks, network storms, server room thermal runaway, or library HVAC energy waste occur, APU-Nexus detects, diagnoses root causes, and either self-heals in **under 4 seconds** (`Full Autonomous` mode) or holds for operator sign-off (`Co-Pilot Governance` mode)—complete with live **Voice NOC** briefings, **Open-Meteo Bukit Jalil** weather correlation, **GitHub GitOps PR** dispatch, and **1-Click Compliance & ESG Audit Report** exports.

---

## 🚀 Key Architectural Highlights

### 1. Dual True-Edge Hardware Sentinels (`/sensor` & `/cctv`)
All edge nodes operate in **single-window SPA navigation** and stream directly into the `/api/iot` cross-device hardware bridge with zero mock reliance:

- **Mobile Hardware Accelerometer Node (`/sensor`):**
  - **60 FPS `DeviceMotionEvent` Streaming:** Hooks into real phone accelerometer/gyroscope hardware (iOS 13+ permission handshake & Android).
  - **3-Tier `3.5G` Smart Deadband:** Cleanly separates nominal ambient vibration (`1.00 G`) and slight vibration (`< 3.5G`, filtered) from violent seismic shock (`>= 3.5G` trigger).
  - **Interactive G-Force Touch Simulator (`1.0G – 9.5G`):** Includes an interactive slider and touch/click fallback button (`[HOLD TO SIMULATE VIOLENT SEISMIC SHAKE]`) so demos work seamlessly on desktop or non-HTTPS local IPs.
- **WebRTC Optical Computer Vision Sentinel (`/cctv`):**
  - **Real-Time RGB Luminance Sampler (`500ms`):** Captures live webcam frames via `getUserMedia` + `<canvas>` and computes average scene luminance (`Lux`).
  - **Optical Sabotage Detection (`<15.0 Lux`):** Automatically detects lens obstruction / physical tampering in **Server Room Core** and dispatches `CAMERA_TAMPERING` to the NOC dashboard.
  - **1-Click Test Mode:** Includes a **[Simulate Cover Lens (<15)]** toggle for instant verification even without physically covering a camera.
- **HTTPS Tunnel Support (for iOS Safari / Mobile Testing):**
  Mobile browsers require HTTPS for `DeviceMotionEvent` and `getUserMedia` camera permissions when accessed remotely:
  ```bash
  npx cloudflared tunnel --url http://localhost:3000
  ```

### 2. Enterprise Governance, Observability & GitOps Features
- **Human-in-the-Loop (HITL) Co-Pilot Governance Toggle:** Switch seamlessly between **`🟢 Mode: Full Autonomous (Auto-Heal)`** and **`🟡 Mode: Co-Pilot Governance (Hold for Approval)`**. In Co-Pilot mode, the 5-Agent pipeline completes diagnosis and IaC synthesis, holds the red alert state on stage for judges/operators, and waits for **`[⚡ Approve & Execute Autonomous Remediation]`**.
- **Live Voice NOC Incident Briefing:** Toggleable **`[🔊 Voice NOC: ON / 🔇 OFF]`** using the native Web Speech API (`window.speechSynthesis`) to announce crisp executive alerts on crisis detection, Co-Pilot hold, and remediation completion.
- **Natural-Language "Ask APU-Nexus" AI Commander:** Interactive command bar with one-click executive prompt chips querying live zone kW loads, temperatures, carbon emissions, RM savings, and 5-Agent defense architecture (powered by Gemini when `GEMINI_API_KEY` is set, or the built-in live telemetry engine with zero keys required).
- **Live Bukit Jalil Weather Correlation:** Polls the free, keyless Open-Meteo satellite API (`3.0554° N, 101.7005° E`) every 60 seconds to correlate tropical ambient temperature and humidity against campus HVAC chiller loads and ESG carbon metrics.
- **Closed-Loop GitOps & 1-Click Compliance Export:**
  - **Automated GitHub Pull Requests (`/api/github`):** Dispatches synthesized Terraform/Kubernetes manifests directly to a GitHub branch and opens a Pull Request.
  - **Discord Webhook Alerts:** Sends rich Red Alert and Green Resolved embeds to operations channels.
  - **1-Click Compliance & ESG Audit Report (`.md`):** Compiles live weather, zone telemetry, FinOps/ESG totals, and the full session incident audit log into `APU-Nexus-Compliance-Report.md`.

### 3. 2D Spatial Campus Digital Twin Topology Map & Dynamic IaC Engine
- Interactive SVG topology across all 4 APU zones with animated optical mesh lines and power conduits (Emerald = Healthy, Pulsing Red = Active Crisis, Cyan/Emerald = Re-routed).
- Real-time **Terraform (`.tf`)** and **Kubernetes (`deployment.yaml`)** manifest synthesizer with one-click **[Copy IaC]** and **[Deploy to GitHub]**.

### 4. 5-Agent Autonomous Orchestration Pipeline
```text
[Stage 01: IoT Telemetry Ingestion Agent]
               │ (Sub-second threshold detection, WebRTC Lux & mobile G-force tracking)
               ▼
[Stage 02: Gemini Root-Cause Diagnostic Agent]
               │ (Cross-correlates SDN packet loss, optical tampering, HVAC temps & seismic vectors)
               ▼
[Stage 03: Resolution Architect Agent]
               │ (Synthesizes zero-downtime execution payload & Terraform / Kubernetes manifests)
               ▼
[Stage 04: Cloud & Edge Execution Agent]
               │ (Holds for HITL Co-Pilot approval if enabled, or executes gcloud, BACnet & SDN commands)
               ▼
[Stage 05: Audit & FinOps Compliance Agent]
               │ (Verifies SLA recovery, updates ESG CO2e & RM savings, and logs compliance audit)
               ▼
[Autonomous Campus Equilibrium Restored]
```

---

## 🏢 Monitored Campus Zones

| Zone Identifier | Zone Code | Monitored Telemetry | Target Operational Baseline |
| :--- | :--- | :--- | :--- |
| **Block B - AI Labs** | `ZONE-B-AILAB` | Wi-Fi load, packet drop, latency, edge vCPU, Cloud Run replicas | 40–50% Wi-Fi, <0.2% drop, 18ms latency |
| **APU Library Level 2** | `ZONE-LIB-LVL2` | Occupancy (PIR/vision), Smart VRF AC temp, lighting power (kW) | Eco-comfort 23.5°C, dynamic lighting dimming |
| **Main Auditorium** | `ZONE-AUD-MAIN` | Wi-Fi saturation, event power feed, sound/AC load | Nominal low-power standby during non-events |
| **Server Room Core** | `ZONE-SRV-CORE` | Optical CCTV Lux, inverter chiller temp (°C), rack power, vibration G-force | ≥15.0 Lux, rack temp 19.5–21.5°C, <1.1G vibration |

---

## 🎯 All 5 Live Demo Crisis Scenarios

1. **CCTV Optical Sabotage (`CAMERA_TAMPERING`)**
   - **Trigger:** Cover webcam lens (`<15.0 Lux`) or click **[Simulate Cover Lens (<15)]** on `/cctv`.
   - **Remediation:** Locks magnetic access doors, switches to thermal backup optics, and dispatches APU security drone. **RM 1,450 saved.**
2. **Seismic Structural Shock (`SEISMIC_ANOMALY`, `>3.5G` / `8.4G`)**
   - **Trigger:** Shake phone (`>=3.5G`) or tap **[HOLD TO SIMULATE VIOLENT SEISMIC SHAKE]** on `/sensor`, or inject `8.4G` from dashboard overrides.
   - **Remediation:** Isolates high-voltage substation breaker to UPS battery grid and evacuates core workloads to GCP `asia-southeast1-b`. **RM 1,850 saved.**
3. **Block B Wi-Fi & Cloud Storm (`NETWORK_STORM`)**
   - **Trigger:** Click **`[Simulate Block B Wi-Fi & Cloud Storm]`** in Overrides.
   - **Remediation:** Isolates SDN broadcast storm VLAN and scales Cloud Run `apu-portal` instances (`min=8, max=16`). **RM 680 saved.**
4. **Server Room Thermal Runaway (`IOT_THERMAL_RUNAWAY`)**
   - **Trigger:** Click **`[Simulate Server Thermal Runaway]`** in Overrides.
   - **Remediation:** Engages auxiliary BACnet chiller (`18.0°C`, `100%` fan) and shifts batch GPU workloads to Vertex spot instances. **RM 1,250 saved.**
5. **Library HVAC Energy Waste (`ENERGY_WASTE_ANOMALY`)**
   - **Trigger:** Click **`[Simulate Library HVAC Energy Waste]`** in Overrides.
   - **Remediation:** Resets Library Level 2 HVAC from `17.0°C` (`145 kW`) to `23.5°C` eco-mode and dims DALI lighting to `30%`, cutting carbon load. **RM 820 saved.**

---

## 🛠️ Zero-Config Quickstart & Verification

> **Zero-Config Guarantee:** Every dashboard feature—including HITL Governance, Voice NOC, Live Open-Meteo Weather, Ask APU-Nexus Commander, `/cctv`, `/sensor`, and Compliance Report Export—works **100% out-of-the-box with zero `.env` keys required**. Optional keys (`GEMINI_API_KEY`, `GITHUB_TOKEN`, `DISCORD_WEBHOOK_URL`) can be added in `.env.local` using `.env.example`.

### 1. Clone & Install
```bash
git clone https://github.com/Rodrick-Sara7/APU-Nexus-Autonomous-Campus-Digital-Twin.git
cd APU-Nexus-Autonomous-Campus-Digital-Twin
npm install
```

### 2. Production Build & Start
```bash
npm install && npm run build && npm run start
```
- Central NOC Dashboard: **[http://localhost:3000](http://localhost:3000)**
- Optical CCTV Sentinel: **[http://localhost:3000/cctv](http://localhost:3000/cctv)**
- Mobile Accelerometer Sentinel: **[http://localhost:3000/sensor](http://localhost:3000/sensor)**

### 3. Run Full Verification Suite
```bash
node verify_project.mjs && node verify_phase3_upgrades.mjs && node verify_phase4.mjs && node verify_smart_thresholds.mjs
```

---

## 📊 Project Structure

```text
├── app/
│   ├── api/
│   │   ├── agent/
│   │   │   └── route.js              # 5-Agent Gemini controller & Ask APU-Nexus Commander API
│   │   ├── github/
│   │   │   └── route.js              # Closed-loop GitOps PR creation API
│   │   └── iot/
│   │       └── route.js              # Cross-device CCTV + Accelerometer hardware bridge
│   ├── cctv/
│   │   └── page.jsx                  # WebRTC Optical Computer Vision Sentinel (<15 Lux)
│   ├── sensor/
│   │   └── page.jsx                  # 60 FPS Mobile Accelerometer & 3.5G Seismic Sentinel
│   ├── globals.css                   # Tailwind CSS v4 dark NOC theme
│   ├── layout.js                     # Root layout & Geist font
│   └── page.jsx                      # Enterprise NOC Dashboard (HITL, Voice, Weather, Commander, Export)
├── lib/
│   ├── data_simulator.js             # Multi-zone IoT, network, FinOps & ESG telemetry engine
│   ├── firebase_setup.js             # Hybrid Firebase RTDB & in-memory pub-sub bridge
│   └── gemini_agent.js               # 5-Agent AI brain, Commander Q&A, Discord & IaC synthesizer
├── verify_project.mjs                # Master end-to-end verification suite (8 checks)
├── verify_phase3_upgrades.mjs        # Phase 3 FinOps, ESG, Discord & GitOps audit
├── verify_phase4.mjs                 # Phase 4 True-Edge CCTV & Accelerometer audit
├── verify_smart_thresholds.mjs       # 3.5G deadband & mobile touch/HTTP fallback audit
└── README.md                         # Complete platform & demo documentation
```
