---
description: How to use the DevNexus SDK in your project
---

The DevNexus SDK allows you to easily report exceptions and messages from your JavaScript or TypeScript application to the DevNexus Incident Management System.

> **ADVANCED plan only** — The SDK API Key is only generated for projects on the Advanced tier.

### 1. Installation

```bash
npm install devnexus-sdk
```

Or if testing locally against the SDK source:
```bash
cd sdk && npm link
cd your-project && npm link devnexus-sdk
```

### 2. Initialization

Import and initialize the SDK at the entry point of your application (e.g., `layout.tsx` / `index.ts`). Call `init()` **once only** — calling it again will log a warning and be ignored.

```typescript
import { DevNexus } from 'devnexus-sdk';

DevNexus.init({
  apiKey: 'YOUR_PROJECT_API_KEY', // Get this from Project → SDK Integration
  baseUrl: 'http://localhost:3000/api/ingest', // Optional: defaults to production URL
  autoCapture: true,  // Optional: automatically capture unhandled errors (default: true)
  maxRetries: 3,      // Optional: retry failed reports with backoff (default: 3)
});
```

### 3. Capturing Exceptions

```typescript
try {
  // Your code here
} catch (error) {
  await DevNexus.captureException(error, {
    severity: 'CRITICAL',
    tags: { section: 'billing' }
  });
}
```

### 4. Capturing Messages

```typescript
await DevNexus.captureMessage('User successfully upgraded plan', {
  severity: 'LOW',
  tags: { action: 'upgrade' }
});
```

### 5. Deduplication

Identical errors (same message + stack) are automatically suppressed within a 1-minute window. You will see in your console:
```
[DevNexus] Suppressed duplicate: "Your Error Message"
```

### 6. Re-initialization (for testing/reconfiguration)

```typescript
DevNexus.reset();
DevNexus.init({ apiKey: 'NEW_KEY' });
```

### 7. Local Testing

Run the included test script from the `sdk/` directory:
```bash
npx tsx local-test.ts
```
