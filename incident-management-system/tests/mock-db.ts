import { mock } from "bun:test";

export interface PrismaMock {
  user: {
    findUnique: ReturnType<typeof mock>;
    findFirst: ReturnType<typeof mock>;
    create: ReturnType<typeof mock>;
    update: ReturnType<typeof mock>;
    findMany: ReturnType<typeof mock>;
  };
  organization: {
    create: ReturnType<typeof mock>;
  };
  project: {
    findUnique: ReturnType<typeof mock>;
    create: ReturnType<typeof mock>;
    delete: ReturnType<typeof mock>;
    deleteMany: ReturnType<typeof mock>;
    findMany: ReturnType<typeof mock>;
    count: ReturnType<typeof mock>;
  };
  issue: {
    create: ReturnType<typeof mock>;
    update: ReturnType<typeof mock>;
    findUnique: ReturnType<typeof mock>;
    findMany: ReturnType<typeof mock>;
    count: ReturnType<typeof mock>;
  };
  issueActivity: {
    create: ReturnType<typeof mock>;
  };
  issueComment: {
    create: ReturnType<typeof mock>;
  };
  verificationToken: {
    create: ReturnType<typeof mock>;
    findUnique: ReturnType<typeof mock>;
    delete: ReturnType<typeof mock>;
  };
  notification: {
    create: ReturnType<typeof mock>;
    createMany: ReturnType<typeof mock>;
    findMany: ReturnType<typeof mock>;
    update: ReturnType<typeof mock>;
    updateMany: ReturnType<typeof mock>;
  };
  team: {
    create: ReturnType<typeof mock>;
    findFirst: ReturnType<typeof mock>;
  };
  invite: {
    create: ReturnType<typeof mock>;
    findFirst: ReturnType<typeof mock>;
    findUnique: ReturnType<typeof mock>;
    update: ReturnType<typeof mock>;
  };
  $transaction: ReturnType<typeof mock>;
}

export const createPrismaMock = (): PrismaMock => {
  const prismaMock: PrismaMock = {
    user: {
      findUnique: mock(() => Promise.resolve(null)),
      findFirst: mock(() => Promise.resolve(null)),
      create: mock((args: { data?: Record<string, unknown> }) => Promise.resolve({ id: "user-1", ...args.data })),
      update: mock((args: { data?: Record<string, unknown> }) => Promise.resolve({ id: "user-1", ...args.data })),
      findMany: mock(() => Promise.resolve([{ id: "staff-1" }, { id: "staff-2" }])),
    },
    organization: {
      create: mock((args: { data?: Record<string, unknown> }) => Promise.resolve({ id: "org-1", ...args.data })),
    },
    project: {
      findUnique: mock(() => Promise.resolve({ id: "project-1", orgId: "org-1", sdkApiKey: "hashed-key", plan: "ADVANCED" })),
      create: mock((args: { data?: Record<string, unknown> }) => Promise.resolve({ id: "project-1", ...args.data })),
      delete: mock(() => Promise.resolve({ id: "deleted-id" })),
      deleteMany: mock(() => Promise.resolve({ count: 1 })),
      findMany: mock(() => Promise.resolve([{ id: "p1", name: "P1" }, { id: "p2", name: "P2" }])),
      count: mock(() => Promise.resolve(2)),
    },
    issue: {
      create: mock((args: { data?: Record<string, unknown> }) => Promise.resolve({ id: "issue-1", ...args.data })),
      update: mock((args: { data?: Record<string, unknown> }) => Promise.resolve({ id: "issue-1", ...args.data })),
      findUnique: mock(() => Promise.resolve({ id: "issue-1", status: "OPEN" })),
      findMany: mock(() => Promise.resolve([{ id: "issue-1", title: "I1" }, { id: "issue-2", title: "I2" }])),
      count: mock(() => Promise.resolve(2)),
    },
    issueActivity: {
      create: mock((args: { data?: Record<string, unknown> }) => Promise.resolve({ id: "activity-1", ...args.data })),
    },
    issueComment: {
      create: mock((args: { data?: Record<string, unknown> }) => Promise.resolve({ id: "comment-1", ...args.data, user: { name: "User 1", email: "user1@example.com" } })),
    },
    verificationToken: {
      create: mock((args: { data?: Record<string, unknown> }) => Promise.resolve({ id: "token-1", ...args.data })),
      findUnique: mock(() => Promise.resolve({
        email: "test@example.com",
        token: "valid-token",
        expiresAt: new Date(Date.now() + 3600000)
      })),
      delete: mock(() => Promise.resolve()),
    },
    notification: {
      create: mock((args: { data?: Record<string, unknown> }) => Promise.resolve({ id: "notif-1", ...args.data })),
      createMany: mock((args: { data?: Record<string, unknown>[] }) => Promise.resolve({ count: args.data?.length || 0 })),
      findMany: mock(() => Promise.resolve([{ id: "notif-1", title: "N1" }, { id: "notif-2", title: "N2" }])),
      update: mock((args: { where: { id: string }; data?: Record<string, unknown> }) => Promise.resolve({ id: args.where.id, ...args.data })),
      updateMany: mock(() => Promise.resolve({ count: 5 })),
    },
    team: {
      create: mock((args: { data?: Record<string, unknown> }) => Promise.resolve({ id: "team-1", ...args.data })),
      findFirst: mock(() => Promise.resolve({ id: "team-1", projectId: "project-1" })),
    },
    invite: {
      create: mock((args: { data?: Record<string, unknown> }) => Promise.resolve({ id: "invite-1", ...args.data })),
      findFirst: mock(() => Promise.resolve(null)),
      findUnique: mock(() => Promise.resolve(null)),
      update: mock((args: { data?: Record<string, unknown> }) => Promise.resolve({ id: "invite-1", ...args.data })),
    },
    $transaction: mock(async (cb: (tx: PrismaMock) => Promise<unknown>) => {
      return cb(prismaMock);
    }),
  };
  return prismaMock;
};
