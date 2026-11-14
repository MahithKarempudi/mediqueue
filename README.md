# 🏥 MediQueue AI — Hospital Resource Coordination & Clinical Scheduling Platform

> **Academic Prototype Notice**: MediQueue AI is an educational, research-oriented platform developed for undergraduate research (UROP) and IEEE conference publication. All patient records, physician schedules, hospital beds, OPD tokens, and lab records are **100% synthetic research data**. It is **not** a certified medical device, has **not** undergone clinical accreditation, and must **never** be used for real patient care or live clinical decision-making.

[![React 19](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-49%20Passed-green?logo=vitest&logoColor=white)](https://vitest.dev/)
[![Security: RBAC Strict](https://img.shields.io/badge/Security-RBAC%20Least--Privilege-blue)](#-security-model--rbac-matrix)
[![Audit: HIPAA §164.312](https://img.shields.io/badge/Audit-HIPAA%20%C2%A7164.312%20Integrity-teal)](#-clinical-audit-trail--system-event-logs)
[![Deploy: Cloudflare Workers](https://img.shields.io/badge/Deploy-Cloudflare%20Workers-orange?logo=cloudflare)](https://mediqueue.mahithkarempudi.workers.dev)

---

## 🌟 Executive Overview

Hospital overcrowding, uncoordinated outpatient department (OPD) queues, delayed inpatient bed turnovers, and emergency department diversion present critical operational hurdles in modern healthcare delivery. **MediQueue AI** presents an AI-assisted hospital resource coordination platform that connects patients, clinical staff, hospital administrators, government health officers, and super administrators through:

1. **5 Role-Based Stakeholder Portals**: Dedicated operational workspaces for Patients, Clinical Staff, Hospital Administrators, Government Public Health Officers, and Super Administrators.
2. **Hybrid Conversational AI Assistant**: Natural language clinical copilot with an allowlist of **10 structured backend tools**, server-side LLM processing with zero frontend secret exposure, and an offline deterministic clinical NLU fallback.
3. **Controlled Concurrency-Safe Appointment Engine**: 4-stage booking workflow featuring slot hold identity, 5-minute atomic reservation locks, explicit patient consent validation, idempotency protection, and race condition collision detection.
4. **Healthcare Audit Trail & Event Logging**: Append-only event log with SHA-256 block hash integrity verification adhering to HIPAA Security Rule §164.312 audit control principles.
5. **Zero-Credential Academic Evaluation**: Dual persistence seam enabling instantaneous testing with pre-seeded synthetic data alongside live Cloud Firestore and Firebase Realtime Database compatibility.

---

## 🚀 Quick Start (Local Development)

MediQueue AI runs out of the box locally **without requiring cloud credentials or external API keys**.

### 1. Prerequisites
- **Node.js**: v18.0.0 or later (v20+ recommended)
- **npm**: v9.0.0 or later

### 2. Installation & Dev Server Launch

```bash
# Clone repository
git clone https://github.com/MahithKarempudi/mediqueue.git
cd mediqueue

# Install dependencies
npm install

# Start development server
npm run dev
```

Open your browser at **`http://localhost:5173`** (or the port displayed in terminal).

### 3. Automated Test Execution

```bash
# Execute all 49 automated unit, authorization, workflow, and AI tool tests
npm test

# Run Oxlint static analysis
npm run lint

# Compile TypeScript and generate production Vite bundle
npm run build
```

---

## 🔑 Role Portals & Authentication Architecture

MediQueue AI implements a strict authentication and authorization model. Access is gated by both client-side route guards (`ProtectedRoute.tsx`) and authoritative server/database rules.

### Institutional Evaluation Personas

For project demonstrations and academic evaluation, the dedicated **`/login`** page provides 1-click persona sign-in alongside traditional email/password authentication:

| Stakeholder Role | Persona Identity | Email / Login | Institutional Scope & Capabilities |
| :--- | :--- | :--- | :--- |
| **Patient** | Priya Sharma | `priya.sharma@mediqueue.org` | Book OPD appointments, track live queue token position, inspect bed availability, review personal bills, view test reports, interact with AI assistant. |
| **Hospital Staff** | Dr. Rajesh Kumar | `rajesh.kumar@mediqueue.org` | Assigned to AIIMS New Delhi (`hosp_metro_01`, Cardiology). Call queue tokens, write prescriptions, order lab/imaging panels, update ward bed status. |
| **Hospital Admin** | Sunita Rao | `sunita.rao@mediqueue.org` | Manage ward bed census, view department staffing, inspect operational occupancy analytics, export hospital-level reports. |
| **Government Officer** | Vikramaditya Sen | `vikramaditya.sen@mediqueue.org` | District Public Health Directorate. Real-time hospital bed surge map, inter-facility capacity comparison, aggregate epidemiological metrics. **Zero access to individual patient PHI**. |
| **Super Admin** | Dev Anand | `dev.anand@mediqueue.org` | System Architecture Directorate. Hospital onboarding, account provisioning, system-wide operational overview, clinical audit trail inspection. |

---

## 🛡️ Security Model & RBAC Matrix

MediQueue AI enforces the **Principle of Least Privilege**:

| Feature / Resource | Patient | Hospital Staff | Hospital Admin | Government Officer | Super Admin |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Personal Health Records (PHI)** | ✅ (Own Only) | ✅ (Assigned Hosp) | ❌ | ❌ (Aggregate Only) | ❌ |
| **Slot Search & Booking** | ✅ | ✅ (Assigned Hosp) | ❌ | ❌ | ❌ |
| **Appointment Rejection / Completion** | ❌ | ✅ (Assigned Hosp) | ✅ (Assigned Hosp) | ❌ | ❌ |
| **Ward Bed Status Updates** | ❌ | ✅ (Assigned Hosp) | ✅ (Assigned Hosp) | ❌ | ❌ |
| **Live Queue Calling & Advancement** | ❌ | ✅ (Assigned Dept) | ❌ | ❌ | ❌ |
| **Hospital Operational Analytics** | ❌ | ❌ | ✅ (Assigned Hosp) | ❌ | ❌ |
| **District Surge Surveillance** | ❌ | ❌ | ❌ | ✅ (Aggregate Only) | ✅ |
| **System Audit Trail Inspection** | ❌ | ❌ | ✅ (Assigned Hosp) | ❌ | ✅ |
| **Hospital Onboarding** | ❌ | ❌ | ❌ | ❌ | ✅ |

### Security Rules Highlights
- **`firestore.rules`**:
  - Restricts patient profile reads strictly to record owners and assigned hospital staff.
  - Prevents client-side privilege escalation (`affectedKeys().hasAny(['role', 'hospitalId', 'patientId', 'privileges'])`).
  - Restricts government officers strictly to aggregate reports (`daily_reports`, `monthly_reports`), denying access to individual patient records.
  - Requires valid appointment status transitions (`Pending`, `Confirmed`, `Cancelled`, `Completed`, `Rejected`).
- **`database.rules.json`**:
  - Denies root read/write access by default (`.read: false`, `.write: false`).
  - Restricts `liveBeds`, `liveQueues`, `hospitalStatus`, and `emergencyCapacity` writes to authorized staff and admins of the target hospital using both custom token claims and database lookups.

---

## 📅 Concurrency-Safe Appointment Workflow

MediQueue AI provides an authoritative, backend-mediated appointment workflow:

```
[1. Full-Context Slot Discovery]
       ↓ (Hospital + Department + Doctor + Date + Time)
[2. Intent Preparation & 5-Min Hold]
       ↓ (Status: AWAITING_CONFIRMATION)
[3. Patient Review & Explicit Consent]
       ↓ (Consultation Type Selector + Fee Summary + Mandatory Consent Checkbox)
[4. Backend Concurrency Revalidation & Atomic Commit]
       ↓ (Idempotency Key Check + Race Condition Collision Detection)
[5. Authoritative Token Issued & Persistent Notification Created]
```

### Key Workflow Safeguards:
1. **Full-Context Slot Identity**: Slots encapsulate `hospitalId`, `departmentId`, `doctorId`, `date`, and `time` to prevent ambiguity.
2. **Atomic 5-Minute Hold**: Placing an intent reserves the slot temporarily; expired intents are rejected on confirmation.
3. **Mandatory Patient Consent**: Bookings cannot proceed without an explicit authorization checkbox from the patient.
4. **Idempotency Protection**: Repeated submissions with the same idempotency key return the committed record without duplicating bookings or queue tokens.
5. **Concurrent Collision Handling**: If another user reserves a slot concurrently, the transaction aborts cleanly with a descriptive message inviting the user to select an alternate slot.
6. **Persistent Lifecycle Notifications**: Confirmations, cancellations, rescheduling, rejections, and completions write persistent notifications to the user's notification feed.

---

## 🤖 Hybrid Conversational AI Assistant

The **MediQueue AI Assistant** understands natural-language clinical queries and maps them to an allowlist of **10 structured backend tools**:

### 10 Allowlisted Backend Tools:
1. `search_doctors`: Find specialist physicians by medical specialty, department, hospital, or name.
2. `get_doctor_availability`: Query real-time OPD consultation slots for a specific physician or date.
3. `search_hospitals`: List facilities by district, bed capacity, and emergency trauma status.
4. `get_appointment_details`: Retrieve authorized appointment records with ownership verification.
5. `create_appointment`: Prepare an authoritative booking intent with a 5-minute hold (`AWAITING_CONFIRMATION`).
6. `cancel_appointment`: Cancel an existing appointment with verified consent and audit logging.
7. `reschedule_appointment`: Reschedule an appointment to a new date/time slot after revalidation.
8. `get_queue_status`: Check real-time queue token status and wait-time regression estimates.
9. `get_bed_availability`: Inpatient ward and ICU census breakdown with bed status metrics.
10. `get_patient_profile`: Retrieve verified patient UHID, blood group, and clinical profile details.

### Security & Privacy Architecture:
- **Zero Frontend Secret Leaks**: LLM API keys (`GEMINI_API_KEY`) are stored strictly in server-side environment variables or Cloudflare Worker secrets. The client calls `/api/ai-assistant`.
- **RBAC Enforcement**: The LLM never directly executes database mutations. Tool requests pass through backend authorization checks before touching persistent storage.
- **Two-Step Consent**: Consequential actions (booking, canceling, rescheduling) require explicit user consent and confirmation.
- **Deterministic Clinical NLU Fallback**: When an external LLM is offline or no API key is provided, the platform seamlessly uses a deterministic clinical entity and intent extractor, clearly labeled as `CLINICAL_NLU_DETERMINISTIC`.

---

## 📋 Clinical Audit Trail & System Event Logs

Adhering to HIPAA Security Rule §164.312 (Audit Controls) and data integrity requirements, MediQueue AI maintains an append-only event log with SHA-256 block hash integrity:

- **Genesis Block**: Root block anchored at index 0 with standard zero-hash anchor.
- **Canonical UTF-8 Serialization**: RFC 6234 compliant SHA-256 hashing on normalized JSON payloads ensuring deterministic cross-platform hash computation.
- **Payload Recomputation**: Log verification recomputes `sha256(canonicalPayload)` from stored event fields to detect in-place data tampering.
- **Patient Privacy**: Patients inspect their own verified consultation history and activity log; super administrators inspect the system-wide audit trail.

---

## 🧪 Automated Test Suite (49 Tests)

MediQueue AI includes 49 automated unit, authorization, workflow, and AI tool tests executed via **Vitest**:

```bash
npx vitest run
```

### Test Suite Breakdown:
- **`tests/auth_session_lifecycle.test.ts` (5 tests)**:
  - Institutional persona profile verification across all 5 roles.
  - Restriction of patient self-registration from hospitalId assignment.
  - Hospital isolation between different hospital staff accounts.
  - Rejection of clinical booking slot queries from government officers.
  - Rejection of cross-patient booking intent confirmation.
- **`tests/auth_permissions.test.ts` (13 tests)**:
  - Positive tests for patient viewing own appointments.
  - Negative tests for cross-patient appointment inspection.
  - Rejection of cross-patient booking intent creation.
  - Staff foreign hospital slot query rejection.
  - Staff foreign hospital appointment record viewing rejection.
  - Government officer clinical slot query denial.
  - Government officer booking intent rejection.
  - Patient bed status modification rejection.
  - Patient role alteration / privilege escalation prevention.
  - Super admin global hospital overview authorization.
- **`tests/appointments_workflow.test.ts` (8 tests)**:
  - Valid slot search execution.
  - Booking intent creation with 5-minute hold in `AWAITING_CONFIRMATION` state.
  - Confirmation rejection without explicit patient consent.
  - Atomic booking commit, token assignment, and audit event creation.
  - Idempotency key duplicate protection.
  - Concurrent slot collision handling.
  - Non-owner cancellation rejection.
  - Owner cancellation with explicit authorization.
- **`tests/ai_assistant_tools.test.ts` (11 tests)**:
  - All 10 allowlisted tools tested with valid parameters.
  - Rejection of unauthorized actions (e.g. government officer attempting to book clinical slots).
  - Explicit confirmation verification for appointment cancellation.
- **`tests/audit_trail.test.ts` (7 tests)**:
  - Genesis block generation & standard 64-char zero-anchor verification.
  - 100% integrity validation on untouched chains.
  - In-place adversary payload tampering detection.
  - Block deletion and sequence discontinuity detection.
  - Block reordering detection.
  - Deterministic Unicode and emoji UTF-8 hashing.
  - Storage rehydration without integrity breakdown.
- **`tests/demo_behavior.test.ts` (5 tests)**:
  - Deterministic synthetic seeding (5 hospitals, 180 beds, 55 patients, 460 visits).
  - Credential-free switching across all 5 demo personas.
  - Total storage isolation & clean re-seeding.
  - Synthetic data verification (no real PHI).

---

## ⚙️ Environment Configuration

### Cloudflare Workers Deployment

The application is deployed on Cloudflare Workers at:
**`https://mediqueue.mahithkarempudi.workers.dev`**

Configuration file: [wrangler.toml](file:///Users/mahithchowdary/Downloads/mediqueue-main/wrangler.toml)  
Worker entrypoint: [worker.js](file:///Users/mahithchowdary/Downloads/mediqueue-main/worker.js)

To deploy updates to Cloudflare Workers:
```bash
# 1. Build the production static assets
npm run build

# 2. Deploy via Wrangler
npx wrangler deploy

# 3. (Optional) Set the server-side Gemini API key secret
npx wrangler secret put GEMINI_API_KEY
```

### Firebase Cloud Mode

To connect to a live Firebase project:
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Populate the Firebase project variables:
   ```env
   VITE_FIREBASE_API_KEY="your-api-key"
   VITE_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
   VITE_FIREBASE_PROJECT_ID="your-project-id"
   VITE_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
   VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
   VITE_FIREBASE_APP_ID="your-app-id"
   VITE_FIREBASE_DATABASE_URL="https://your-project-default-rtdb.firebaseio.com"
   ```
3. Deploy Firestore rules and RTDB rules via Firebase CLI:
   ```bash
   firebase deploy --only firestore:rules,database
   ```

---

## 📂 Repository Structure

```
mediqueue/
├── public/                       # Static assets and icons
├── scripts/
│   └── seed.ts                   # CLI synthetic seeding runner
├── src/
│   ├── components/
│   │   ├── appointments/         # AppointmentConfirmationCard & Booking Review
│   │   ├── auth/                 # ProtectedRoute & RBAC security guards
│   │   ├── layout/               # Navbar, Sidebar, AppLayout
│   │   └── ui/                   # Reusable clinical UI component primitives
│   ├── context/
│   │   ├── AuthContext.tsx       # Auth provider, session handling, logout & login
│   │   ├── roleProfiles.ts       # 5 Stakeholder persona definitions
│   │   └── useAuth.ts            # Auth hook & TypeScript interfaces
│   ├── pages/
│   │   ├── admin/                # Hospital Admin dashboard, beds, analytics & reports
│   │   ├── auth/                 # Dedicated /login page & /unauthorized screen
│   │   ├── government/           # Public health surge map & compliance reports
│   │   ├── patient/              # OPD booking, AI Assistant, live queue, billing, timeline
│   │   ├── staff/                # Ward bed manager, OPD desk, IPD admissions, diagnostics
│   │   └── superadmin/           # Hospital onboarding, accounts, and clinical audit trail
│   ├── services/
│   │   ├── ai/                   # AI Assistant orchestration, 10-tool schema & clinical NLU
│   │   ├── appointments/         # Concurrency-safe appointment backend, holds & notifications
│   │   ├── db/                   # Dual persistence adapter (Firestore / Local Engine)
│   │   ├── firebase.ts           # Firebase SDK initialization & configuration check
│   │   ├── forensics/            # RFC 6234 UTF-8 SHA-256 audit hash chain service
│   │   ├── mockStorage.ts        # Reactive local storage engine with cross-tab events
│   │   └── seed/                 # Deterministic synthetic data generator
│   ├── types/                    # Domain models, appointments workflow, and RBAC types
│   ├── App.tsx                   # Central React router & role-protected route tree
│   ├── index.css                 # Tailwind CSS tokens
│   └── main.tsx                  # App bootstrap entry point
├── tests/                        # Vitest automated test suites
│   ├── ai_assistant_tools.test.ts
│   ├── appointments_workflow.test.ts
│   ├── audit_trail.test.ts
│   ├── auth_permissions.test.ts
│   ├── auth_session_lifecycle.test.ts
│   └── demo_behavior.test.ts
├── worker.js                     # Cloudflare Worker entrypoint & server-side API proxy
├── wrangler.toml                 # Cloudflare Workers configuration
├── database.rules.json           # Firebase Realtime Database security rules
├── firestore.rules               # Firebase Firestore security rules
├── package.json
└── vite.config.ts                # Vite config with server-side AI assistant plugin
```

---

## 📜 Academic Research & IEEE Publication Alignment

This project is prepared for evaluation under the following research dimensions:
1. **Natural Language Intent Recognition**: Precision and recall of intent classification across healthcare administrative queries.
2. **Entity Extraction Accuracy**: Detection of medical specialties, hospital identifiers, appointment dates, and time slots.
3. **Role-Based Scope Enforcement**: Quantifiable verification of zero cross-hospital or cross-patient authorization leaks.
4. **Concurrency Reliability**: Prevention of double-booking under rapid concurrent requests via 5-minute atomic holds and idempotency keys.
5. **Real-Time Queue Telemetry**: Live synchronization latency of queue tokens and bed capacity state transitions.

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
