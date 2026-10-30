# 🎓 MediQueue — 5-to-7 Minute Professor Demonstration Script

> **Purpose**: A structured, step-by-step walkthrough to present MediQueue's architecture, role-based workflows, AI assistant, appointment confirmation engine, and cyber-forensics audit trail to your professor.

---

## ⏱️ Presentation Outline (Total: ~6.5 Minutes)

| Phase | Time | Topic | Key Screencast / Action |
| :--- | :---: | :--- | :--- |
| **1. Intro & Architecture** | 1.0 min | Project Scope, Architecture & Demo Mode | Terminal launch, zero-cred mode, persistent badge |
| **2. Patient & AI Assistant** | 2.0 min | MediQueue AI, Slot Search & Confirmation | Prompt query, Section 4 review card, atomic booking |
| **3. Staff Operations** | 1.0 min | Ward Bed Management & Realtime Sync | Ward status transition, live bed occupancy update |
| **4. Government Surveillance**| 0.5 min | Public Health Surge & Aggregate Isolation | Surge alert (>85%), aggregate-only enforcement |
| **5. Cyber-Forensics** | 1.5 min | SHA-256 Hash Chain & Tamper Detection | Valid chain verification, adversary tamper trigger |
| **6. RBAC Guard & Conclusion**| 0.5 min | 403 Security Guard & Academic Disclaimer | Unauthorized URL attempt, prototype limitations |

---

## 🚀 Step 1: Launch & Show Demo Mode (0:00 - 1:00)

1. **Terminal Launch**:
   ```bash
   npm run dev
   ```
2. **Open Browser**: Navigate to `http://localhost:5173`.
3. **What to Say to the Professor**:
   > *"Professor, this is MediQueue, a cloud-native healthcare operations and digital forensics platform. It is designed to solve hospital overcrowding, opaque OPD wait times, and bed management delays.*
   >
   > *Notice the persistent **'DEMO MODE — SYNTHETIC DATA'** badge in the header. The application runs 100% locally with zero cloud credentials required. All data across our 5 synthetic hospitals, 180 beds, and 55 patients is deterministically seeded and completely synthetic."*

---

## 🤖 Step 2: Patient Portal & MediQueue AI Assistant (1:00 - 3:00)

1. **Active Persona**: In the top-right **Persona Switcher**, ensure **Priya Sharma (Patient)** is active.
2. **Navigate to AI Assistant**: Click **"AI Assistant"** in the sidebar (or navigate to `/patient/ai-assistant`).
3. **Trigger Slot Search via AI**:
   - In the suggested prompts bar, click the button: **`"Book Cardiologist for tomorrow"`**.
   - Notice the AI calls the allowlisted backend tool `searchAppointmentSlots`.
4. **Select an Available Slot**:
   - The AI Assistant renders available slots for Cardiology at Metro Hospital.
   - Click the green **"Prepare Booking Intent"** button on any morning slot (e.g., 09:30 AM).
5. **Inspect the Confirmation Card (Section 4 Requirements)**:
   - Point out the **Appointment Confirmation Card**:
     - Doctor: Dr. Rajesh Kumar (Senior Consultant Cardiologist).
     - Slot Time: Scheduled date & time with active **5-Minute Hold Countdown Timer**.
     - Fee: ₹500 standard OPD fee.
     - Consultation Type selector: Toggle between **In-Person** and **Teleconsultation**.
     - Cancellation terms: Free cancellation up to 2 hours prior.
     - **Mandatory Consent Checkbox**: *"I verify my details and explicitly authorize this appointment reservation."*
