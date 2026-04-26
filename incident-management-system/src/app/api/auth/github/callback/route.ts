import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const installationId = searchParams.get("installation_id");
  const projectId = searchParams.get("state"); // We passed projectId in the 'state' parameter

  if (!installationId || !projectId) {
    return NextResponse.json({ error: "Missing installation data" }, { status: 400 });
  }

  try {
    // 1. Link the GitHub Installation ID to the project in our database
    await prisma.project.update({
      where: { id: projectId },
      data: {
        githubInstallationId: installationId,
      },
    });

    // 2. Redirect the user back to their project dashboard with a success message
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const host = req.headers.get("host");
    
    // You can redirect to a specific project page or the main dashboard
    return NextResponse.redirect(`${protocol}://${host}/dashboard/admin?github_linked=true`);

  } catch (error) {
    console.error("GitHub Callback Error:", error);
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const host = req.headers.get("host");
    return NextResponse.redirect(`${protocol}://${host}/dashboard/admin?error=github_link_failed`);
  }
}
