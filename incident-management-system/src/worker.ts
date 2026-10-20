import { prisma } from "@/lib/db";
import { startAiWorker } from "@/lib/ai-worker";
import { startSlaWorker } from "@/lib/sla-worker";
import { startEmailWorker } from "@/lib/mailer";
import { validateEnvironment } from "@/lib/env";

validateEnvironment();
startAiWorker();
startSlaWorker();
startEmailWorker();

// Worker poll timers are unref'ed for application embedding; keep this process alive.
setInterval(() => {
  void prisma.$queryRaw`SELECT 1`.catch(() => {});
}, 60_000);
