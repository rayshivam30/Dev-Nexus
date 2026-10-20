import { afterAll, beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";

const state: {
  issue: Record<string, any> | null;
  createCalls: Array<Record<string, any>>;
  activityActions: string[];
} = { issue: null, createCalls: [], activityActions: [] };

const testProject = {
  id: "grouping-project",
  orgId: "grouping-org",
  plan: "ADVANCED",
  allowedOrigins: [],
  sdkApiKey: null,
};

const prisma = {
  projectDailyUsage: { upsert: mock(() => Promise.resolve({ eventCount: 1 })) },
  issue: {
    findFirst: mock(async (): Promise<Record<string, any> | null> => null),
    create: mock((args: { data: Record<string, any> }) => {
      state.createCalls.push(args.data);
      state.issue = {
        id: "grouped-issue",
        ...args.data,
        status: "OPEN",
        resolvedAt: null,
        timesSeen: 1,
        createdAt: new Date(),
      };
      return Promise.resolve(state.issue);
    }),
    update: mock((args: { data: Record<string, any> }) => {
      if (!state.issue) throw new Error("Expected a grouped issue to exist");
      const increment = args.data.timesSeen?.increment || 0;
      state.issue = {
        ...state.issue,
        ...args.data,
        timesSeen: state.issue.timesSeen + increment,
        ...(args.data.status === "OPEN" ? { status: "OPEN", resolvedAt: null } : {}),
      };
      return Promise.resolve(state.issue);
    }),
  },
  issueActivity: {
    count: mock(() => Promise.resolve(0)),
    create: mock((args: { data: { action: string } }) => {
      state.activityActions.push(args.data.action);
      return Promise.resolve({ id: `activity-${state.activityActions.length}`, ...args.data });
    }),
  },
  job: { create: mock(() => Promise.resolve({ id: "analysis-job" })) },
  alertPolicy: { findMany: mock(() => Promise.resolve([])) },
  alertTrigger: { createMany: mock(() => Promise.resolve({ count: 0 })) },
  $queryRaw: mock(() => Promise.resolve([])),
  $transaction: mock((callback: (transaction: typeof prisma) => Promise<unknown>) => callback(prisma)),
};

mock.module("@/lib/db", () => ({ prisma }));
mock.module("@/lib/redis", () => ({ redis: null }));
mock.module("@/lib/logger", () => ({ logger: { error: mock(() => {}), info: mock(() => {}), warn: mock(() => {}) } }));
mock.module("@/lib/metrics", () => ({ incidentsIngestedTotal: { inc: mock(() => {}) } }));
mock.module("@/lib/events", () => ({ EVENTS: { INCIDENT_CREATED: "INCIDENT_CREATED", INCIDENT_UPDATED: "INCIDENT_UPDATED" }, emitEvent: mock(() => Promise.resolve()) }));
mock.module("@/services/api-key-service", () => ({ validateApiKey: mock(() => Promise.resolve(testProject)) }));
mock.module("@/services/issue-service", () => ({ calculateSLADeadlines: mock(() => Promise.resolve({})) }));
mock.module("@/services/routing-service", () => ({ resolveRoutingTeam: mock(() => Promise.resolve(null)) }));
mock.module("@/services/sourcemap-service", () => ({ resolveStackTrace: mock(() => Promise.resolve({ resolved: false })) }));
mock.module("@/services/notification-service", () => ({ notifyOrgStaff: mock(() => Promise.resolve()) }));
mock.module("@/services/on-call-service", () => ({ notifyCurrentOnCall: mock(() => Promise.resolve(null)) }));
mock.module("next/server", () => ({
  NextResponse: {
    json(data: unknown, init?: ResponseInit) {
      const response = new Response(JSON.stringify(data), init);
      (response as Response & { json: () => Promise<unknown> }).json = () => Promise.resolve(data);
      return response;
    },
  },
}));

import { POST } from "../src/app/api/ingest/route";

const previousNodeEnv = process.env.NODE_ENV;

function ingest() {
  return POST(new Request("http://localhost/api/ingest", {
    method: "POST",
    headers: { Authorization: "Bearer e2e-grouping-key", "Content-Type": "application/json" },
    body: JSON.stringify({ message: "Same grouped failure", stack: "at checkout (app.js:1:1)", severity: "HIGH" }),
  }));
}

describe("ingest issue grouping", () => {
  beforeAll(() => { (process.env as Record<string, string | undefined>).NODE_ENV = "test"; });
  afterAll(() => {
    const env = process.env as Record<string, string | undefined>;
    if (previousNodeEnv === undefined) Reflect.deleteProperty(env, "NODE_ENV");
    else env.NODE_ENV = previousNodeEnv;
  });

  beforeEach(() => {
    state.issue = null;
    state.createCalls.length = 0;
    state.activityActions.length = 0;
    prisma.issue.findFirst.mockImplementation(() => Promise.resolve(state.issue));
    prisma.issue.create.mockClear();
    prisma.issue.update.mockClear();
    prisma.issueActivity.create.mockClear();
    prisma.$transaction.mockClear();
  });

  test("20 identical reports produce one issue with 20 occurrences, then reopen after resolution", async () => {
    const responses = [];
    for (let i = 0; i < 20; i++) responses.push(await ingest());

    expect(responses.every((response) => response.status === 201)).toBe(true);
    expect(state.createCalls).toHaveLength(1);
    expect(state.issue?.id).toBe("grouped-issue");
    expect(state.issue?.timesSeen).toBe(20);
    expect(state.activityActions).toHaveLength(19);
    expect(state.activityActions.every((action) => action === "Occurrence received")).toBe(true);

    state.issue = { ...state.issue!, status: "RESOLVED", resolvedAt: new Date() };
    const regressionResponse = await ingest();
    expect(regressionResponse.status).toBe(201);
    expect(state.createCalls).toHaveLength(1);
    expect(state.issue?.timesSeen).toBe(21);
    expect(state.issue?.status).toBe("OPEN");
    expect(state.issue?.resolvedAt).toBeNull();
    expect(state.activityActions.at(-1)).toBe("Occurrence received; issue reopened");
  });
});
