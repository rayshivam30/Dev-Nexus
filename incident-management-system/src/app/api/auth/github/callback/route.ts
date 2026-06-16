import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/api-utils";
import { verifyToken } from "@/lib/jwt";
import { getBaseUrl } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const installationId = searchParams.get("installation_id");
  const state = searchParams.get("state");
  const baseUrl = getBaseUrl();

  // Validate baseUrl is a proper URL (prevents misconfigured NEXT_PUBLIC_APP_URL)
  try {
    const parsed = new URL(baseUrl);
    if (process.env.NODE_ENV === "production" && parsed.protocol !== "https:") {
      console.error("GitHub callback: baseUrl must use HTTPS in production:", baseUrl);
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }
  } catch {
    console.error("GitHub callback: invalid baseUrl:", baseUrl);
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  if (!installationId || !state) {
    return NextResponse.redirect(
      `${baseUrl}/dashboard/admin?error=github_missing_data`
    );
  }

  const currentUser = await getCurrentUser();
  const statePayload = verifyToken(state);
  if (
    !currentUser ||
    currentUser.role !== "ADMIN" ||
    !statePayload ||
    statePayload.userId !== currentUser.userId ||
    statePayload.orgId !== currentUser.orgId ||
    !statePayload.projectId
  ) {
    return NextResponse.redirect(
      `${baseUrl}/dashboard/admin?error=github_invalid_state`
    );
  }

  try {
    const updated = await prisma.project.updateMany({
      where: {
        id: statePayload.projectId,
        orgId: currentUser.orgId,
      },
      data: {
        githubInstallationId: installationId,
      },
    });

    if (updated.count !== 1) {
      return NextResponse.redirect(
        `${baseUrl}/dashboard/admin?error=github_project_not_found`
      );
    }

    const safeOrigin = JSON.stringify(new URL(baseUrl).origin);
    const safeProjectId = JSON.stringify(statePayload.projectId);
    const successHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>GitHub Connected</title>
        <style>
          body { background:#0b0b0c; color:#fff; font-family:Arial,sans-serif; display:flex; align-items:center; justify-content:center; height:100vh; margin:0; text-align:center; }
          main { max-width:420px; padding:40px; border:1px solid #27272a; border-radius:16px; }
          p { color:#a1a1aa; line-height:1.5; }
          button { padding:12px 20px; border:0; border-radius:8px; cursor:pointer; }
        </style>
      </head>
      <body>
        <main>
          <h1>GitHub Connected</h1>
          <p>The installation is now linked to your DevNexus project.</p>
          <button onclick="window.close()">Close Window</button>
        </main>
        <script>
          const targetOrigin = ${safeOrigin};
          const channel = new BroadcastChannel("devnexus-github");
          channel.postMessage({ type: "GITHUB_LINKED", projectId: ${safeProjectId} });
          channel.close();
          if (window.opener) {
            window.opener.postMessage(
              { type: "GITHUB_LINKED", projectId: ${safeProjectId} },
              targetOrigin
            );
          }
          setTimeout(function () { window.close(); }, 3500);
        </script>
      </body>
      </html>
    `;

    return new NextResponse(successHtml, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("GitHub Callback Error:", error);
    return NextResponse.redirect(
      `${baseUrl}/dashboard/admin?error=github_callback_failed`
    );
  }
}