6. **Demonstrate Guard**: Click "Confirm & Authorize Appointment" **without** ticking the consent box. Show the error: *"Consent required before committing booking."*
7. **Authorize Booking**:
   - Check the consent box and click **"Confirm & Authorize Appointment"**.
   - The backend atomically validates the hold, checks idempotency, commits the record, assigns an authoritative Token (e.g., Token #15), and generates an immutable SHA-256 forensic audit hash.
8. **View in Patient Appointments**:
   - Click **"My Appointments"** in the sidebar. Show the new confirmed appointment with status **"scheduled"**.

---

## 👨‍⚕️ Step 3: Staff Portal & Live Ward Bed Updates (3:00 - 4:00)

1. **Switch Persona**: In the top-bar dropdown, switch to **Dr. Rajesh Kumar (Hospital Staff)**.
2. **Notice Scope**: The navbar immediately updates to show Dr. Rajesh Kumar assigned to **Metro Hospital (hosp_metro_01)**.
3. **Navigate to Ward Beds**: Click **"Ward Beds"** in the sidebar (`/staff/beds`).
4. **Execute an Authorized Bed Status Update**:
   - Locate an available bed (e.g., `ICU-01` or `GEN-04`).
   - Change its status dropdown to **"cleaning"** or **"maintenance"**.
   - The status updates immediately in reactive storage and logs a forensic audit record to the chain.
5. **What to Say to the Professor**:
   > *"Hospital staff can only update beds within their assigned facility. The system validates hospital isolation before committing any state change."*

---

## 🏛️ Step 4: Government Surveillance & Aggregate Scope (4:00 - 4:30)

1. **Switch Persona**: In the top-bar dropdown, switch to **Vikramaditya Sen (Government Officer)**.
2. **Navigate to Surveillance**: Click **"Surveillance Map"** (`/government/dashboard`).
3. **What to Say to the Professor**:
   > *"Government officers monitor district-level healthcare capacity and surge alerts. Notice AIIMS is highlighted in critical red (>88% occupancy), triggering an automatic bed surge alert.*
   >
   > *Crucially, our RBAC model enforces that Government Officers have **aggregate-only access**. They have zero access to individual patient names, diagnostic orders, or medical records."*

---

## 🔍 Step 5: Cyber-Forensics SHA-256 Hash Chain & Tamper Detection (4:30 - 6:00)

1. **Switch Persona**: Switch to **Dev Anand (Super Admin)**.
2. **Navigate to Audit Chain**: Click **"Forensics Audit Trail"** (`/superadmin/audit` or `/superadmin/dashboard`).
3. **Explain Hash Chain Architecture**:
   - Point to the **Genesis Block (Block #0)**: Anchored with index 0 and 64-char zero previous hash.
   - Point to our recent appointment booking and bed update events in the chain.
   - Each event contains `index`, `timestamp`, `eventType`, `actorUid`, `payloadHash`, `previousHash`, and `currentHash`.
4. **Run Valid Integrity Verification**:
   - Click the green **"Verify Chain Integrity"** button.
   - Show the result: **"100% Chain Integrity Verified (X Blocks Valid)"**.
5. **Demonstrate Adversarial Tamper Detection**:
   - Scroll to the **"Adversarial Tamper Simulation (Demo Only)"** card.
   - Click **"Simulate Adversary Modifying Block Details"**.
   - Now click **"Verify Chain Integrity"** again.
   - Show the result: **"INTEGRITY VIOLATION DETECTED at Block #X: Stored payloadHash does not match recomputed hash of stored details!"**
   - Click **"Reset Chain to Valid Baseline"** to restore integrity.
6. **What to Say to the Professor**:
   > *"Professor, our forensic service uses standard RFC 6234 UTF-8 byte SHA-256 hashing. Rather than merely checking previous hash links, our verifier recomputes the payload hash from the stored database fields. If an adversary tampers with details in-place, deletes an event, or reorders records, the chain immediately breaks."*

---

## 🛡️ Step 6: RBAC 403 Security Guard & Wrap-Up (6:00 - 6:30)

1. **Demonstrate 403 Unauthorized Guard**:
   - Switch back to **Priya Sharma (Patient)**.
   - Manually type `/superadmin/audit` or `/admin/dashboard` into the browser URL bar.
   - Show that the `ProtectedRoute` component immediately catches the unauthorized role and renders the dedicated **"403 — Unauthorized Access"** page.
2. **Show Automated Test Suite**:
   - Switch back to the terminal and run:
     ```bash
     npm test
     ```
   - Show all **26 tests passing across 4 suites** (forensics, auth permissions, appointments, and demo behavior).
3. **Closing Statement**:
   > *"In summary, MediQueue demonstrates a robust academic prototype combining dual-persistence architecture, role-based access control, concurrency-safe appointment confirmation, an allowlisted AI assistant, and a verifiable cyber-forensics audit trail. All data is synthetic and ready for academic assessment."*

---

## ❓ Probable Professor Questions & Recommended Answers

### Q1: *"Is the hash chain tamper-proof?"*
> **Answer**: *"No hash chain is completely tamper-proof on a writeable medium. It is **tamper-evident**. If an adversary modifies any event payload, the stored hash and recomputed hash mismatch immediately. For true immutability in production, the chain tip would be periodically published to a write-once ledger or external timestamping service."*

### Q2: *"How does the appointment system prevent double-booking?"*
> **Answer**: *"We use a two-phase reservation model. In phase one, the patient selects a slot and the backend places a 5-minute atomic hold in an `AWAITING_CONFIRMATION` state. In phase two, when the patient submits explicit consent with an idempotency key, the backend revalidates slot availability before committing the booking and generating the queue token."*

### Q3: *"Can the AI assistant order treatments or change medical records on its own?"*
> **Answer**: *"No. The AI Assistant operates exclusively through 6 narrow, allowlisted backend tools. It does not perform autonomous diagnosis or emergency triage. Consequential actions such as booking or bed status updates require explicit user confirmation and backend authorization."*

### Q4: *"Can a user escalate their role by editing their browser session?"*
> **Answer**: *"In our local demo mode, the persona switcher is strictly an educational simulation. In cloud mode with Firebase, our `firestore.rules` and `database.rules.json` explicitly reject any client write attempting to modify `role`, `hospitalId`, or `patientId`."*
