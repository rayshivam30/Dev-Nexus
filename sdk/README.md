# DevNexus SDK (devnexus-sdk) 🚨

The official lightweight client for reporting errors and incidents to the **DevNexus Incident Management System**.

[![NPM Version](https://img.shields.io/npm/v/devnexus-sdk.svg)](https://www.npmjs.com/package/devnexus-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Features

- **⚡ One-liner Setup**: Just call `DevNexus.init` once.
- **🧩 React Integration**: Built-in Error Boundary component for seamless React support.
- **🛡️ Deduplication**: Identical errors within a 60-second window are suppressed.
- **📦 Offline Support**: Queues reports while offline and flushes them when the connection is restored.
- **📉 Breadcrumbs**: Automatically tracks console logs and navigation events for easier debugging.
- **🔄 Retry with Backoff**: Failed reports are retried with exponential backoff.
- **🌍 Universal**: Works in both **Browser** and **Node.js** environments.
- **TypeScript First**: Full type safety for all configurations and reporting methods.

## 📦 Installation

```bash
npm install devnexus-sdk
# or
yarn add devnexus-sdk
# or
bun add devnexus-sdk
```

## 🛠️ Quick Start

### 1. Initialize the SDK
Initialize the client as early as possible (e.g., `index.ts` or `main.tsx`).

```typescript
import { DevNexus } from 'devnexus-sdk';

DevNexus.init({
  apiKey: 'dn_live_YOUR_API_KEY', // Get this from your Project Dashboard
  autoCapture: true // Default: true
});
```

### 2. React Error Boundary
Wrap your application or specific components to catch rendering errors.

```tsx
import { DevNexusErrorBoundary } from 'devnexus-sdk/react';

function App() {
  return (
    <DevNexusErrorBoundary 
      tags={{ version: "1.0.0" }}
      fallback={({ error, reset }) => (
        <div>
          <h1>Oops! An incident occurred.</h1>
          <button onClick={reset}>Try Again</button>
        </div>
      )}
    >
      <MyAppLogic />
    </DevNexusErrorBoundary>
  );
}
```

### 3. Manual Reporting
```typescript
try {
  throw new Error("Critical payment failure");
} catch (error) {
  DevNexus.captureException(error, {
    severity: 'CRITICAL',
    tags: { feature: 'billing' },
    metadata: { orderId: '12345' }
  });
}
```

## ⚙️ Configuration

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `apiKey` | `string` | — | **Required**. Your project's API Key. |
| `baseUrl` | `string` | `https://devnexus.vercel.app/api/ingest` | The ingest endpoint URL. |
| `autoCapture` | `boolean` | `true` | Catch global errors automatically. |
| `maxRetries` | `number` | `3` | Retries for failed reports. |
| `beforeSend` | `function` | — | Hook to scrub/modify data before sending. Return `null` to cancel. |
| `flushInterval`| `number` | `5000` | How often (ms) to flush the report queue. |

## 🛠️ Advanced Usage: Breadcrumbs
Manual breadcrumbs help you understand the events leading up to an error.

```typescript
DevNexus.addBreadcrumb({
  message: 'User added item to cart',
  type: 'manual',
  level: 'info'
});
```

## 📄 License
MIT © [DevNexus Team](https://devnexus-omega.vercel.app/)
