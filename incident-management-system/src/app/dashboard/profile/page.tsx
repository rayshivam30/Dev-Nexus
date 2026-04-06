"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { 
  Loader2, User, Mail, Phone, MapPin, Github, Linkedin, Save, X, 
  Camera, Briefcase, Globe, Shield, LayoutDashboard,
  AlertCircle, FolderKanban, CheckSquare, Edit3, UserCircle,
  Terminal, Zap, ShieldAlert, Activity, Command
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar, NavItem } from "@/components/dashboard/shared/Sidebar";
import { cn } from "@/lib/utils";

function ProfileContent() {
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

  const getNavItems = (role: string): NavItem[] => {
    switch (role) {
      case "ADMIN":
        return [
          { href: "/dashboard/admin", icon: LayoutDashboard, label: "Overview" },
          { href: "/dashboard/admin/issues", icon: AlertCircle, label: "Issues" },
          { href: "/dashboard/admin/projects", icon: FolderKanban, label: "Projects" },
        ];
      case "MANAGER":
        return [
          { href: "/dashboard/manager", icon: LayoutDashboard, label: "Overview" },
          { href: "/dashboard/manager/issues", icon: AlertCircle, label: "Issues" },
          { href: "/dashboard/manager/team", icon: UserCircle, label: "My Team" },
        ];
      case "DEVELOPER":
        return [
          { href: "/dashboard/developer", icon: LayoutDashboard, label: "Overview" },
          { href: "/dashboard/developer/issues", icon: AlertCircle, label: "My Issues" },
          { href: "/dashboard/developer/resolved", icon: CheckSquare, label: "Resolved" },
        ];
      default:
        return [];
    }
  };

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("incident_token");
      if (!token) {
        router.push("/auth/login");
        return;
      }

      const res = await fetch("/api/user/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

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
      const token = localStorage.getItem("incident_token");
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-6">
          <Loader2 className="w-16 h-16 animate-spin text-black" />
          <p className="text-2xl font-black uppercase italic tracking-widest animate-pulse">SYNCHRONIZING_USER_DATA...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white text-black overflow-hidden font-mono">
      <Sidebar navItems={getNavItems(formData.role)} roleTitle={`${formData.role}_HUB`} />
      
      <main className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 lg:p-12">
        {/* ── MISSION_CONTROL BANNER ── */}
        <div className="relative h-80 w-full bg-white border-4 border-black mb-16 overflow-hidden">
           {/* Brutalist Grid Pattern */}
           <div className="absolute inset-0 bg-[#FFD700]/5 opacity-50" style={{ backgroundImage: 'radial-gradient(black 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>
           
           {/* Telemetry Accents */}
           <div className="absolute top-4 left-4 flex gap-4 opacity-20">
              <div className="flex items-center gap-2 text-[8px] font-black uppercase">
                 <div className="h-1 w-8 bg-black"></div> LATENCY_012ms
              </div>
              <div className="flex items-center gap-2 text-[8px] font-black uppercase">
                 <div className="h-1 w-8 bg-black"></div> BANDWIDTH_98%
              </div>
           </div>

           <div className="absolute inset-y-0 left-0 w-1 bg-black/10"></div>
           <div className="absolute inset-y-0 right-0 w-1 bg-black/10"></div>
           
           <div className="absolute inset-0 flex items-center justify-between px-8 md:px-16">
              <div className="flex items-center gap-12">
                {/* PROFILE FRAME RIG */}
                <div className="relative group">
                   {/* Tactical Bracket Accents */}
                   <div className="absolute -top-3 -left-3 w-8 h-8 border-t-4 border-l-4 border-[#FF00FF] z-10"></div>
                   <div className="absolute -bottom-3 -right-3 w-8 h-8 border-b-4 border-r-4 border-[#00D1FF] z-10"></div>
                   
                   <div className="relative w-48 h-48 border-4 border-black bg-white shadow-[12px_12px_0_0_black] overflow-hidden">
                      {formData.image ? (
                        <Image src={formData.image} alt={formData.name} fill className="object-cover grayscale hover:grayscale-0 transition-all duration-500" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-[#F0F0F0] text-black/10">
                          <User className="h-20 w-20" />
                        </div>
                      )}
                      
                      {isEditing && (
                        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center cursor-pointer text-[#FFD700] z-20 group-hover:bg-black/90 transition-all">
                          <Camera className="h-8 w-8 mb-2 animate-bounce" />
                          <span className="text-[10px] font-black uppercase tracking-widest italic">INIT_UPLOAD</span>
                        </div>
                      )}
                   </div>
                </div>
                
                {/* IDENTITY STACK */}
                <div className="space-y-3">
                   <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 bg-black text-[#FFD700] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] italic shadow-[4px_4px_0_0_black]">
                        <Shield className="w-3 h-3" /> USER_NODE_ACTIVE
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-[#32CD32] animate-pulse border-2 border-black"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-black/40">UPLINK_STABLE</span>
                      </div>
                   </div>
                   
                   <div className="space-y-0">
                      <h1 className="text-4xl md:text-7xl font-[950] tracking-tighter uppercase italic leading-[0.8] text-black drop-shadow-[5px_5px_0_rgba(0,0,0,0.1)]">
                        {formData.name || "UNIDENTIFIED"}
                      </h1>
                      <div className="flex items-center gap-3 pt-3">
                         <span className="text-[11px] font-black uppercase text-black/30 tracking-[0.4em]">RANK_LEVEL_04</span>
                         <span className="text-[11px] font-black uppercase text-black/30 tracking-[0.4em]">NODE_HASH_{formData.email?.slice(0, 4).toUpperCase()}</span>
                      </div>
                   </div>
                </div>
              </div>

              {/* ACTION RIG */}
              <div className="hidden xl:block">
                 {isEditing ? (
                   <div className="flex flex-col gap-4">
                      <button
                        type="button"
                        onClick={() => { setIsEditing(false); fetchProfile(); }}
                        className="h-14 px-8 border-4 border-black bg-white text-xs font-black uppercase italic shadow-[6px_6px_0_0_#FF3131] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all active:scale-95"
                      >
                        ABORT_COMMAND
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={submitting || !formData.name}
                        className="h-14 px-10 bg-black text-[#FFD700] border-4 border-black text-xs font-black uppercase italic shadow-[8px_8px_0_0_#32CD32] hover:bg-black hover:text-[#32CD32] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center justify-center gap-3 disabled:opacity-20"
                      >
                        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} COMMIT_SAVE
                      </button>
                   </div>
                 ) : (
                   <button
                     onClick={() => setIsEditing(true)}
                     className="h-20 px-12 bg-black text-[#00D1FF] border-4 border-black text-sm font-black uppercase italic shadow-[12px_12px_0_0_black] hover:bg-[#00D1FF] hover:text-black hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center gap-6 group"
                   >
                     <Edit3 className="w-8 h-8 group-hover:rotate-[15deg] transition-transform" /> 
                     <div className="flex flex-col items-start leading-none gap-1">
                        <span>MODIFY_IDENTITY</span>
                        <span className="text-[10px] opacity-40 italic">MANUAL_OVERRIDE</span>
                     </div>
                   </button>
                 )}
              </div>
           </div>
        </div>

        <div className="mt-12 px-6 md:px-12 pb-20 max-w-6xl mx-auto space-y-12">
          {/* Status Panel */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-6 border-4 border-black bg-[#FF3131] text-white font-black uppercase italic flex items-center gap-4 shadow-[6px_6px_0_0_black] text-sm">
                <ShieldAlert className="w-8 h-8" /> ERROR: {error}
              </motion.div>
            )}
            {success && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-6 border-4 border-black bg-[#32CD32] font-black uppercase italic flex items-center gap-4 shadow-[6px_6px_0_0_black] text-sm">
                <CheckSquare className="w-8 h-8" /> SYSTEM_SYNC_COMPLETE
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* ── LEFT METRICS COLUMN ── */}
            <div className="lg:col-span-4 space-y-10">
               <section className="p-8 border-4 border-black bg-white shadow-[8px_8px_0_0_black] space-y-8">
                 <h3 className="text-lg font-[950] uppercase italic tracking-tighter flex items-center gap-3 text-black">
                   <Activity className="w-6 h-6 text-[#FF3131]" /> NODE_METRICS
                 </h3>
                 
                 <div className="space-y-4">
                    <div className="p-5 border-4 border-black bg-[#F8F8F8] shadow-[4px_4px_0_0_#FF00FF]">
                       <span className="block text-4xl font-black italic tracking-tighter">{stats.resolvedCount}</span>
                       <span className="block text-[9px] font-black uppercase text-black/40 tracking-[0.2em]">RESOLVED_OPS</span>
                    </div>
                    <div className="p-5 border-4 border-black bg-[#F8F8F8] shadow-[4px_4px_0_0_#00D1FF]">
                       <span className="block text-4xl font-black italic tracking-tighter">{stats.rating}</span>
                       <span className="block text-[9px] font-black uppercase text-black/40 tracking-[0.2em]">OPERATOR_RANK</span>
                    </div>
                 </div>

                 <div className="pt-6 border-t-2 border-black space-y-3">
                    <div className="flex justify-between items-end">
                       <span className="text-[9px] font-black uppercase text-black/40">DATA_SYNC</span>
                       <span className="text-xl font-black italic">{stats.profileCompletion}%</span>
                    </div>
                    <div className="h-4 border-2 border-black p-0.5 bg-white">
                       <div className="h-full bg-black transition-all duration-1000" style={{ width: `${stats.profileCompletion}%` }} />
                    </div>
                 </div>
              </section>

              <section className="p-6 border-4 border-black bg-[#FFD700] shadow-[8px_8px_0_0_black] space-y-3 relative overflow-hidden">
                 <h4 className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                    <Zap className="w-4 h-4 fill-black" /> ADVISORY
                 </h4>
                 <p className="text-[10px] font-black uppercase italic leading-tight text-black/80">
                    &quot;INTEGRATING_GITHUB_UPLINK_INCREASES_METRICS_BY_42%.&quot;
                 </p>
              </section>
            </div>

            {/* ── MAIN IDENTITY RIG ── */}
            <div className="lg:col-span-8 space-y-12">
               
               {/* Professional Specs */}
               <div className="space-y-6">
                 <div className="flex items-center gap-4 bg-black text-[#00D1FF] px-5 py-1.5 inline-flex rotate-1 border-2 border-black">
                    <Briefcase className="w-5 h-5" />
                    <h2 className="text-base font-black uppercase italic tracking-tighter">DATA_WORKSPACE</h2>
                 </div>

                 <div className="bg-white border-4 border-black p-8 shadow-[10px_10px_0_0_black] space-y-10">
                    <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase tracking-widest text-black/40 ml-1">IDENTIFIER_NAME</label>
                       {isEditing ? (
                         <input
                           value={formData.name}
                           onChange={e => setFormData({ ...formData, name: e.target.value })}
                           className="w-full h-14 px-5 border-4 border-black bg-white font-black uppercase italic focus:bg-[#00D1FF]/5 outline-none shadow-[4px_4px_0_0_black]"
                         />
                       ) : (
                         <div className="p-5 border-4 border-black bg-[#F8F8F8] font-black uppercase italic text-2xl shadow-[4px_4px_0_0_black]">{formData.name || "UNIDENTIFIED"}</div>
                       )}
                    </div>
                    
                    <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase tracking-widest text-black/40 ml-1">OPERATOR_BIO</label>
                       {isEditing ? (
                         <textarea
                           value={formData.bio}
                           onChange={e => setFormData({ ...formData, bio: e.target.value })}
                           className="w-full p-5 border-4 border-black bg-white font-black uppercase italic focus:bg-[#00D1FF]/5 outline-none shadow-[4px_4px_0_0_black] min-h-[140px]"
                         />
                       ) : (
                         <div className="p-6 border-4 border-black bg-[#F8F8F8] font-black uppercase italic text-lg leading-relaxed shadow-[4px_4px_0_0_black]">
                            {formData.bio || "NULL_STREAM"}
                         </div>
                       )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-widest text-black/40 ml-1">GEOGRAPHIC_NODE</label>
                          {isEditing ? (
                            <div className="relative">
                              <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 opacity-20" />
                              <input value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="w-full h-14 pl-14 border-4 border-black bg-white font-black uppercase italic shadow-[4px_4px_0_0_black]" />
                            </div>
                          ) : (
                            <div className="h-14 px-5 border-4 border-black bg-[#F8F8F8] font-black uppercase italic flex items-center gap-3 shadow-[4px_4px_0_0_black]">
                              <MapPin className="w-4 h-4 opacity-20" /> {formData.location || "OFF_GRID"}
                            </div>
                          )}
                       </div>
                       <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-widest text-black/40 ml-1">AVATAR_LINK</label>
                          {isEditing ? (
                            <div className="relative">
                              <Globe className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 opacity-20" />
                              <input value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} className="w-full h-14 pl-14 border-4 border-black bg-white font-black uppercase italic shadow-[4px_4px_0_0_black]" />
                            </div>
                          ) : (
                            <div className="h-14 px-5 border-4 border-black bg-[#F8F8F8] font-black uppercase italic flex items-center gap-3 shadow-[4px_4px_0_0_black] truncate">
                              <Globe className="w-4 h-4 opacity-20" /> {formData.image || "NULL"}
                            </div>
                          )}
                       </div>
                    </div>
                 </div>
               </div>

               {/* Communications RIG */}
               <div className="space-y-6">
                 <div className="flex items-center gap-4 bg-black text-[#FF00FF] px-5 py-1.5 inline-flex -rotate-1 border-2 border-black">
                    <Terminal className="w-5 h-5" />
                    <h2 className="text-base font-black uppercase italic tracking-tighter">COMMS_LINK</h2>
                 </div>

                 <div className="bg-white border-4 border-black p-8 shadow-[10px_10px_0_0_black] grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[
                      { l: "UPLINK_PHONE", v: formData.phoneNumber, f: "phoneNumber", i: Phone },
                      { l: "UPLINK_EMAIL (LOCKED)", v: formData.email, f: "email", i: Mail, d: true },
                      { l: "GITHUB_UPLINK", v: formData.githubUrl, f: "githubUrl", i: Github },
                      { l: "LINKEDIN_UPLINK", v: formData.linkedinUrl, f: "linkedinUrl", i: Linkedin },
                    ].map((row) => (
                      <div key={row.l} className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-widest text-black/40 ml-1">{row.l}</label>
                        {isEditing && !row.d ? (
                          <div className="relative">
                             <row.i className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 opacity-20" />
                             <input value={row.v} onChange={e => setFormData({ ...formData, [row.f]: e.target.value })} className="w-full h-14 pl-14 border-4 border-black bg-white font-black uppercase italic shadow-[4px_4px_0_0_black]" />
                          </div>
                        ) : (
                          <div className={cn(
                            "h-14 px-5 border-4 border-black bg-[#F8F8F8] font-black uppercase italic flex items-center gap-3 shadow-[4px_4px_0_0_black] truncate",
                            row.d && "opacity-60"
                          )}>
                             <row.i className="w-4 h-4 opacity-20" /> {row.v || "NOT_ACTIVE"}
                          </div>
                        )}
                      </div>
                    ))}
                 </div>
               </div>

               {/* Expertise Protocol */}
               <div className="space-y-6">
                 <div className="flex items-center gap-4 bg-black text-[#32CD32] px-5 py-1.5 inline-flex rotate-2 border-2 border-black">
                    <Command className="w-5 h-5" />
                    <h2 className="text-base font-black uppercase italic tracking-tighter">EXPERTISE_STACK</h2>
                 </div>

                 <div className="bg-white border-4 border-black p-8 shadow-[12px_12px_0_0_black] space-y-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#32CD32] opacity-5 -rotate-12 translate-x-12 -translate-y-12"></div>
                    
                    {isEditing && (
                      <div className="flex gap-4 relative z-10">
                        <input
                          value={newSkill}
                          onChange={e => setNewSkill(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSkill())}
                          className="flex-1 h-12 px-5 border-4 border-black bg-white font-black uppercase italic focus:bg-[#32CD32]/5 outline-none shadow-[4px_4px_0_0_black] text-xs"
                          placeholder="ADD_PROTOCOL..."
                        />
                        <button
                          type="button"
                          onClick={addSkill}
                          className="h-12 px-6 bg-black text-[#32CD32] border-4 border-black font-black uppercase italic shadow-[6px_6px_0_0_black] hover:bg-[#32CD32] hover:text-black hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all text-xs"
                        >
                          INIT
                        </button>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-4 relative z-10">
                      <AnimatePresence>
                        {skills.map((skill) => (
                          <motion.div
                            key={skill}
                            initial={{ scale: 0.85, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.85, opacity: 0 }}
                            className={cn(
                              "flex items-center gap-3 h-12 border-4 border-black font-black uppercase italic text-[10px] shadow-[4px_4px_0_0_black] transition-all",
                              isEditing 
                                ? "pl-5 pr-3 bg-white border-black hover:bg-[#32CD32] hover:text-black cursor-default" 
                                : "px-6 bg-[#32CD32] text-black border-black"
                            )}
                          >
                            {skill}
                            {isEditing && (
                              <button type="button" onClick={() => removeSkill(skill)} className="text-black/30 hover:text-black transition-colors border-l-2 border-black/10 pl-2">
                                <X className="w-4 h-4 stroke-[4px]" />
                              </button>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      {skills.length === 0 && (
                        <p className="text-lg font-black uppercase italic opacity-10 py-6 tracking-widest text-center w-full">NULL_SKILLS_ALGO</p>
                      )}
                    </div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 12px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #F0F0F0;
          border-left: 4px solid black;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: black;
          border: 2px solid #F0F0F0;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #333;
        }
      `}</style>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-white">
        <Loader2 className="w-16 h-16 animate-spin text-black" />
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
