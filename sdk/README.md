<div align="center">
  <h1>🚨 DevNexus SDK</h1>
  <p><strong>The official, ultra-lightweight client for routing application errors to the DevNexus Incident Management Platform.</strong></p>
  
  <p>
    <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" alt="License MIT" />
    <img src="https://img.shields.io/badge/TypeScript-Ready-blue?style=flat-square&logo=typescript" alt="TypeScript Ready" />
  </p>
</div>

---

## 📖 What does it do?

The `devnexus-sdk` is a zero-dependency tracking script that sits quietly in your application. When a bug, unhandled exception, or Promise rejection occurs, the SDK instantly captures the stack trace, environmental context, and user breadcrumbs.

It sends reports to the DevNexus ingest API. The server groups matching reports into issues and queues AI analysis; analysis and live updates depend on server configuration.

## ✨ Core Features

*   **⚡ Zero-Config Auto-Capture:** Automatically hooks into `window.onerror` and `unhandledrejection` to catch every bug without manual wrappers.
*   **🧠 AI-Ready Reports:** Reports include stack, environment, tags, metadata, and breadcrumbs for server-side analysis.
*   **🛡️ Smart Deduplication:** Identical errors happening in a rapid loop (like a broken `useEffect`) are automatically suppressed to save bandwidth.
*   **📦 Offline Resilience:** If the user's internet drops, errors are safely queued in memory and flushed when the connection returns.
*   **⚛️ React Support:** Ships with a `DevNexusErrorBoundary` component for React web applications.

---

## 📦 Installation

The SDK package is not published to npm yet. To use it from this repository, clone the project and build the SDK locally:

```bash
git clone https://github.com/rayshivam30/Dev-Nexus.git
cd Dev-Nexus/sdk
npm install
npm run build
npm link
```

In your application, run `npm link devnexus-sdk` to use that local build.

---

## 🚀 Quick Start

### 1. Global Initialization
Initialize the client as early as possible in your application lifecycle (e.g., `index.ts`, `main.tsx`, or `app.tsx`).

```typescript
import { DevNexus } from 'devnexus-sdk';

DevNexus.init({
  apiKey: 'devnexus_sk_YOUR_API_KEY', // Create or rotate this in your project SDK settings
  autoCapture: true // Automatically listen to global errors
});
```

### 2. React Error Boundary
Catch rendering crashes and prevent the "White Screen of Death".

```tsx
import { DevNexusErrorBoundary } from 'devnexus-sdk/react';

function App() {
  return (
    <DevNexusErrorBoundary 
      tags={{ version: "1.0.0", environment: "production" }}
      fallback={({ error, reset }) => (
        <div className="error-screen">
          <h1>Oops! Something broke.</h1>
          <p>Our engineers have been notified instantly.</p>
          <button onClick={reset}>Try Again</button>
        </div>
      )}
    >
      <YourApplicationLogic />
    </DevNexusErrorBoundary>
  );
}
```

### 3. Manual Reporting
Catch silent failures or API errors and report them with custom context.

```typescript
try {
  await processPayment(cart);
} catch (error) {
  DevNexus.captureException(error, {
    severity: 'CRITICAL',
    tags: { feature: 'checkout_gateway' },
    metadata: { 
      cartId: cart.id,
      userId: user.id 
    }
  });
}
```

---

## ⚙️ Configuration Options

You can deeply customize the SDK behavior by passing options to `DevNexus.init()`:

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `apiKey` | `string` | **Required** | Your unique project identifier. |
| `baseUrl` | `string` | `https://devnexus.io/api/ingest` | Where to send payloads. Set this to your deployment's `/api/ingest` URL when self-hosting. |
| `autoCapture` | `boolean` | `true` | Enables global event listeners for uncaught exceptions. |
| `maxRetries` | `number` | `3` | Exponential backoff retry attempts if the network fails. |
| `flushInterval`| `number` | `5000` | How frequently (in ms) queued events are dispatched. |
| `beforeSend` | `function` | `undefined` | Hook to scrub sensitive data (like PII or credit cards) before sending. Return `null` to drop the event. |

---

## 🕵️‍♂️ Advanced: Breadcrumbs
Breadcrumbs act like a flight recorder. They automatically (or manually) track what the user was doing right before the crash.

```typescript
// Add a manual breadcrumb when an important action happens
DevNexus.addBreadcrumb({
  message: 'User clicked the "Complete Purchase" button',
  type: 'ui.click',
  level: 'info'
});
```

---
<div align="center">
  <p>Built with ❤️ by the <strong>DevNexus Team</strong> | © 2026</p>
</div>
