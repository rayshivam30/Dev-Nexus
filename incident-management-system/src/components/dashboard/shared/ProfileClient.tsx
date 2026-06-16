"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  Loader2,
  User,
  Mail,
  Phone,
  MapPin,
  Github,
  Linkedin,
  Save,
  X,
  Camera,
  Briefcase,
  Globe,
  Shield,
  AlertCircle,
  CheckSquare,
  Edit3,
  Command,
  Layers3,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type UserRole = "ADMIN" | "MANAGER" | "DEVELOPER" | "";

interface RoleContext {
  organizationName?: string;
  projectName?: string;
  projectDescription?: string;
  teamName?: string;
  plan?: string | null;
  projectCount?: number;
  teamCount?: number;
  memberCount?: number;
  developerCount?: number;
  openIncidentCount?: number;
  teamMemberCount?: number;
  inProgressCount?: number;
  assignedOpenCount?: number;
}

const roleCopy: Record<Exclude<UserRole, "">, {
  headline: string;
  subheadline: string;
  metricsTitle: string;
  personalTitle: string;
  workTitle: string;
}> = {
  ADMIN: {
    headline: "Leadership Profile",
    subheadline: "Organization identity, stakeholder presence, and platform ownership.",
    metricsTitle: "Organization Snapshot",
    personalTitle: "Executive Profile",
    workTitle: "Leadership Surface",
  },
  MANAGER: {
    headline: "Operations Profile",
    subheadline: "Project coordination, team routing, and incident command context.",
    metricsTitle: "Project Snapshot",
    personalTitle: "Manager Profile",
    workTitle: "Command Surface",
  },
  DEVELOPER: {
    headline: "Engineering Profile",
    subheadline: "Technical identity, delivery context, and assignment readiness.",
    metricsTitle: "Work Snapshot",
    personalTitle: "Engineer Profile",
    workTitle: "Technical Surface",
  },
};

