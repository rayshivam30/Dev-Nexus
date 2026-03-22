---
description: How to use the DevNexus SDK in your project
---

The DevNexus SDK allows you to easily report exceptions and messages from your JavaScript or TypeScript application to the DevNexus Incident Management System.

### 1. Installation

If you are using the local SDK folder:
```bash
npm install ../path/to/sdk
# or link it
cd ../path/to/sdk && npm link
cd your-project && npm link @devnexus/sdk
```

### 2. Initialization

Import and initialize the SDK at the entry point of your application (e.g., `index.ts` or `App.tsx`).

```typescript
import { DevNexus } from '@devnexus/sdk';

DevNexus.init({
  apiKey: 'YOUR_PROJECT_API_KEY', // Get this from Project -> SDK Integration
  baseUrl: 'http://localhost:3000/api/ingest', // Optional: change for local dev
  autoCapture: true // Optional: automatically capture unhandled errors
});
```

### 3. Capturing Exceptions

You can manually capture exceptions in `try...catch` blocks.

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

You can also send simple informational messages.

```typescript
await DevNexus.captureMessage('User successfully upgraded plan', {
  severity: 'LOW',
  tags: { action: 'upgrade' }
});
```

### 5. Automated Testing

You can use the built-in test script to verify your integration:
```bash
bun scripts/test-sdk.ts
```
