import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const installationId = searchParams.get("installation_id");
  const projectId = searchParams.get("state"); // We passed projectId in the 'state' parameter

  const protocol = req.headers.get("x-forwarded-proto") || "http";
  const host = req.headers.get("host");
  const baseUrl = `${protocol}://${host}`;

  if (!installationId || !projectId) {
    return NextResponse.redirect(`${baseUrl}/dashboard/admin?error=github_missing_data`);
  }

  try {
    // Link the GitHub Installation ID to the project in our database
    await prisma.project.update({
      where: { id: projectId },
      data: {
        githubInstallationId: installationId,
      },
    });

    const successHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>GitHub Connected</title>
        <style>
          body {
            background-color: #0b0b0c;
            color: #ffffff;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            text-align: center;
          }
          .container {
            padding: 2.5rem;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 20px;
            background-color: rgba(255, 255, 255, 0.02);
            backdrop-filter: blur(10px);
            max-width: 420px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          }
          .icon-box {
            width: 64px;
            height: 64px;
            background-color: rgba(16, 185, 129, 0.1);
            border: 1px solid rgba(16, 185, 129, 0.2);
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px auto;
          }
          .icon {
            color: #10b981;
            font-size: 32px;
            font-weight: bold;
          }
          h1 { font-size: 22px; font-weight: 800; margin-bottom: 10px; tracking: -0.5px; }
          p { color: #82828c; font-size: 14px; margin-bottom: 24px; line-height: 1.5; }
          button {
            background-color: #ffffff;
            color: #000000;
            border: none;
            padding: 12px 24px;
            border-radius: 12px;
            font-weight: 600;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s;
          }
          button:hover {
            opacity: 0.9;
            transform: scale(0.98);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon-box">
            <span class="icon">✓</span>
          </div>
          <h1>GitHub Connected!</h1>
          <p>DevNexus is now successfully connected to your GitHub. This window will automatically close shortly.</p>
          <button onclick="window.close()">Close Window</button>
        </div>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'GITHUB_LINKED', projectId: '${projectId}' }, '*');
          }
          setTimeout(function() { window.close(); }, 3500);
        </script>
      </body>
      </html>
    `;

    return new NextResponse(successHtml, {
      headers: { "Content-Type": "text/html" }
    });

  } catch (error) {
    console.error("GitHub Callback Error:", error);
    const errorHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Connection Failed</title>
        <style>
          body {
            background-color: #0b0b0c;
            color: #ffffff;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            text-align: center;
          }
          .container {
            padding: 2.5rem;
            border: 1px solid rgba(239, 68, 68, 0.1);
            border-radius: 20px;
            background-color: rgba(239, 68, 68, 0.02);
            backdrop-filter: blur(10px);
            max-width: 420px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          }
          .icon-box {
            width: 64px;
            height: 64px;
            background-color: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.2);
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px auto;
          }
          .icon {
            color: #ef4444;
            font-size: 32px;
            font-weight: bold;
          }
          h1 { font-size: 22px; font-weight: 800; margin-bottom: 10px; tracking: -0.5px; }
          p { color: #82828c; font-size: 14px; margin-bottom: 24px; line-height: 1.5; }
          button {
            background-color: #ffffff;
            color: #000000;
            border: none;
            padding: 12px 24px;
            border-radius: 12px;
            font-weight: 600;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s;
          }
          button:hover {
            opacity: 0.9;
            transform: scale(0.98);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon-box">
            <span class="icon">✗</span>
          </div>
          <h1>Connection Failed</h1>
          <p>We were unable to complete the GitHub connection. Please try again.</p>
          <button onclick="window.close()">Close Window</button>
        </div>
      </body>
      </html>
    `;

    return new NextResponse(errorHtml, {
      headers: { "Content-Type": "text/html" }
    });
  }
}
