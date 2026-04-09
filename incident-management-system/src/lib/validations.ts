import { z } from "zod";
import { IssueSeverity, EnvironmentType, Role, IssueStatus, IssuePriority } from "@prisma/client";

// Auth Schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  orgName: z.string().min(1, "Organization name is required"),
});

export const inviteSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(Role),
  projectId: z.string().optional(),
  teamId: z.string().optional(),
});

export const acceptInviteSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Issues Schemas
export const createIssueSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().min(1, "Description is required"),
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
