import { z } from "zod";
import { IssueSeverity, EnvironmentType, Role, IssueStatus, IssuePriority } from "@devnexus/prisma-client";

// Auth Schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

const passwordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters")
  .max(128, "Password must not exceed 128 characters")
  .refine((p) => /[a-z]/.test(p), "Must contain at least one lowercase letter")
  .refine((p) => /[A-Z]/.test(p), "Must contain at least one uppercase letter")
  .refine((p) => /[0-9]/.test(p), "Must contain at least one number")
  .refine(
    (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p),
    "Must contain at least one special character"
  );

export const registerSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  orgName: z.string().min(1, "Organization name is required"),
});

export const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum([Role.MANAGER, Role.DEVELOPER]),
  projectId: z.string().optional(),
  teamId: z.string().optional(),
}).superRefine((data, context) => {
  if (data.role === Role.MANAGER && !data.projectId) {
    context.addIssue({
      code: "custom",
      path: ["projectId"],
      message: "Manager invites require a project",
    });
  }
  if (data.role === Role.DEVELOPER && !data.teamId) {
    context.addIssue({
      code: "custom",
      path: ["teamId"],
      message: "Developer invites require a team",
    });
  }
});

export const acceptInviteSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: passwordSchema,
});

// Issues Schemas
export const createIssueSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().min(1, "Description is required").max(10000, "Description must be 10,000 characters or less"),
  severity: z.nativeEnum(IssueSeverity),
  priority: z.nativeEnum(IssuePriority).optional().default("MEDIUM"),
  environment: z.nativeEnum(EnvironmentType).optional().default("PRODUCTION"),
  projectId: z.string().min(1, "Project ID is required"),
  teamId: z.string().optional(),
  assignedToId: z.string().optional(),
});

export const updateIssueSchema = z.object({
  status: z.nativeEnum(IssueStatus).optional(),
  teamId: z.string().optional(),
  assignedToId: z.string().optional(),
  rootCause: z.string().max(1000).optional(),
});

// AI Service Schema
export const aiAnalysisSchema = z.object({
  title: z.string(),
  description: z.string(),
  severity: z.nativeEnum(IssueSeverity),
  priority: z.nativeEnum(IssuePriority),
  environment: z.nativeEnum(EnvironmentType),
  rootCause: z.string(),
  suggestedFixes: z.string(),
});

// Profile Update Schema
export const profileUpdateSchema = z.object({
  name: z.string().max(100, "Name must be 100 characters or fewer").optional(),
  bio: z.string().max(500, "Bio must be 500 characters or fewer").optional(),
  image: z
    .string()
    .url("Image must be a valid URL")
    .refine((url) => url.startsWith("https://"), "Image URL must use HTTPS")
    .refine((url) => {
      try {
        const parsed = new URL(url);
        return [
          "github.com",
          "www.github.com",
          "avatars.githubusercontent.com",
          "raw.githubusercontent.com",
          "cdn.example.com"
        ].includes(parsed.hostname);
      } catch {
        return false;
      }
    }, "Image URL must be from a trusted source (GitHub or cdn.example.com)")
    .optional(),
  phoneNumber: z
    .string()
    .regex(/^\+?[0-9\s\-()]{7,20}$/, "Invalid phone number format")
    .optional(),
  location: z.string().max(100, "Location must be 100 characters or fewer").optional(),
  githubUrl: z
    .string()
    .url("GitHub URL must be a valid URL")
    .refine(
      (url) => /^https:\/\/(www\.)?github\.com\//.test(url),
      "Must be a valid GitHub profile URL"
    )
    .optional(),
  linkedinUrl: z
    .string()
    .url("LinkedIn URL must be a valid URL")
    .refine(
      (url) => /^https:\/\/(www\.)?linkedin\.com\//.test(url),
      "Must be a valid LinkedIn profile URL"
    )
    .optional(),
  skills: z
    .array(z.string().max(50, "Each skill must be 50 characters or fewer"))
    .max(20, "Maximum 20 skills allowed")
    .optional(),
});

