// Cloudflare Worker for MediQueue AI
// Serves static assets and single-page application routing,
// and provides the secure server-side /api/ai-assistant endpoint.

export default {
  async fetch(request, env, _ctx) {
    const url = new URL(request.url);

    // 1. Server-side AI Assistant Endpoint (GEMINI_API_KEY stored securely in Worker environment)
    if (url.pathname === '/api/ai-assistant' && request.method === 'POST') {
      try {
        const { prompt, caller } = await request.json();
        const apiKey = env.GEMINI_API_KEY;

        if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY') {
          return new Response(
            JSON.stringify({
              fallback: true,
              reason: 'NO_SERVER_KEY',
              message:
                'Deterministic Clinical NLU Fallback: Server LLM API key not configured. Using deterministic entity & intent parser.',
            }),
            {
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              },
            }
          );
        }

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const systemInstruction = `You are the MediQueue Healthcare AI Assistant. Coordinate clinical workflows and answer questions about doctor availability, appointment booking, bed occupancy, OPD queue, and hospital profiles. Caller context: ${caller?.name || 'Anonymous'} (${caller?.role || 'patient'}). Always invoke available tools.`;

        // Tool declarations
        const toolDeclarations = [
          {
            name: 'search_doctors',
            description: 'Search for registered specialist physicians by medical specialty, department, hospital, or physician name.',
            parameters: {
              type: 'OBJECT',
              properties: {
                specialty: { type: 'STRING', description: 'Medical specialty e.g. Cardiology, Orthopedics, Pediatrics' },
                hospitalId: { type: 'STRING', description: 'Target hospital identifier e.g. hosp_metro_01' },
                doctorName: { type: 'STRING', description: 'Physician name query e.g. Dr. Rajesh Kumar' },
              },
            },
          },
          {
            name: 'get_doctor_availability',
            description: 'Query available OPD consultation appointment slots for a specific doctor, specialty, or date.',
            parameters: {
              type: 'OBJECT',
              properties: {
                specialty: { type: 'STRING', description: 'Medical specialty e.g. Cardiology' },
                hospitalId: { type: 'STRING', description: 'Hospital ID' },
                doctorId: { type: 'STRING', description: 'Doctor/Staff ID' },
                date: { type: 'STRING', description: 'Date in YYYY-MM-DD format' },
              },
            },
          },
          {
            name: 'search_hospitals',
            description: 'Find hospital facilities by name, geographic district, facility type, or emergency availability.',
            parameters: {
              type: 'OBJECT',
              properties: {
                district: { type: 'STRING', description: 'District name e.g. Central, North, South' },
                emergencyOnly: { type: 'BOOLEAN', description: 'Filter only facilities with active emergency services' },
              },
            },
          },
          {
            name: 'get_appointment_details',
            description: 'Retrieve authorized appointment records and statuses for the signed-in patient or authorized hospital staff.',
            parameters: {
              type: 'OBJECT',
              properties: {
                appointmentId: { type: 'STRING', description: 'Specific appointment ID (optional)' },
              },
            },
          },
          {
            name: 'create_appointment',
            description: 'Prepare an authoritative appointment booking intent with a 5-minute hold requiring explicit patient confirmation.',
            parameters: {
              type: 'OBJECT',
              properties: {
                specialty: { type: 'STRING', description: 'Medical specialty' },
                hospitalId: { type: 'STRING', description: 'Hospital ID' },
                doctorId: { type: 'STRING', description: 'Doctor ID' },
                date: { type: 'STRING', description: 'Date in YYYY-MM-DD' },
                time: { type: 'STRING', description: 'Time slot e.g. 10:30 AM' },
                consultationType: { type: 'STRING', description: 'In-Person OPD or Telehealth Video' },
              },
              required: ['specialty'],
            },
          },
          {
            name: 'cancel_appointment',
            description: 'Cancel an existing scheduled appointment with explicit verification and record update.',
            parameters: {
              type: 'OBJECT',
              properties: {
                appointmentId: { type: 'STRING', description: 'Appointment ID e.g. APT-2026-10001' },
                reason: { type: 'STRING', description: 'Reason for cancellation' },
              },
              required: ['appointmentId'],
            },
          },
          {
            name: 'reschedule_appointment',
            description: 'Reschedule an existing scheduled appointment to a new date and time slot.',
            parameters: {
              type: 'OBJECT',
              properties: {
                appointmentId: { type: 'STRING', description: 'Appointment ID' },
                newSlotTime: { type: 'STRING', description: 'New date and time e.g. 2026-10-26 11:45 AM' },
              },
              required: ['appointmentId', 'newSlotTime'],
            },
          },
          {
            name: 'get_queue_status',
            description: 'Check real-time outpatient department queue token, serving status, and estimated wait time.',
            parameters: {
              type: 'OBJECT',
              properties: {
                hospitalId: { type: 'STRING', description: 'Hospital ID' },
                departmentId: { type: 'STRING', description: 'Department ID' },
              },
            },
          },
          {
            name: 'get_bed_availability',
            description: 'Retrieve real-time inpatient ward and ICU bed census, availability, and occupancy rate.',
            parameters: {
              type: 'OBJECT',
              properties: {
                hospitalId: { type: 'STRING', description: 'Hospital ID' },
                bedType: { type: 'STRING', description: 'ICU, general, emergency, pediatric, or maternity' },
              },
            },
          },
          {
            name: 'get_patient_profile',
            description: 'Retrieve the verified clinical identity, UHID, blood group, and contact information of the current patient.',
            parameters: {
              type: 'OBJECT',
              properties: {},
            },
          },
        ];

        const upstream = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            systemInstruction: { parts: [{ text: systemInstruction }] },
            tools: [{ functionDeclarations: toolDeclarations }],
          }),
        });

        if (!upstream.ok) {
          return new Response(
            JSON.stringify({
              fallback: true,
              reason: 'UPSTREAM_ERROR',
              status: upstream.status,
            }),
            {
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              },
            }
          );
        }

        const data = await upstream.json();
        const candidate = data.candidates?.[0]?.content?.parts?.[0];

        return new Response(
          JSON.stringify({
            success: true,
            functionCall: candidate?.functionCall || null,
            text: candidate?.text || null,
          }),
          {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      } catch (err) {
        return new Response(
          JSON.stringify({
            fallback: true,
            error: err.message,
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }
    }

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // 2. Static Asset Handling & SPA Fallback via Cloudflare Assets Binding
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not Found', { status: 404 });
  },
};
