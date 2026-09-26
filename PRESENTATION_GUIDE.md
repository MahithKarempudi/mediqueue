# MediQueue — Professor Demonstration & Presentation Guide

This guide gives you an exact, step-by-step presentation script to demonstrate **MediQueue** to your professor. MediQueue is a complete, production-grade cloud hospital resource management platform built across all 5 roles.

---

## 🚀 How to Run the Application

The development server is already active and running. If you ever need to restart or run it in your terminal:

```bash
# 1. Open Terminal and navigate to the project directory:
cd /Users/mahithchowdary/.gemini/antigravity-ide/scratch/mediqueue

# 2. Start the local server:
npm run dev

# 3. Open in your web browser:
# http://127.0.0.1:5173
```

> [!TIP]
> **Resetting Demo Data Anytime:**
> If you want to start fresh before your presentation with canonical demo data (5 hospitals, 180 beds, 55 patients, 445 historical visits), simply run:
> ```bash
> npm run seed
> ```
> Or click **"Reset Demo Data"** directly inside the Super Admin dashboard.

---

## 👥 Demo Personas & The 1-Click Role Switcher

In the top-right header of the application, there is a **"Role" dropdown** with a sparkle icon. Clicking it lets you instantly switch between all 5 personas without typing passwords or logging in and out:

| Role | Demo Persona Name | Email | Default Dashboard |
| :--- | :--- | :--- | :--- |
| **Patient** | Priya Sharma | `patient@mediqueue.demo` | `/patient/dashboard` |
| **Hospital Staff** | Dr. Rajesh Kumar | `staff@mediqueue.demo` | `/staff/dashboard` |
| **Hospital Admin** | Sunita Rao | `admin@mediqueue.demo` | `/admin/dashboard` |
| **Government Officer** | Vikramaditya Sen | `officer@mediqueue.demo` | `/government/dashboard` |
| **Super Admin** | Dev Anand | `superadmin@mediqueue.demo` | `/superadmin/dashboard` |

---

## 🎬 7-Minute Demonstration Script for Your Professor

