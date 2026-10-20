import { IssueSeverity } from "@devnexus/prisma-client";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/api-utils";
import { NextResponse } from "next/server";

async function ownsProject(projectId: string, orgId?: string) {
  if (!orgId) return false;
  return Boolean(await prisma.project.findFirst({ where: { id: projectId, orgId }, select: { id: true } }));
}

export const GET = withAuth(async (_req, { decoded, params }) => {
  const { id } = await (params as { id: string });
  if (!await ownsProject(id, decoded.orgId)) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  const policies = await prisma.alertPolicy.findMany({ where: { projectId: id }, orderBy: { createdAt: "asc" } });
  return NextResponse.json({ policies });
}, ["ADMIN"]);

export const POST = withAuth(async (_req, { decoded, params, body }) => {
  const { id } = await (params as { id: string });
  if (!await ownsProject(id, decoded.orgId)) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  const input = body as { name?: string; severity?: string; threshold?: number; windowMinutes?: number };
  const name = input.name?.trim() || "";
  const threshold = Number(input.threshold);
  const windowMinutes = Number(input.windowMinutes);
  if (!name || name.length > 80 || !Object.values(IssueSeverity).includes(input.severity as IssueSeverity) || !Number.isInteger(threshold) || threshold < 1 || threshold > 100_000 || !Number.isInteger(windowMinutes) || windowMinutes < 1 || windowMinutes > 1440) {
    return NextResponse.json({ error: "Provide a name, severity, event threshold (1–100000), and window (1–1440 minutes)" }, { status: 400 });
  }
  const policy = await prisma.alertPolicy.create({ data: { projectId: id, name, severity: input.severity as IssueSeverity, threshold, windowMinutes } });
  return NextResponse.json({ policy }, { status: 201 });
}, ["ADMIN"]);

export const DELETE = withAuth(async (_req, { decoded, params, body }) => {
  const { id } = await (params as { id: string });
  if (!await ownsProject(id, decoded.orgId)) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  const policyId = (body as { policyId?: string } | undefined)?.policyId;
  if (!policyId) return NextResponse.json({ error: "policyId is required" }, { status: 400 });
  const deleted = await prisma.alertPolicy.deleteMany({ where: { id: policyId, projectId: id } });
  if (!deleted.count) return NextResponse.json({ error: "Alert policy not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}, ["ADMIN"]);
