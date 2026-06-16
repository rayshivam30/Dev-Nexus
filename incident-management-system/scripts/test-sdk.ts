import { DevNexus, IssueSeverity } from '../../sdk';

// Mocking fetch as we are in a Node environment and might not have a running server
// In a real scenario, this would hit the local or production API.
async function runTest() {
  console.log('--- DevNexus SDK Test ---');
  
  // NOTE: To test this, you MUST have the DevNexus server running!
  // Run: npm run dev
  
  const API_KEY = process.env.TEST_SDK_API_KEY;
  
  if (!API_KEY) {
    console.error('❌ TEST_SDK_API_KEY environment variable is required. Set it in your .env file.');
    process.exit(1);
  }

  // Initialize SDK
  DevNexus.init({
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
