import { useState, useEffect } from "react";
import {
  StaffProfile,
  InventoryItem,
  LeaveRequest,
  DocumentArchive,
} from "./types";

// Importing Tab Components
import Dashboard from "./components/Dashboard";
import Inventory from "./components/Inventory";
import Staff from "./components/Staff";
import Leave from "./components/Leave";
import DocumentArchiveView from "./components/Archive";
import AiAssistant from "./components/AiAssistant";
import Login from "./components/Login";
import Settings from "./components/Settings";
import EditProfileModal from "./components/EditProfileModal";

// Importing Icons
import {
  LayoutDashboard,
  Package,
  Users,
  CalendarDays,
  FileBox,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  User as UserIcon,
  Bell,
  Building2,
  Clock,
  ArrowUpRight,
  LogOut,
  ShieldCheck,
  Crown,
  Bot,
  Settings as SettingsIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { supabase } from "./supabase";
import { User } from "@supabase/supabase-js";

const navigationItems = [
  { id: "dashboard", label: "Beranda", icon: LayoutDashboard },
  { id: "inventory", label: "Inventaris", icon: Package },
  { id: "staff", label: "Profil & Staf", icon: Users },
  { id: "leave", label: "Kontrol Cuti", icon: CalendarDays },
  { id: "archive", label: "Arsip Dokumen", icon: FileBox },
  { id: "ai-assistant", label: "Asisten AI", icon: Bot },
  { id: "settings", label: "Pengaturan", icon: SettingsIcon },
];

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsAuthenticated(true);
        setCurrentUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setIsAuthenticated(true);
        setCurrentUser(session.user);
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);
  // Navigation active tab State
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] =
    useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] =
    useState<boolean>(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);

  // Core States
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [documents, setDocuments] = useState<DocumentArchive[]>([]);

  // Supabase Loaders
  useEffect(() => {
    if (!isAuthenticated) return;

    const parseStaff = (rows: any[]) => rows.map(row => {
      let extra: any = {};
      if (row.notes) {
        try { extra = JSON.parse(row.notes); } catch(e) {}
      }
      return {
        ...row,
        ...extra,
        role: row.position,
        joinDate: row.startdate,
        leaveBalance: Number(row.leavebalance || extra.leaveBalance) || 0,
      };
    });

    const parseInventory = (rows: any[]) => rows.map(row => {
      let extra: any = {};
      if (row.notes) {
        try { extra = JSON.parse(row.notes); } catch(e) {}
      }
      return { 
        ...row, 
        ...extra,
        assignedToId: row.assignedtoid,
        assignedToName: row.assignedtoname,
        purchaseDate: row.purchasedate,
        code: row.serialnumber || extra.code || '',
        quantity: Number(extra.quantity || row.quantity) || 1,
        unitPrice: Number(extra.unitPrice || row.unitprice) || 0,
      };
    });

    const parseLeaves = (rows: any[]) => rows.map(row => ({
      ...row,
      staffId: row.staffid,
      staffName: row.staffname,
      leaveType: row.type,
      startDate: row.startdate,
      endDate: row.enddate,
      durationDays: Number(row.durationdays) || 1,
      requestDate: row.requestdate
    }));

    const parseDocuments = (rows: any[]) => rows.map(row => {
      let tags = [];
      try {
        tags = row.tags ? JSON.parse(row.tags) : [];
      } catch(e) {}
      return {
        ...row,
        uploadDate: row.uploaddate,
        fileSize: row.filesize || "Unknown",
        fileType: row.filetype,
        tags
      };
    });

    const fetchData = async () => {
      const [{ data: staffData }, { data: invData }, { data: leaveData }, { data: docData }] = await Promise.all([
        supabase.from("staff").select("*"),
        supabase.from("inventory").select("*"),
        supabase.from("leaves").select("*"),
        supabase.from("documents").select("*")
      ]);
      if (staffData) setStaff(parseStaff(staffData));
      if (invData) setInventory(parseInventory(invData));
      if (leaveData) setLeaves(parseLeaves(leaveData));
      if (docData) setDocuments(parseDocuments(docData));
    };

    fetchData();

    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staff' }, () => {
        supabase.from("staff").select("*").then(({ data }) => { if(data) setStaff(parseStaff(data)) });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, () => {
        supabase.from("inventory").select("*").then(({ data }) => { if(data) setInventory(parseInventory(data)) });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leaves' }, () => {
        supabase.from("leaves").select("*").then(({ data }) => { if(data) setLeaves(parseLeaves(data)) });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, () => {
        supabase.from("documents").select("*").then(({ data }) => { if(data) setDocuments(parseDocuments(data)) });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    const currentTab = navigationItems.find((i) => i.id === activeTab);
    if (currentTab) {
      document.title = `${currentTab.label} - SIMAK`;
    }
  }, [activeTab]);

  // --- Handlers for Inventory ---
  const serializeInventory = (id: string, item: any) => {
    const { name, category, status, assignedToId, assignedToName, purchaseDate, location, code, ...extra } = item;
    return {
      id,
      name: name || 'Tanpa Nama',
      category: category || 'Lainnya',
      status: status || 'Tersedia',
      assignedtoid: assignedToId || null,
      assignedtoname: assignedToName || null,
      purchasedate: purchaseDate || new Date().toISOString(),
      location: location || 'Gudang',
      serialnumber: code || '',
      condition: 'Baik',
      notes: JSON.stringify({ ...extra, code: code || '' })
    };
  };

  const handleAddInventory = async (item: Omit<InventoryItem, "id">) => {
    try {
      const newId = `INV-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const payload = serializeInventory(newId, item);
      const { error } = await supabase.from("inventory").insert(payload);
      if (error) {
        console.error("Supabase insert error:", error);
        throw error;
      }
    } catch (e: any) {
      console.error(e);
      throw e;
    }
  };

  const handleUpdateInventory = async (updatedItem: InventoryItem) => {
    try {
      const { id, ...data } = updatedItem;
      const payload = serializeInventory(id, data);
      const { id: _removedId, ...updatePayload } = payload;
      await supabase.from("inventory").update(updatePayload).eq("id", id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteInventory = async (id: string) => {
    try {
      setInventory(prev => prev.filter(i => i.id !== id));
      await supabase.from("inventory").delete().eq("id", id);
    } catch (e) {
      console.error(e);
    }
  };

  // --- Handlers for Staff ---
  const serializeStaff = (id: string, profile: any) => {
    const { name, role, department, status, email, phone, joinDate, leaveBalance, ...extra } = profile;
    return {
      id,
      name: name || 'Tanpa Nama',
      position: role || 'Staf',
      department: department || 'Umum',
      status: status || 'Aktif',
      contact: email || phone || '-',
      startdate: joinDate || new Date().toISOString().split('T')[0],
      leavebalance: leaveBalance || 0,
      notes: JSON.stringify({ ...extra, email, phone })
    };
  };

  const handleAddStaff = async (profile: Omit<StaffProfile, "id">) => {
    try {
      const newId = `STF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const payload = serializeStaff(newId, profile);
      await supabase.from("staff").insert(payload);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateStaff = async (updatedProfile: StaffProfile) => {
    try {
      const { id, ...data } = updatedProfile;
      const payload = serializeStaff(id, data);
      const { id: _removedId, ...updatePayload } = payload;
      await supabase.from("staff").update(updatePayload).eq("id", id);
      
      const relatedInv = inventory.filter(item => item.assignedToId === id);
      if (relatedInv.length > 0) {
        await Promise.all(relatedInv.map(item => 
          supabase.from("inventory").update({ assignedtoname: updatedProfile.name }).eq("id", item.id)
        ));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteStaff = async (id: string) => {
    try {
      setStaff(prev => prev.filter(s => s.id !== id));
      await supabase.from("staff").delete().eq("id", id);

      const relatedInv = inventory.filter(item => item.assignedToId === id);
      if (relatedInv.length > 0) {
        await Promise.all(relatedInv.map(item => 
          supabase.from("inventory").update({ assignedtoid: null, assignedtoname: null, status: "Tersedia" }).eq("id", item.id)
        ));
      }

      const relatedLeaves = leaves.filter(l => l.staffId === id);
      if (relatedLeaves.length > 0) {
        await Promise.all(relatedLeaves.map(l => 
          supabase.from("leaves").delete().eq("id", l.id)
        ));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // --- Handlers for Leaves ---
  const serializeLeave = (id: string, req: Omit<LeaveRequest, "id" | "requestDate">, requestDate: string) => ({
    id,
    staffid: req.staffId,
    staffname: req.staffName,
    type: req.leaveType,
    startdate: req.startDate,
    enddate: req.endDate,
    durationdays: req.durationDays,
    reason: req.reason,
    status: req.status,
    requestdate: requestDate
  });

  const handleAddLeaveRequest = async (
    req: Omit<LeaveRequest, "id" | "requestDate">,
  ) => {
    try {
      const newId = `LV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const requestDate = new Date().toISOString().split("T")[0];
      const payload = serializeLeave(newId, req, requestDate);
      await supabase.from("leaves").insert(payload);
    } catch (e) {
      console.error(e);
    }
  };

  const handleApproveLeave = async (id: string) => {
    const req = leaves.find((l) => l.id === id);
    if (!req) return;

    try {
      await supabase.from("leaves").update({ status: "Disetujui" }).eq("id", id);

      const member = staff.find((s) => s.id === req.staffId);
      if (member) {
        const newBalance = Math.max(0, member.leaveBalance - req.durationDays);
        await supabase.from("staff").update({
          leavebalance: newBalance,
          status: "Cuti",
        }).eq("id", member.id);
      }

      const relatedInv = inventory.filter(item => item.assignedToId === req.staffId);
      if (relatedInv.length > 0) {
        await Promise.all(relatedInv.map(item => 
          supabase.from("inventory").update({ assignedtoname: `${req.staffName} (Sedang Cuti)` }).eq("id", item.id)
        ));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRejectLeave = async (id: string) => {
    try {
      await supabase.from("leaves").update({ status: "Ditolak" }).eq("id", id);
    } catch (e) {
      console.error(e);
    }
  };

  // --- Handlers for Documents ---
  const serializeDocument = (id: string, doc: Omit<DocumentArchive, "id" | "uploadDate">, uploadDate: string) => ({
    id,
    name: doc.name,
    category: doc.category,
    uploaddate: uploadDate,
    filesize: doc.fileSize,
    filetype: doc.fileType,
    description: doc.description || null,
    tags: doc.tags ? JSON.stringify(doc.tags) : null
  });

  const handleAddDocument = async (
    docReq: Omit<DocumentArchive, "id" | "uploadDate">,
  ) => {
    try {
      const newId = `DOC-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const uploadDate = new Date().toISOString().split("T")[0];
      const payload = serializeDocument(newId, docReq, uploadDate);
      await supabase.from("documents").insert(payload);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    try {
      setDocuments(prev => prev.filter(d => d.id !== id));
      await supabase.from("documents").delete().eq("id", id);
    } catch (e) {
      console.error(e);
    }
  };

  // Switch Sidebar tabs listing

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] flex flex-col md:flex-row antialiased font-sans selection:bg-blue-200">
      {/* 1. SIDEBAR (RESPONSIVE: COLLAPSIBLE ON DESKTOP, OFF-CANVAS ON MOBILE) */}

      {/* Sidebar Desktop - Clean Translucent Floating Feel */}
      <aside
        className={`bg-white/70 backdrop-blur-3xl text-slate-800 hidden md:flex flex-col border-r border-slate-200/50 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${isSidebarCollapsed ? "w-20" : "w-72"} shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-40 relative`}
      >
        {/* Brand Header */}
        <div className="h-20 flex items-center justify-between px-5 border-b border-slate-100/50 shrink-0">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
              <img
                src="https://i.ibb.co.com/FbHbkzXX/SIMAK-V3.png"
                alt="SIMAK Logo"
                className="w-full h-full object-contain"
              />
            </div>
            {!isSidebarCollapsed && (
              <div>
                <span className="font-bold text-lg tracking-tight text-slate-900 whitespace-nowrap block">
                  SIMAK
                </span>
                <span className="text-[9px] font-bold text-slate-500 tracking-wide block leading-tight whitespace-normal">
                  Sistem Manajemen Aset Baznas
                  <br />
                  <span className="text-blue-600/90">
                    Aset Terdata, Amanah Terjaga.
                  </span>
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100/50 transition-colors hidden md:block"
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 p-5 space-y-2 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center px-1" : "space-x-4 px-5"} py-3.5 rounded-2xl text-[15px] font-semibold tracking-tight transition-all duration-300 ${
                  isActive
                    ? "bg-white text-blue-600 shadow-[0_4px_12px_rgba(0,0,0,0.06)] ring-1 ring-slate-100"
                    : "text-slate-500 hover:text-slate-900 hover:bg-white/60"
                }`}
                title={item.label}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 ${isActive ? "text-blue-600" : "text-slate-400"}`}
                />
                {!isSidebarCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer Details */}
      </aside>

      {/* Side drawer for Mobile screens */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm"
            ></motion.div>

            {/* Sidebar box drawer */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white/90 backdrop-blur-3xl text-slate-900 w-72 h-full relative z-10 flex flex-col p-4 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                    <img
                      src="https://i.ibb.co.com/FbHbkzXX/SIMAK-V3.png"
                      alt="SIMAK Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <span className="font-bold text-lg tracking-tight leading-none block">
                      SIMAK
                    </span>
                    <span className="text-[9px] font-bold text-slate-500 tracking-wide block leading-tight mt-1">
                      Sistem Manajemen Aset Baznas
                      <br />
                      <span className="text-blue-600/90">
                        Aset Terdata, Amanah Terjaga.
                      </span>
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="text-slate-400 hover:text-slate-800 p-2 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation list */}
              <nav className="flex-1 mt-4 space-y-2 overflow-y-auto">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center space-x-4 px-4 py-3.5 rounded-2xl text-[15px] font-semibold tracking-tight transition-all duration-300 ${
                        isActive
                          ? "bg-blue-50/80 text-blue-600 shadow-sm ring-1 ring-blue-100"
                          : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* 2. MAIN LAYOUT CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        {/* TOP COMPACT HEADER - Transparent / Floating */}
        <header className="h-20 bg-transparent px-6 sm:px-10 flex items-center justify-between shrink-0 sticky top-0 z-30">
          <div className="flex items-center space-x-5">
            {/* Mobile menu Toggle button */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden text-slate-500 hover:text-slate-900 p-2 hover:bg-white rounded-full shadow-sm transition-all bg-white/50 backdrop-blur-md ring-1 ring-slate-200"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Current Active view context */}
            <div className="flex items-center space-x-3 text-[15px] font-semibold text-slate-800 tracking-tight">
              <span className="bg-white/80 backdrop-blur-md shadow-sm ring-1 ring-slate-900/5 text-slate-900 px-4 py-1.5 rounded-full">
                {navigationItems.find((i) => i.id === activeTab)?.label}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            {/* Profile badge wrapper with Dropdown */}
            <div className="relative">
              <div
                className="flex items-center space-x-3 cursor-pointer group"
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              >
                <div className="text-right hidden sm:block">
                  <span className="text-[14px] font-bold text-slate-800 block leading-none group-hover:text-blue-600 transition-colors">
                    {currentUser?.user_metadata?.full_name || "Admin"}
                  </span>
                  <div className="flex items-center justify-end space-x-1 mt-1 text-amber-500">
                    <ShieldCheck className="w-3 h-3" />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">
                      {currentUser?.user_metadata?.role || "Administrator"}
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden shadow-lg shadow-blue-500/10 ring-2 ring-white group-hover:ring-blue-500/30 transition-all bg-gradient-to-br from-blue-50 to-indigo-50">
                    <img
                      src={currentUser?.user_metadata?.avatar_url || "https://i.pravatar.cc/150"}
                      alt="User Profile"
                      className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-500"
                    />
                  </div>
                  {/* Status indicator active */}
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
                </div>
              </div>

              {/* Grand Profile Dropdown Menu */}
              <AnimatePresence>
                {isProfileDropdownOpen && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-40 bg-transparent"
                      onClick={() => setIsProfileDropdownOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-3 w-64 bg-white/90 backdrop-blur-2xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 ring-1 ring-slate-900/5"
                    >
                      <div className="p-5 bg-gradient-to-br from-slate-900 to-blue-900 text-white relative overflow-hidden">
                        <div className="absolute -right-6 -top-6 text-white/5 rotate-12">
                          <Crown className="w-24 h-24" />
                        </div>
                        <div className="flex items-center space-x-3 relative z-10">
                          <div className="w-12 h-12 rounded-xl overflow-hidden ring-2 ring-white/20">
                            <img
                              src={
                                currentUser?.user_metadata?.avatar_url ||
                                "https://i.pravatar.cc/150"
                              }
                              alt="User Profile"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <span className="font-bold text-sm block">
                              {currentUser?.user_metadata?.full_name || "Admin"}
                            </span>
                            <span className="text-[10px] text-blue-300 font-mono tracking-widest uppercase">
                              {currentUser?.user_metadata?.role || "Administrator"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-2 space-y-1">
                        <button
                          onClick={() => {
                            setIsProfileDropdownOpen(false);
                            setIsEditProfileModalOpen(true);
                          }}
                          className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-blue-600 text-sm font-semibold transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-blue-50 flex items-center justify-center transition-colors">
                            <UserIcon className="w-4 h-4" />
                          </div>
                          <span>Edit Profil</span>
                        </button>
                        <button
                          onClick={async () => {
                            setIsProfileDropdownOpen(false);
                            await supabase.auth.signOut();
                            setIsAuthenticated(false);
                          }}
                          className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-red-600 text-sm font-semibold transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-red-50 flex items-center justify-center transition-colors">
                            <LogOut className="w-4 h-4" />
                          </div>
                          <span>Keluar Sistem</span>
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* SCROLLABLE MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-10 pb-10 max-w-[1600px] w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === "dashboard" && (
                <Dashboard
                  staff={staff}
                  inventory={inventory}
                  leaves={leaves}
                  documents={documents}
                  userName={
                    currentUser?.user_metadata?.full_name || currentUser?.email || undefined
                  }
                  onNavigate={(tab) => setActiveTab(tab)}
                  onApproveLeave={handleApproveLeave}
                  onRejectLeave={handleRejectLeave}
                />
              )}

              {activeTab === "inventory" && (
                <Inventory
                  inventory={inventory}
                  staff={staff}
                  onAddInventory={handleAddInventory}
                  onUpdateInventory={handleUpdateInventory}
                  onDeleteInventory={handleDeleteInventory}
                />
              )}

              {activeTab === "staff" && (
                <Staff
                  staff={staff}
                  inventory={inventory}
                  leaves={leaves}
                  onAddStaff={handleAddStaff}
                  onUpdateStaff={handleUpdateStaff}
                  onDeleteStaff={handleDeleteStaff}
                />
              )}

              {activeTab === "leave" && (
                <Leave
                  leaves={leaves}
                  staff={staff}
                  onAddLeaveRequest={handleAddLeaveRequest}
                  onApproveLeave={handleApproveLeave}
                  onRejectLeave={handleRejectLeave}
                />
              )}

              {activeTab === "archive" && (
                <DocumentArchiveView
                  documents={documents}
                  onAddDocument={handleAddDocument}
                  onDeleteDocument={handleDeleteDocument}
                />
              )}

              {activeTab === "ai-assistant" && <AiAssistant />}

              {activeTab === "settings" && <Settings />}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Mini human administrative notice as signature decoration */}
        <footer className="bg-white border-t border-slate-100 py-4 text-center text-[11px] text-slate-400 font-sans">
          © 2026 Sistem Manajemen Aset Baznas (SIMAK). Aset Terdata, Amanah
          Terjaga.
        </footer>
      </div>

      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        currentUser={currentUser}
        onProfileUpdated={(user) => {
          if (user) {
            setCurrentUser(user);
          } else {
            supabase.auth.getUser().then(({ data: { user } }) => {
              if (user) {
                setCurrentUser(user);
              }
            });
          }
        }}
      />
    </div>
  );
}
