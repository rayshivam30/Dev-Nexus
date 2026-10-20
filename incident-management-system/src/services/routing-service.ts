import { prisma } from "@/lib/db";
import { IssueSeverity, RoutingMatchType } from "@devnexus/prisma-client";

export async function resolveRoutingTeam(input: {
  projectId: string;
  message: string;
  stack?: string;
  tags?: Record<string, string>;
  severity: IssueSeverity;
}) {
  const rules = await prisma.routingRule.findMany({
    where: { projectId: input.projectId, enabled: true },
    orderBy: { createdAt: "asc" },
    select: { id: true, matchType: true, matchValue: true, targetTeamId: true },
  });

  for (const rule of rules) {
    let matches = false;
    switch (rule.matchType) {
      case RoutingMatchType.SEVERITY:
        matches = input.severity === rule.matchValue.toUpperCase();
        break;
      case RoutingMatchType.TAG: {
        const separator = rule.matchValue.indexOf("=");
        if (separator > 0) {
          const key = rule.matchValue.slice(0, separator).trim();
          const value = rule.matchValue.slice(separator + 1).trim();
          matches = input.tags?.[key] === value;
        }
        break;
      }
      case RoutingMatchType.PATH_PREFIX: {
        const path = typeof input.tags?.path === "string" ? input.tags.path : null;
        matches = path ? path.startsWith(rule.matchValue) : (input.stack || "").includes(rule.matchValue);
        break;
      }
      case RoutingMatchType.MESSAGE_CONTAINS:
        matches = input.message.toLowerCase().includes(rule.matchValue.toLowerCase());
        break;
    }
    if (matches) return { teamId: rule.targetTeamId, ruleId: rule.id };
  }
  return null;
}
