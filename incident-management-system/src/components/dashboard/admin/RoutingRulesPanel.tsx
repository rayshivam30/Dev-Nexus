"use client";

import { useEffect, useState } from "react";

type RoutingRule = {
  id: string;
  matchType: "TAG" | "SEVERITY" | "PATH_PREFIX" | "MESSAGE_CONTAINS";
  matchValue: string;
  targetTeam: { id: string; name: string };
};

export function RoutingRulesPanel({ projectId, teams }: { projectId: string; teams: Array<{ id: string; name: string }> }) {
  const [rules, setRules] = useState<RoutingRule[]>([]);
  const [matchType, setMatchType] = useState<RoutingRule["matchType"]>("SEVERITY");
  const [matchValue, setMatchValue] = useState("CRITICAL");
  const [targetTeamId, setTargetTeamId] = useState(teams[0]?.id || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function refresh() {
    const response = await fetch(`/api/projects/${projectId}/routing-rules`);
    const result = await response.json();
    if (response.ok) setRules(result.rules || []);
    else setError(result.error || "Could not load routing rules");
  }

  useEffect(() => { void refresh(); }, [projectId]);

  async function addRule(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/projects/${projectId}/routing-rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetTeamId, matchType, matchValue }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not create routing rule");
      setRules((current) => [...current, result.rule]);
      setMatchValue("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create routing rule");
    } finally {
      setLoading(false);
    }
  }

  async function removeRule(ruleId: string) {
    const response = await fetch(`/api/projects/${projectId}/routing-rules`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ruleId }),
    });
    if (response.ok) setRules((current) => current.filter((rule) => rule.id !== ruleId));
    else setError("Could not remove routing rule");
  }

  const placeholder = matchType === "TAG" ? "environment=production" : matchType === "SEVERITY" ? "CRITICAL" : matchType === "PATH_PREFIX" ? "src/payments/" : "database timeout";

  return (
    <section className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] space-y-4">
      <div>
        <h2 className="text-lg font-bold">Routing rules</h2>
        <p className="mt-1 text-xs text-zinc-500">First matching enabled rule sends new issue groups to its team. Existing groups keep their current assignment.</p>
      </div>
      {rules.length ? <ul className="space-y-2">
        {rules.map((rule, index) => <li key={rule.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.06] px-3 py-2 text-xs">
          <span className="text-zinc-400">{index + 1}. <strong className="text-zinc-200">{rule.matchType}</strong> {rule.matchValue} <span className="text-zinc-600">→</span> <strong className="text-emerald-400">{rule.targetTeam.name}</strong></span>
          <button type="button" onClick={() => void removeRule(rule.id)} className="text-zinc-500 hover:text-red-400">Remove</button>
        </li>)}
      </ul> : <p className="text-xs text-zinc-600">No routing rules yet.</p>}
      {teams.length === 0 ? <p className="text-xs text-amber-400">Create a team before adding a routing rule.</p> : <form onSubmit={addRule} className="grid grid-cols-1 md:grid-cols-[1fr_1.3fr_1fr_auto] gap-2">
        <select value={matchType} onChange={(event) => setMatchType(event.target.value as RoutingRule["matchType"])} className="rounded-lg border border-white/[0.08] bg-black/40 px-3 py-2 text-xs text-zinc-300">
          <option value="SEVERITY">Severity</option><option value="TAG">Tag</option><option value="PATH_PREFIX">Path prefix</option><option value="MESSAGE_CONTAINS">Message contains</option>
        </select>
        <input value={matchValue} onChange={(event) => setMatchValue(event.target.value)} maxLength={256} required placeholder={placeholder} className="rounded-lg border border-white/[0.08] bg-black/40 px-3 py-2 text-xs text-zinc-300" />
        <select value={targetTeamId} onChange={(event) => setTargetTeamId(event.target.value)} className="rounded-lg border border-white/[0.08] bg-black/40 px-3 py-2 text-xs text-zinc-300">
          {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
        </select>
        <button disabled={loading || !matchValue.trim()} className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-black disabled:opacity-50">{loading ? "Adding..." : "Add rule"}</button>
      </form>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </section>
  );
}
