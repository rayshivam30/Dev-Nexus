import { mock } from "bun:test";

export const createPrismaMock = () => {
  const prismaMock: any = {
    user: {
      findUnique: mock(() => Promise.resolve(null)),
      create: mock((args: any) => Promise.resolve({ id: "user-1", ...args.data })),
      update: mock((args: any) => Promise.resolve({ id: "user-1", ...args.data })),
      findMany: mock(() => Promise.resolve([{ id: "staff-1" }, { id: "staff-2" }])),
    },
    organization: {
      create: mock((args: any) => Promise.resolve({ id: "org-1", ...args.data })),
    },
    project: {
      findUnique: mock((args: any) => Promise.resolve({ id: "project-1", orgId: "org-1", sdkApiKey: "hashed-key", plan: "ADVANCED" })),
      create: mock((args: any) => Promise.resolve({ id: "project-1", ...args.data })),
      delete: mock((args: any) => Promise.resolve({ id: "deleted-id" })),
      findMany: mock((args: any) => Promise.resolve([{ id: "p1", name: "P1" }, { id: "p2", name: "P2" }])),
      count: mock(() => Promise.resolve(2)),
    },
    issue: {
      create: mock((args: any) => Promise.resolve({ id: "issue-1", ...args.data })),
      update: mock((args: any) => Promise.resolve({ id: "issue-1", ...args.data })),
      findUnique: mock((args: any) => Promise.resolve({ id: "issue-1", status: "OPEN" })),
      findMany: mock(() => Promise.resolve([{ id: "issue-1", title: "I1" }, { id: "issue-2", title: "I2" }])),
      count: mock(() => Promise.resolve(2)),
    },
    issueActivity: {
      create: mock((args: any) => Promise.resolve({ id: "activity-1", ...args.data })),
    },
    issueComment: {
      create: mock((args: any) => Promise.resolve({ id: "comment-1", ...args.data, user: { name: "User 1", email: "user1@example.com" } })),
    },
    verificationToken: {
      create: mock((args: any) => Promise.resolve({ id: "token-1", ...args.data })),
      findUnique: mock((args: any) => Promise.resolve({ 
        email: "test@example.com", 
        token: "valid-token", 
        expiresAt: new Date(Date.now() + 3600000) 
      })),
      delete: mock((args: any) => Promise.resolve()),
    },
    notification: {
      create: mock((args: any) => Promise.resolve({ id: "notif-1", ...args.data })),
      createMany: mock((args: any) => Promise.resolve({ count: args.data?.length || 0 })),
      findMany: mock(() => Promise.resolve([{ id: "notif-1", title: "N1" }, { id: "notif-2", title: "N2" }])),
      update: mock((args: any) => Promise.resolve({ id: args.where.id, ...args.data })),
      updateMany: mock((args: any) => Promise.resolve({ count: 5 })),
    },
    team: {
      create: mock((args: any) => Promise.resolve({ id: "team-1", ...args.data })),
    },
    $transaction: mock(async (cb: any) => {
      return cb(prismaMock);
    }),
  };
  return prismaMock;
};
