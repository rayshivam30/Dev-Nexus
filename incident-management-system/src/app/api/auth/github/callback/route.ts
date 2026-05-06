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

    // Redirect the user back to their specific project page with a success flag
    return NextResponse.redirect(`${baseUrl}/dashboard/admin/projects/${projectId}?github_linked=true`);

  } catch (error) {
    console.error("GitHub Callback Error:", error);
    return NextResponse.redirect(`${baseUrl}/dashboard/admin?error=github_link_failed`);
  }
}
