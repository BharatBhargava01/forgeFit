# 🔥 ForgeFit — AI Workout & Routine Generator

ForgeFit is a modern, high-performance web application designed to help users generate, log, and track personalized workout sessions and weekly training routines. It features a fast procedural rules-engine, an advanced **Google Gemini AI generator**, interactive workout tracking, detailed analytics, and full **Progressive Web App (PWA)** capabilities.

---

## ✨ Key Features

*   **🧠 Gemini AI Workout Generator**: Generates customized training sessions matching your target muscle groups, available equipment, and duration targets. It enforces **strict JSON response schemas** from the Gemini 1.5 Flash model and includes a fail-safe procedural fallback.
*   **⚡ Traditional Rules Engine**: Generates workouts instantly client-side by choosing exercise types, compound movements first, and difficulty volume (sets/reps/rest).
*   **📅 Weekly Routine Builder**: Generates multi-day weekly plans based on goals (Hypertrophy, Strength, Endurance) and split schedules (PPL, Upper/Lower, Arnold Split, Full Body, Bro Split).
*   **⏱️ Active Workout Tracker**: Interactive dashboard with a stopwatch, rest countdowns, and set-by-set weight and rep logging.
*   **📊 Consistency & Volume Analytics**: Visualizes training stats through SVG volume trend charts, muscle distribution progress bars, consistency calendars, and milestone badges.
*   **📱 Progressive Web App (PWA)**: Installable directly to iOS, Android, and Desktop with offline caching for core assets and Google Fonts.
*   **💾 Resilient Data Layer**: Backed by PostgreSQL with a client-side `localStorage` fallback layer that keeps the app fully functional offline.

---

## 🛠️ Technology Stack

*   **Frontend**: Vanilla HTML5, CSS3 Custom Properties (variables, components, pages layouts), and modular JavaScript.
*   **Backend**: Node.js, Express, PG (PostgreSQL client), CORS.
*   **AI Integration**: `@google/generative-ai` SDK.
*   **PWA**: Web App Manifest (`manifest.json`), Service Workers (static & dynamic caching).
*   **Database**: PostgreSQL.

---

## 🏗️ Architecture

```mermaid
graph TD
  A[Frontend UI / PWA] -->|Service Worker Cache| A
  A -->|POST /api/workouts/ai-generate| B[Express server]
  B --> C[Gemini AI Controller]
  C -->|Schema Enforcements| D[Google Gemini API]
  B --> E[PostgreSQL DB]
  A -->|Fallback: LocalStorage| A
```

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have the following installed:
*   [Node.js](https://nodejs.org/) (v16 or higher)
*   [PostgreSQL](https://www.postgresql.org/)

### 2. Installation
Clone the repository and install the dependencies:
```bash
git clone https://github.com/BharatBhargava01/forgeFit.git
cd workout-gen
npm install
```

### 3. Database Configuration
1. Start your local PostgreSQL server.
2. Initialize the database schema and pre-populated exercise library:
   ```bash
   npm run db:init
   ```

### 4. Environment Setup
Create or update the `.env` file in the root directory:
```env
# Database Credentials
DATABASE_URL=postgresql://username:password@localhost:5432/forgefit
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_NAME=forgefit

# Server Configuration
PORT=3000

# Google Gemini AI (Optional)
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
```

### 5. Running the Application
Start the development server with Nodemon:
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 📱 PWA & Offline Usage

ForgeFit is fully installable:
*   **Desktop**: Click the install icon in the address bar of Chrome/Edge.
*   **iOS**: Open the app in Safari, tap **Share**, and select **Add to Home Screen**.
*   **Android**: Open in Chrome, tap the menu, and select **Install App**.

When offline, the Service Worker serves the application shell, and `storage.js` redirects database operations to `localStorage` until the server is reachable again.

---

## 🤝 License

Distributed under the MIT License. See `LICENSE` for more information.
