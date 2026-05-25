import React, { useState } from "react";
import { LeaveRequest, StaffProfile } from "../types";
import {
  Calendar,
  Plus,
  CheckCircle,
  CheckSquare,
  XCircle,
  X,
  AlertOctagon,
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
  const [selectedStatus, setSelectedStatus] = useState("Semua");
  const [notes, setNotes] = useState<Record<string, string>>({});

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
  const totalOnLeave = staff.filter((s) => s.status === "Cuti").length;
  const totalPending = leaves.filter((l) => l.status === "Pending").length;

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
    const matchesStatus =
      selectedStatus === "Semua" || req.status === selectedStatus;
    return matchesStatus;
  });

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Grid Dashboard Widget Khusus Cuti */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#FFF9EA] border border-amber-100 rounded-xl p-5 flex items-start space-x-4">
          <div className="p-3 bg-white border border-amber-200 rounded-xl text-amber-500 shadow-sm shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              SEDANG MENGAMBIL CUTI
            </h3>
            <div className="flex items-baseline space-x-1 mt-1">
              <span className="text-2xl font-extrabold text-amber-700">
                {totalOnLeave}
              </span>
              <span className="text-amber-700 font-bold text-sm">Staff</span>
            </div>
            <p className="text-[11px] text-amber-600 mt-1">
              Berdasarkan status keaktifan live
            </p>
          </div>
        </div>

        <div className="bg-[#F0F5FF] border border-blue-100 rounded-xl p-5 flex items-start space-x-4">
          <div className="p-3 bg-white border border-blue-200 rounded-xl text-blue-500 shadow-sm shrink-0">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              MENUNGGU VERIFIKASI HR
            </h3>
            <div className="flex items-baseline space-x-1 mt-1">
              <span className="text-2xl font-extrabold text-blue-800">
                {totalPending}
              </span>
              <span className="text-blue-800 font-bold text-sm">Berkas</span>
            </div>
            <p className="text-[11px] text-blue-600 mt-1">
              Membutuhkan persetujuan administrasi
            </p>
          </div>
        </div>

        <div className="bg-[#F0FDF4] border border-emerald-100 rounded-xl p-5 flex items-start space-x-4">
          <div className="p-3 bg-white border border-emerald-200 rounded-xl text-emerald-500 shadow-sm shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              RASIO REKOR KEHADIRAN
            </h3>
            <div className="flex items-baseline space-x-1 mt-1">
              <span className="text-2xl font-extrabold text-emerald-700">
                94.8%
              </span>
            </div>
            <p className="text-[11px] text-emerald-600 mt-1">
              Rata-rata tahun anggaran berjalan
            </p>
          </div>
        </div>
      </div>

      {/* Tabs and Actions */}
      <div className="bg-white border text-sm font-semibold border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-sm">
        <div className="flex bg-slate-50 border border-slate-100 rounded-lg p-1 space-x-1">
          {["Semua", "Pending", "Disetujui", "Ditolak"].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-4 py-2 text-[13px] rounded-md transition-all ${
                selectedStatus === status
                  ? "bg-white text-slate-800 shadow-sm border border-slate-200 font-bold"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {status === "Semua" ? "Semua Berkas" : status}
            </button>
          ))}
        </div>

        <button
          onClick={handleOpenRequest}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[13px] px-4 py-2 rounded-lg shadow-sm transition-all flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Ajukan Cuti Mandiri</span>
        </button>
      </div>

      {/* Leave Application History Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
        {filteredLeaves.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center h-full min-h-[300px]">
            <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
              <Calendar className="w-5 h-5" />
            </div>
            <p className="mt-2 text-[13px] font-bold text-slate-800">
              Tidak ada pengajuan ditemukan
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto">
            <table className="w-full whitespace-nowrap min-w-max text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="font-bold text-[11px] text-slate-500 uppercase tracking-wide px-5 py-4 w-64 text-left border-r border-slate-200">
                    NAMA STAF DAN DIVISI
                  </th>
                  <th className="font-bold text-[11px] text-slate-500 uppercase tracking-wide px-5 py-4 w-40 text-center">
                    HAK CUTI TAHUNAN
                  </th>
                  <th className="font-bold text-[11px] text-slate-500 uppercase tracking-wide px-5 py-4 w-40 text-center">
                    HAK CUTI KHUSUS
                  </th>
                  <th className="font-bold text-[11px] text-slate-500 uppercase tracking-wide px-5 py-4 w-44 text-center">
                    JUMLAH CUTI TAHUNAN
                  </th>
                  <th className="font-bold text-[11px] text-slate-500 uppercase tracking-wide px-5 py-4 w-64 text-center border-r border-slate-200">
                    JUMLAH CUTI TAHUNAN YANG SUDAH DI AMBIL
                  </th>
                  <th className="font-bold text-[11px] text-slate-500 uppercase tracking-wide px-5 py-4 w-40 text-center border-r border-slate-200">
                    SISA CUTI TAHUNAN
                  </th>
                  <th className="font-bold text-[11px] text-slate-500 uppercase tracking-wide px-5 py-4 w-40">
                    JENIS CUTI
                  </th>
                  <th className="font-bold text-[11px] text-slate-500 uppercase tracking-wide px-5 py-4 min-w-[200px]">
                    PERIODE TANGGAL (DURASI)
                  </th>
                  <th className="font-bold text-[11px] text-slate-500 uppercase tracking-wide px-5 py-4 min-w-[150px]">
                    ALASAN PENGAJUAN
                  </th>
                  <th className="font-bold text-[11px] text-slate-500 uppercase tracking-wide px-5 py-4 w-32 text-center">
                    STATUS BERKAS
                  </th>
                  <th className="font-bold text-[11px] text-slate-500 uppercase tracking-wide px-5 py-4 w-64">
                    Persetujuan dan Catatan SAU
                  </th>
                  <th className="font-bold text-[11px] text-slate-500 uppercase tracking-wide px-5 py-4 w-64">
                    RIWAYAT PENGAMBILAN CUTI TAHUNAN
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeaves.map((req) => {
                  const member = staff.find((s) => s.id === req.staffId);
                  const hakKhusus =
                    member?.specialLeaveBalance !== undefined
                      ? member.specialLeaveBalance
                      : 12;
                  const hakTahunan = 12;
                  const sisaTahunan = member?.leaveBalance ?? 12;
                  const sudahDiambil = hakTahunan - sisaTahunan;

                  return (
                    <tr
                      key={req.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-5 py-4 border-r border-slate-200">
                        <div className="flex items-center space-x-3">
                          {member?.avatarUrl ? (
                            <img
                              src={member.avatarUrl}
                              alt={member.name}
                              className="w-10 h-10 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0 border border-indigo-100">
                              {(req.staffName || "??")
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .substring(0, 2)
                                .toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="font-bold text-[13px] text-slate-800 truncate">
                              {req.staffName}
                            </h4>
                            <p className="text-[11px] text-[#6D42F8] font-bold mt-0.5">
                              {member?.department || "-"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center font-bold text-slate-700 text-[13px]">
                        {hakTahunan} Hari
                      </td>
                      <td className="px-5 py-4 text-center font-medium text-slate-500 text-[13px]">
                        {req.leaveType === "Sakit"
                          ? "Sakit (Kondisi Kesehatan)"
                          : "Sakit/Khusus (SOP)"}
                      </td>
                      <td className="px-5 py-4 text-center font-bold text-slate-700 text-[13px]">
                        {hakTahunan} Hari
                      </td>
                      <td className="px-5 py-4 text-center font-bold text-slate-700 text-[13px] border-r border-slate-200">
                        {sudahDiambil} Hari
                      </td>
                      <td className="px-5 py-4 text-center font-bold text-blue-600 text-[13px] border-r border-slate-200">
                        {sisaTahunan} Hari
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-700 text-[13px]">
                        {req.leaveType}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-700 text-[13px]">
                          {req.startDate} s/d {req.endDate}
                        </p>
                        <span className="inline-block px-2 py-0.5 mt-1 bg-slate-100 text-slate-500 rounded font-bold text-[10px]">
                          {req.durationDays} Hari Kerja
                        </span>
                      </td>
                      <td className="px-5 py-4 font-medium text-slate-500 text-[13px]">
                        {req.reason}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-block px-3 py-1 text-[11px] font-bold rounded-full border ${
                            req.status === "Pending"
                              ? "bg-orange-50 text-orange-600 border-orange-100"
                              : req.status === "Disetujui"
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                : "bg-rose-50 text-rose-600 border-rose-100"
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {req.status === "Pending" ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={notes[req.id] || ""}
                              onChange={(e) =>
                                setNotes({ ...notes, [req.id]: e.target.value })
                              }
                              placeholder="Tambah catatan/jawaban SAU..."
                              className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded text-slate-600 bg-white"
                            />
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => onApproveLeave(req.id)}
                                className="bg-[#059669] hover:bg-emerald-700 text-white font-bold text-[11px] px-3 py-1.5 rounded"
                              >
                                Setujui
                              </button>
                              <button
                                onClick={() => onRejectLeave(req.id)}
                                className="bg-[#E11D48] hover:bg-rose-700 text-white font-bold text-[11px] px-3 py-1.5 rounded"
                              >
                                Tolak
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400 italic">
                            {req.status === "Disetujui"
                              ? "Telah Disetujui"
                              : "Ditolak"}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4 font-medium text-slate-400 italic text-[11px]">
                        Belum ada riwayat cuti disetujui
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
                {/* Form fields identical to before... */}
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
                        {member.name} (Sisa Kuota: {member.leaveBalance ?? 12}{" "}
                        Hari)
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
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 hover:shadow-sm transition-all"
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
