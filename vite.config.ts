import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

function aiAssistantServerPlugin(): Plugin {
  return {
    name: 'ai-assistant-server',
    configureServer(server) {
      server.middlewares.use('/api/ai-assistant', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }

        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });

        req.on('end', async () => {
          try {
            const { prompt, caller } = JSON.parse(body || '{}');
            const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

            if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY') {
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  fallback: true,
                  reason: 'NO_SERVER_KEY',
                  message:
                    'Deterministic Clinical NLU Fallback: Server LLM API key not configured. Using deterministic entity & intent parser.',
                })
              );
              return;
            }

            const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
            const systemInstruction = `You are the MediQueue Healthcare AI Assistant. Assist patients, hospital staff, and administrators with clinical scheduling and hospital coordination.
Caller Context: Name: ${caller?.name || 'Anonymous'}, Role: ${caller?.role || 'patient'}, Hospital: ${caller?.hospitalId || 'General'}.
Always call tools when the user requests information or actions. Never fabricate clinical appointments or bed numbers without calling tools.`;

            // Dynamic import of schema
            const { GEMINI_TOOLS_SCHEMA } = await import('./src/services/ai/toolSchema.ts');

            const upstream = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                systemInstruction: { parts: [{ text: systemInstruction }] },
                tools: [{ functionDeclarations: GEMINI_TOOLS_SCHEMA }],
              }),
            });

            if (!upstream.ok) {
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  fallback: true,
                  reason: 'UPSTREAM_ERROR',
                  message: `Upstream LLM error (${upstream.status}). Falling back to Deterministic Clinical NLU.`,
                })
              );
              return;
            }

            const data = (await upstream.json()) as any;
            const candidate = data.candidates?.[0]?.content?.parts?.[0];

            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                success: true,
                functionCall: candidate?.functionCall || null,
                text: candidate?.text || null,
              })
            );
          } catch (err: any) {
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                fallback: true,
                error: err.message,
                message: 'Internal server error while invoking LLM. Falling back to Deterministic Clinical NLU.',
              })
            );
          }
        });
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), aiAssistantServerPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (
            id.includes('node_modules/react') ||
            id.includes('node_modules/react-dom') ||
            id.includes('node_modules/react-router')
          ) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/firebase')) {
            return 'firebase-vendor';
          }
          if (id.includes('node_modules/recharts')) {
            return 'chart-vendor';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'ui-vendor';
          }
        },
      },
    },
  },
});
