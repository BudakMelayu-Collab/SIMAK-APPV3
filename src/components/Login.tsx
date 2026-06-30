import React, { useState } from "react";
import { motion } from "motion/react";
import { Loader2, ArrowRight } from "lucide-react";
import { supabase } from "../supabase";

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorInfo(null);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
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
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md p-8 relative z-10"
      >
        <div className="backdrop-blur-2xl bg-white/[0.03] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          {/* Inner Light glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>

          <div className="text-center mb-10">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-lg shadow-blue-500/10 overflow-hidden relative group">
              <div className="absolute inset-0 bg-blue-500/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out"></div>
              <img
                src="https://i.ibb.co.com/FbHbkzXX/SIMAK-V3.png"
                alt="SIMAK Logo"
                className="w-16 h-16 object-contain relative z-10"
              />
            </div>
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

        <p className="max-w-xs mx-auto text-center mt-8 text-[10px] text-slate-500 font-mono">
          Akses terbatas hanya untuk personel otorisasi Baznas.
        </p>
      </motion.div>
    </div>
  );
}
