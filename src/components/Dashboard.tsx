import {
  StaffProfile,
  InventoryItem,
  LeaveRequest,
  DocumentArchive,
} from "../types";
import {
  Users,
  Briefcase,
  Calendar,
  FileText,
  ChevronRight,
  Activity,
  TrendingUp,
  AlertCircle,
  Clock,
} from "lucide-react";
import { motion } from "motion/react";

interface DashboardProps {
  staff: StaffProfile[];
  inventory: InventoryItem[];
  leaves: LeaveRequest[];
  documents: DocumentArchive[];
  userName?: string;
  onNavigate: (tab: string) => void;
  onApproveLeave: (id: string) => void;
  onRejectLeave: (id: string) => void;
}

export default function Dashboard({
  staff,
  inventory,
  leaves,
  documents,
  userName,
  onNavigate,
  onApproveLeave,
  onRejectLeave,
}: DashboardProps) {
  // Calculations
  const totalStaff = staff.length;
  const staffOnLeave = staff.filter((s) => s.status === "Cuti").length;
  const activeStaff = staff.filter((s) => s.status === "Aktif").length;

  const totalInventory = inventory.reduce(
    (acc, curr) => acc + curr.quantity,
    0,
  );
  const itemsAssigned = inventory
    .filter((item) => item.status === "Digunakan")
    .reduce((acc, curr) => acc + curr.quantity, 0);
  const itemsDamaged = inventory
    .filter((item) => item.status === "Rusak")
    .reduce((acc, curr) => acc + curr.quantity, 0);

  const pendingLeaves = leaves.filter((l) => l.status === "Pending");
  const totalLeavesApproved = leaves.filter(
    (l) => l.status === "Disetujui",
  ).length;

  const totalDocs = documents.length;

  // Create dynamic activities based on our actual records
  const dynamicActivities: any[] = [];

  leaves.forEach((l) => {
    dynamicActivities.push({
      id: `leave-${l.id}`,
      type: "leave",
      title: "Pengajuan Cuti Baru",
      desc: `${l.staffName} mengajukan ${l.leaveType} untuk ${l.durationDays} hari kerja.`,
      time: l.requestDate || "Baru saja",
      rawDate: new Date(l.requestDate || 0).getTime(),
      color: "bg-amber-100 text-amber-700",
    });
  });

  inventory.forEach((i) => {
    dynamicActivities.push({
      id: `inv-${i.id}`,
      type: "inventory",
      title: "Aktivitas Inventaris",
      desc: `${i.name} (${i.category}) ditambahkan. ${i.assignedToName ? "Dialokasikan ke " + i.assignedToName : "Status: " + i.status}`,
      time: i.purchaseDate || "Baru saja",
      rawDate: new Date(i.purchaseDate || 0).getTime(),
      color: "bg-indigo-100 text-indigo-700",
    });
  });

  documents.forEach((d) => {
    dynamicActivities.push({
      id: `doc-${d.id}`,
      type: "document",
      title: "Dokumen Baru Dibuat",
      desc: `Dokumen ${d.name} (${d.category}) telah diunggah.`,
      time: d.uploadDate || "Baru saja",
      rawDate: new Date(d.uploadDate || 0).getTime(),
      color: "bg-emerald-100 text-emerald-700",
    });
  });

  staff.forEach((s) => {
    dynamicActivities.push({
      id: `staff-${s.id}`,
      type: "staff",
      title: "Data Staf Baru",
      desc: `${s.name} (${s.role} - ${s.department}) ditambahkan ke sistem.`,
      time: s.joinDate || "Baru saja",
      rawDate: new Date(s.joinDate || 0).getTime(),
      color: "bg-sky-100 text-sky-700",
    });
  });

  // Sort by date newest first and take top 5
  dynamicActivities.sort((a, b) => b.rawDate - a.rawDate);
  const recentActivities = dynamicActivities.slice(0, 5);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:auto-rows-[minmax(120px,auto)]">
      {/* Hero Header Card - Elegant & Smooth Bento Bento Hero */}
      <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-6 sm:p-8 relative overflow-hidden shadow-xl md:col-span-2 lg:col-span-2 lg:row-span-2 flex flex-col justify-center">
        <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute left-1/3 bottom-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-2xl -ml-20 -mb-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <span className="bg-indigo-500/20 text-indigo-300 font-mono text-xs uppercase font-semibold px-3 py-1 rounded-full border border-indigo-500/30">
              Operations Status • Staf & Aset
            </span>
            <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight">
              Selamat Datang Kembali, {userName || "Administrator"}
            </h1>
            <p className="mt-2 text-slate-300 max-w-xl text-sm leading-relaxed">
              Sistem Manajemen Aset Baznas.
              <br />
              <span className="font-semibold text-white/90">
                Aset Terdata, Amanah Terjaga.
              </span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-4 min-w-[140px] text-center shadow-sm">
              <span className="text-xs text-slate-300 font-medium uppercase tracking-wider block">
                Tahun Fiskal
              </span>
              <span className="text-2xl font-black font-mono tracking-wider block mt-1">
                2026
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-4 min-w-[140px] text-center shadow-sm">
              <span className="text-xs text-slate-300 font-medium uppercase tracking-wider block">
                Lokasi Utama
              </span>
              <span className="text-lg font-bold block mt-1">Siak, ID</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card 1: Profil Staf */}
      <motion.div
        onClick={() => onNavigate("staff")}
        whileHover={{ y: -2 }}
        className="card-container p-5 cursor-pointer group flex flex-col justify-between lg:col-span-1 lg:row-span-1"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Direktori Staf
          </span>
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-sm">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-baseline space-x-2">
            <span className="text-4xl font-extrabold text-slate-900">
              {totalStaff}
            </span>
            <span className="text-slate-500 text-sm font-medium">Anggota</span>
          </div>

          {/* Overlapping Staff Avatars */}
          <div className="flex -space-x-2 overflow-hidden">
            {staff.slice(0, 3).map((member, i) =>
              member.avatarUrl ? (
                <img
                  key={member.id}
                  src={member.avatarUrl}
                  alt={member.name}
                  className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover shadow-sm"
                />
              ) : (
                <div
                  key={member.id}
                  className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700 shadow-sm uppercase shrink-0"
                >
                  {member.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .substring(0, 2)}
                </div>
              ),
            )}
            {staff.length > 3 && (
              <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 shadow-sm">
                +{staff.length - 3}
              </div>
            )}
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs border-t border-slate-100 pt-3 text-slate-500">
          <span className="font-medium">
            {activeStaff} Aktif • {staffOnLeave} Cuti
          </span>
          <span className="text-blue-600 font-semibold group-hover:underline inline-flex items-center">
            Kelola <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </span>
        </div>
      </motion.div>

      {/* Card 2: Inventaris Office */}
      <motion.div
        onClick={() => onNavigate("inventory")}
        whileHover={{ y: -2 }}
        className="card-container p-5 cursor-pointer group flex flex-col justify-between lg:col-span-1 lg:row-span-1"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Inventaris Aset
          </span>
          <div className="p-2 bg-violet-50 text-violet-600 rounded-lg group-hover:bg-violet-600 group-hover:text-white transition-colors duration-300 shadow-sm">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4 flex items-baseline space-x-2">
          <span className="text-4xl font-extrabold text-slate-900">
            {totalInventory}
          </span>
          <span className="text-slate-500 text-sm font-medium">Item</span>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs border-t border-slate-100 pt-3 text-slate-500">
          <span className="font-medium">
            {itemsAssigned} Digunakan • {itemsDamaged} Rusak
          </span>
          <span className="text-violet-600 font-semibold group-hover:underline inline-flex items-center">
            Detail <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </span>
        </div>
      </motion.div>

      {/* Card 3: Kontrol Cuti */}
      <motion.div
        onClick={() => onNavigate("leave")}
        whileHover={{ y: -2 }}
        className="card-container p-5 cursor-pointer group flex flex-col justify-between lg:col-span-1 lg:row-span-1"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Kontrol Cuti
          </span>
          <div className="p-2 bg-amber-50 text-amber-600 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition-colors duration-300 shadow-sm relative">
            <Calendar className="w-5 h-5" />
            {pendingLeaves.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full animate-pulse"></span>
            )}
          </div>
        </div>
        <div className="mt-4 flex items-baseline space-x-2">
          <span className="text-4xl font-extrabold text-slate-900">
            {pendingLeaves.length}
          </span>
          <span className="text-slate-500 text-sm font-medium">
            Sertifikasi
          </span>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs border-t border-slate-100 pt-3 text-slate-500">
          <span className="font-medium">
            {totalLeavesApproved} Cuti Disetujui
          </span>
          <span className="text-amber-600 font-semibold group-hover:underline inline-flex items-center">
            Buka <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </span>
        </div>
      </motion.div>

      {/* Card 4: Arsip Dokumen */}
      <motion.div
        onClick={() => onNavigate("archive")}
        whileHover={{ y: -2 }}
        className="card-container p-5 cursor-pointer group flex flex-col justify-between lg:col-span-1 lg:row-span-1"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Arsip Dokumen
          </span>
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300 shadow-sm">
            <FileText className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4 flex items-baseline space-x-2">
          <span className="text-4xl font-extrabold text-slate-900">
            {totalDocs}
          </span>
          <span className="text-slate-500 text-sm font-medium">Berkas</span>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs border-t border-slate-100 pt-3 text-slate-500">
          <span className="font-medium">PDF, DOCX, XLSX</span>
          <span className="text-emerald-600 font-semibold group-hover:underline inline-flex items-center">
            Cari <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </span>
        </div>
      </motion.div>

      {/* Antrean Pengajuan Cuti (Pending Cuti) */}
      <div className="card-container p-6 space-y-4 md:col-span-2 lg:col-span-2 lg:row-span-3 flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm text-slate-900 uppercase tracking-wider">
              Persetujuan Cuti
            </h3>
          </div>
          <span className="text-xs font-mono font-bold bg-amber-50 text-amber-700 px-3 py-1 rounded-md">
            {pendingLeaves.length} Permintaan
          </span>
        </div>

        {pendingLeaves.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
              <Calendar className="w-6 h-6" />
            </div>
            <p className="mt-4 text-sm text-slate-400 font-medium">
              Semua permohonan cuti telah diproses.
            </p>
            <button
              onClick={() => onNavigate("leave")}
              className="mt-2 text-xs text-indigo-600 font-semibold hover:underline"
            >
              Buat Pengajuan Cuti Baru
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingLeaves.map((req) => (
              <div
                key={req.id}
                className="p-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-3">
                    <span className="font-bold text-sm text-slate-900">
                      {req.staffName}
                    </span>
                    <span className="text-[10px] font-bold tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded uppercase">
                      {req.leaveType}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    Tanggal:{" "}
                    <span className="text-slate-800 font-semibold">
                      {req.startDate} s/d {req.endDate}
                    </span>{" "}
                    ({req.durationDays} hari)
                  </p>
                  <p className="text-xs italic text-slate-400 max-w-sm truncate">
                    "{req.reason}"
                  </p>
                </div>

                <div className="flex items-center space-x-2 self-start sm:self-center shrink-0">
                  <button
                    onClick={() => onRejectLeave(req.id)}
                    className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-red-700 border border-slate-200 hover:border-red-200 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Tolak
                  </button>
                  <button
                    onClick={() => onApproveLeave(req.id)}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
                  >
                    Setujui
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Aktivitas Terkini & Log Perubahan */}
      <div className="card-container p-6 space-y-4 lg:col-span-1 lg:row-span-3">
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-100 shrink-0">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Activity className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-sm text-slate-900 uppercase tracking-wider">
            Aktivitas Terkini
          </h3>
        </div>

        {recentActivities.length > 0 ? (
          <div className="space-y-4 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
            {recentActivities.map((act) => (
              <div key={act.id} className="flex space-x-4 relative">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 z-10 ${act.color} text-xs shadow-sm ring-4 ring-white`}
                >
                  {act.type === "leave" && <Calendar className="w-5 h-5" />}
                  {act.type === "inventory" && (
                    <Briefcase className="w-5 h-5" />
                  )}
                  {act.type === "document" && <FileText className="w-5 h-5" />}
                  {act.type === "staff" && <Users className="w-5 h-5" />}
                </div>
                <div className="space-y-1 pt-1 overflow-hidden">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-slate-800 truncate">
                      {act.title}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono font-medium whitespace-nowrap bg-slate-50 px-2 py-0.5 rounded-full">
                      {act.time}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-[280px]">
                    {act.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-center bg-slate-50 border border-slate-100 border-dashed rounded-xl p-4">
            <Activity className="w-8 h-8 text-slate-300 mb-2" />
            <p className="text-xs font-semibold text-slate-500">
              Belum ada aktivitas tercatat
            </p>
          </div>
        )}
      </div>

      {/* Distribusi Kondisi Item Inventaris */}
      <div className="card-container p-6 space-y-4 lg:col-span-1 lg:row-span-2 flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <h3 className="font-semibold text-sm text-slate-800 uppercase tracking-wider">
            Kondisi Inventaris
          </h3>
          <span className="text-xs font-bold text-slate-400 font-mono uppercase bg-slate-50 px-2.5 py-1 rounded-md">
            Rasio Distribusi
          </span>
        </div>

        <div className="space-y-4 py-2">
          {/* Tersedia (Baik) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium font-sans">
                Bagus & Tersedia
              </span>
              <span className="text-slate-900 font-bold font-mono">
                {inventory.length > 0
                  ? Math.round(
                      (inventory.filter((i) => i.status === "Tersedia").length /
                        inventory.length) *
                        100,
                    )
                  : 0}
                %
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${inventory.length > 0 ? (inventory.filter((i) => i.status === "Tersedia").length / inventory.length) * 100 : 0}%`,
                }}
              ></div>
            </div>
          </div>

          {/* Business Use */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium font-sans">
                Sedang Digunakan Staf
              </span>
              <span className="text-slate-900 font-bold font-mono">
                {inventory.length > 0
                  ? Math.round(
                      (inventory.filter((i) => i.status === "Digunakan")
                        .length /
                        inventory.length) *
                        100,
                    )
                  : 0}
                %
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-500 h-full rounded-full transition-all duration-1000 ease-out delay-150"
                style={{
                  width: `${inventory.length > 0 ? (inventory.filter((i) => i.status === "Digunakan").length / inventory.length) * 100 : 0}%`,
                }}
              ></div>
            </div>
          </div>

          {/* Repair / Damaged */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium font-sans">
                Rusak atau Masalah Fisik
              </span>
              <span className="text-slate-900 font-bold font-mono">
                {inventory.length > 0
                  ? Math.round(
                      (inventory.filter(
                        (i) =>
                          i.status === "Rusak" ||
                          i.status === "Dalam Perbaikan",
                      ).length /
                        inventory.length) *
                        100,
                    )
                  : 0}
                %
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-1000 ease-out delay-300"
                style={{
                  width: `${inventory.length > 0 ? (inventory.filter((i) => i.status === "Rusak" || i.status === "Dalam Perbaikan").length / inventory.length) * 100 : 0}%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Informasi Ringkas Tata Tertib Cuti */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 text-slate-100 space-y-4 flex flex-col justify-between shadow-xl relative overflow-hidden lg:col-span-1 lg:row-span-1 group hover:ring-2 hover:ring-emerald-500/30 transition-all cursor-default">
        <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
        <div className="space-y-3 relative z-10">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-xs text-white uppercase tracking-wider">
              Panduan Cuti
            </h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Maksimum 12-15 hari kerja per tahun. Rekam Nomor Seri di{" "}
            <strong className="text-slate-200">Inventaris</strong>.
          </p>
        </div>

        <div className="p-3 bg-slate-800/50 rounded-xl flex items-start space-x-2 border border-slate-700/50 relative z-10 backdrop-blur-sm">
          <AlertCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-[10px] text-slate-300 leading-relaxed">
            <strong className="text-white">Tips Arsip</strong>: Format didukung:
            .pdf, .docx, .xlsx.
          </p>
        </div>
      </div>
    </div>
  );
}
