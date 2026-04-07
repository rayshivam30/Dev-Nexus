// sdk/local-test.ts — Run with: npx tsx local-test.ts
import { DevNexus, IssueSeverity } from './index';

DevNexus.init({
  apiKey: 'YOUR-API-KEY-FROM-DASHBOARD',
  baseUrl: 'http://localhost:3000/api/ingest',
});

async function runTests() {
  // Test 1: manual exception capture
  const result = await DevNexus.captureException(
    new Error('Payment processing failed'),
    { severity: IssueSeverity.HIGH, tags: { section: 'billing' } }
  );
  console.log('Test 1 (new error → should succeed):', result);

  // Test 2: deduplication — same error, should be suppressed
  const result2 = await DevNexus.captureException(
    new Error('Payment processing failed'),
    { severity: IssueSeverity.HIGH }
  );
  console.log('Test 2 (duplicate → should be suppressed):', result2);

  // Test 3: message capture
  const result3 = await DevNexus.captureMessage('User signed up', { severity: IssueSeverity.LOW });
  console.log('Test 3 (message → should succeed):', result3);

  // Test 4: double init guard — should warn, not crash
  DevNexus.init({ apiKey: 'ANOTHER_KEY' });
  console.log('Test 4: double init → check for [DevNexus] Already initialized warning above');
}

runTests().catch(console.error);
