# 🚀 MediQueue AI — Production Deployment Guide

This guide covers deployment options for **MediQueue AI**, including **Vercel** and **Firebase Hosting**, with instructions for local demo execution and live cloud deployment.

---

## 1. Architecture & Deployment Modes

MediQueue supports two distinct operating modes:

### Mode A: Zero-Credential Demo Mode (Default)
- **Use Case**: Professor evaluations, classroom demonstrations, local code assessment, and public showcase previews.
- **Requirements**: None. Does not require Firebase credentials or paid AI API keys.
- **Data Layer**: Deterministic synthetic records in reactive local storage with cross-tab Web `BroadcastChannel` synchronization.
- **UI Indicator**: Displays a persistent `"DEMO MODE — SYNTHETIC DATA"` banner. Top-bar Persona Switcher is active.

### Mode B: Verified Cloud Mode (Firebase Production)
- **Use Case**: Live institutional pilot deployments.
- **Requirements**: A live Google Firebase project with Cloud Firestore, Realtime Database, and Firebase Authentication enabled.
- **Data Layer**: Firestore persistent documents and RTDB live bus nodes with strict security rules.
- **UI Indicator**: Persona Switcher is automatically disabled; real authenticated user sessions and hospital isolation are enforced.

---

## 2. Option A: Deploying to Vercel (Recommended for Web Demonstration)

MediQueue is pre-configured for **Vercel** via [vercel.json](file:///Users/mahithchowdary/Projects/mediqueue/vercel.json) with SPA fallback rewrites.

### Deployment Steps:

1. **Push your code to GitHub**:
   Ensure your latest code is on branch `main` at `https://github.com/<your-username>/mediqueue`.

2. **Import to Vercel**:
   - Go to [vercel.com](https://vercel.com) and log in.
   - Click **"Add New Project"** $\to$ **"Import Git Repository"**.
   - Select your `mediqueue` repository.

3. **Configure Project Settings**:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Environment Variables**:
   - *For Demo Mode*: Leave environment variables empty! MediQueue will run with synthetic datasets.
   - *For Cloud Mode*: Add the variables from `.env.example` (`VITE_FIREBASE_API_KEY`, etc.).

5. **Deploy**:
   - Click **"Deploy"**. Vercel will bundle the TypeScript and Tailwind CSS assets into `dist/`.
   - Your application will be live at `https://mediqueue-<unique>.vercel.app`.

---

## 3. Option B: Deploying to Firebase Hosting

MediQueue includes [firebase.json](file:///Users/mahithchowdary/Projects/mediqueue/firebase.json) configured for static hosting, Firestore rules, and Realtime Database rules.

### Prerequisites:
- Install Firebase CLI: `npm install -g firebase-tools`
- Log in to your Google account: `firebase login`

### Deployment Steps:

1. **Build the production bundle**:
   ```bash
   npm run build
   ```
   This generates the minified production assets in the `dist/` directory.

2. **Select your Firebase project**:
   ```bash
   firebase use --add
   ```
   Choose your active Firebase project from the list.

3. **Deploy Security Rules**:
   ```bash
   firebase deploy --only firestore:rules,database
   ```
   Deploys `firestore.rules` and `database.rules.json` to enforce role-based access control and hospital isolation.

4. **Deploy Web Application**:
   ```bash
   firebase deploy --only hosting
   ```
   Firebase Hosting will upload the `dist/` directory and activate the URL at `https://<your-project>.web.app`.

---

## 4. Environment Variables Reference

Refer to [.env.example](file:///Users/mahithchowdary/Projects/mediqueue/.env.example):

| Variable | Description | Default in Demo Mode |
| :--- | :--- | :--- |
| `VITE_FIREBASE_API_KEY` | Firebase Web API Key | Unset (triggers Demo Mode) |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain | Unset |
| `VITE_FIREBASE_PROJECT_ID` | Google Cloud / Firebase Project ID | Unset |
| `VITE_FIREBASE_STORAGE_BUCKET`| Firebase Storage Bucket | Unset |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Cloud Messaging Sender ID | Unset |
| `VITE_FIREBASE_APP_ID` | Firebase Application App ID | Unset |
| `VITE_FIREBASE_DATABASE_URL` | Realtime Database Endpoint | Unset |
| `VITE_AI_SERVICE_URL` | Optional backend AI proxy endpoint | `http://localhost:8000` |
| `VITE_GOOGLE_MAPS_API_KEY` | Optional Google Maps API key for routing | Unset (uses SVG route maps) |

> ⚠️ **CRITICAL SECURITY RULE**: Never commit `.env` files containing live credentials, private keys, or API secrets.

---

## 5. Pre-Deployment Verification Checklist

Before publishing or presenting:

- [x] **Dependencies Installed**: Clean `npm install`.
- [x] **TypeScript Validation**: `tsc -b` passes with 0 errors.
- [x] **Automated Tests**: `npm test` passes all 23 tests across 4 suites.
- [x] **Production Bundle**: `npm run build` succeeds in under 1 second.
- [x] **SPA Routing**: Direct browser URL refreshes (e.g., `/patient/ai-booking`) resolve without 404s via `vercel.json` and `firebase.json`.
- [x] **Zero Secrets Committed**: Verified via `git diff` that no credentials exist in source control.
- [x] **Synthetic Data Only**: All demo names, facilities, and records are fictional.
- [x] **Hospital Isolation**: Staff and admin portals restrict queries to assigned facilities.