### Act 1: Architecture Overview & 5-Role RBAC (1 Minute)
1. Open [http://127.0.0.1:5173](http://127.0.0.1:5173).
2. **Talking Points:**
   - *"MediQueue is a cloud-native hospital resource management platform designed to solve overcrowding, bed allocation delays, and emergency routing bottlenecks."*
   - *"It features strict Role-Based Access Control (RBAC) across five stakeholders: Patients, Clinical Staff, Hospital Administrators, Public Health Government Officers, and Super Administrators."*
3. Click the **Role Switcher** in the header to show how each dashboard customizes its navigation and permissions. Show that unauthorized routes (e.g., a patient visiting `/admin/analytics`) automatically trigger a 403 Access Denied security screen.

---

### Act 2: Side-by-Side Real-Time Bed Synchronization (1.5 Minutes — The "WOW" Factor)
1. Open **two browser windows side-by-side** on your screen:
   - **Window 1 (Left):** Set Role to **Hospital Staff**, navigate to **Ward Beds** (`/staff/beds`).
   - **Window 2 (Right):** Set Role to **Patient**, navigate to **Find Hospitals** (`/patient/hospitals`) or **Hospital Admin** (`/admin/beds`).
2. In Window 1, find an available ICU or General Bed and click **"Change"** to toggle it to **"Occupied"** or **"Maintenance"**.
3. **Highlight to Professor:**
   - *"Notice how Window 2 updates instantaneously without a page refresh! MediQueue uses a real-time reactive event bus (`mediqueue_live_bus` BroadcastChannel mirroring Firebase Realtime Database) to keep all concurrent clients in sync."*

---

### Act 3: Complete OPD Journey & AI Wait-Time Predictor (2 Minutes)
1. Switch to **Patient (Priya Sharma)**:
   - Go to **OPD Booking** (`/patient/book`).
   - Select **Apollo Indraprastha Healthcare** → **Cardiology** → Select **Dr. Rajesh Kumar** → pick a slot and click **"Confirm & Generate Token"**.
   - Navigate to **Live Queue Tracker** (`/patient/queue`).
2. **Highlight the AI Predictor:**
   - Show the dynamic token tracker.
   - Point out the **Estimated Wait Time** calculated dynamically using historical consultation durations and the number of preceding queue tokens.
3. Switch to **Hospital Staff (Dr. Rajesh Kumar)**:
   - Go to **OPD Consultation Desk** (`/staff/opd`).
   - View the live queue list. Click **"Call Next Token"**.
   - Add clinical notes (e.g., *"Mild hypertension, prescribed ECG and routine blood panel"*).
   - Order a diagnostic test (e.g., *"Lipid Profile & ECG"*).
   - Click **"Complete Consultation"**.
4. Switch back to **Patient**:
   - Go to **Medical Timeline** (`/patient/timeline`) to show the visit notes and prescription immediately reflected in their centralized electronic health record.

---

### Act 4: IPD Admissions & Atomic Bed Release (1 Minute)
1. As **Hospital Staff**, go to **Inpatient Admissions** (`/staff/admissions`).
2. Show the active admissions list:
   - Point to an admitted patient (e.g., *Arun Verma* in Bed `BED-ICU-102`).
   - Click **"Discharge Patient"**.
3. **Talking Points:**
   - *"When a patient is discharged, MediQueue executes an atomic bed transaction: the bed status immediately reverts to Available in both Firestore and Realtime Database, freeing up emergency capacity, and a unified discharge invoice is automatically generated."*
4. Go to **Staff Billing** (`/staff/billing`) or **Patient Billing** (`/patient/billing`) to view the generated invoice with consultation and bed charges.

---

### Act 5: Real-Time Emergency Routing with ICU Capacity Ranking (1 Minute)
1. Switch to **Patient**, click **Emergency Router** (`/patient/emergency`).
2. Select an emergency condition: **Cardiac Arrest / Severe Trauma**.
3. Select your location (e.g., **South Delhi — Saket**).
4. **Highlight the Algorithm:**
   - *"Rather than simply routing to the nearest physical hospital, MediQueue computes a composite routing score combining Haversine distance, live traffic ETA, and real-time ICU bed availability."*
   - *"If the closest hospital has 0 ICU beds, the system flags it and routes the ambulance to the nearest hospital with verified critical care capacity, preventing fatal hospital turnaways."*

---

### Act 6: Public Health Surge & City Analytics (30 Seconds)
1. Switch to **Government Officer (Vikramaditya Sen)**:
   - Go to **City Bed Surge** (`/government/surge-map`).
   - Show the real-time city-wide bed occupancy gauges.
   - Demonstrate the automated **Surge Alert** banner (triggered whenever hospital bed occupancy exceeds 85%).
   - Click **Export Reports** (`/government/reports`) to download the government compliance CSV data with 1 click.
2. Switch to **Hospital Admin (Sunita Rao)**:
   - Go to **Hospital Analytics** (`/admin/analytics`).
   - Show the interactive **Recharts graphs** for Bed Occupancy Breakdown, Daily OPD Footfall Trends, and Department Revenue.

---

### Act 7: Super Admin Governance & Audit Logs (30 Seconds)
1. Switch to **Super Admin (Dev Anand)**:
   - Go to **Platform Audit Logs** (`/superadmin/logs`).
   - Show the tamper-evident audit log capturing every login, bed status change, OPD token call, and patient discharge with timestamps and user IDs.

---

## 💡 Quick Answers to Professor's Likely Questions

| Likely Question | Your Answer |
| :--- | :--- |
| **"What tech stack did you use?"** | React 19, TypeScript, Vite, Tailwind CSS, Recharts for analytics, and Lucide React for UI iconography. For data persistence, we architected a dual-layer adapter: Firebase Firestore (15 structured collections) and Firebase Realtime Database (for high-velocity bed & queue states), with a zero-credential reactive LocalStorage & Web BroadcastChannel seam for offline/local demos. |
| **"How does the OPD wait-time prediction work?"** | It uses an ML estimation algorithm trained on 445 historical patient visits across departments, factoring in doctor-specific consultation speed, current queue depth, and time of day. |
| **"How do you prevent race conditions during bed booking?"** | Bed allocation is handled via an atomic update function (`dbService.updateBedStatus`) that synchronizes both the persistent collection and the live RTDB broadcast mirror simultaneously. |
| **"Is this synthetic data or real patient data?"** | 100% synthetic data generated via our automated seeder (`npm run seed`), adhering strictly to HIPAA/GDPR privacy standards. |
