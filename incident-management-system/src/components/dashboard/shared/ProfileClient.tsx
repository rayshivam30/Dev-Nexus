"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { 
  Loader2, User, Mail, Phone, MapPin, Github, Linkedin, Save, X, 
  Camera, Briefcase, Globe, Shield,
  AlertCircle, CheckSquare, Edit3,
  Command
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

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
    role: "" as "ADMIN" | "MANAGER" | "DEVELOPER" | "",
  });

  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [stats, setStats] = useState({
    resolvedCount: 0,
    rating: "5.0",
    profileCompletion: 0,
  });

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("incident_token") || "";

      const res = await fetch("/api/user/profile", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

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
      if (data.stats) {
        setStats(data.stats);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchProfile();
    if (fromLogin) {
      setIsEditing(true);
    }
  }, [fromLogin, fetchProfile]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isEditing) return;

    setSubmitting(true);
    setError("");
    setSuccess(false);

    try {
      const token = localStorage.getItem("incident_token") || "";
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
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
        }, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSubmitting(false);
    }
  }

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim()) && skills.length < 15) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    if (!isEditing) return;
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
          <p className="text-sm text-zinc-500 animate-pulse">Loading profile...</p>
        </div>
      </div>
    );
  }

  const inputClass = "w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all text-sm";
  const displayClass = "px-4 py-3 bg-white/[0.02] border border-white/[0.04] rounded-xl text-sm text-zinc-400";

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-start gap-8 p-8 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
        {/* Avatar */}
        <div className="relative group">
          <div className="w-28 h-28 rounded-2xl border border-white/[0.06] overflow-hidden bg-white/[0.03] relative">
            {formData.image ? (
              <Image src={formData.image} alt={formData.name} fill className="object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <User className="h-12 w-12 text-zinc-700" />
              </div>
            )}
            
            {isEditing && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center cursor-pointer rounded-2xl">
                <Camera className="h-6 w-6 text-emerald-400 mb-1" />
                <span className="text-[10px] text-zinc-400">Upload</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Identity */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <span className="flex items-center gap-1.5 text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
              <Shield className="w-3 h-3" /> {formData.role}
            </span>
            <span className="flex items-center gap-1.5 text-[10px] text-zinc-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online
            </span>
          </div>
          
          <h1 className="text-3xl font-extrabold tracking-tight">
            {formData.name || "Unnamed User"}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">{formData.email}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={() => { setIsEditing(false); fetchProfile(); }}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-400 border border-white/[0.06] hover:bg-white/[0.04] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !formData.name}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-500 transition-all disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-zinc-400 border border-white/[0.06] hover:bg-white/[0.04] hover:text-white transition-all"
            >
              <Edit3 className="w-4 h-4" /> Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Status Messages */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="p-4 border border-red-500/20 bg-red-500/10 rounded-xl text-sm text-red-400 flex items-center gap-3">
            <AlertCircle className="w-4 h-4" /> {error}
          </motion.div>
        )}
        {success && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="p-4 border border-emerald-500/20 bg-emerald-500/10 rounded-xl text-sm text-emerald-400 flex items-center gap-3">
            <CheckSquare className="w-4 h-4" /> Profile updated successfully
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Stats */}
        <div className="space-y-4">
          <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] space-y-6">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-zinc-600" /> Metrics
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <span className="block text-2xl font-extrabold text-white">{stats.resolvedCount}</span>
                <span className="block text-[10px] text-zinc-600 font-medium">Issues Resolved</span>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <span className="block text-2xl font-extrabold text-white">{stats.rating}</span>
                <span className="block text-[10px] text-zinc-600 font-medium">Performance Rating</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-[10px] text-zinc-600">Profile Completion</span>
                <span className="text-sm font-bold">{stats.profileCompletion}%</span>
              </div>
              <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${stats.profileCompletion}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Form */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Personal Info */}
          <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] space-y-5">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <User className="w-4 h-4 text-zinc-600" /> Personal Information
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-zinc-500 ml-1 mb-1 block">Name</label>
                {isEditing ? (
                  <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className={inputClass} />
                ) : (
                  <div className={displayClass}>{formData.name || "—"}</div>
                )}
              </div>
              
              <div>
                <label className="text-xs text-zinc-500 ml-1 mb-1 block">Bio</label>
                {isEditing ? (
                  <textarea value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} className={cn(inputClass, "min-h-[100px]")} />
                ) : (
                  <div className={displayClass}>{formData.bio || "—"}</div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-500 ml-1 mb-1 block">Location</label>
                  {isEditing ? (
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                      <input value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className={cn(inputClass, "pl-10")} />
                    </div>
                  ) : (
                    <div className={cn(displayClass, "flex items-center gap-2")}>
                      <MapPin className="w-4 h-4 text-zinc-600" /> {formData.location || "—"}
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-xs text-zinc-500 ml-1 mb-1 block">Avatar URL</label>
                  {isEditing ? (
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                      <input value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} className={cn(inputClass, "pl-10")} />
                    </div>
                  ) : (
                    <div className={cn(displayClass, "flex items-center gap-2 truncate")}>
                      <Globe className="w-4 h-4 text-zinc-600 shrink-0" /> {formData.image || "—"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Contact Links */}
          <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] space-y-5">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Mail className="w-4 h-4 text-zinc-600" /> Contact &amp; Links
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { l: "Phone", v: formData.phoneNumber, f: "phoneNumber", i: Phone },
                { l: "Email", v: formData.email, f: "email", i: Mail, d: true },
                { l: "GitHub", v: formData.githubUrl, f: "githubUrl", i: Github },
                { l: "LinkedIn", v: formData.linkedinUrl, f: "linkedinUrl", i: Linkedin },
              ].map((row) => (
                <div key={row.l}>
                  <label className="text-xs text-zinc-500 ml-1 mb-1 block">{row.l} {row.d && "(locked)"}</label>
                  {isEditing && !row.d ? (
                    <div className="relative">
                      <row.i className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                      <input value={row.v} onChange={e => setFormData({ ...formData, [row.f]: e.target.value })} className={cn(inputClass, "pl-10")} />
                    </div>
                  ) : (
                    <div className={cn(displayClass, "flex items-center gap-2 truncate", row.d && "opacity-60")}>
                      <row.i className="w-4 h-4 text-zinc-600 shrink-0" /> {row.v || "—"}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] space-y-5">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Command className="w-4 h-4 text-zinc-600" /> Skills
            </h3>
            
            {isEditing && (
              <div className="flex gap-2">
                <input
                  value={newSkill}
                  onChange={e => setNewSkill(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSkill())}
                  className={cn(inputClass, "flex-1")}
                  placeholder="Add a skill..."
                />
                <button type="button" onClick={addSkill}
                  className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-500 transition-all"
                >
                  Add
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <AnimatePresence>
                {skills.map((skill) => (
                  <motion.div
                    key={skill}
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.85, opacity: 0 }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                      isEditing 
                        ? "bg-white/[0.03] border-white/[0.08] text-zinc-300" 
                        : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    )}
                  >
                    {skill}
                    {isEditing && (
                      <button type="button" onClick={() => removeSkill(skill)} className="text-zinc-600 hover:text-red-400 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              {skills.length === 0 && (
                <p className="text-sm text-zinc-700 py-4 text-center w-full">No skills added</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
