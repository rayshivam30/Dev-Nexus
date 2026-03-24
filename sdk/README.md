# DevNexus SDK (devnexus-sdk) 🚨

The official lightweight client for reporting errors and incidents to the **DevNexus Incident Management System**.

[![NPM Version](https://img.shields.io/npm/v/devnexus-sdk.svg)](https://www.npmjs.com/package/devnexus-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **One-liner Setup**: Just call `DevNexus.init` once.
- **Zero Overhead**: Minimal performance impact.
- **Auto-Capture**: Catches uncaught exceptions and unhandled rejections automatically.
- **Universal**: Works in both **Browser** and **Node.js** environments.
- **Type-Safe**: Written in TypeScript with full ESM and CommonJS support.

## Installation

```bash
npm install devnexus-sdk
# or
yarn add devnexus-sdk
# or
bun add devnexus-sdk
```

## Quick Start

### 1. Initialize the SDK
Initialize the client as early as possible in your application entry point.

```typescript
import { DevNexus } from 'devnexus-sdk';

DevNexus.init({
  apiKey: 'dn_live_YOUR_API_KEY', // Get this from your DevNexus Project Dashboard
  autoCapture: true // Automatically capture global errors (default: true)
});
```

### 2. Manual Reporting
You can also manually report exceptions or custom messages from anywhere in your code.

```typescript
try {
  // Your logic here
} catch (error) {
  DevNexus.captureException(error, {
    severity: 'HIGH',
    tags: { component: 'checkout' }
  });
}

// Or just send a message
DevNexus.captureMessage('User performed a critical action', {
  severity: 'LOW'
});
```

## Configuration

| Option | Type | Description |
| --- | --- | --- |
| `apiKey` | `string` | **Required**. Your project's unique SDK API Key. |
| `baseUrl` | `string` | The ingest endpoint URL (Default: `https://dev-nexus-ptnh.vercel.app/api/ingest`). |
| `autoCapture` | `boolean` | If `true`, the SDK will catch global errors/unhandled rejections (Default: `true`). |

## Monitoring Issues
Once integrated, head over to your [DevNexus Dashboard](https://dev-nexus-ptnh.vercel.app/dashboard) to see your incidents organized by service, environment, and severity.

## License
MIT © [DevNexus Team](https://dev-nexus-ptnh.vercel.app/)
