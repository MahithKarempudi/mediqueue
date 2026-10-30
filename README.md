# 🏥 MediQueue — Healthcare Operations & Cyber-Forensics Platform

> **Academic Prototype Notice**: MediQueue is an educational and research prototype built for academic demonstration. All patient records, physician names, hospitals, diagnostic reports, and operational metrics are **100% synthetic mock data**. It is **not** a certified medical device, is **not** HIPAA/GDPR certified, and must **never** be used for real patient care or live clinical decision-making.

[![React 19](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-26%20Passed-green?logo=vitest&logoColor=white)](https://vitest.dev/)
[![Security: RBAC Strict](https://img.shields.io/badge/Security-RBAC%20Least--Privilege-blue)](#-security-model--rbac-matrix)
[![Forensics: SHA-256 Chain](https://img.shields.io/badge/Forensics-Tamper--Evident%20SHA--256-orange)](#-cyber-forensics-tamper-evident-audit-trail)

---

## 🌟 Executive Overview

Hospital overcrowding, uncoordinated OPD queues, delayed bed turnovers, and emergency routing turnaways present major operational hurdles in modern healthcare. **MediQueue** demonstrates a cloud-native platform architecture resolving these challenges through:

1. **5 Role-Based Portals** (Patient, Hospital Staff / Doctor, Hospital Admin, Government Officer, Super Admin).
2. **"MediQueue AI Assistant — Ask, Find & Act"** with 6 allowlisted backend tools and role-scoped execution.
3. **Controlled 4-Stage Appointment Confirmation Engine** featuring full-context slot identity, atomic 5-minute reservations, idempotency protection, and explicit consent validation.
4. **Tamper-Evident Cyber-Forensics SHA-256 Audit Trail** with UTF-8 byte hashing, sequence verification, and payload recomputation for adversarial tamper detection.
5. **Zero-Credential Local Demo Mode** featuring instant persona switching and persistent synthetic data indicators.

---

## 🚀 Quick Start (Local Demo Mode)

MediQueue runs out-of-the-box locally **without requiring Firebase credentials, cloud infrastructure, or external paid AI API keys**.

### 1. Prerequisites
- **Node.js**: v18.0.0 or later (v20+ recommended)
- **npm**: v9.0.0 or later

### 2. Installation & Launch

```bash
# Clone the repository
git clone https://github.com/MahithKarempudi/mediqueue.git
cd mediqueue

# Install dependencies (including React 19, Vite 8, Recharts, Vitest)
npm install

# Start the local development server (runs in Demo Mode by default)
npm run dev
```

Open your browser at: **`http://localhost:5173`** (or the port displayed in the terminal).

### 3. Running Automated Tests

```bash
# Run all 26 automated unit and security tests via Vitest
npm test

# Run build verification (TypeScript compile + Vite production bundle)
npm run build
```

---

## 🔑 Demo Personas & Simulation Switcher

In Demo Mode, a persistent **"DEMO MODE — SYNTHETIC DATA"** banner is anchored to the header. A top-bar **"Persona Switcher (Simulation Only)"** allows instant evaluation of all 5 stakeholder roles without entering credentials.

> ⚠️ **Academic Simulation Notice**: The Persona Switcher is strictly a local educational simulation tool. It is automatically disabled when production Firebase credentials are provided. Client-side role claims are never trusted for cloud authorization.

| Persona | Role | Simulated Identity | Core Authorized Capabilities |
| :--- | :--- | :--- | :--- |
| **Priya Sharma** | `patient` | `pat_demo_01` | Book OPD slots, track live token queue, check hospital bed capacity, view own bills and diagnostic records, chat with AI Assistant. |
| **Dr. Rajesh Kumar** | `staff` | `hosp_metro_01` (Cardiology) | Call OPD tokens, write prescriptions, view assigned hospital beds, update bed status (available, cleaning, maintenance), query hospital queue. |
| **Sunita Rao** | `hospital_admin` | `hosp_metro_01` | Manage ward bed inventory, department staffing, review census & revenue analytics, export hospital operational reports. |
| **Vikramaditya Sen** | `government_officer` | District Directorate | View city-wide hospital surge map, district bed occupancy heatmaps, aggregate epidemiology statistics. **Strictly restricted from viewing individual patient records**. |
| **Dev Anand** | `super_admin` | System Directorate | Onboard new hospitals, inspect platform audit log hash chains, verify cryptographic integrity, trigger adversarial tamper simulations. |

---

## 🛡️ Security Model & RBAC Matrix

MediQueue adheres to the **Principle of Least Privilege**:

| Feature / Resource | Patient | Hospital Staff | Hospital Admin | Government Officer | Super Admin |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Personal Health Records (PHI)** | ✅ (Own Only) | ✅ (Assigned Hosp) | ❌ | ❌ (Aggregate Only) | ❌ |
| **Slot Search & OPD Booking** | ✅ | ✅ (Assigned Hosp) | ❌ | ❌ | ❌ |
| **Ward Bed Status Updates** | ❌ | ✅ (Assigned Hosp) | ✅ (Assigned Hosp) | ❌ | ❌ |
| **Live Queue Token Calling** | ❌ | ✅ (Assigned Dept) | ❌ | ❌ | ❌ |
| **Hospital Operational Analytics** | ❌ | ❌ | ✅ (Assigned Hosp) | ❌ | ❌ |
| **District Surge Surveillance** | ❌ | ❌ | ❌ | ✅ (Aggregate Only) | ✅ |
| **Forensic Audit Hash Verification**| ❌ | ❌ | ❌ | ❌ | ✅ |
| **Tamper Simulation (Demo Only)** | ❌ | ❌ | ❌ | ❌ | ✅ |

### Security Rules Implementation
- **`firestore.rules`**: Prevents client-side privilege escalation (`affectedKeys().hasAny(['role', 'hospitalId', 'patientId'])`), enforces hospital scope matching, limits patient record reads to resource owners, and restricts government officers strictly to `daily_reports` and `monthly_reports`.
- **`database.rules.json`**: Broad root `.read` has been **completely removed**. Realtime nodes (`liveBeds/$hospitalId`, `liveQueues/$hospitalId`) require authenticated tokens matching the target hospital scope.
- **Fail-Safe Persistence Seam**: In cloud mode, any Firestore/RTDB failure throws an explicit, user-facing error and **never** silently degrades to a mock write.

---

## 📅 Reliable Appointment Confirmation Workflow

MediQueue enforces an authoritative, backend-mediated 4-stage appointment confirmation engine:

```
[1. Full-Context Slot Discovery] 
       ↓ (Hospital + Specialty + Doctor + Date + Time)
[2. Intent Preparation & 5-Min Lock] 
       ↓ (Status: AWAITING_CONFIRMATION)
[3. User Review Card & Explicit Consent] 
       ↓ (Consultation Type Selector + Fee Summary + Mandatory Consent Checkbox)
[4. Backend Concurrency Revalidation & Atomic Commit]
       ↓ (Idempotency Key Verification + Collision Detection)
[5. Authoritative Token Issued & Forensic Audit Logged]
```

### Key Workflow Safeguards:
- **Full-Context Slot Identity**: Slots encapsulate `hospitalId`, `departmentId`, `doctorId`, `date`, and `time`—eliminating ambiguity.
- **Atomic 5-Minute Hold**: Placing an intent reserves the slot temporarily; expired intents are automatically released.
- **Mandatory Consent Checkbox**: Bookings cannot proceed without an explicit authorization action from the patient.
- **Idempotency Protection**: Rapid double-clicks or repeated submissions with the same idempotency key return the committed record without duplicating bookings or queue tokens.
- **Concurrent Collision Handling**: If another user reserves a slot concurrently, the backend aborts the transaction cleanly with a descriptive message and invites the user to select an alternate slot.

---

## 🤖 MediQueue AI Assistant — Ask, Find & Act

Integrated across all 5 portals, the **MediQueue AI Assistant** executes actions exclusively through **6 narrow, allowlisted backend tools**:

1. `searchAppointmentSlots`: Finds available OPD slots filtered by specialty and authorized facility.
2. `getMyAppointments`: Retrieves appointments strictly belonging to the caller's verified identity.
3. `getRequestStatus`: Inspects the real-time status of pending booking intents and queue positions.
4. `getAuthorizedBedAvailability`: Queries ward bed occupancies scoped to the user's hospital.
5. `getHospitalOperationalSummary`: Computes bed turnover and census metrics for administrators.
6. `updateBedStatus`: Authorizes staff to transition bed states (`available`, `cleaning`, `occupied`, `maintenance`).

### Architecture & Safety Principles:
- **User Prompt → AI Dispatcher → Tool Allowlist → RBAC & Scope Validator → Authoritative Backend → Forensic Audit → Result Card**.
- **Transparent Demo Engine**: Operates locally with a high-fidelity rule-based engine when external LLM APIs are not configured. Clearly explains to users that AI advice does not replace medical consultation.
- **Consequential Actions Require Consent**: The assistant prepares booking intents and structured confirmation cards; it never commits medical reservations autonomously.

---

## 🔍 Cyber-Forensics Tamper-Evident Audit Trail

MediQueue features an append-only, SHA-256 cryptographic audit chain (`src/services/forensics/auditChainService.ts`) providing verifiable provenance for all sensitive actions:

- **Genesis Block**: Root block anchored at index 0 with standard previous hash `0000000000000000000000000000000000000000000000000000000000000000`.
- **UTF-8 Byte Hashing**: RFC 6234 compliant SHA-256 implementation operating strictly on canonical UTF-8 bytes to ensure consistent hashing across non-ASCII characters and emojis.
- **Payload Recomputation**: Chain verification does not merely trust stored payload hashes—it recomputes `sha256(canonicalPayload)` from stored event fields to detect in-place column tampering.
- **Adversarial Tamper Simulation**: Super Admins can simulate an adversary altering an event payload or deleting a block, demonstrating how the chain verifier pinpoints the exact tampered index.

---

## 🧪 Automated Test Suite

MediQueue includes 26 automated unit, security, and workflow tests executed via **Vitest**:

```bash
npx vitest run
```

### Test Coverage Summary:
- **`tests/forensics_chain.test.ts` (7 tests)**:
  - Genesis block generation & standard 64-char zero-anchor verification.
  - 100% integrity validation on untouched chains.
  - In-place adversary payload tampering detection.
  - Block deletion and sequence discontinuity detection.
  - Block reordering detection.
  - Genesis anchor previousHash tampering detection.
  - Deterministic Unicode and emoji UTF-8 hashing.
- **`tests/auth_permissions.test.ts` (7 tests)**:
  - Cross-patient appointment access denial.
  - Cross-patient booking intent creation rejection.
  - Staff foreign hospital slot query rejection.
  - Staff foreign hospital appointment record viewing rejection.
  - Government officer clinical slot query denial.
  - Government officer booking intent rejection.
  - Patient bed status modification rejection.
- **`tests/appointments_workflow.test.ts` (8 tests)**:
  - Valid slot search execution.
  - Booking intent creation with 5-minute hold in `AWAITING_CONFIRMATION` state.
  - Confirmation rejection without explicit consent.
  - Atomic booking commit, token assignment, and forensic hash generation.
  - Idempotency key duplicate protection.
  - Concurrent slot collision handling.
  - Non-owner cancellation rejection.
  - Owner cancellation with explicit authorization.
- **`tests/demo_behavior.test.ts` (4 tests)**:
  - Deterministic synthetic seeding (5 hospitals, 180 beds, 55 patients, 460 visits).
  - Credential-free switching across all 5 demo personas.
  - Total storage isolation & clean re-seeding.
  - Synthetic data verification (no real PHI).

---

## ⚙️ Environment Configuration (Cloud Mode)

To run MediQueue against a live Firebase project instead of Demo Mode:

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Populate the required Firebase configuration values:
   ```env
   VITE_FIREBASE_API_KEY="your-api-key"
   VITE_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
   VITE_FIREBASE_PROJECT_ID="your-project-id"
   VITE_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
   VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
   VITE_FIREBASE_APP_ID="your-app-id"
   VITE_FIREBASE_DATABASE_URL="https://your-project-default-rtdb.firebaseio.com"
   ```
3. When these variables are provided, MediQueue connects directly to Firestore and Realtime Database, automatically disabling the simulation persona switcher and enforcing cloud security rules.

---

## 📂 Repository Structure

```
mediqueue/
├── public/                       # Static branding and assets
├── scripts/
│   └── seed.ts                   # CLI synthetic seeding runner
├── src/
│   ├── components/
│   │   ├── appointments/         # AppointmentConfirmationCard & Booking Review
│   │   ├── auth/                 # ProtectedRoute & RBAC security guards
│   │   └── layout/               # Navbar (with Demo Mode Badge), Sidebar, Layout
│   ├── context/
│   │   └── AuthContext.tsx       # Auth provider & demo persona switcher
│   ├── pages/
│   │   ├── admin/                # Hospital Admin dashboard, beds, analytics & reports
│   │   ├── auth/                 # Login & 403 Forbidden screens
│   │   ├── government/           # Public health surge map & compliance reports
│   │   ├── patient/              # OPD booking, AI Assistant, live queue, billing, timeline
│   │   ├── staff/                # Ward bed manager, OPD desk, IPD admissions, diagnostics
│   │   └── superadmin/           # Hospital onboarding, accounts, and forensic audit timeline
│   ├── services/
│   │   ├── ai/                   # AI Assistant orchestration engine & allowlisted tools
│   │   ├── appointments/         # Concurrency-safe appointment backend & holds
│   │   ├── db/                   # Dual persistence adapter (Firestore / Local Seam)
│   │   ├── firebase.ts           # Firebase SDK initialization
│   │   ├── forensics/            # RFC 6234 UTF-8 SHA-256 audit hash chain service
│   │   ├── mockStorage.ts        # Reactive storage engine + cross-tab synchronization
│   │   └── seed/                 # Deterministic synthetic data generators
│   ├── types/                    # Domain models, appointments workflow, and RBAC types
│   ├── App.tsx                   # Central router & role-protected route tree
│   ├── index.css                 # Tailwind CSS tokens
│   └── main.tsx                  # App bootstrap & auto-seeding entry point
├── tests/                        # Vitest automated test suites
│   ├── appointments_workflow.test.ts
│   ├── auth_permissions.test.ts
│   ├── demo_behavior.test.ts
│   └── forensics_chain.test.ts
├── database.rules.json           # Firebase Realtime Database security rules
├── firestore.rules               # Firebase Firestore security rules
├── DEMO_SCRIPT.md                # 5-7 minute professor presentation guide
├── package.json
└── tsconfig.json
```

---

## ⚠️ Known Limitations & Remaining Risks

1. **Hash Chain Immutability**: A client-side hash chain is **tamper-evident, not tamper-proof**. If an adversary has write access to the underlying storage medium, they could theoretically recompute subsequent blocks. In production, chain tips must be anchored periodically to an immutable external ledger or write-once cloud storage.
2. **Local Concurrency Scope**: In demo mode, concurrency checks and slot holds use local in-memory locking and browser `BroadcastChannel`. In multi-tenant cloud deployments, concurrency must be enforced via Cloud Firestore distributed transactions or Cloud Functions.
3. **Synthetic Dataset Scope**: All medical metrics, triage scores, and medication lists are fictional representations. Clinical efficacy is not validated.

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
