"use client";

import { useEffect, useState } from "react";

type AlertPolicy = { id: string; name: string; severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"; threshold: number; windowMinutes: number };

export function AlertPoliciesPanel({ projectId }: { projectId: string }) {
  const [policies, setPolicies] = useState<AlertPolicy[]>([]);
  const [name, setName] = useState("");
  const [severity, setSeverity] = useState<AlertPolicy["severity"]>("HIGH");
  const [threshold, setThreshold] = useState(5);
  const [windowMinutes, setWindowMinutes] = useState(10);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const response = await fetch(`/api/projects/${projectId}/alert-policies`);
    const result = await response.json();
    if (response.ok) setPolicies(result.policies || []);
    else setError(result.error || "Could not load alert policies");
  }
  useEffect(() => { void refresh(); }, [projectId]);

  async function addPolicy(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const csrfResponse = await fetch("/api/csrf-token");
      const { token } = await csrfResponse.json();
      const response = await fetch(`/api/projects/${projectId}/alert-policies`, {
        method: "POST", headers: { "Content-Type": "application/json", "x-csrf-token": token },
        body: JSON.stringify({ name, severity, threshold, windowMinutes }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not create alert policy");
      setPolicies((current) => [...current, result.policy]); setName("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not create alert policy"); }
    finally { setBusy(false); }
  }

  async function removePolicy(policyId: string) {
    setError("");
    const csrfResponse = await fetch("/api/csrf-token");
    const { token } = await csrfResponse.json();
    const response = await fetch(`/api/projects/${projectId}/alert-policies`, {
      method: "DELETE", headers: { "Content-Type": "application/json", "x-csrf-token": token },
      body: JSON.stringify({ policyId }),
    });
    if (response.ok) setPolicies((current) => current.filter((policy) => policy.id !== policyId));
    else setError("Could not remove alert policy");
  }

  return (
    <section className="space-y-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
      <div><h2 className="text-lg font-bold">Alert policies</h2><p className="mt-1 text-xs text-zinc-500">Notify organization admins and project managers when matching events cross a threshold. A policy fires once per issue in each window.</p></div>
      {policies.length ? <ul className="space-y-2">{policies.map((policy) => <li key={policy.id} className="flex items-center justify-between rounded-lg border border-white/[0.06] px-3 py-2 text-xs"><span className="text-zinc-300"><strong className="text-white">{policy.name}</strong> · {policy.severity} · {policy.threshold} events / {policy.windowMinutes} min</span><button type="button" onClick={() => void removePolicy(policy.id)} className="text-zinc-500 hover:text-red-400">Remove</button></li>)}</ul> : <p className="text-xs text-zinc-600">No alert policies configured.</p>}
      <form onSubmit={addPolicy} className="grid grid-cols-1 gap-2 md:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
        <input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} required placeholder="Policy name" className="rounded-lg border border-white/[0.08] bg-black/40 px-3 py-2 text-xs text-zinc-300" />
        <select value={severity} onChange={(event) => setSeverity(event.target.value as AlertPolicy["severity"])} className="rounded-lg border border-white/[0.08] bg-black/40 px-3 py-2 text-xs text-zinc-300">{["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((value) => <option key={value}>{value}</option>)}</select>
        <label className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-black/40 px-3 py-2 text-xs text-zinc-500">Events<input type="number" min={1} max={100000} value={threshold} onChange={(event) => setThreshold(Number(event.target.value))} className="w-16 bg-transparent text-zinc-200" /></label>
        <label className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-black/40 px-3 py-2 text-xs text-zinc-500">Minutes<input type="number" min={1} max={1440} value={windowMinutes} onChange={(event) => setWindowMinutes(Number(event.target.value))} className="w-16 bg-transparent text-zinc-200" /></label>
        <button disabled={busy || !name.trim()} className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-black disabled:opacity-50">{busy ? "Adding…" : "Add policy"}</button>
      </form>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </section>
  );
}
