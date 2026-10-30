# 🎓 MediQueue AI — Professor Demonstration Script

> **Purpose**: A structured, step-by-step walkthrough to present MediQueue AI's clinical operations, 5 role-based portals, hybrid AI assistant with 11 tools, concurrency-safe appointment booking engine, and enterprise security logging to your university professor.

---

## ⏱️ Demonstration Timeline (Total: ~6 to 8 Minutes)

| Step | Persona / Role | Key Action | What It Proves |
| :---: | :--- | :--- | :--- |
| **1** | System Overview | Terminal launch & Demo Mode banner | Zero-credential local architecture & synthetic seeding |
| **2** | **Patient** (Priya Sharma) | Ask MediQueue AI to find appointment | Natural language intent extraction & slot query |
| **3** | **Patient** (Priya Sharma) | Review available slots | Real-time doctor & slot availability presentation |
| **4** | **Patient** (Priya Sharma) | Confirm with explicit consent | Concurrency-safe reservation & 5-minute hold validation |
| **5** | **Patient** (Priya Sharma) | Inspect confirmed booking | Persistent booking reference (`BK-...`) & OPD token |
| **6** | **Staff** (Dr. Rajesh Kumar) | Log in as hospital doctor/staff | Role-based portal navigation & facility isolation |
| **7** | **Staff** (Dr. Rajesh Kumar) | Update bed status (`available` $\to$ `cleaning`) | Real-time ward state transition & event logging |
| **8** | **Staff** (Dr. Rajesh Kumar) | Inspect live dashboard & OPD queue | Real-time bed counter decrement & token queue desk |
| **9** | **Hospital Admin** (Sunita Rao) | Review hospital executive dashboard | Census analytics, occupancy rates, and department metrics |
| **10** | **Hospital Admin** (Sunita Rao) | Inspect department utilization & beds | Recharts data visualizations & ward inventory management |
| **11** | **Government Officer** (Vikramaditya Sen) | District-level public health surveillance | Regional surge heatmaps (>85% alerts) & aggregate-only data |
| **12** | **Super Admin** (Dev Anand) | Inspect enterprise security activity logs | HIPAA/Audit trail of all actions with actor, timestamp & scope |

---

## 🚀 Step-by-Step Guided Walkthrough

### Step 1: Launch & Show Architecture (0:00 – 1:00)
1. **Launch from Terminal**:
   ```bash
   npm run dev
   ```
2. **Open Browser**: Navigate to `http://localhost:5173`.
3. **Point out the Interface**:
   - Show the persistent **"DEMO MODE — SYNTHETIC DATA"** banner at the top of the header.
   - Point out the **Persona Switcher** in the top navigation bar.
4. **What to Say to the Professor**:
   > *"Professor, this is MediQueue AI, an AI-powered real-time hospital resource management platform. It addresses four chronic challenges in healthcare delivery: uncoordinated outpatient queues, delayed inpatient bed turnaround, opaque doctor availability, and inter-hospital emergency turnaways.*
   >
   > *Notice that MediQueue is running in dedicated Demonstration Mode with deterministic synthetic data across 5 representative hospitals, 180 beds, and 55 patients. No paid cloud credentials or external API keys are required for this local evaluation."*

---

### Step 2: Patient Portal — Ask MediQueue AI to Find an Appointment (1:00 – 2:00)
1. In the top-right Persona Switcher, ensure **Priya Sharma (Patient)** is selected.
2. In the left navigation sidebar, click **"AI Assistant"** (navigates to `/patient/ai-assistant`).
3. Under **Suggested Prompts**, click the quick action button:
   - **`"Book Cardiologist for tomorrow"`**
4. Observe the AI execution:
   - The hybrid assistant extracts the intent: `searchAppointmentSlots`.
   - It targets department: `cardiology` and date: `tomorrow`.
   - It displays real available morning and afternoon consultation slots with Dr. Rajesh Kumar.
5. **What to Say to the Professor**:
   > *"MediQueue implements a hybrid conversational architecture. Natural language is parsed into structured parameters, validated against strict schemas, checked against the user's role authorization, and executed through an allowlisted backend tool. The LLM never writes directly to the database."*

---

### Step 3: Review Available Consultation Slots (2:00 – 2:30)
1. Look at the retrieved slot cards rendered directly in the AI Assistant chat.
2. Point out:
   - Doctor Name: **Dr. Rajesh Kumar** (Senior Consultant Cardiologist).
   - Department: **Cardiology** at Metro General Hospital.
   - Slot Time: Morning 09:30 AM – 10:00 AM.
   - Room: Consultation Room 104.
   - Consultation Fee: ₹500.
3. Click the green **"Prepare Booking Intent"** button on the `09:30 AM` slot.

---

### Step 4: Confirm the Appointment with Explicit Consent (2:30 – 3:30)
1. Point to the **Appointment Confirmation Card** that appears:
   - Shows doctor, specialty, facility, and appointment slot timestamp.
   - Shows an active **5-Minute Temporary Reservation Timer**.
   - Mode selector: Toggle between **In-Person Consultation** and **Teleconsultation**.
   - Explicit Patient Consent Checkbox: *"I verify my details and explicitly authorize this appointment reservation."*
2. **Demonstrate Validation**:
   - Click **"Confirm & Authorize Appointment"** *without* checking the consent box.
   - Point out the validation error: *"Consent required before committing booking."*
3. **Authorize the Booking**:
   - Check the consent box.
   - Click **"Confirm & Authorize Appointment"**.
