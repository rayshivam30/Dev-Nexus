import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/api-utils";

async function getProject(projectId: string, orgId?: string) {
  if (!orgId) return null;
  return prisma.project.findFirst({ where: { id: projectId, orgId }, select: { id: true, orgId: true } });
}

export const GET = withAuth(async (_request, { decoded, params }) => {
  const { id } = await (params as { id: string });
  const project = await getProject(id, decoded.orgId);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const [rotation, eligibleMembers] = await Promise.all([
    prisma.onCallRotation.findUnique({
      where: { projectId: id },
      include: { members: { orderBy: { position: "asc" }, include: { user: { select: { id: true, name: true, email: true } } } } },
    }),
    prisma.user.findMany({
      where: {
        orgId: project.orgId,
        status: "ACTIVE",
        OR: [{ role: "ADMIN" }, { projectMemberships: { some: { projectId: id } } }],
      },
      select: { id: true, name: true, email: true },
      orderBy: { email: "asc" },
    }),
  ]);

  return NextResponse.json({ rotation, eligibleMembers });
}, ["ADMIN"]);

export const PUT = withAuth(async (_request, { decoded, params, body }) => {
  const { id } = await (params as { id: string });
  const project = await getProject(id, decoded.orgId);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  const input = body as { name?: string; timezone?: string; startsAt?: string; shiftDurationHours?: number; memberIds?: string[] };
  const name = input.name?.trim() || "";
  const timezone = input.timezone?.trim() || "UTC";
  const startsAt = new Date(input.startsAt || "");
  const shiftDurationHours = Number(input.shiftDurationHours);
  const memberIds = input.memberIds;
  let validTimezone = true;
  try { new Intl.DateTimeFormat("en", { timeZone: timezone }); } catch { validTimezone = false; }

  if (!name || name.length > 80 || !validTimezone || Number.isNaN(startsAt.getTime()) ||
      !Number.isInteger(shiftDurationHours) || shiftDurationHours < 1 || shiftDurationHours > 168 ||
      !Array.isArray(memberIds) || memberIds.length < 1 || memberIds.length > 100 ||
      memberIds.some((memberId) => typeof memberId !== "string") || new Set(memberIds).size !== memberIds.length) {
    return NextResponse.json({ error: "Provide a name, valid timezone and start time, a 1–168 hour shift, and at least one unique rotation member" }, { status: 400 });
  }

  const eligibleCount = await prisma.user.count({
    where: {
      id: { in: memberIds }, orgId: project.orgId, status: "ACTIVE",
      OR: [{ role: "ADMIN" }, { projectMemberships: { some: { projectId: id } } }],
    },
  });
  if (eligibleCount !== memberIds.length) return NextResponse.json({ error: "Every rotation member must be an active organization admin or project member" }, { status: 400 });

  const rotation = await prisma.$transaction(async (tx) => {
    const saved = await tx.onCallRotation.upsert({
      where: { projectId: id },
      create: { projectId: id, name, timezone, startsAt, shiftDurationHours },
      update: { name, timezone, startsAt, shiftDurationHours, enabled: true },
    });
    await tx.onCallRotationMember.deleteMany({ where: { rotationId: saved.id } });
    await tx.onCallRotationMember.createMany({ data: memberIds.map((userId, position) => ({ rotationId: saved.id, userId, position })) });
    return tx.onCallRotation.findUnique({
      where: { id: saved.id },
      include: { members: { orderBy: { position: "asc" }, include: { user: { select: { id: true, name: true, email: true } } } } },
    });
  });
  return NextResponse.json({ rotation });
}, ["ADMIN"]);

export const DELETE = withAuth(async (_request, { decoded, params }) => {
  const { id } = await (params as { id: string });
  if (!await getProject(id, decoded.orgId)) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  await prisma.onCallRotation.deleteMany({ where: { projectId: id } });
  return NextResponse.json({ success: true });
}, ["ADMIN"]);
