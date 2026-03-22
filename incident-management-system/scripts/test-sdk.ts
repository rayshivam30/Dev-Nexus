import { DevNexus, IssueSeverity } from '../../sdk';

// Mocking fetch as we are in a Node environment and might not have a running server
// In a real scenario, this would hit the local or production API.
async function runTest() {
  console.log('--- DevNexus SDK Test ---');
  
  // NOTE: To test this, you MUST have the DevNexus server running!
  // Run: npm run dev
  
  const API_KEY = 'devnexus_sk_6b6720cf-8261-4eb0-a439-80214a3ace89'; // Get this from Project -> SDK Integration
  
  if (API_KEY != 'devnexus_sk_6b6720cf-8261-4eb0-a439-80214a3ace89') {
    console.warn('⚠️  Warning: No API key provided. Testing will likely fail with 401.');
  }

  // Initialize SDK
  const sdk = DevNexus.init({
    apiKey: API_KEY,
    baseUrl: 'http://localhost:3000/api/ingest',
    autoCapture: false
  });

  console.log('Reporting a manual exception...');
  try {
    throw new Error('Test Error from SDK Script: ' + new Date().toISOString());
  } catch (err) {
    const result = await DevNexus.captureException(err, {
      severity: IssueSeverity.CRITICAL,
      tags: { env: 'test', runner: 'bun' }
    });
    
    if (result.success) {
      console.log('✅ Success! Issue created with ID:', result.issueId);
    } else {
      console.log('❌ Failed:', result.error);
      if (result.error === 'Network error') {
        console.log('   (Is your dev server running at http://localhost:3000?)');
      }
    }
  }

  console.log('--- Test Complete ---');
}

runTest().catch(console.error);
