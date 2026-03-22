# DevNexus SDK: Deployment & Setup Guide 🚀

Follow these steps to integrate DevNexus into any project, both during development and in production.

---

### **Step 0: The Setup (DevNexus Dashboard)**
1.  **Create Project**: Go to your DevNexus dashboard.
2.  **Choose Plan**: Select the **Advanced** plan (this generates your unique SDK API Key).
3.  **Get API Key**: Copy the `sdkApiKey` from your Project Details page.

---

### **Scenario A: Local Development (Local Machine)**
*Use this for testing while your DevNexus server is also running locally.*

1.  **Copy SDK**: Place the `sdk` folder inside your project's `/lib` directory.
2.  **Install locally**: Update your `package.json` with:
    ```json
    "@devnexus/sdk": "file:./lib/sdk"
    ```
    Then run `npm install`.
3.  **Initialize for Local Testing**:
    ```javascript
    import { DevNexus } from '@devnexus/sdk';

    DevNexus.init({ 
      apiKey: 'YOUR_SDK_API_KEY', 
      baseUrl: 'http://localhost:3000/api/ingest', // Internal URL
      autoCapture: true 
    });
    ```

---

### **Scenario B: Production Deployment (Live)**
*Use this when your project and DevNexus are both live on the internet.*

1.  **Install via NPM**: After you publish the SDK to the NPM registry, run:
    ```bash
    npm install @devnexus/sdk
    ```
2.  **Initialize for Production**: Update your `DevNexus.init` call to use your **live domain**:
    ```javascript
    import { DevNexus } from '@devnexus/sdk';

    DevNexus.init({ 
      apiKey: 'YOUR_SDK_API_KEY', 
      baseUrl: 'https://your-live-devnexus-domain.com/api/ingest',
      autoCapture: true 
    });
    ```

---

### **Verifying Connection**
When your app crashes or reports an error, you will see a red log in your **Browser Console (F12)** or **Terminal**:
`[DevNexus] 🚨 Reporting Issue: Your Error Message Here`

If you see this, the SDK is working and the incident is being sent to your DevNexus dashboard! 🚀
