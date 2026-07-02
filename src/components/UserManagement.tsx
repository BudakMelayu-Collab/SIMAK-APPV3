import React, { useState, useMemo } from "react";
import {
  ShieldAlert,
  UserCog,
  UserCheck,
  X,
  Search,
  Trash2,
  Power,
  Filter,
} from "lucide-react";
import { StaffProfile, LeaveRequest } from "../types";

interface UserManagementProps {
  staff: StaffProfile[];
  leaves: LeaveRequest[];
  currentUserRole: string;
  onUpdateRole: (staffId: string, newRole: string, newJabatan?: string) => void;
  onUpdateStatus: (staffId: string, newStatus: string) => void;
  onUpdatePermissions: (staffId: string, permissions: string[]) => void;
  onDeleteStaff: (staffId: string) => void;
}

export default function UserManagement({
  staff,
  leaves,
  currentUserRole,
  onUpdateRole,
  onUpdateStatus,
  onUpdatePermissions,
  onDeleteStaff,
}: UserManagementProps) {
  const [selectedStaff, setSelectedStaff] = useState<StaffProfile | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<
    "role" | "permissions" | "audit"
  >("role");

  const [newRole, setNewRole] = useState<string>("");
  const [newJabatan, setNewJabatan] = useState<string>("");
  const [newPermissions, setNewPermissions] = useState<string[]>([]);
  const [userToDelete, setUserToDelete] = useState<StaffProfile | null>(null);
  const [userToChangeStatus, setUserToChangeStatus] = useState<{user: StaffProfile, newStatus: string} | null>(null);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("Semua");

  const isSuperAdmin = currentUserRole === "Super Admin";
  const hasAccess = isSuperAdmin || currentUserRole === "Admin SDM dan Umum 1" || currentUserRole === "Admin SDM dan Umum 2";

  const modalPeran = [
    "Admin SDM dan Umum 1",
    "Admin SDM dan Umum 2",
    "Staf SDM dan Umum",
    "Staf Pendistribusian",
    "Staf Pengumpulan",
    "Staf Keuangan",
    "Kepala Pelaksana",
    "Kepala Bidang Pendistribusian",
    "Kepala Bagian Keuangan",
    "Kepala Bagian Pengumpulan",
    "Kepala Sub Bidang Pendayagunaan",
  ];

  const modalRoles = [
    "Kepala Pelaksana",
    "Kepala Bidang",
    "Kepala Bagian",
    "Kepala Sub Bidang",
    "Staf",
  ];

  const ALL_PERMISSIONS = [
    { id: "dashboard", label: "Beranda" },
    { id: "inventory", label: "Inventaris" },
    { id: "staff", label: "Profil & Staf" },
    { id: "leave", label: "Kontrol Cuti" },
    { id: "archive", label: "Arsip Dokumen" },
  ];

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <ShieldAlert className="w-16 h-16 text-rose-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800">Akses Ditolak</h2>
        <p className="text-slate-500 mt-2">
          Hanya Administrator yang dapat mengakses halaman ini.
        </p>
      </div>
    );
  }

  const handleSaveRole = () => {
    if (selectedStaff && newRole) {
      onUpdateRole(selectedStaff.id, newRole, newJabatan);
      setSelectedStaff(null);
    }
  };

  const rolesList = useMemo(() => {
    const roles = new Set(staff.filter((s) => s.role !== "Super Admin").map((s) => s.role));
    return ["Semua", ...Array.from(roles)];
  }, [staff]);

  const filteredStaff = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const computedStaff = staff.map((member) => {
      if (member.status === "Nonaktif") return member;
      const isCurrentlyOnLeave = leaves.some(
        (l) =>
          l.staffId === member.id &&
          l.status === "Disetujui" &&
          l.startDate <= today &&
          l.endDate >= today
      );
      return { ...member, status: isCurrentlyOnLeave ? "Cuti" : "Aktif" };
    });

    return computedStaff.filter((member) => {
      if (member.role === "Super Admin") return false;
      const matchesSearch =
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = filterRole === "Semua" || member.role === filterRole;
      return matchesSearch && matchesRole;
    });
  }, [staff, leaves, searchTerm, filterRole]);

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Manajemen Akses User
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Kelola peran, status, dan hak akses staf di dalam sistem.
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama atau email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
          />
        </div>
        <div className="relative min-w-[200px]">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none"
          >
            {rolesList.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex-1">
        <div className="overflow-x-auto h-full">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4">Nama User</th>
                <th className="px-6 py-4">Jabatan / Peran</th>
                <th className="px-6 py-4">Status Akses</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStaff.length > 0 ? (
                filteredStaff.map((member) => (
                  <tr
                    key={member.id}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="font-normal text-slate-900">
                        {member.name}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {member.email || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <span className="text-xs text-slate-600 font-semibold bg-slate-100 px-2 py-0.5 rounded">
                          {member.jabatan || "Staf"}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded-md">
                          {member.role || "Staf"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-700">
                        {member.status}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => {
                            const newStatus =
                              member.status === "Aktif" ? "Nonaktif" : "Aktif";
                            setUserToChangeStatus({ user: member, newStatus });
                          }}
                          disabled={member.role === "Super Admin"}
                          className={`p-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                            member.status === "Aktif"
                              ? "text-amber-600 hover:bg-amber-50"
                              : "text-emerald-600 hover:bg-emerald-50"
                          }`}
                          title={
                            member.status === "Aktif"
                              ? "Nonaktifkan User"
                              : "Aktifkan User"
                          }
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedStaff(member);
                            setNewRole(member.role || "");
                            setNewJabatan(member.jabatan || "Staf");
                            setNewPermissions(
                              member.permissions ||
                                ALL_PERMISSIONS.map((p) => p.id),
                            );
                            setActiveModalTab("role");
                          }}
                          disabled={member.role === "Super Admin"}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Kelola Akses & Info"
                        >
                          <UserCog className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setUserToDelete(member);
                          }}
                          disabled={member.role === "Super Admin"}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Hapus User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    Tidak ada staf yang sesuai dengan pencarian Anda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-xl overflow-hidden border border-slate-100 flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {selectedStaff.name}
                </h3>
                <p className="text-sm text-slate-500">
                  {selectedStaff.email || "Tanpa Email"}
                </p>
              </div>
              <button
                onClick={() => setSelectedStaff(null)}
                className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex border-b border-slate-200">
              <button
                className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${activeModalTab === "role" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}
                onClick={() => setActiveModalTab("role")}
              >
                Informasi & Role
              </button>
              <button
                className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${activeModalTab === "permissions" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}
                onClick={() => setActiveModalTab("permissions")}
              >
                Hak Akses Spesifik
              </button>
              <button
                className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${activeModalTab === "audit" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}
                onClick={() => setActiveModalTab("audit")}
              >
                Log Aktivitas
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {activeModalTab === "role" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                      Peran Sistem (Akses Level)
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                    >
                      {modalPeran.map((roleOpt) => (
                        <option key={roleOpt} value={roleOpt}>
                          {roleOpt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                      Jabatan Struktur
                    </label>
                    <select
                      value={newJabatan}
                      onChange={(e) => setNewJabatan(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                    >
                      {modalRoles.map((roleOpt) => (
                        <option key={roleOpt} value={roleOpt}>
                          {roleOpt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {activeModalTab === "permissions" && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-500 mb-4">
                    Centang menu yang dapat diakses oleh user ini. Pengaturan
                    ini akan mengabaikan akses bawaan dari role yang
                    dimilikinya.
                  </p>
                  <div className="space-y-3">
                    {ALL_PERMISSIONS.map((perm) => {
                      const isChecked = newPermissions.includes(perm.id);
                      return (
                        <label
                          key={perm.id}
                          className="flex items-center space-x-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewPermissions((prev) => [...prev, perm.id]);
                              } else {
                                setNewPermissions((prev) =>
                                  prev.filter((p) => p !== perm.id),
                                );
                              }
                            }}
                            className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                          />
                          <span className="text-sm font-semibold text-slate-700">
                            {perm.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeModalTab === "audit" && (
                <div className="space-y-6">
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">
                        Login Terakhir
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Waktu terakhir pengguna mengakses sistem SIMAK
                      </p>
                    </div>
                    <div className="text-sm font-bold text-indigo-600">
                      {selectedStaff.lastLogin
                        ? new Date(selectedStaff.lastLogin).toLocaleString(
                            "id-ID",
                            { dateStyle: "full", timeStyle: "short" },
                          )
                        : "Belum pernah login"}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-800 mb-4">
                      Riwayat Perubahan Data
                    </h4>
                    {!selectedStaff.activityLog ||
                    selectedStaff.activityLog.length === 0 ? (
                      <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        Belum ada riwayat aktivitas yang tercatat.
                      </div>
                    ) : (
                      <div className="relative border-l-2 border-slate-100 ml-3 space-y-6">
                        {selectedStaff.activityLog.map((log) => (
                          <div key={log.id} className="relative pl-6">
                            <div className="absolute w-3 h-3 bg-indigo-500 rounded-full -left-[7px] top-1.5 ring-4 ring-white" />
                            <div className="text-xs text-slate-400 font-medium mb-1">
                              {new Date(log.date).toLocaleString("id-ID", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })}
                            </div>
                            <div className="text-sm font-bold text-slate-800">
                              {log.action}
                            </div>
                            {log.details && (
                              <div className="text-sm text-slate-500 mt-1">
                                {log.details}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end space-x-3 bg-slate-50/50 mt-auto">
              <button
                onClick={() => setSelectedStaff(null)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Tutup
              </button>
              {activeModalTab !== "audit" && (
                <button
                  onClick={() => {
                    if (activeModalTab === "role") handleSaveRole();
                    if (activeModalTab === "permissions") {
                      onUpdatePermissions(selectedStaff.id, newPermissions);
                      setSelectedStaff(null);
                    }
                  }}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold shadow-md hover:bg-indigo-700 hover:shadow-lg transition-all flex items-center space-x-2"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {userToChangeStatus && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-100 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-6 flex flex-col space-y-4">
            <h3 className="font-bold text-slate-800 text-lg">Konfirmasi Status</h3>
            <p className="text-sm text-slate-600">
              Yakin ingin mengubah status {userToChangeStatus.user.name} menjadi {userToChangeStatus.newStatus}?
            </p>
            <div className="flex items-center justify-end space-x-3 pt-4">
              <button
                onClick={() => setUserToChangeStatus(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg text-sm hover:bg-slate-200 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onUpdateStatus(userToChangeStatus.user.id, userToChangeStatus.newStatus);
                  setUserToChangeStatus(null);
                }}
                className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg text-sm hover:bg-indigo-700 transition-colors"
              >
                Ya, Ubah
              </button>
            </div>
          </div>
        </div>
      )}

      {userToDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-100 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-6 flex flex-col space-y-4">
            <h3 className="font-bold text-slate-800 text-lg">Konfirmasi Hapus</h3>
            <p className="text-sm text-slate-600">
              Apakah Anda yakin ingin menghapus akses untuk {userToDelete.name}? Data akan dihapus dari sistem.
            </p>
            <div className="flex items-center justify-end space-x-3 pt-4">
              <button
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg text-sm hover:bg-slate-200 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onDeleteStaff(userToDelete.id);
                  setUserToDelete(null);
                }}
                className="px-4 py-2 bg-rose-600 text-white font-semibold rounded-lg text-sm hover:bg-rose-700 transition-colors"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
