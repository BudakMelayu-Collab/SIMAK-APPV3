import React, { useState } from "react";
import { LeaveRequest, StaffProfile } from "../types";
import {
  Calendar,
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  HelpCircle,
  X,
  AlertOctagon,
  UserCheck,
} from "lucide-react";

interface LeaveProps {
  leaves: LeaveRequest[];
  staff: StaffProfile[];
  onAddLeaveRequest: (req: Omit<LeaveRequest, "id" | "requestDate">) => void;
  onApproveLeave: (id: string) => void;
  onRejectLeave: (id: string) => void;
}

export default function Leave({
  leaves,
  staff,
  onAddLeaveRequest,
  onApproveLeave,
  onRejectLeave,
}: LeaveProps) {
  // Filters or search State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("Semua");

  // Tabs State
  const [activeTab, setActiveTab] = useState<"permohonan" | "rekap">(
    "permohonan",
  );

  // Submit Modal States
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);

  // Form States
  const [formData, setFormData] = useState({
    staffId: "",
    leaveType: "Cuti Tahunan" as const,
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    reason: "",
  });

  // Calculate leaves statistics
  const totalPending = leaves.filter((l) => l.status === "Pending").length;
  const totalApproved = leaves.filter((l) => l.status === "Disetujui").length;
  const totalRejected = leaves.filter((l) => l.status === "Ditolak").length;

  const handleOpenRequest = () => {
    // Select first staff as default
    const firstStaffId = staff.length > 0 ? staff[0].id : "";
    setFormData({
      staffId: firstStaffId,
      leaveType: "Cuti Tahunan",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
      reason: "",
    });
    setIsSubmitOpen(true);
  };

  const calculateDays = (start: string, end: string): number => {
    const sDate = new Date(start);
    const eDate = new Date(end);
    if (isNaN(sDate.getTime()) || isNaN(eDate.getTime())) return 1;

    const diffTime = Math.abs(eDate.getTime() - sDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Inclusive
    return diffDays;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.staffId || !formData.reason) return;

    const durationDays = calculateDays(formData.startDate, formData.endDate);
    const selectedStaff = staff.find((s) => s.id === formData.staffId);

    // Check if leave balance is sufficient (Optional warning, but let them file it anyway)
    if (
      selectedStaff &&
      formData.leaveType === "Cuti Tahunan" &&
      selectedStaff.leaveBalance < durationDays
    ) {
      if (
        !confirm(
          `Peringatan: Jatah Cuti Tahunan tinggal ${selectedStaff.leaveBalance} hari. Durasi pengajuan adalah ${durationDays} hari. Lanjutkan pengajuan?`,
        )
      ) {
        return;
      }
    }

    onAddLeaveRequest({
      staffId: formData.staffId,
      staffName: selectedStaff ? selectedStaff.name : "Unknown Staff",
      leaveType: formData.leaveType,
      startDate: formData.startDate,
      endDate: formData.endDate,
      durationDays,
      reason: formData.reason,
      status: "Pending",
    });

    setIsSubmitOpen(false);
  };

  // Filter Leave requests list
  const filteredLeaves = leaves.filter((req) => {
    const matchesSearch =
      req.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.reason.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      selectedStatus === "Semua" || req.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header section with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold tracking-tight text-slate-800 uppercase">
            KONTROL ABSENSI & CUTI
          </h2>
        </div>

        <button
          onClick={handleOpenRequest}
          className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-[10px] px-3 py-1.5 rounded shadow-xs hover:shadow-sm inline-flex items-center space-x-1.5 transition-all"
        >
          <Plus className="w-3 h-3" />
          <span>AJUKAN CUTI</span>
        </button>
      </div>

      {/* Grid Dashboard Widget Khusus Cuti */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 to-white p-5 rounded-2xl shadow-sm border border-amber-100/50 flex items-center justify-between group transition-all hover:shadow-md">
          <div className="absolute top-0 right-0 w-28 h-28 bg-amber-400/20 rounded-full blur-3xl -mr-10 -mt-10 transition-transform duration-500 group-hover:scale-110"></div>
          <div className="relative flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-amber-400 to-amber-500 text-white rounded-xl shadow-[0_4px_12px_-4px_rgba(251,191,36,0.5)]">
              <Clock className="w-6 h-6" />
            </div>
            <span className="text-xs text-slate-600 font-bold uppercase tracking-widest">
              Menunggu
            </span>
          </div>
          <span className="relative text-4xl font-black text-slate-800 leading-none font-mono drop-shadow-sm">
            {totalPending}
          </span>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-white p-5 rounded-2xl shadow-sm border border-emerald-100/50 flex items-center justify-between group transition-all hover:shadow-md">
          <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-400/20 rounded-full blur-3xl -mr-10 -mt-10 transition-transform duration-500 group-hover:scale-110"></div>
          <div className="relative flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-emerald-400 to-emerald-500 text-white rounded-xl shadow-[0_4px_12px_-4px_rgba(52,211,153,0.5)]">
              <CheckCircle className="w-6 h-6" />
            </div>
            <span className="text-xs text-slate-600 font-bold uppercase tracking-widest">
              Disetujui
            </span>
          </div>
          <span className="relative text-4xl font-black text-slate-800 leading-none font-mono drop-shadow-sm">
            {totalApproved}
          </span>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-rose-50 to-white p-5 rounded-2xl shadow-sm border border-rose-100/50 flex items-center justify-between group transition-all hover:shadow-md">
          <div className="absolute top-0 right-0 w-28 h-28 bg-rose-400/20 rounded-full blur-3xl -mr-10 -mt-10 transition-transform duration-500 group-hover:scale-110"></div>
          <div className="relative flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-rose-400 to-rose-500 text-white rounded-xl shadow-[0_4px_12px_-4px_rgba(251,113,133,0.5)]">
              <XCircle className="w-6 h-6" />
            </div>
            <span className="text-xs text-slate-600 font-bold uppercase tracking-widest">
              Ditolak
            </span>
          </div>
          <span className="relative text-4xl font-black text-slate-800 leading-none font-mono drop-shadow-sm">
            {totalRejected}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg self-start">
        <button
          onClick={() => setActiveTab("permohonan")}
          className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === "permohonan" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          Permohonan Cuti
        </button>
        <button
          onClick={() => setActiveTab("rekap")}
          className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === "rekap" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          Rekapitulasi Cuti Karyawan
        </button>
      </div>

      {activeTab === "permohonan" ? (
        <>
          {/* Search & Filter Bar */}
          <div className="bg-slate-50 p-2 border border-slate-200 rounded flex flex-col sm:flex-row gap-2">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari permohonan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1 border border-slate-200 rounded text-[11px] bg-white focus:outline-none focus:border-slate-400 transition-all font-sans"
              />
            </div>

            {/* Dropdowns */}
            <div className="flex items-center space-x-2">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:block" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="border border-slate-200 rounded text-[11px] px-2 py-1 bg-white focus:outline-none focus:border-slate-400 font-semibold transition-colors cursor-pointer"
              >
                <option value="Semua">Semua Keputusan</option>
                <option value="Pending">Menunggu Approval</option>
                <option value="Disetujui">Telah Disetujui</option>
                <option value="Ditolak">Ditolak</option>
              </select>
            </div>
          </div>

          {/* Leave Application History Table */}
          <div className="card-container flex-1 min-h-[300px]">
            {filteredLeaves.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center h-full">
                <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                  <Calendar className="w-5 h-5" />
                </div>
                <p className="mt-2 text-[11px] font-bold text-slate-800">
                  Tidak ada pengajuan ditemukan
                </p>
              </div>
            ) : (
              <div className="flex-1 overflow-auto">
                <table className="high-density-table whitespace-nowrap">
                  <thead>
                    <tr>
                      <th className="text-left font-normal text-[11px]">
                        No Induk
                      </th>
                      <th className="text-left font-normal text-[11px]">
                        Nama Karyawan
                      </th>
                      <th className="text-left w-32 font-normal text-[11px]">
                        Jenis Cuti
                      </th>
                      <th className="text-left w-40 font-normal text-[11px]">
                        Tanggal
                      </th>
                      <th className="text-left font-normal text-[11px]">
                        Durasi
                      </th>
                      <th className="text-left font-normal text-[11px]">
                        Alasan
                      </th>
                      <th className="text-left w-24 font-normal text-[11px]">
                        Status
                      </th>
                      <th className="text-right font-normal text-[11px]">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeaves.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/50">
                        <td className="font-mono font-normal text-[11px] text-slate-800">
                          {req.staffId}
                        </td>
                        <td className="font-normal text-[11px] text-slate-800">
                          {req.staffName}
                        </td>
                        <td className="font-normal text-[11px] text-slate-800 capitalize">
                          {req.leaveType}
                        </td>
                        <td className="font-normal text-[11px] text-slate-800 font-mono whitespace-nowrap">
                          {req.startDate} s/d {req.endDate}
                        </td>
                        <td className="font-normal text-[11px] text-slate-800 font-mono">
                          {req.durationDays} Hr
                        </td>
                        <td className="font-normal text-[11px] text-slate-800 italic whitespace-normal max-w-md">
                          "{req.reason}"
                        </td>
                        <td className="font-normal text-[11px] text-slate-800 capitalize">
                          {req.status}
                        </td>
                        <td className="text-right relative">
                          {req.status === "Pending" ? (
                            <div className="inline-flex space-x-2">
                              <button
                                onClick={() => onRejectLeave(req.id)}
                                className="flex-1 bg-white hover:bg-rose-50 text-rose-600 font-semibold text-[11px] px-3 py-1 border border-rose-200 rounded-md transition-all shadow-sm flex items-center justify-center space-x-1 uppercase"
                              >
                                <XCircle className="w-3 h-3" />
                                <span>Tolak</span>
                              </button>
                              <button
                                onClick={() => onApproveLeave(req.id)}
                                className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold text-[11px] px-3 py-1 rounded-md shadow-sm transition-all flex items-center justify-center space-x-1 uppercase"
                              >
                                <CheckCircle className="w-3 h-3" />
                                <span>Setujui</span>
                              </button>
                            </div>
                          ) : (
                            <div
                              className={`mt-1 text-left px-2.5 py-2 rounded-lg text-[10px] w-56 ${req.status === "Disetujui" ? "bg-emerald-50/80 text-emerald-800 border border-emerald-100" : "bg-rose-50/80 text-rose-800 border border-rose-100"}`}
                            >
                              <span className="font-bold flex items-center space-x-1 mb-1">
                                {req.status === "Disetujui" ? (
                                  <CheckCircle className="w-3 h-3" />
                                ) : (
                                  <XCircle className="w-3 h-3" />
                                )}
                                <span>Catatan Atasan</span>
                              </span>
                              <span className="italic opacity-90 block leading-tight">
                                {req.status === "Disetujui"
                                  ? "Permohonan cuti disetujui, harap selesaikan serah terima tugas jika diperlukan."
                                  : "Permohonan cuti tidak dapat disetujui saat ini, karena kebutuhan operasional."}
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="card-container flex-1 min-h-[300px]">
            <div className="flex-1 overflow-auto">
              <table className="high-density-table whitespace-nowrap">
                <thead>
                  <tr>
                    <th className="text-left font-normal text-[11px]">
                      No Induk
                    </th>
                    <th className="text-left font-normal text-[11px]">
                      Nama Karyawan
                    </th>
                    <th className="text-center font-normal text-[11px]">
                      Hak Cuti Tahunan
                    </th>
                    <th className="text-center font-normal text-[11px]">
                      Hak Cuti Khusus
                    </th>
                    <th className="text-center font-normal text-[11px]">
                      Jml Cuti Tahunan
                    </th>
                    <th className="text-center font-normal text-[11px]">
                      Sdh Diambil (Tahunan)
                    </th>
                    <th className="text-center font-normal text-[11px]">
                      Sisa (Tahunan)
                    </th>
                    <th className="text-center font-normal text-[11px]">
                      Riwayat Pengambilan Cuti
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((member) => {
                    const approvedLeaves = leaves.filter(
                      (l) =>
                        l.staffId === member.id && l.status === "Disetujui",
                    );
                    const historyCount = leaves.filter(
                      (l) => l.staffId === member.id,
                    ).length;
                    return (
                      <tr key={member.id} className="hover:bg-slate-50/50">
                        <td className="font-mono font-normal text-[11px] text-slate-800">
                          {member.id}
                        </td>
                        <td className="font-normal text-[11px] text-slate-800">
                          {member.name}
                        </td>
                        <td className="text-center font-mono font-normal text-[11px] text-slate-800">
                          12 Hari
                        </td>
                        <td className="text-center font-mono font-normal text-[11px] text-slate-800">
                          {member.specialLeaveBalance !== undefined
                            ? member.specialLeaveBalance
                            : 12}{" "}
                          Hari
                        </td>
                        <td className="text-center font-mono font-normal text-[11px] text-slate-800">
                          12 Hari
                        </td>
                        <td className="text-center font-mono font-normal text-[11px] text-slate-600">
                          {12 - member.leaveBalance} Hari
                        </td>
                        <td className="text-center font-mono font-normal text-[11px] text-emerald-600">
                          {member.leaveBalance} Hari
                        </td>
                        <td className="text-center font-mono font-normal text-[11px] text-slate-800">
                          {historyCount} Pengajuan ({approvedLeaves.length}{" "}
                          Disetujui)
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal: Form Pengajuan Baru */}
      {isSubmitOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-md">
                Formulir Pengajuan Cuti Baru
              </h3>
              <button
                onClick={() => setIsSubmitOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {staff.length === 0 ? (
              <div className="p-6 text-center space-y-3">
                <AlertOctagon className="w-10 h-10 text-rose-500 mx-auto" />
                <p className="text-sm font-semibold text-slate-900">
                  Direktori Staf Kosong
                </p>
                <p className="text-xs text-slate-400">
                  Anda harus mendaftarkan staf minimal satu orang pada tab
                  "Profil Staf" sebelum mengisi formulir cuti.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Staff Dropdown selector */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Pilih Anggota Staf / Karyawan
                  </label>
                  <select
                    required
                    value={formData.staffId}
                    onChange={(e) =>
                      setFormData({ ...formData, staffId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all cursor-pointer font-sans"
                  >
                    {staff.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} (Sisa Kuota: {member.leaveBalance} Hari)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Leave Type Selector */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Jenis Cuti
                  </label>
                  <select
                    value={formData.leaveType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        leaveType: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-sans cursor-pointer"
                  >
                    <option value="Cuti Tahunan">
                      Cuti Tahunan (Mengurangi Kuota)
                    </option>
                    <option value="Sakit">Sakit (Kondisi Kesehatan)</option>
                    <option value="Izin Khusus">
                      Izin Khusus (Ibadah, Duka, dll.)
                    </option>
                    <option value="Cuti Melahirkan">Cuti Melahirkan</option>
                  </select>
                </div>

                {/* Calendar Date range */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      Tanggal Mulai Cuti
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData({ ...formData, startDate: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      Tanggal Berakhir Cuti
                    </label>
                    <input
                      type="date"
                      required
                      min={formData.startDate}
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData({ ...formData, endDate: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Estimated duration counter display */}
                <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between text-xs border border-slate-100">
                  <span className="text-slate-500 font-medium">
                    Perkiraan Lama Pengajuan:
                  </span>
                  <strong className="text-slate-900 font-mono text-sm">
                    {calculateDays(formData.startDate, formData.endDate)} Hari
                    Kerja
                  </strong>
                </div>

                {/* Reason Details */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 font-sans">
                    Alasan / Penjelasan Absensi
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Tulis alasan rinci pengajuan cuti demi mempermudah persetujuan..."
                    value={formData.reason}
                    onChange={(e) =>
                      setFormData({ ...formData, reason: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-sans"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsSubmitOpen(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-500 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 hover:shadow-sm transition-all"
                  >
                    Kirim Pengajuan
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
