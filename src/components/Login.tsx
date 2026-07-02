import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Loader2, ArrowRight } from "lucide-react";
import { supabase } from "../supabase";

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("Staf Pendistribusian");
  const [takenRoles, setTakenRoles] = useState<string[]>([]);

  useEffect(() => {
    const fetchTakenRoles = async () => {
      const { data } = await supabase
        .from("staff")
        .select("position");
      if (data) {
        setTakenRoles(data.map(d => d.position));
      }
    };
    fetchTakenRoles();
  }, []);

  const getDepartmentForRole = (roleName: string): string => {
    if (roleName === "Kepala Pelaksana") return "Kepala Pelaksana";
    if (roleName.includes("Pendistribusian")) return "Pendistribusian";
    if (roleName.includes("Keuangan")) return "Keuangan";
    if (roleName.includes("Pengumpulan")) return "Pengumpulan";
    if (roleName.includes("Pendayagunaan")) return "Pendayagunaan";
    if (roleName.includes("SDM") || roleName.includes("Admin")) return "SDM dan Umum";
    return "SDM dan Umum"; // fallback
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorInfo(null);
    try {
      if (isSignUp) {
        const { data: signUpData, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: role,
            },
          },
        });
        if (error) throw error;
        
        if (signUpData?.user) {
          const { error: insertError } = await supabase.from("staff").insert({
            id: `STF-${Date.now()}`,
            name: fullName,
            position: role,
            department: getDepartmentForRole(role),
            contact: email,
            status: "Aktif",
            startdate: new Date().toISOString().split("T")[0],
            leavebalance: 12,
            notes: JSON.stringify({ email: email })
          });
          if (insertError) console.error("Insert error:", insertError);
        }
        
        setErrorInfo("Pendaftaran berhasil. Silakan masuk atau periksa email Anda.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onLogin();
      }
    } catch (error: any) {
      setErrorInfo(error.message || "Failed to authenticate.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020817] flex items-center justify-center relative overflow-hidden font-sans">
      {/* Background Ornaments (Grand/Megah feel) */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-900/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-900/20 blur-[120px] rounded-full pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md p-8 relative z-10"
      >
        <div className="relative rounded-3xl shadow-2xl overflow-hidden p-[1px]">
          {/* Animated Glow Border */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 5, ease: "linear" }}
            className="absolute top-1/2 left-1/2 w-[250%] h-[250%] -translate-x-1/2 -translate-y-1/2"
            style={{
              background: "conic-gradient(from 0deg, transparent 75%, rgba(59, 130, 246, 0.8) 100%)",
            }}
          />
          <div className="relative z-10 h-full w-full backdrop-blur-3xl bg-[#020817]/90 rounded-[calc(1.5rem-1px)] p-8">
            {/* Inner Light glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>

            <div className="text-center mb-10">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="w-24 h-24 mx-auto mb-6 flex items-center justify-center relative"
            >
              <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full"></div>
              <img
                src="https://i.ibb.co.com/FbHbkzXX/SIMAK-V3.png"
                alt="SIMAK Logo"
                className="w-20 h-20 object-contain relative z-10 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]"
              />
            </motion.div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
              SIMAK
            </h1>
            <p className="text-slate-400 text-sm tracking-wide font-medium leading-relaxed">
              Sistem Manajemen Aset Baznas
              <br />
              <span className="text-blue-400/80">
                Aset Terdata, Amanah Terjaga.
              </span>
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-4">
              {isSignUp && (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">Nama Lengkap</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                      placeholder="Nama Lengkap Anda"
                      required={isSignUp}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">Peran (Role)</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none"
                      required={isSignUp}
                    >
                      {!takenRoles.includes("Admin SDM dan Umum 1") && (
                        <option value="Admin SDM dan Umum 1" className="bg-[#020817]">Admin SDM dan Umum 1</option>
                      )}
                      {!takenRoles.includes("Admin SDM dan Umum 2") && (
                        <option value="Admin SDM dan Umum 2" className="bg-[#020817]">Admin SDM dan Umum 2</option>
                      )}
                      {!takenRoles.includes("Kepala Pelaksana") && (
                        <option value="Kepala Pelaksana" className="bg-[#020817]">Kepala Pelaksana</option>
                      )}
                      {!takenRoles.includes("Kepala Bidang Pendistribusian") && (
                        <option value="Kepala Bidang Pendistribusian" className="bg-[#020817]">Kepala Bidang Pendistribusian</option>
                      )}
                      {!takenRoles.includes("Kepala Bagian Keuangan") && (
                        <option value="Kepala Bagian Keuangan" className="bg-[#020817]">Kepala Bagian Keuangan</option>
                      )}
                      {!takenRoles.includes("Kepala Bagian Pengumpulan") && (
                        <option value="Kepala Bagian Pengumpulan" className="bg-[#020817]">Kepala Bagian Pengumpulan</option>
                      )}
                      {!takenRoles.includes("Kepala Sub Bidang Pendayagunaan") && (
                        <option value="Kepala Sub Bidang Pendayagunaan" className="bg-[#020817]">Kepala Sub Bidang Pendayagunaan</option>
                      )}
                      <option value="Staf Pendistribusian" className="bg-[#020817]">Staf Pendistribusian</option>
                      <option value="Staf Pengumpulan" className="bg-[#020817]">Staf Pengumpulan</option>
                      <option value="Staf Keuangan" className="bg-[#020817]">Staf Keuangan</option>
                      <option value="Staf SDM dan Umum" className="bg-[#020817]">Staf SDM dan Umum</option>
                    </select>
                  </div>
                </>
              )}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  placeholder="admin@baznas.go.id"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  placeholder="••••••••"
                  required
                />
                
                {!isSignUp && (
                  <div className="flex items-center justify-between mt-3">
                    <label className="flex items-center space-x-2 text-xs text-slate-400 cursor-pointer group">
                      <input type="checkbox" className="rounded border-white/10 bg-white/5 text-blue-500 focus:ring-blue-500/50 cursor-pointer" />
                      <span className="group-hover:text-slate-300 transition-colors">Ingat Saya</span>
                    </label>
                    <button type="button" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                      Lupa Password?
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {errorInfo && (
              <div className={`text-xs p-3 rounded-xl text-center border ${isSignUp && !errorInfo.toLowerCase().includes("failed") && !errorInfo.toLowerCase().includes("invalid") ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
                {errorInfo}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl px-4 py-4 font-bold tracking-wide flex items-center justify-center space-x-2 transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] disabled:opacity-70 group"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Otentikasi...</span>
                  </>
                ) : (
                  <>
                    <span>{isSignUp ? "Daftar Akun" : "Masuk ke SIMAK"}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
            
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setErrorInfo(null);
                }}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                {isSignUp ? "Sudah punya akun? Masuk" : "Belum punya akun? Daftar"}
              </button>
            </div>
          </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