export function ProfileClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromLogin = searchParams.get("source") === "login";

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    bio: "",
    image: "",
    phoneNumber: "",
    location: "",
    githubUrl: "",
    linkedinUrl: "",
    role: "" as UserRole,
  });

  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [roleContext, setRoleContext] = useState<RoleContext>({});
  const [stats, setStats] = useState({
    resolvedCount: 0,
    rating: "5.0",
    profileCompletion: 0,
  });

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/user/profile");

      if (res.status === 401) {
        router.push("/auth/login");
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch profile");

      setFormData({
        name: data.user.name || "",
        email: data.user.email || "",
        bio: data.user.bio || "",
        image: data.user.image || "",
        phoneNumber: data.user.phoneNumber || "",
        location: data.user.location || "",
        githubUrl: data.user.githubUrl || "",
        linkedinUrl: data.user.linkedinUrl || "",
        role: data.user.role || "",
      });
      setSkills(data.user.skills || []);
      setRoleContext(data.roleContext || {});
      if (data.stats) setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchProfile();
    if (fromLogin) setIsEditing(true);
  }, [fromLogin, fetchProfile]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isEditing) return;

    setSubmitting(true);
    setError("");
    setSuccess(false);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };

      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          ...formData,
          skills,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");

      setSuccess(true);
      setIsEditing(false);
      setTimeout(() => fetchProfile(), 100);

      if (fromLogin) {
        setTimeout(() => {
          const roleDashboard: Record<string, string> = {
            ADMIN: "/dashboard/admin",
            MANAGER: "/dashboard/manager",
            DEVELOPER: "/dashboard/developer",
          };
          router.push(roleDashboard[formData.role] || "/dashboard");
        }, 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSubmitting(false);
    }
  }

  function addSkill() {
    if (newSkill.trim() && !skills.includes(newSkill.trim()) && skills.length < 15) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  }

  function removeSkill(skillToRemove: string) {
    if (!isEditing) return;
    setSkills(skills.filter((skill) => skill !== skillToRemove));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
          <p className="text-sm text-zinc-500 animate-pulse">Loading profile...</p>
        </div>
      </div>
    );
  }

  const role = formData.role || "DEVELOPER";
  const copy = roleCopy[role as Exclude<UserRole, "">];
  const inputClass = "w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm transition-all focus:border-emerald-500/50 focus:bg-white/[0.05] focus:outline-none";
  const displayClass = "rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3 text-sm text-zinc-400";

  const roleStats = getRoleStats(role, roleContext);
  const roleChips = getRoleChips(role, roleContext);

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-20">
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <div className="relative group">
            <div className="relative h-28 w-28 overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03]">
              {formData.image ? (
                <Image src={formData.image} alt={formData.name} fill className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <User className="h-12 w-12 text-zinc-700" />
                </div>
              )}

              {isEditing ? (
                <div className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center bg-black/70">
                  <Camera className="mb-1 h-6 w-6 text-emerald-400" />
                  <span className="text-[10px] text-zinc-400">Avatar URL</span>
                </div>
              ) : null}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-400">
                <Shield className="h-3 w-3" /> {formData.role}
              </span>
              {roleChips.map((chip) => (
                <span key={chip} className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-[10px] text-zinc-500">
                  {chip}
                </span>
              ))}
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight">{formData.name || "Unnamed User"}</h1>
            <p className="mt-1 text-sm text-zinc-500">{formData.email}</p>
            <p className="mt-4 max-w-2xl text-sm text-zinc-400">{copy.subheadline}</p>
          </div>

          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    fetchProfile();
                  }}
                  className="rounded-xl border border-white/[0.06] px-4 py-2.5 text-sm font-medium text-zinc-400 transition-all hover:bg-white/[0.04]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !formData.name}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-emerald-500 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 rounded-xl border border-white/[0.06] px-5 py-2.5 text-sm font-medium text-zinc-400 transition-all hover:bg-white/[0.04] hover:text-white"
              >
                <Edit3 className="h-4 w-4" />
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {error ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400"
          >
            <AlertCircle className="h-4 w-4" />
            {error}
          </motion.div>
        ) : null}
        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-400"
          >
            <CheckSquare className="h-4 w-4" />
            Profile updated successfully
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
            <h3 className="flex items-center gap-2 text-sm font-bold">
              <Briefcase className="h-4 w-4 text-zinc-600" />
              {copy.metricsTitle}
            </h3>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {roleStats.map((item) => (
                <div key={item.label} className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
                  <span className="block text-2xl font-extrabold text-white">{item.value}</span>
                  <span className="mt-1 block text-[10px] font-medium uppercase tracking-wider text-zinc-600">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 space-y-2">
              <div className="flex justify-between">
                <span className="text-[10px] text-zinc-600">Profile Completion</span>
                <span className="text-sm font-bold">{stats.profileCompletion}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.04]">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-1000"
                  style={{ width: `${stats.profileCompletion}%` }}
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
            <h3 className="flex items-center gap-2 text-sm font-bold">
              <Layers3 className="h-4 w-4 text-zinc-600" />
              {copy.workTitle}
            </h3>
            <div className="mt-5 space-y-4">
              {getRoleSurface(role, roleContext).map((item) => (
                <div key={item.label} className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-600">{item.label}</label>
                  <div className={displayClass}>{item.value || "—"}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6 xl:col-span-2">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
            <h3 className="flex items-center gap-2 text-sm font-bold">
              <User className="h-4 w-4 text-zinc-600" />
              {copy.personalTitle}
            </h3>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1 ml-1 block text-xs text-zinc-500">Name</label>
                {isEditing ? (
                  <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputClass} />
                ) : (
                  <div className={displayClass}>{formData.name || "—"}</div>
                )}
              </div>

              <div>
                <label className="mb-1 ml-1 block text-xs text-zinc-500">
                  {role === "ADMIN" ? "Leadership Bio" : role === "MANAGER" ? "Operations Bio" : "Engineering Bio"}
                </label>
                {isEditing ? (
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className={cn(inputClass, "min-h-[110px] resize-none")}
                  />
                ) : (
                  <div className={displayClass}>{formData.bio || "—"}</div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field
                  editing={isEditing}
                  label="Location"
                  icon={MapPin}
                  value={formData.location}
                  inputClass={inputClass}
                  displayClass={displayClass}
                  onChange={(value) => setFormData({ ...formData, location: value })}
                />
                <Field
                  editing={isEditing}
                  label="Avatar URL"
                  icon={Globe}
                  value={formData.image}
                  inputClass={inputClass}
                  displayClass={displayClass}
                  onChange={(value) => setFormData({ ...formData, image: value })}
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
            <h3 className="flex items-center gap-2 text-sm font-bold">
              <Mail className="h-4 w-4 text-zinc-600" />
              Contact & Links
            </h3>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field
                editing={isEditing}
                label="Phone"
                icon={Phone}
                value={formData.phoneNumber}
                inputClass={inputClass}
                displayClass={displayClass}
                onChange={(value) => setFormData({ ...formData, phoneNumber: value })}
              />
              <Field
                editing={false}
                label="Email (locked)"
                icon={Mail}
                value={formData.email}
                inputClass={inputClass}
                displayClass={displayClass}
                onChange={() => undefined}
              />
              <Field
                editing={isEditing}
                label={role === "DEVELOPER" ? "GitHub" : "GitHub / Org"}
                icon={Github}
                value={formData.githubUrl}
                inputClass={inputClass}
                displayClass={displayClass}
                onChange={(value) => setFormData({ ...formData, githubUrl: value })}
              />
              <Field
                editing={isEditing}
                label="LinkedIn"
                icon={Linkedin}
                value={formData.linkedinUrl}
                inputClass={inputClass}
                displayClass={displayClass}
                onChange={(value) => setFormData({ ...formData, linkedinUrl: value })}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
            <h3 className="flex items-center gap-2 text-sm font-bold">
              <Command className="h-4 w-4 text-zinc-600" />
              {role === "DEVELOPER" ? "Technical Skills" : role === "MANAGER" ? "Domain Skills" : "Leadership Skills"}
            </h3>

            {isEditing ? (
              <div className="mt-5 flex gap-2">
                <input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                  className={cn(inputClass, "flex-1")}
                  placeholder="Add a skill..."
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-emerald-500"
                >
                  Add
                </button>
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-2">
              <AnimatePresence>
                {skills.map((skill) => (
                  <motion.div
                    key={skill}
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.85, opacity: 0 }}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                      isEditing
                        ? "border-white/[0.08] bg-white/[0.03] text-zinc-300"
                        : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                    )}
                  >
                    {skill}
                    {isEditing ? (
                      <button type="button" onClick={() => removeSkill(skill)} className="text-zinc-600 transition-colors hover:text-red-400">
                        <X className="h-3 w-3" />
                      </button>
                    ) : null}
                  </motion.div>
                ))}
              </AnimatePresence>

              {skills.length === 0 ? (
                <div className="w-full py-6 text-center rounded-xl border border-dashed border-white/[0.06] bg-white/[0.01]">
                  <p className="text-sm text-zinc-600">No skills added yet</p>
                  {isEditing && <p className="text-xs text-zinc-700 mt-1">Type above and press Enter to add</p>}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  editing,
  label,
  icon: Icon,
  value,
  inputClass,
  displayClass,
  onChange,
}: {
  editing: boolean;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  inputClass: string;
  displayClass: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 ml-1 block text-xs text-zinc-500">{label}</label>
      {editing ? (
        <div className="relative">
          <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
          <input value={value} onChange={(e) => onChange(e.target.value)} className={cn(inputClass, "pl-10")} />
        </div>
      ) : (
        <div className={cn(displayClass, "flex items-center gap-2 truncate")}>
          <Icon className="h-4 w-4 shrink-0 text-zinc-600" />
          {value || "—"}
        </div>
      )}
    </div>
  );
}

function getRoleStats(role: Exclude<UserRole, "">, roleContext: RoleContext) {
  if (role === "ADMIN") {
    return [
      { label: "Projects", value: roleContext.projectCount ?? 0 },
      { label: "Teams", value: roleContext.teamCount ?? 0 },
      { label: "Members", value: roleContext.memberCount ?? 0 },
      { label: "Plan", value: roleContext.plan || "—" },
    ];
  }

  if (role === "MANAGER") {
    return [
      { label: "Teams", value: roleContext.teamCount ?? 0 },
      { label: "Developers", value: roleContext.developerCount ?? 0 },
      { label: "Open Issues", value: roleContext.openIncidentCount ?? 0 },
      { label: "Plan", value: roleContext.plan || "—" },
    ];
  }

  return [
    { label: "Resolved", value: roleContext.inProgressCount !== undefined ? roleContext.inProgressCount + (roleContext.assignedOpenCount ?? 0) : 0 },
    { label: "In Progress", value: roleContext.inProgressCount ?? 0 },
    { label: "Queue", value: roleContext.assignedOpenCount ?? 0 },
    { label: "Team", value: roleContext.teamMemberCount ?? 0 },
  ];
}

function getRoleSurface(role: Exclude<UserRole, "">, roleContext: RoleContext) {
  if (role === "ADMIN") {
    return [
      { label: "Organization", value: roleContext.organizationName || "—" },
      { label: "Plan", value: roleContext.plan || "—" },
      { label: "Scope", value: `${roleContext.projectCount ?? 0} projects / ${roleContext.teamCount ?? 0} teams` },
    ];
  }

  if (role === "MANAGER") {
    return [
      { label: "Project", value: roleContext.projectName || "—" },
      { label: "Project Brief", value: roleContext.projectDescription || "—" },
      { label: "Command Span", value: `${roleContext.teamCount ?? 0} teams / ${roleContext.developerCount ?? 0} developers` },
    ];
  }

  return [
    { label: "Team", value: roleContext.teamName || "—" },
    { label: "Live Work", value: `${roleContext.inProgressCount ?? 0} in progress` },
    { label: "Assignment Queue", value: `${roleContext.assignedOpenCount ?? 0} waiting` },
  ];
}

function getRoleChips(role: Exclude<UserRole, "">, roleContext: RoleContext) {
  if (role === "ADMIN") {
    return [roleContext.organizationName || "Org", roleContext.plan || "Plan"];
  }

  if (role === "MANAGER") {
    return [roleContext.projectName || "Project", `${roleContext.openIncidentCount ?? 0} open`];
  }

  return [roleContext.teamName || "Team", `${roleContext.inProgressCount ?? 0} active`];
}
