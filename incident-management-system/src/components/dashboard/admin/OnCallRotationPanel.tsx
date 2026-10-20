"use client";

import { useEffect, useMemo, useState } from "react";

type Member = { id: string; name: string | null; email: string };
type Rotation = {
  name: string;
  timezone: string;
  startsAt: string;
  shiftDurationHours: number;
  members: Array<{ user: Member }>;
};

function toLocalInput(value: string) {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function OnCallRotationPanel({ projectId }: { projectId: string }) {
  const [eligible, setEligible] = useState<Member[]>([]);
  const [name, setName] = useState("Primary on-call");
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  const [startsAt, setStartsAt] = useState(() => toLocalInput(new Date(Date.now() + 5 * 60_000).toISOString()));
  const [shiftHours, setShiftHours] = useState(24);
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const response = await fetch(`/api/projects/${projectId}/on-call`);
    const result = await response.json();
    if (!response.ok) { setError(result.error || "Could not load on-call rotation"); return; }
    setEligible(result.eligibleMembers || []);
    const rotation = result.rotation as Rotation | null;
    if (rotation) {
      setName(rotation.name);
      setTimezone(rotation.timezone);
      setStartsAt(toLocalInput(rotation.startsAt));
      setShiftHours(rotation.shiftDurationHours);
      setMemberIds(rotation.members.map(({ user }) => user.id));
    }
  }

  useEffect(() => { void refresh(); }, [projectId]);

  const selectedMembers = useMemo(() => memberIds.map((id) => eligible.find((member) => member.id === id)).filter((member): member is Member => Boolean(member)), [memberIds, eligible]);

  function move(index: number, offset: number) {
    const destination = index + offset;
    if (destination < 0 || destination >= memberIds.length) return;
    setMemberIds((current) => {
      const next = [...current];
      [next[index], next[destination]] = [next[destination], next[index]];
      return next;
    });
  }

  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const csrfResponse = await fetch("/api/csrf-token");
      const { token } = await csrfResponse.json();
      const response = await fetch(`/api/projects/${projectId}/on-call`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-csrf-token": token },
        body: JSON.stringify({ name, timezone, startsAt: new Date(startsAt).toISOString(), shiftDurationHours: shiftHours, memberIds }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save on-call rotation");
      await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save on-call rotation"); }
    finally { setBusy(false); }
  }

  async function remove() {
    setBusy(true); setError("");
    try {
      const csrfResponse = await fetch("/api/csrf-token");
      const { token } = await csrfResponse.json();
      const response = await fetch(`/api/projects/${projectId}/on-call`, { method: "DELETE", headers: { "x-csrf-token": token } });
      if (!response.ok) throw new Error("Could not remove on-call rotation");
      setMemberIds([]); setName("Primary on-call");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not remove on-call rotation"); }
    finally { setBusy(false); }
  }

  const unselected = eligible.filter((member) => !memberIds.includes(member.id));

  return (
    <section className="space-y-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
      <div><h2 className="text-lg font-bold">On-call rotation</h2><p className="mt-1 text-xs text-zinc-500">Set a repeating, ordered rotation. Alert-policy incidents notify the person currently on call by in-app notification and configured Gmail SMTP.</p></div>
      <form onSubmit={save} className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="space-y-1 text-xs text-zinc-500">Rotation name<input value={name} onChange={(event) => setName(event.target.value)} required maxLength={80} className="mt-1 w-full rounded-lg border border-white/[0.08] bg-black/40 px-3 py-2 text-zinc-200" /></label>
          <label className="space-y-1 text-xs text-zinc-500">Timezone<input value={timezone} onChange={(event) => setTimezone(event.target.value)} required maxLength={80} placeholder="Asia/Kolkata" className="mt-1 w-full rounded-lg border border-white/[0.08] bg-black/40 px-3 py-2 text-zinc-200" /></label>
          <label className="space-y-1 text-xs text-zinc-500">First shift starts<input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} required className="mt-1 w-full rounded-lg border border-white/[0.08] bg-black/40 px-3 py-2 text-zinc-200" /></label>
          <label className="space-y-1 text-xs text-zinc-500">Shift length in hours<input type="number" min={1} max={168} value={shiftHours} onChange={(event) => setShiftHours(Number(event.target.value))} required className="mt-1 w-full rounded-lg border border-white/[0.08] bg-black/40 px-3 py-2 text-zinc-200" /></label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-xs text-zinc-500">Add a project member
            <select value="" onChange={(event) => { if (event.target.value) setMemberIds((current) => [...current, event.target.value]); }} className="w-full rounded-lg border border-white/[0.08] bg-black/40 px-3 py-2 text-zinc-200">
              <option value="">Choose a member…</option>{unselected.map((member) => <option key={member.id} value={member.id}>{member.name || member.email}</option>)}
            </select>
          </label>
          <div className="space-y-2 text-xs text-zinc-500"><p>Rotation order</p>
            {selectedMembers.length ? selectedMembers.map((member, index) => <div key={member.id} className="flex items-center justify-between rounded-lg border border-white/[0.06] px-3 py-2 text-zinc-300"><span>{index + 1}. {member.name || member.email} <span className="text-zinc-600">{member.name ? `· ${member.email}` : ""}</span></span><span className="flex gap-2"><button type="button" onClick={() => move(index, -1)} aria-label={`Move ${member.email} earlier`} disabled={index === 0}>↑</button><button type="button" onClick={() => move(index, 1)} aria-label={`Move ${member.email} later`} disabled={index === selectedMembers.length - 1}>↓</button><button type="button" onClick={() => setMemberIds((current) => current.filter((id) => id !== member.id))} className="text-rose-400">Remove</button></span></div>) : <p className="rounded-lg border border-dashed border-white/[0.08] p-3">Add at least one active project member.</p>}
          </div>
        </div>
        <div className="flex gap-3"><button disabled={busy || memberIds.length === 0} className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-black disabled:opacity-50">{busy ? "Saving…" : "Save rotation"}</button><button type="button" disabled={busy || memberIds.length === 0} onClick={() => void remove()} className="rounded-lg border border-white/[0.08] px-4 py-2 text-xs text-zinc-400 disabled:opacity-50">Remove rotation</button></div>
      </form>
      {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
    </section>
  );
}
