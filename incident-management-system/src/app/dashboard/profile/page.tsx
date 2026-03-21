"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Loader2, User, Mail, Phone, MapPin, Github, Linkedin, Save, Plus, X, 
  Camera, Briefcase, Award, Globe, Shield, Sparkles, LayoutDashboard,
  AlertCircle, FolderKanban, Settings, CheckSquare, Edit3, UserCircle
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

  const getNavItems = (role: string): NavItem[] => {
    switch (role) {
      case "ADMIN":
        return [
          { href: "/dashboard/admin", icon: LayoutDashboard, label: "Overview" },
          { href: "/dashboard/admin/issues", icon: AlertCircle, label: "Issues" },
          { href: "/dashboard/admin/projects", icon: FolderKanban, label: "Projects" },
          { href: "/dashboard/admin/settings", icon: Settings, label: "Settings" },
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

  useEffect(() => {
    fetchProfile();
    // If coming from login, we should enable edit mode after data is fetched
    if (fromLogin) {
      setIsEditing(true);
    }
  }, [fromLogin]);

  async function fetchProfile() {
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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

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
    } catch (err: any) {
      setError(err.message);
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
      <div className="flex h-screen items-center justify-center bg-background">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-sm font-medium text-foreground/40 italic">Loading your profile...</p>
        </motion.div>
      </div>
    );
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  // Helper component for label + display/input
  const ProfileField = ({ label, value, field, type = "input", placeholder, icon: Icon }: any) => {
    return (
      <div className="group space-y-1.5 focus-within:text-foreground transition-colors">
        <label className={cn(
          "text-[10px] font-bold uppercase tracking-widest text-foreground/40 transition-colors",
          isEditing && "group-focus-within:text-primary"
        )}>
          {label}
        </label>
        
        {isEditing ? (
          <div className="relative group/field">
            {Icon && <Icon className="absolute left-3.5 top-3.5 h-4 w-4 text-foreground/30 group-focus-within/field:text-primary" />}
            {type === "textarea" ? (
              <textarea
                value={value}
                onChange={e => setFormData({ ...formData, [field]: e.target.value })}
                rows={5}
                className="w-full px-4 py-3 bg-accent/30 border border-border/50 rounded-xl focus:bg-background focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all resize-none shadow-sm text-sm"
                placeholder={placeholder}
              />
            ) : (
              <input
                value={value}
                onChange={e => setFormData({ ...formData, [field]: e.target.value })}
                className={cn(
                  "w-full px-4 py-3 bg-accent/30 border border-border/50 rounded-xl focus:bg-background focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-sm text-sm",
                  Icon && "pl-11"
                )}
                placeholder={placeholder}
              />
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 py-1 group/display min-h-[24px]">
             {Icon && <Icon className="h-4 w-4 text-foreground/20 group-hover/display:text-foreground/40 transition-colors" />}
             <span className={cn(
               "text-sm font-medium transition-colors",
               value ? "text-foreground/80" : "text-foreground/20 italic"
             )}>
               {value || `No ${label.toLowerCase()} specified`}
             </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar navItems={getNavItems(formData.role)} roleTitle={`${formData.role} Panel`} />
      
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Banner Section */}
        <div className="relative h-48 w-full bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-emerald-600/10 border-b border-border/50">
          <div className="absolute inset-0 backdrop-blur-[100px]" />
          <div className="absolute -bottom-16 left-8 md:left-12">
            <div className="relative group h-32 w-32 rounded-3xl border-4 border-background bg-card overflow-hidden shadow-2xl transition-transform hover:scale-[1.02]">
              {formData.image ? (
                <img src={formData.image} alt={formData.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-accent text-foreground/10">
                  <User className="h-14 w-14" />
                </div>
              )}
              {isEditing && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white">
                  <Camera className="h-6 w-6 mb-1" />
                  <span className="text-[10px] font-bold uppercase">Change</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-20 px-8 md:px-12 pb-20 max-w-6xl mx-auto space-y-12">
          {/* Header Action Bar */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border/50">
            <div className="space-y-1">
               <motion.h1 
                 initial={{ opacity: 0, x: -20 }}
                 animate={{ opacity: 1, x: 0 }}
                 className="text-4xl font-black tracking-tight text-foreground"
               >
                 {formData.name || "Set Up Your Profile"}
               </motion.h1>
               <div className="flex items-center gap-4 text-foreground/40 font-bold uppercase tracking-widest text-[10px]">
                 <span className="flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-1 rounded-full border border-primary/20">
                   <Shield className="w-3 h-3" /> {formData.role}
                 </span>
                 <span className="flex items-center gap-1.5">
                   <Mail className="w-3 h-3" /> {formData.email}
                 </span>
               </div>
            </div>

            <div className="flex items-center gap-3">
               {isEditing ? (
                 <>
                   <button
                     type="button"
                     onClick={() => {
                        setIsEditing(false);
                        fetchProfile(); 
                     }}
                     className="px-5 py-2.5 rounded-xl text-sm font-bold text-foreground/60 hover:bg-accent/50 transition-all border border-transparent hover:border-border"
                   >
                     Cancel
                   </button>
                   <button
                     onClick={handleSubmit}
                     disabled={submitting || !formData.name}
                     className="px-6 py-2.5 bg-foreground text-background font-black rounded-xl text-xs uppercase tracking-widest flex items-center gap-2 hover:opacity-90 transition-all shadow-xl shadow-foreground/10 disabled:opacity-50"
                   >
                     {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save Profile</>}
                   </button>
                 </>
               ) : (
                 <button
                   onClick={() => setIsEditing(true)}
                   className="px-6 py-2.5 bg-primary text-primary-foreground font-black rounded-xl text-xs uppercase tracking-widest flex items-center gap-2 hover:opacity-90 transition-all shadow-xl shadow-primary/20"
                 >
                   <Edit3 className="w-4 h-4" /> Edit Profile
                 </button>
               )}
            </div>
          </div>

          {/* Success/Error Alerts */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-4 bg-destructive/10 text-destructive text-sm font-bold border border-destructive/20 rounded-2xl">
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-5 bg-emerald-500/10 text-emerald-500 text-sm font-bold border border-emerald-500/20 rounded-2xl flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Profile updated successfully! {fromLogin && "Proceeding to dashboard..."}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Stats Sidebar */}
            <div className="space-y-8">
              <section className="p-6 rounded-3xl bg-card border border-border shadow-sm space-y-6">
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground/30">Activity Hub</h3>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <span className="block text-3xl font-black">12</span>
                       <span className="block text-[8px] font-black uppercase text-foreground/40 tracking-wider">Resolved</span>
                    </div>
                    <div className="space-y-1">
                       <span className="block text-3xl font-black">4.8</span>
                       <span className="block text-[8px] font-black uppercase text-foreground/40 tracking-wider">Rating</span>
                    </div>
                 </div>
                 <div className="pt-4 border-t border-border/50">
                    <div className="flex items-center justify-between text-[10px] font-bold mb-2">
                       <span className="text-foreground/40 uppercase">Profile Completion</span>
                       <span className="text-primary font-black">85%</span>
                    </div>
                    <div className="h-1.5 w-full bg-accent rounded-full overflow-hidden">
                       <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: '85%' }} />
                    </div>
                 </div>
              </section>

              <section className="p-6 rounded-3xl bg-primary/5 border border-primary/10 space-y-4">
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-primary/60">Pro Tip</h3>
                 <p className="text-xs font-medium text-foreground/60 leading-relaxed">
                   Connecting your GitHub account helps your team collaborate more effectively on code-related incidents.
                 </p>
              </section>
            </div>

            {/* Form Fields */}
            <div className="lg:col-span-2 space-y-12">
               {/* Personal Details Section */}
               <div className="space-y-8">
                 <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                       <Briefcase className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-black tracking-tight">Professional Workspace</h2>
                 </div>

                 <div className="space-y-8">
                    <ProfileField 
                      label="Full Name" 
                      value={formData.name} 
                      field="name" 
                      placeholder="Enter your full name" 
                    />
                    
                    <ProfileField 
                      label="Biography" 
                      value={formData.bio} 
                      field="bio" 
                      type="textarea" 
                      placeholder="Tell the team about your expertise and current focus..." 
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <ProfileField 
                        label="Location" 
                        value={formData.location} 
                        field="location" 
                        icon={MapPin} 
                        placeholder="City, Country" 
                      />
                      <ProfileField 
                        label="Avatar URL" 
                        value={formData.image} 
                        field="image" 
                        icon={Camera} 
                        placeholder="https://..." 
                      />
                    </div>
                 </div>
               </div>

               {/* Connections Section */}
               <div className="space-y-8 pt-4">
                 <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 border border-purple-500/20">
                       <Globe className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-black tracking-tight">Social Network</h2>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <ProfileField 
                      label="Phone Number" 
                      value={formData.phoneNumber} 
                      field="phoneNumber" 
                      icon={Phone} 
                      placeholder="+1 234 567 890" 
                    />
                    <ProfileField 
                      label="Email (Disabled)" 
                      value={formData.email} 
                      field="email" 
                      icon={Mail} 
                    />
                    <ProfileField 
                      label="GitHub" 
                      value={formData.githubUrl} 
                      field="githubUrl" 
                      icon={Github} 
                      placeholder="github.com/..." 
                    />
                    <ProfileField 
                      label="LinkedIn" 
                      value={formData.linkedinUrl} 
                      field="linkedinUrl" 
                      icon={Linkedin} 
                      placeholder="linkedin.com/in/..." 
                    />
                 </div>
               </div>

               {/* Skills Tag Section */}
               <div className="space-y-8 pt-4">
                 <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                       <Award className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-black tracking-tight">Expertise Stack</h2>
                 </div>

                 <div className="p-8 rounded-3xl bg-card border border-border shadow-sm space-y-8">
                    {isEditing && (
                      <div className="flex gap-4">
                        <input
                          value={newSkill}
                          onChange={e => setNewSkill(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSkill())}
                          className="flex-1 px-5 py-3 bg-accent/30 border border-border/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm font-medium"
                          placeholder="Add a techncial or soft skill..."
                        />
                        <button
                          type="button"
                          onClick={addSkill}
                          className="px-6 bg-foreground text-background rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-foreground/10"
                        >
                          Add
                        </button>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3">
                      <AnimatePresence>
                        {skills.map((skill, index) => (
                          <motion.div
                            key={skill}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className={cn(
                              "flex items-center gap-3 py-2 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border",
                              isEditing 
                                ? "pl-5 pr-4 bg-background border-border hover:border-primary/50 text-foreground" 
                                : "px-5 bg-primary/5 border-primary/10 text-primary"
                            )}
                          >
                            {skill}
                            {isEditing && (
                              <button
                                type="button"
                                onClick={() => removeSkill(skill)}
                                className="text-foreground/20 hover:text-destructive transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      {skills.length === 0 && (
                        <p className="text-sm font-medium text-foreground/20 italic">No skills added to your expertise stack yet.</p>
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
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(var(--foreground), 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(var(--foreground), 0.1);
        }
      `}</style>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
