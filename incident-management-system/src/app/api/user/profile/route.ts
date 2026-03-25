import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth, apiResponse, apiError } from "@/lib/api-utils";

export const PATCH = withAuth(async (req, { decoded, body }) => {
  try {
    const userId = decoded.userId;

    if (!body) {
      return apiError("Missing request body", 400);
    }

    const { 
      name, 
      bio, 
      image, 
      phoneNumber, 
      location, 
      githubUrl, 
      linkedinUrl, 
      skills 
    } = body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        bio,
        image,
        phoneNumber,
        location,
        githubUrl,
        linkedinUrl,
        skills: Array.isArray(skills) ? skills : undefined,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        bio: true,
        image: true,
        phoneNumber: true,
        location: true,
        githubUrl: true,
        linkedinUrl: true,
        skills: true,
      }
    });

    return apiResponse("Profile updated successfully", { user: updatedUser });
  } catch (error) {
    console.error("Profile update error:", error);
    return apiError("Failed to update profile", 500);
  }
});

export const GET = withAuth(async (req, { decoded }) => {
  try {
    const userId = decoded.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        bio: true,
        image: true,
        phoneNumber: true,
        location: true,
        githubUrl: true,
        linkedinUrl: true,
        skills: true,
        orgId: true,
        projectId: true,
      }
    });

    if (!user) {
      return apiError("User not found", 404);
    }

    // Calculate Stats based on Role
    let resolvedCount = 0;
    let breachedCount = 0;
    let totalIssuesCount = 0;
    const now = new Date();

    if (user.role === "ADMIN") {
      // Find all project IDs in the admin's organization
      let targetOrgId = user.orgId;
      if (!targetOrgId) {
        // Fallback for primary admin if orgId is missing but role is ADMIN
        const firstOrg = await prisma.organization.findFirst({ select: { id: true } });
        targetOrgId = firstOrg?.id || null;
      }

      const [resolved, breached, total] = await Promise.all([
        prisma.issue.count({
          where: { project: { orgId: targetOrgId || undefined }, status: "RESOLVED" },
        }),
        prisma.issue.count({
          where: { 
            project: { orgId: targetOrgId || undefined }, 
            OR: [
              { responseBreached: true }, 
              { resolutionBreached: true },
              { responseSlaDeadline: { lt: now }, status: "OPEN" },
              { resolutionSlaDeadline: { lt: now }, status: { not: "RESOLVED" } }
            ] 
          },
        }),
        prisma.issue.count({
          where: { project: { orgId: targetOrgId || undefined } },
        })
      ]);
      resolvedCount = resolved;
      breachedCount = breached;
      totalIssuesCount = total;
    } else if (user.role === "MANAGER" && user.projectId) {
      const [resolved, breached, total] = await Promise.all([
        prisma.issue.count({
          where: { projectId: user.projectId, status: "RESOLVED" },
        }),
        prisma.issue.count({
          where: { 
            projectId: user.projectId, 
            OR: [
              { responseBreached: true }, 
              { resolutionBreached: true },
              { responseSlaDeadline: { lt: now }, status: "OPEN" },
              { resolutionSlaDeadline: { lt: now }, status: { not: "RESOLVED" } }
            ] 
          },
        }),
        prisma.issue.count({
          where: { projectId: user.projectId },
        })
      ]);
      resolvedCount = resolved;
      breachedCount = breached;
      totalIssuesCount = total;
    } else {
      // DEVELOPER or fallback (Personal context)
      const [resolved, breached, total] = await Promise.all([
        prisma.issue.count({
          where: { assignedToId: userId, status: "RESOLVED" },
        }),
        prisma.issue.count({
          where: { 
            assignedToId: userId, 
            OR: [
              { responseBreached: true }, 
              { resolutionBreached: true },
              { responseSlaDeadline: { lt: now }, status: "OPEN" },
              { resolutionSlaDeadline: { lt: now }, status: { not: "RESOLVED" } }
            ] 
          },
        }),
        prisma.issue.count({
          where: { assignedToId: userId },
        })
      ]);
      resolvedCount = resolved;
      breachedCount = breached;
      totalIssuesCount = total;
    }

    // Dynamic rating formula
    let rating = "5.0";
    if (totalIssuesCount > 0) {
      if (user.role === "DEVELOPER") {
        // Individual performance: -0.1 per breach, base 5.0
        rating = Math.max(1.0, 5.0 - (breachedCount * 0.1)).toFixed(1);
      } else {
        // Org/Project performance: Percentage-based
        const breachRate = breachedCount / totalIssuesCount;
        rating = Math.max(1.0, 5.0 * (1.0 - breachRate)).toFixed(1);
      }
    } else if (user.role === "ADMIN" || user.role === "MANAGER") {
        // For Admins/Managers with no issues, keep it at 5.0 but ensure it's calculated
        rating = "5.0";
    }



    // Profile Completion
    const profileFields = [

      user.name,
      user.bio,
      user.image,
      user.phoneNumber,
      user.location,
      user.githubUrl,
      user.linkedinUrl,
      (user.skills && user.skills.length > 0) ? 'skills' : null,
    ];
    const completedFields = profileFields.filter(field => !!field).length;
    const profileCompletion = Math.round((completedFields / profileFields.length) * 100);

    return apiResponse("Profile fetched successfully", { 
      user,
      stats: {
        resolvedCount,
        rating,
        profileCompletion
      }
    });

  } catch (error) {
    console.error("Profile fetch error:", error);
    return apiError("Failed to fetch profile", 500);
  }
});

