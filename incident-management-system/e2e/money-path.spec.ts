import { test, expect } from '@playwright/test';
import { PrismaClient } from '@devnexus/prisma-client';
import { hash } from 'bcryptjs';
import crypto from 'node:crypto';

const prisma = new PrismaClient();
const suffix = crypto.randomUUID().slice(0, 8);
const email = `e2e-${suffix}@example.test`;
const password = 'DevNexus-E2E-Password1!';
let orgId: string;
let developerId: string;

async function waitFor<T>(read: () => Promise<T>, ready: (value: T) => boolean, label: string): Promise<T> {
  const deadline = Date.now() + 20_000;
  let latest = await read();
  while (!ready(latest) && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    latest = await read();
  }
  expect(ready(latest), `${label} did not complete`).toBe(true);
  return latest;
}

test.beforeAll(async () => {
  const organization = await prisma.organization.create({ data: { name: `E2E ${suffix}` } });
  orgId = organization.id;
  await prisma.user.create({
    data: {
      email,
      passwordHash: await hash(password, 4),
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      orgId,
    },
  });
});

test.afterAll(async () => { await prisma.$disconnect(); });

test('login → project → ingest → grouped issue → assign → resolve', async ({ page }) => {
  await page.goto('/auth/login');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: /Sign in/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  const csrfResponse = await page.request.get('/api/csrf-token');
  expect(csrfResponse.ok()).toBeTruthy();
  const { token: csrfToken } = await csrfResponse.json();
  const headers = { 'x-csrf-token': csrfToken };

  const projectResponse = await page.request.post('/api/projects', {
    headers,
    data: { name: `E2E Project ${suffix}`, plan: 'ADVANCED' },
  });
  expect(projectResponse.status()).toBe(201);
  const { project } = await projectResponse.json();
  expect(project.sdkApiKey).toMatch(/^devnexus_sk_/);

  const origin = 'http://localhost:3000';
  const settingsResponse = await page.request.patch(`/api/projects/${project.id}/settings`, {
    headers,
    data: { allowedOrigins: [origin] },
  });
  expect(settingsResponse.ok()).toBeTruthy();

  const report = { message: `E2E grouped error ${suffix}`, stack: 'at checkout (app.js:1:1)', severity: 'HIGH' };
  const ingestHeaders = { Authorization: `Bearer ${project.sdkApiKey}`, Origin: origin };
  const firstIngest = await page.request.post('/api/ingest', { headers: ingestHeaders, data: report });
  const secondIngest = await page.request.post('/api/ingest', { headers: ingestHeaders, data: report });
  const firstIngestBody = await firstIngest.text();
  const secondIngestBody = await secondIngest.text();
  expect(firstIngest.status(), firstIngestBody).toBe(201);
  expect(secondIngest.status(), secondIngestBody).toBe(201);
  const firstResult = JSON.parse(firstIngestBody) as { issueId: string };
  const secondResult = JSON.parse(secondIngestBody) as { issueId: string };
  expect(secondResult.issueId).toBe(firstResult.issueId);
  const groupedIssue = await prisma.issue.findUnique({ where: { id: firstResult.issueId } });
  expect(groupedIssue?.timesSeen).toBe(2);

  await prisma.issue.update({
    where: { id: firstResult.issueId },
    data: {
      responseSlaDeadline: new Date(Date.now() - 60_000),
      resolutionSlaDeadline: new Date(Date.now() - 60_000),
    },
  });
  const completedAiJob = await waitFor(
    async () => (await prisma.job.findMany({ where: { type: 'AI_ANALYZE' }, orderBy: { createdAt: 'desc' }, take: 20 }))
      .find((job) => (job.payload as { issueId?: string }).issueId === firstResult.issueId),
    (job) => job?.status === 'COMPLETE',
    'AI analysis job',
  );
  expect(completedAiJob?.status).toBe('COMPLETE');
  const slaIssue = await waitFor(
    () => prisma.issue.findUnique({ where: { id: firstResult.issueId } }),
    (issue) => issue?.responseBreached === true && issue?.resolutionBreached === true,
    'SLA sweep',
  );
  expect(slaIssue?.responseBreached).toBe(true);
  expect(slaIssue?.resolutionBreached).toBe(true);

  const team = await prisma.team.create({ data: { name: `E2E Team ${suffix}`, projectId: project.id } });
  const developer = await prisma.user.create({
    data: {
      email: `developer-${suffix}@example.test`,
      passwordHash: await hash(password, 4),
      role: 'DEVELOPER',
      status: 'ACTIVE',
      orgId,
    },
  });
  developerId = developer.id;
  await prisma.projectMembership.create({ data: { userId: developer.id, projectId: project.id, role: 'DEVELOPER' } });
  await prisma.teamMembership.create({ data: { userId: developer.id, teamId: team.id, role: 'DEVELOPER' } });

  const inviteEmail = `invited-${suffix}@example.test`;
  const inviteResponse = await page.request.post('/api/auth/invite', {
    headers,
    data: { email: inviteEmail, role: 'DEVELOPER', teamId: team.id },
  });
  expect(inviteResponse.ok()).toBeTruthy();
  expect((await inviteResponse.json()).warning).toBeUndefined();
  const completedEmailJob = await waitFor(
    async () => (await prisma.job.findMany({ where: { type: 'EMAIL' }, orderBy: { createdAt: 'desc' }, take: 20 }))
      .find((job) => (job.payload as { to?: string }).to === inviteEmail),
    (job) => job?.status === 'COMPLETE',
    'email delivery job',
  );
  expect(completedEmailJob?.status).toBe('COMPLETE');

  const assign = await page.request.patch(`/api/issues/${firstResult.issueId}`, {
    headers,
    data: { teamId: team.id, assignedToId: developerId },
  });
  expect(assign.ok()).toBeTruthy();
  expect((await assign.json()).issue.assignedToId).toBe(developerId);

  const resolve = await page.request.patch(`/api/issues/${firstResult.issueId}`, {
    headers,
    data: { status: 'RESOLVED' },
  });
  expect(resolve.ok()).toBeTruthy();
  expect((await resolve.json()).issue.status).toBe('RESOLVED');
});
