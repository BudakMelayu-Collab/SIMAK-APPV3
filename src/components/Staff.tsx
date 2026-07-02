import React, { useState } from "react";
import { StaffProfile, InventoryItem, LeaveRequest } from "../types";
import { supabase } from "../supabase";
import Swal from "sweetalert2";
import {
  Plus,
  Search,
  Filter,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  ChevronRight,
  X,
  ShieldAlert,
  Edit2,
  Trash2,
  Award,
  User,
  Upload,
} from "lucide-react";

interface StaffProps {
  staff: StaffProfile[];
  inventory: InventoryItem[];
  leaves: LeaveRequest[];
  onAddStaff: (profile: Omit<StaffProfile, "id">) => void;
  onUpdateStaff: (profile: StaffProfile) => void;
  onDeleteStaff: (id: string) => void;
  currentUserEmail?: string;
  currentUserRole?: string;
}

export default function Staff({
  staff,
  inventory,
  leaves,
  onAddStaff,
  onUpdateStaff,
  onDeleteStaff,
  currentUserEmail = "",
  currentUserRole = "Staf",
}: StaffProps) {
  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("Semua Bidang");
  const [selectedStatus, setSelectedStatus] = useState("Semua");

  // Modal control States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Form & Selection states
  const [currentStaff, setCurrentStaff] = useState<StaffProfile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: "",
    name: "",
    birthPlaceAndDate: "",
    address: "",
    education: "",
    trainingHistory: "",
    role: "Staf",
    jabatan: "Staf",
    department: "SDM dan Umum",
    email: "",
    phone: "",
    status: "Aktif" as const,
    joinDate: new Date().toISOString().split("T")[0],
    leaveBalance: 12,
    specialLeaveBalance: 12,
    avatarUrl: "",
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    Swal.fire({
      toast: true,
      position: "bottom-end",
      title: "Mengunggah Foto...",
      html: "Menyiapkan pengunggahan foto...",
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const fileExt = file.name.split(".").pop() || "";
      const fileName = `AVATAR-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Create documents bucket if it doesn't exist
      try {
        await supabase.storage.createBucket("documents", { public: true });
      } catch (err) {}

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("documents").getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      setFormData((prev) => ({ ...prev, avatarUrl: publicUrl }));

      Swal.fire({
        toast: true,
        position: "bottom-end",
        icon: "success",
        title: "Foto berhasil diunggah",
        text: "Foto profil telah diperbarui.",
        timer: 3000,
        showConfirmButton: false,
      });
    } catch (error: any) {
      console.warn("Gagal mengunggah ke Supabase, menggunakan Base64 lokal:", error);

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData((prev) => ({ ...prev, avatarUrl: base64String }));

        Swal.fire({
          toast: true,
          position: "bottom-end",
          icon: "success",
          title: "Foto berhasil dimuat",
          text: "Foto profil lokal telah dimuat.",
          timer: 3000,
          showConfirmButton: false,
        });
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
    }
  };

  // Department/Bidang choices
  const departments = [
    "Semua Bidang",
    "Kepala Pelaksana",
    "SDM dan Umum",
    "Pengumpulan",
    "Pendistribusian",
    "Pendayagunaan",
    "Keuangan",
  ];
  const formDepartments = [
    "Kepala Pelaksana",
    "SDM dan Umum",
    "Pengumpulan",
    "Pendistribusian",
    "Pendayagunaan",
    "Keuangan",
  ];
  const formRoles = [
    "Kepala Pelaksana",
    "Kepala Bidang",
    "Kepala Bagian",
    "Kepala Sub Bidang",
    "Staf",
  ];
  const formPeran = [
    "Super Admin",
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

  const isSystemAdmin =
    currentUserRole === "Admin SDM dan Umum 1" ||
    currentUserRole === "Admin SDM dan Umum 2" ||
    currentUserRole === "Super Admin";

  const today = new Date().toISOString().split("T")[0];
  const computedStaff: StaffProfile[] = staff.map((member) => {
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

  // Filter staff Profiles
  const filteredStaff = computedStaff.filter((member) => {
    // Sembunyikan Super Admin
    if (member.role === "Super Admin") return false;

    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept =
      selectedDept === "Semua Bidang" || member.department === selectedDept;
    const matchesStatus =
      selectedStatus === "Semua" || member.status === selectedStatus;

    return matchesSearch && matchesDept && matchesStatus;
  });

  const handleOpenAdd = () => {
    setFormData({
      employeeId: "",
      name: "",
      birthPlaceAndDate: "",
      address: "",
      education: "",
      trainingHistory: "",
      role: "Staf SDM dan Umum",
      jabatan: "Staf",
      department: "SDM dan Umum",
      email: "",
      phone: "",
      status: "Aktif",
      joinDate: new Date().toISOString().split("T")[0],
      leaveBalance: 12,
      specialLeaveBalance: 12,
      avatarUrl: "",
    });
    setIsAddOpen(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;
    onAddStaff(formData);
    setIsAddOpen(false);
    Swal.fire({
      toast: true,
      position: "bottom-end",
      icon: "success",
      title: "Berhasil didaftarkan",
      text: "Staf baru berhasil didaftarkan.",
      timer: 3000,
      showConfirmButton: false,
    });
  };

  const handleOpenEdit = (member: StaffProfile, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering card details modal
    setCurrentStaff(member);
    
    let defaultJabatan = "Staf";
    const rawRole = member.role || "Staf";
    if (rawRole === "Kepala Pelaksana") {
      defaultJabatan = "Kepala Pelaksana";
    } else if (rawRole.startsWith("Kepala Bidang")) {
      defaultJabatan = "Kepala Bidang";
    } else if (rawRole.startsWith("Kepala Bagian")) {
      defaultJabatan = "Kepala Bagian";
    } else if (rawRole.startsWith("Kepala Sub Bidang")) {
      defaultJabatan = "Kepala Sub Bidang";
    }

    setFormData({
      employeeId: member.employeeId || "",
      name: member.name || "",
      birthPlaceAndDate: member.birthPlaceAndDate || "",
      address: member.address || "",
      education: member.education || "",
      trainingHistory: member.trainingHistory || "",
      role: member.role || "Staf",
      jabatan: member.jabatan || defaultJabatan,
      department: member.department || "SDM dan Umum",
      email: member.email || "",
      phone: member.phone || "",
      status: member.status || "Aktif",
      joinDate: member.joinDate || "",
      leaveBalance: member.leaveBalance || 0,
      specialLeaveBalance: member.specialLeaveBalance || 0,
      avatarUrl: member.avatarUrl || "",
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStaff || !formData.name) return;
    onUpdateStaff({
      ...currentStaff,
      ...formData,
    });
    setIsEditOpen(false);
    Swal.fire({
      toast: true,
      position: "bottom-end",
      icon: "success",
      title: "Berhasil diperbarui",
      text: "Data profil staf berhasil diperbarui.",
      timer: 3000,
      showConfirmButton: false,
    });
  };

  const handleConfirmDelete = (member: StaffProfile) => {
    Swal.fire({
      title: "Konfirmasi Hapus",
      text: `Apakah Anda yakin ingin menghapus profil staf ${member.name}? Tindakan ini tidak dapat dibatalkan.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    }).then((result) => {
      if (result.isConfirmed) {
        onDeleteStaff(member.id);
        Swal.fire({
          toast: true,
          position: "bottom-end",
          icon: "success",
          title: "Berhasil dihapus",
          text: "Data staf berhasil dihapus dari sistem.",
          timer: 3000,
          showConfirmButton: false,
        });
      }
    });
  };

  const handleOpenDetails = (member: StaffProfile) => {
    setCurrentStaff(member);
    setIsDetailOpen(true);
  };

  // Helper: Retrieve items assigned to this staff member
  const getAssignedItems = (staffId: string) => {
    return inventory.filter((item) => item.assignedToId === staffId);
  };

  // Helper: Retrieve approved leave logs for this staff member
  const getStaffLeaves = (staffId: string) => {
    return leaves.filter((l) => l.staffId === staffId);
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header section with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Profil & Staf
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Relevansi tim kerja, status pegawai, kepemilikan inventaris, dan
            tabungan sisa hak cuti.
          </p>
        </div>

        {isSystemAdmin && (
          <button
            onClick={handleOpenAdd}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg inline-flex items-center space-x-2 transition-all transition-transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Staf</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar Section */}
      <div className="card-container p-4 flex flex-col md:flex-row gap-4 mt-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari staf..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-sans"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex gap-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="border border-slate-200 rounded-xl text-sm px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium transition-colors cursor-pointer"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-slate-200 rounded-xl text-sm px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium transition-colors cursor-pointer"
            >
              <option value="Semua">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Cuti">Sedang Cuti</option>
              <option value="Nonaktif">Nonaktif</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Staff grid View */}
      <div className="flex-1 overflow-auto">
        {filteredStaff.length === 0 ? (
          <div className="card-container p-8 text-center flex flex-col items-center justify-center h-full">
            <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <p className="mt-2 text-[11px] font-bold text-slate-800">
              Tidak ada staf ditemukan
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {filteredStaff.map((member) => {
              const assignedItems = getAssignedItems(member.id);
              return (
                <div
                  key={member.id}
                  onClick={() => handleOpenDetails(member)}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition-all hover:shadow-md h-full relative font-sans flex flex-col cursor-pointer"
                >
                  {/* Top strip */}
                  <div className="h-4 bg-[#0CA1EB] w-full shrink-0"></div>

                  <div className="p-6 flex flex-col h-full flex-grow">
                    {/* Header: Avatar, Name, Role, Actions */}
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex space-x-4">
                        {/* Avatar */}
                        <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 shadow-sm border border-slate-200">
                          {member.avatarUrl ? (
                            <img
                              src={member.avatarUrl}
                              alt={member.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-black text-xl uppercase">
                              {member.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .substring(0, 2)}
                            </div>
                          )}
                        </div>
                        <div>
                          {/* Status badge */}
                          <span
                            className={`text-[10px] font-bold uppercase py-1 px-2 rounded font-sans inline-block mb-1 ${
                              member.status === "Aktif"
                                ? "bg-[#E5F7ED] text-[#059669]"
                                : member.status === "Cuti"
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {member.status}
                          </span>
                          <h3 className="font-bold text-slate-800 text-lg leading-tight line-clamp-2">
                            {member.name}
                          </h3>
                          <div className="flex flex-wrap gap-x-2 gap-y-1 mt-1.5 items-center">
                            <span className="text-xs text-slate-600 font-semibold bg-slate-100 px-2 py-0.5 rounded">
                              {member.jabatan || "Staf"}
                            </span>
                            {member.role && (member.role.toLowerCase().includes("admin") || member.role.toLowerCase().includes("super")) && (
                              <span className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded-md">
                                {member.role}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-2 text-slate-400">
                        {(isSystemAdmin || (member.email && currentUserEmail && member.email.toLowerCase() === currentUserEmail.toLowerCase())) && (
                          <button
                            onClick={(e) => handleOpenEdit(member, e)}
                            className="hover:text-indigo-600 transition-colors p-1"
                            title="Edit Profil"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {isSystemAdmin && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConfirmDelete(member);
                            }}
                            className="hover:text-rose-500 transition-colors p-1"
                            title="Hapus Staf"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Divisi & Nomor Induk */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                          DIVISI
                        </p>
                        <p className="text-sm font-semibold text-slate-700 flex items-center space-x-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                          <span>{member.department}</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                          NOMOR INDUK
                        </p>
                        <p className="text-sm font-bold text-slate-700">
                          {member.employeeId || member.id || "STF-TBD"}
                        </p>
                      </div>
                    </div>

                    {/* Contact Box */}
                    <div className="bg-[#FAFAFA] border border-slate-100 rounded-xl p-4 mb-6 space-y-3">
                      <div className="flex items-center space-x-3 text-sm text-slate-600">
                        <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate">{member.email || "-"}</span>
                      </div>
                      <div className="flex items-center space-x-3 text-sm text-slate-600">
                        <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate">{member.phone || "-"}</span>
                      </div>
                    </div>

                    {/* Biodata & Riwayat */}
                    <div className="mb-6">
                      <h4 className="text-[11px] font-bold text-[#6D42F8] uppercase tracking-wide mb-3">
                        BIODATA & RIWAYAT
                      </h4>
                      <div className="border border-slate-100 rounded-xl p-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                              TEMPAT, TGL LAHIR
                            </p>
                            <p className="text-sm font-medium text-slate-700">
                              {member.birthPlaceAndDate || "Belum diatur"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                              PENDIDIKAN
                            </p>
                            <p className="text-sm font-medium text-slate-700">
                              {member.education || "Belum diatur"}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                            ALAMAT TINGGAL
                          </p>
                          <p className="text-sm font-medium text-slate-700">
                            {member.address || "Belum diatur"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
                            RIWAYAT PELATIHAN YANG DIIKUTI
                          </p>
                          <div className="border border-slate-100 rounded-lg p-3 bg-white text-sm text-slate-600">
                            {member.trainingHistory || "Tidak Ada"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Spacer for bottom stuff */}
                    <div className="flex-grow"></div>

                    {/* Hak Cuti */}
                    <div className="mb-6 space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                            HAK CUTI TAHUNAN
                          </h4>
                          <span className="text-xs font-bold text-slate-700">
                            {member.leaveBalance ?? 12} / 12 HARI
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div
                            className="bg-[#6D42F8] h-1.5 rounded-full"
                            style={{
                              width: `${Math.min(((member.leaveBalance ?? 12) / 12) * 100, 100)}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                            HAK CUTI KHUSUS
                          </h4>
                          <span className="text-xs font-bold text-slate-700">
                            {member.specialLeaveBalance !== undefined ? member.specialLeaveBalance : 12} / 12 HARI
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div
                            className="bg-emerald-500 h-1.5 rounded-full"
                            style={{
                              width: `${Math.min(((member.specialLeaveBalance !== undefined ? member.specialLeaveBalance : 12) / 12) * 100, 100)}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Aset yg dipakai */}
                    <div>
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-2">
                        ASET YANG DIPAKAI ({assignedItems.length})
                      </h4>
                      {assignedItems.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {assignedItems.map((item) => (
                            <span
                              key={item.id}
                              className="text-xs text-slate-600 bg-slate-50 border border-slate-100 px-2 py-1 rounded"
                            >
                              {item.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] italic text-slate-400">
                          Tidak membawa barang aset kantor.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal 1: Tambah Staf Baru */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-md">
                Pendaftaran Karyawan / Staf Baru
              </h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={handleAddSubmit}
              className="p-6 space-y-4 max-h-[80vh] overflow-y-auto"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Nama Lengkap Staf
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Ryan Hidayat"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Nomor Induk
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: NIP-2026-001"
                    value={formData.employeeId}
                    onChange={(e) =>
                      setFormData({ ...formData, employeeId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Tempat/Tgl. Lahir
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Jakarta, 12 Agustus 1990"
                    value={formData.birthPlaceAndDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        birthPlaceAndDate: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Pendidikan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: S1 Teknik Informatika"
                    value={formData.education}
                    onChange={(e) =>
                      setFormData({ ...formData, education: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Alamat
                </label>
                <textarea
                  placeholder="Alamat lengkap tempat tinggal"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all min-h-[60px]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Riwayat Pelatihan Diikuti
                </label>
                <textarea
                  placeholder="Sebutkan pelatihan yang pernah diikuti"
                  value={formData.trainingHistory}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      trainingHistory: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all min-h-[60px]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  URL Foto Resolusi Tinggi (Opsional)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formData.avatarUrl || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, avatarUrl: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Peran Sistem (Akses Level)
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  >
                    {formPeran
                      .filter((p) => p !== "Super Admin" || formData.role === "Super Admin")
                      .map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Jabatan Struktur
                  </label>
                  <select
                    value={formData.jabatan}
                    onChange={(e) =>
                      setFormData({ ...formData, jabatan: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  >
                    {formRoles.map((roleOpt) => (
                      <option key={roleOpt} value={roleOpt}>
                        {roleOpt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Bidang
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-sans"
                  >
                    {formDepartments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    E-mail Karyawan
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="nama@office.id"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Nomor Telepon / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="081xxxxxxxx"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Tanggal Bergabung
                  </label>
                  <input
                    type="date"
                    value={formData.joinDate}
                    onChange={(e) =>
                      setFormData({ ...formData, joinDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Jatah Cuti Tahunan
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.leaveBalance}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        leaveBalance: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Jatah Cuti Khusus
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.specialLeaveBalance}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        specialLeaveBalance: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 hover:shadow-sm transition-all"
                >
                  Daftarkan Staf
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Ubah Staf */}
      {isEditOpen && currentStaff && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-md font-sans">
                Ubah Data Karyawan [{currentStaff.id}]
              </h3>
              <button
                onClick={() => setIsEditOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={handleEditSubmit}
              className="p-6 space-y-4 max-h-[80vh] overflow-y-auto"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Nomor Induk
                  </label>
                  <input
                    type="text"
                    value={formData.employeeId}
                    onChange={(e) =>
                      setFormData({ ...formData, employeeId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Tempat/Tgl. Lahir
                  </label>
                  <input
                    type="text"
                    value={formData.birthPlaceAndDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        birthPlaceAndDate: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Pendidikan
                  </label>
                  <input
                    type="text"
                    value={formData.education}
                    onChange={(e) =>
                      setFormData({ ...formData, education: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Alamat
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all min-h-[60px]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Riwayat Pelatihan Diikuti
                </label>
                <textarea
                  value={formData.trainingHistory}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      trainingHistory: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all min-h-[60px]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Foto Profil
                </label>
                <div className="flex items-center space-x-4 border border-slate-100 rounded-xl p-3 bg-slate-50">
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 shadow-sm border border-slate-200 bg-white flex items-center justify-center">
                    {formData.avatarUrl ? (
                      <img
                        src={formData.avatarUrl}
                        alt="Pratinjau Foto"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      id="edit-avatar-upload"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={isUploading}
                    />
                    <label
                      htmlFor="edit-avatar-upload"
                      className={`inline-flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 cursor-pointer transition-colors ${
                        isUploading ? "opacity-50 pointer-events-none" : ""
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{isUploading ? "Mengunggah..." : "Unggah Foto Baru"}</span>
                    </label>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Mendukung format JPG, PNG, GIF, atau WebP.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Peran Sistem (Akses Level)
                  </label>
                  <select
                    value={formData.role}
                    disabled={!isSystemAdmin}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all disabled:opacity-75 disabled:bg-slate-100 disabled:text-slate-500"
                  >
                    {formPeran
                      .filter((p) => p !== "Super Admin" || formData.role === "Super Admin")
                      .map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Jabatan Struktur
                  </label>
                  <select
                    value={formData.jabatan}
                    disabled={!isSystemAdmin}
                    onChange={(e) =>
                      setFormData({ ...formData, jabatan: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all disabled:opacity-75 disabled:bg-slate-100 disabled:text-slate-500"
                  >
                    {formRoles.map((roleOpt) => (
                      <option key={roleOpt} value={roleOpt}>
                        {roleOpt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Bidang
                  </label>
                  <select
                    value={formData.department}
                    disabled={!isSystemAdmin}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all disabled:opacity-75 disabled:bg-slate-100 disabled:text-slate-500 font-sans"
                  >
                    {formDepartments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    E-mail
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    WhatsApp / Telepon
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-sans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-1 space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Status Keaktifan
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 hover:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 transition-colors cursor-pointer"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Cuti">Sedang Cuti</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
                <div className="col-span-1 space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Tanggal Gabung
                  </label>
                  <input
                    type="date"
                    value={formData.joinDate}
                    onChange={(e) =>
                      setFormData({ ...formData, joinDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 font-mono"
                  />
                </div>
                <div className="col-span-1 space-y-1">
                  <label className={`text-xs font-bold ${isSystemAdmin ? "text-slate-700" : "text-slate-500"}`}>
                    Kuota Cuti Tahun
                  </label>
                  <input
                    type="number"
                    min="0"
                    readOnly={!isSystemAdmin}
                    value={formData.leaveBalance}
                    onChange={(e) => {
                      if (isSystemAdmin) {
                        setFormData({
                          ...formData,
                          leaveBalance: parseInt(e.target.value) || 0,
                        });
                      }
                    }}
                    className={`w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-sans ${
                      isSystemAdmin
                        ? "bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-hidden transition-all"
                        : "bg-slate-100 text-slate-500 cursor-not-allowed font-medium"
                    }`}
                  />
                </div>
                <div className="col-span-1 space-y-1">
                  <label className={`text-xs font-bold ${isSystemAdmin ? "text-slate-700" : "text-slate-500"}`}>
                    Kuota Cuti Khusus
                  </label>
                  <input
                    type="number"
                    min="0"
                    readOnly={!isSystemAdmin}
                    value={formData.specialLeaveBalance !== undefined ? formData.specialLeaveBalance : 12}
                    onChange={(e) => {
                      if (isSystemAdmin) {
                        setFormData({
                          ...formData,
                          specialLeaveBalance: parseInt(e.target.value) || 0,
                        });
                      }
                    }}
                    className={`w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-sans ${
                      isSystemAdmin
                        ? "bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-hidden transition-all"
                        : "bg-slate-100 text-slate-500 cursor-not-allowed font-medium"
                    }`}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 hover:shadow-sm transition-all"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Detail Lengkap Karyawan (Arsitektur Kohesif) */}
      {isDetailOpen && currentStaff && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header Profil */}
            <div className="bg-slate-900 text-white p-6 relative">
              <button
                onClick={() => setIsDetailOpen(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-white transition-colors"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-4">
                {currentStaff.avatarUrl ? (
                  <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-slate-700">
                    <img
                      src={currentStaff.avatarUrl}
                      alt={currentStaff.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-slate-850 text-emerald-400 flex items-center justify-center font-bold text-2xl border-2 border-slate-700 uppercase">
                    {currentStaff.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .substring(0, 2)}
                  </div>
                )}
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-xl">{currentStaff.name}</h3>
                    <span className="text-[10px] bg-emerald-500/25 text-emerald-300 font-bold px-2 py-0.5 rounded uppercase">
                      {currentStaff.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    ID Staf:{" "}
                    <span className="font-mono text-white">
                      {currentStaff.id}
                    </span>{" "}
                    • Terdaftar Sejak:{" "}
                    <span className="font-mono text-white">
                      {currentStaff.joinDate}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Konten Kiri Kanan Detail */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[480px] overflow-y-auto">
              {/* Kolom Kiri: Detil Informasi Pribadi */}
              <div className="space-y-5">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-50 pb-1">
                    Detail Posisi
                  </h4>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Nomor Induk</span>
                      <strong className="text-slate-800 font-semibold font-mono">
                        {currentStaff.employeeId || "-"}
                      </strong>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Jabatan Struktur</span>
                      <strong className="text-slate-800 font-semibold">
                        {currentStaff.jabatan || "Staf"}
                      </strong>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Peran Sistem (Akses Level)</span>
                      <strong className="text-slate-800 font-semibold">
                        {currentStaff.role}
                      </strong>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">
                        Divisi / Departemen
                      </span>
                      <strong className="text-slate-800 font-semibold">
                        {currentStaff.department}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-50 pb-1">
                    Informasi Personal
                  </h4>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Tempat/Tgl. Lahir</span>
                      <strong className="text-slate-800 font-semibold max-w-[200px] text-right text-balance">
                        {currentStaff.birthPlaceAndDate || "-"}
                      </strong>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Alamat</span>
                      <strong className="text-slate-800 font-semibold max-w-[200px] text-right text-balance">
                        {currentStaff.address || "-"}
                      </strong>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Pendidikan</span>
                      <strong className="text-slate-800 font-semibold max-w-[200px] text-right text-balance">
                        {currentStaff.education || "-"}
                      </strong>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Riwayat Pelatihan</span>
                      <strong className="text-slate-800 font-semibold max-w-[200px] text-right text-balance">
                        {currentStaff.trainingHistory || "-"}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-50 pb-1">
                    Kontak & Jalur Komunikasi
                  </h4>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">
                        Alamat Surat Elektronik
                      </span>
                      <strong className="text-slate-800 underline font-mono">
                        {currentStaff.email}
                      </strong>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Nomor Telepon</span>
                      <strong className="text-slate-800 font-mono">
                        {currentStaff.phone || "-"}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Detail Informasi Cuti */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex flex-col space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">
                        a. Hak Cuti Tahunan
                      </span>
                      <strong className="text-slate-800 font-semibold font-mono">
                        12 Hari
                      </strong>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">b. Hak Cuti Khusus</span>
                      <strong className="text-slate-800 font-semibold font-mono">
                        12 Hari
                      </strong>
                    </div>
                    <div className="flex justify-between text-xs pt-2 border-t border-slate-200/60">
                      <span className="text-slate-500">
                        c. Jumlah Cuti Tahunan
                      </span>
                      <strong className="text-slate-800 font-semibold font-mono">
                        12 Hari
                      </strong>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">
                        d. Jml Cuti Tahunan Diambil
                      </span>
                      <strong className="text-slate-800 font-semibold font-mono">
                        {12 - currentStaff.leaveBalance} Hari
                      </strong>
                    </div>
                    <div className="flex justify-between text-xs pt-2 border-t border-slate-200/60">
                      <span className="text-emerald-700 font-bold">
                        e. Sisa Cuti Tahunan
                      </span>
                      <strong className="text-emerald-700 font-extrabold font-mono">
                        {currentStaff.leaveBalance} Hari
                      </strong>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-purple-700 font-bold">
                        {" "}
                        Sisa Cuti Khusus
                      </span>
                      <strong className="text-purple-700 font-extrabold font-mono">
                        {currentStaff.specialLeaveBalance !== undefined
                          ? currentStaff.specialLeaveBalance
                          : 12}{" "}
                        Hari
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Kolom Kanan: Aset kantor yang sedang dipegang + Riwayat cuti singkat */}
              <div className="space-y-5">
                {/* Aset Dipinjamkan */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-50 pb-1">
                    Alokasi Aset Kantor (
                    {getAssignedItems(currentStaff.id).length})
                  </h4>

                  {getAssignedItems(currentStaff.id).length === 0 ? (
                    <div className="p-4 bg-slate-50 rounded-lg text-center text-xs text-slate-400 font-medium">
                      Saat ini staf tidak meminjam / memegang aset inventaris
                      kantor apa pun.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {getAssignedItems(currentStaff.id).map((item) => (
                        <div
                          key={item.id}
                          className="p-2.5 bg-slate-50 hover:bg-slate-100/50 border border-slate-100 rounded-lg flex items-center justify-between"
                        >
                          <div className="min-w-0 pr-2">
                            <span className="text-xs font-semibold text-slate-900 block truncate">
                              {item.name}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 block">
                              {item.code} • {item.location}
                            </span>
                          </div>
                          <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded whitespace-nowrap">
                            {item.category}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Riwayat Cuti Singkat */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-50 pb-1">
                    f. Riwayat Pengambilan Cuti Tahunan/Khusus (
                    {getStaffLeaves(currentStaff.id).length})
                  </h4>

                  {getStaffLeaves(currentStaff.id).length === 0 ? (
                    <div className="p-4 bg-slate-50 rounded-lg text-center text-xs text-slate-400 font-medium">
                      Belum terdapat rekam pengajuan cuti sebelumnya.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[150px] overflow-y-auto">
                      {getStaffLeaves(currentStaff.id).map((l) => (
                        <div
                          key={l.id}
                          className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg flex flex-col space-y-0.5"
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-slate-800">
                              {l.leaveType} ({l.durationDays} hari)
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-sm font-bold scale-90 ${
                                l.status === "Disetujui"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : l.status === "Ditolak"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {l.status}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {l.startDate} s/d {l.endDate}
                          </span>
                          <span className="text-[10px] text-slate-500 italic block">
                            "{l.reason}"
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="bg-slate-50 px-6 py-4 flex justify-between items-center border-t border-slate-100">
              <span className="text-[11px] text-slate-400 inline-flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-emerald-500" />
                Divalidasi oleh HRD Konsol OfficeHub
              </span>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="px-4 py-1.5 bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold rounded-md transition-colors"
              >
                Tutup Jendela
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
