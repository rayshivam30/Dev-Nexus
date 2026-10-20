import { NextResponse } from "next/server";
import { IssueSeverity, RoutingMatchType } from "@devnexus/prisma-client";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/api-utils";
import { hasProjectMembership } from "@/services/membership-service";

async function canManage(projectId: string, decoded: { role?: string; orgId?: string; userId?: string }) {
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { orgId: true } });
  if (!project || project.orgId !== decoded.orgId) return false;
  return decoded.role === "ADMIN" || (decoded.role === "MANAGER" && !!decoded.userId && await hasProjectMembership(decoded.userId, projectId, ["MANAGER"]));
}

export const GET = withAuth(async (_request, { decoded, params }) => {
  const { id } = await (params as { id: string });
  if (!await canManage(id, decoded)) return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
  const rules = await prisma.routingRule.findMany({
    where: { projectId: id },
    include: { targetTeam: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ rules });
}, ["ADMIN", "MANAGER"]);

export const POST = withAuth(async (_request, { decoded, params, body }) => {
  const { id } = await (params as { id: string });
  if (!await canManage(id, decoded)) return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
  const input = body as { targetTeamId?: string; matchType?: string; matchValue?: string };
  const value = input.matchValue?.trim() || "";
  const validTag = input.matchType !== "TAG" || /^[^=\s]+=.{1,}$/.test(value);
  const validSeverity = input.matchType !== "SEVERITY" || Object.values(IssueSeverity).includes(value.toUpperCase() as IssueSeverity);
  if (!input.targetTeamId || !value || value.length > 256 || !input.matchType || !Object.values(RoutingMatchType).includes(input.matchType as RoutingMatchType) || !validTag || !validSeverity) {
    return NextResponse.json({ error: "A target team, valid match type, and match value (max 256 chars) are required" }, { status: 400 });
  }
  const team = await prisma.team.findFirst({ where: { id: input.targetTeamId, projectId: id }, select: { id: true } });
  if (!team) return NextResponse.json({ error: "Target team must belong to this project" }, { status: 400 });
  const rule = await prisma.routingRule.create({
    data: { projectId: id, targetTeamId: team.id, matchType: input.matchType as RoutingMatchType, matchValue: value },
    include: { targetTeam: { select: { id: true, name: true } } },
  });
  return NextResponse.json({ rule }, { status: 201 });
}, ["ADMIN", "MANAGER"]);

export const DELETE = withAuth(async (_request, { decoded, params, body }) => {
  const { id } = await (params as { id: string });
  if (!await canManage(id, decoded)) return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
  const ruleId = (body as { ruleId?: string } | undefined)?.ruleId;
  if (!ruleId) return NextResponse.json({ error: "ruleId is required" }, { status: 400 });
  const deleted = await prisma.routingRule.deleteMany({ where: { id: ruleId, projectId: id } });
  if (deleted.count !== 1) return NextResponse.json({ error: "Routing rule not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}, ["ADMIN", "MANAGER"]);