4. **What to Say to the Professor**:
   > *"Notice our clinical safety invariant: The AI can recommend and stage a booking, but only an explicit, authenticated user action can commit the reservation. In addition, our backend validates slot availability atomically immediately prior to committing, preventing concurrent double-booking."*

---

### Step 5: Verify the Persisted Booking & Reference (3:30 – 4:00)
1. Notice the confirmation message with the authoritative **Booking Reference ID** (e.g., `BK-A1B2C3D4`) and **Queue Token Number** (e.g., `Token #15`).
2. Click **"My Appointments"** in the left sidebar (`/patient/appointments`).
3. Show the newly booked appointment listed under **Upcoming Appointments** with status **"scheduled"**.
4. Point out the options for **Reschedule** and **Cancel Appointment**.

---

### Step 6: Staff Portal — Log in as Hospital Doctor/Staff (4:00 – 4:30)
1. In the top-bar Persona Switcher, switch to **Dr. Rajesh Kumar (Hospital Staff)**.
2. Notice the navigation changes to the **Staff Portal**:
   - Shows doctor credentials, designation (*Senior Consultant Cardiologist*), and hospital affiliation (*Metro General Hospital*).
   - Hospital isolation is active: Dr. Kumar cannot access beds or queues of other hospitals.

---

### Step 7: Update Ward Bed Status (4:30 – 5:15)
1. In the sidebar, click **"Ward Beds"** (`/staff/beds`).
2. Filter by ward: **ICU** or **General Ward**.
3. Locate an **Available** bed (e.g., `ICU-02`).
4. Click its status dropdown and transition it to **"cleaning"** (simulating a patient discharge turnover).
5. Notice the bed card badge updates immediately from green (*Available*) to amber (*Cleaning*).

---

### Step 8: Inspect Live Staff Dashboard & OPD Queue (5:15 – 6:00)
1. Click **"Dashboard"** in the sidebar (`/staff/dashboard`).
2. Observe:
   - Available Bed Counter has decremented in real-time.
   - Cleaning Bed Counter has incremented.
3. Click **"OPD Queue Desk"** (`/staff/opd-queue`).
4. Show the live queue caller with:
   - Current Token in Consultation.
   - Waiting patient queue.
   - Actions: **"Call Next Patient"**, **"Mark In-Consultation"**, **"Complete Consultation"**.

---

### Step 9: Hospital Admin Portal — Executive Overview (6:00 – 6:45)
1. In the top-bar Persona Switcher, switch to **Sunita Rao (Hospital Admin)**.
2. In the sidebar, click **"Dashboard"** (`/admin/dashboard`).
3. Point out the executive KPI summary cards:
   - Total Hospital Beds: 180.
   - Occupied Beds & Occupancy Percentage (e.g., 78%).
   - Currently Available Beds.
   - Active OPD Queue Token Throughput.
   - Today's Patient Admissions vs. Discharges.

---

### Step 10: Hospital Admin — Department Utilization & Capacity Analytics (6:45 – 7:15)
1. In the sidebar, click **"Analytics"** (`/admin/analytics`).
2. Demonstrate the interactive **Recharts** visualizations:
   - Department-wise Bed Occupancy (Cardiology, Orthopedics, Pediatrics, Oncology).
   - Daily Outpatient Flow vs. Staff Capacity.
   - Average Consultation Wait Time by Department.
3. Click **"Department Staffing"** (`/admin/departments`) to show clinical roster management.

---

### Step 11: Government Surveillance Portal — Regional Health Surveillance (7:15 – 7:45)
1. In the top-bar Persona Switcher, switch to **Vikramaditya Sen (Government Officer)**.
2. In the sidebar, click **"Surveillance Map"** (`/government/dashboard`).
3. Point out:
   - District-level hospital utilization across all 5 facilities in the jurisdiction.
   - Facilities with >85% bed occupancy highlighted with an automatic **Public Health Surge Alert** badge.
4. **Emphasize Privacy & HIPAA Compliance**:
   > *"Notice that Government Officers have access strictly to aggregate statistical data. They have zero visibility into individual patient identities, clinical diagnoses, or billing records. This enforces least-privilege compliance by design."*

---

### Step 12: Super Admin Portal — Enterprise Security & Activity Audit Logs (7:45 – 8:15)
1. In the top-bar Persona Switcher, switch to **Dev Anand (Super Admin)**.
2. In the sidebar, click **"Security & Activity Logs"** (`/superadmin/logs`).
3. Point out the live enterprise audit stream:
   - Every appointment booking, bed status change, queue update, and login is recorded with:
     - Exact Timestamp
     - Actor User ID & Role
     - Facility / Hospital Scope
     - Event Category (`APPOINTMENT`, `BED_STATUS`, `OPD_QUEUE`, `AUTH`)
     - Operational Severity (`INFO`, `WARN`, `SECURITY`)
4. Point out the **Security Invariant**:
   - All critical state transitions leave an auditable, queryable enterprise activity trail for operational transparency and governance.

---

## 💡 Quick Tips for the Presentation
- **If the professor asks about the AI**: Emphasize that the assistant uses structured intent extraction with schema validation and role-based tool allowlisting, backed by a deterministic rule-based engine when cloud LLMs are unconfigured.
- **If the professor asks about double-booking**: Point to the concurrency-safe revalidation step where slot availability is re-checked immediately before writing the booking to persistent storage.
- **If the professor asks about security**: Show `firestore.rules` and explain that client-side role claims are never trusted for cloud authorization.
