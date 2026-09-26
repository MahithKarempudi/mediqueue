# 🏥 MediQueue — Cloud-Native Hospital Resource Management Platform

> A comprehensive, real-time healthcare operations platform featuring 5-role RBAC, dynamic bed/queue tracking, OPD/IPD workflows, diagnostic billing, electronic health records, AI-driven wait-time estimation, and capacity-aware emergency hospital routing.

[![React 19](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Dual--Adapter-FFA611?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🌟 Overview

Overcrowding, delayed bed turnover, non-transparent OPD waiting times, and blind emergency ambulance routing lead to critical delays and hospital turnaways. **MediQueue** solves this by unifying all hospital operations into a single real-time cloud platform with dedicated interfaces for all key healthcare stakeholders.

---

## 👥 5 Stakeholder Portals

| Role | Portal URL | Core Capabilities |
| :--- | :--- | :--- |
| **Patient** | `/patient/dashboard` | Hospital directory, OPD booking, live queue token tracker with AI wait-time estimation, emergency routing, diagnostic reports, online bill payment, centralized medical record timeline. |
| **Hospital Staff** | `/staff/dashboard` | Interactive ward bed management (ICU, General, Emergency), patient registration desk, doctor OPD consultation desk, IPD admissions with atomic bed release, diagnostic lab orders, billing cashier. |
| **Hospital Admin** | `/admin/dashboard` | Ward bed configuration, clinical department management, interactive Recharts analytics (occupancy, footfall, department revenue), CSV compliance reports. |
| **Government Officer** | `/government/dashboard` | Regional public health surveillance, real-time city bed surge heatmap (>85% automated critical alerts), district-level CSV reporting. |
| **Super Admin** | `/superadmin/dashboard` | Multi-hospital onboarding, hospital administrator account provisioning, platform-wide immutable audit logging trace. |

---

## ⚡ Key Technical Highlights

1. **Dual-Layer Persistence & Real-Time Sync:**
   - **Firestore / Relational Persistence:** 15 collections storing persistent hospital entities, appointments, admissions, diagnostic orders, and invoices.
   - **Realtime Database / Live Bus:** High-frequency live nodes (`liveBeds`, `liveQueues`, `emergencyCapacity`) synchronized across browser tabs in under 50ms using Web `BroadcastChannel` (`mediqueue_live_bus`) and Firebase Realtime Database adapters.
2. **AI-Driven OPD Wait-Time Predictor:**
   - Evaluates queue position, doctor consultation velocity, and historical visit distributions (trained on 445 synthetic clinical visits) to provide accurate patient wait-time ETAs.
3. **Capacity-Aware Emergency Router:**
   - Integrates Haversine distance, travel time, and **real-time ICU bed availability** into a composite routing score to prevent ambulances from arriving at hospitals with zero critical-care beds.
4. **Atomic Bed Turnover:**
   - Discharging an IPD patient executes an atomic transaction releasing the ward bed, incrementing city emergency capacity, and generating the consolidated billing invoice in one step.
5. **Zero-Credential Offline Mode & 1-Click Persona Switcher:**
   - Run demonstrations out of the box with zero cloud setup or API keys using the built-in reactive storage seam and header role switcher.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18.0 or newer)
- npm or yarn

### Installation & Run

```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/mediqueue.git
cd mediqueue

# 2. Install dependencies
npm install

# 3. Seed synthetic data (hospitals, doctors, beds, patients)
npm run seed

# 4. Start local development server
npm run dev
```

Navigate to `http://127.0.0.1:5173` in your browser.

---

## 🔑 Demo Personas (1-Click Switcher)

Click the **Role Dropdown** in the top navigation bar to instantly switch personas:

| Persona | Role | Email |
| :--- | :--- | :--- |
| **Priya Sharma** | Patient | `patient@mediqueue.demo` |
| **Dr. Rajesh Kumar** | Hospital Staff | `staff@mediqueue.demo` |
| **Sunita Rao** | Hospital Admin | `admin@mediqueue.demo` |
| **Vikramaditya Sen** | Government Officer | `officer@mediqueue.demo` |
| **Dev Anand** | Super Admin | `superadmin@mediqueue.demo` |

---

## 📂 Project Architecture

```
mediqueue/
├── public/                  # Static assets & favicon
├── scripts/
│   └── seed.ts              # Synthetic data seeding runner
├── src/
│   ├── components/
│   │   ├── auth/            # ProtectedRoute & RBAC guards
│   │   └── layout/          # AppLayout, Navbar with Role Switcher, Sidebar
│   ├── context/
│   │   └── AuthContext.tsx  # Authentication state & persona switcher
│   ├── pages/
│   │   ├── admin/           # Hospital Admin dashboards, analytics & reports
│   │   ├── auth/            # Login and 403 Unauthorized screens
│   │   ├── government/      # Public health surge map & compliance reports
│   │   ├── patient/         # Patient booking, queue, billing, timeline, emergency
│   │   ├── staff/           # Ward beds, OPD queue desk, IPD admissions, diagnostics
│   │   └── superadmin/      # Hospital onboarding, accounts & audit logs
│   ├── services/
│   │   ├── db/              # Unified database service (Firestore + RTDB)
│   │   ├── firebase.ts      # Firebase SDK configuration
│   │   ├── mockStorage.ts   # Reactive LocalStorage + BroadcastChannel seam
│   │   └── seed/            # Canonical synthetic dataset (5 hospitals, 180 beds)
│   ├── types/               # TypeScript interfaces for all 15 collections & live models
│   ├── App.tsx              # Application routing & layout tree
│   ├── index.css            # Tailwind CSS styling tokens
│   └── main.tsx             # Application bootstrap
├── database.rules.json      # Firebase Realtime Database security rules
├── firestore.rules          # Firebase Firestore security rules
└── package.json
```

---

## 🛡️ Data Privacy & Synthetic Dataset Notice

All records, patient profiles, physician names, and medical diagnoses within this repository are **100% synthetic mock data** generated strictly for academic, educational, and testing purposes. No Personally Identifiable Information (PII) or Protected Health Information (PHI) is contained.

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
