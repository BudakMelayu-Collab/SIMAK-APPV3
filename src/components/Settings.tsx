import { motion } from "motion/react";
import { User as UserIcon, Globe, Wifi, Clock, ShieldCheck } from "lucide-react";

export default function Settings() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Pengaturan Sistem
          </h2>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Konfigurasi sistem dan informasi koneksi
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 p-6 space-y-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Wifi className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 tracking-tight">Status Koneksi</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-slate-50 text-slate-400 rounded-md">
                <div className="w-4 h-4 flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</p>
                <p className="text-sm font-bold text-slate-900">Connected</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-slate-50 text-slate-400 rounded-md">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Waktu Sistem</p>
                <p className="text-sm font-mono font-bold text-slate-900">UTC 18:15</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
