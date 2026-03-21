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
      }
    });

    if (!user) {
      return apiError("User not found", 404);
    }

    return apiResponse("Profile fetched successfully", { user });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return apiError("Failed to fetch profile", 500);
  }
});
