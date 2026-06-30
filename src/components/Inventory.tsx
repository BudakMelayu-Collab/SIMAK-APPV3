import React, { useState, useRef } from "react";
import { InventoryItem, StaffProfile } from "../types";
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  CheckCircle2,
  UserCheck,
  X,
  RefreshCw,
  AlertTriangle,
  HelpCircle,
  FileSpreadsheet,
  Download,
} from "lucide-react";
import * as XLSX from "xlsx";

interface InventoryProps {
  inventory: InventoryItem[];
  staff: StaffProfile[];
  onAddInventory: (item: Omit<InventoryItem, "id">) => void;
  onUpdateInventory: (item: InventoryItem) => void;
  onDeleteInventory: (id: string) => void;
}

export default function Inventory({
  inventory,
  staff,
  onAddInventory,
  onUpdateInventory,
  onDeleteInventory,
}: InventoryProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [selectedStatus, setSelectedStatus] = useState("Semua");

  // Modal States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);

  // Form States
  const [currentItem, setCurrentItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState({
    assetType: "",
    name: "",
    brand: "",
    code: "",
    category: "Elektronik",
    quantity: 1,
    unitPrice: 0,
    status: "Tersedia" as const,
    location: "",
    purchaseDate: new Date().toISOString().split("T")[0],
  });

  const [assigneeId, setAssigneeId] = useState("");

  // Dropdown options
  const categories = [
    "Semua",
    "Elektronik",
    "Furnitur",
    "Perangkat Jaringan",
    "Alat Tulis Kantor",
    "Lainnya",
  ];
  const formCategories = [
    "Elektronik",
    "Furnitur",
    "Perangkat Jaringan",
    "Alat Tulis Kantor",
    "Lainnya",
  ];
  
  const statuses = [
    "Semua",
    ...Array.from(new Set(inventory.map(i => i.status))).filter(Boolean)
  ];

  // Filter logic
  const filteredItems = inventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.assignedToName &&
        item.assignedToName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      selectedCategory === "Semua" || item.category === selectedCategory;
    const matchesStatus =
      selectedStatus === "Semua" || item.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleOpenAdd = () => {
    setFormData({
      assetType: "",
      name: "",
      brand: "",
      code: `INV-${Math.floor(100 + Math.random() * 900)}`,
      category: "Elektronik",
      quantity: 1,
      unitPrice: 0,
      status: "Tersedia",
      location: "Gudang GA",
      purchaseDate: new Date().toISOString().split("T")[0],
    });
    setIsAddOpen(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    onAddInventory(formData);
    setIsAddOpen(false);
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setCurrentItem(item);
    setFormData({
      assetType: item.assetType || "",
      name: item.name,
      brand: item.brand || "",
      code: item.code,
      category: item.category,
      quantity: item.quantity,
      unitPrice: item.unitPrice || 0,
      status: item.status,
      location: item.location,
      purchaseDate: item.purchaseDate,
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItem || !formData.name) return;
    onUpdateInventory({
      ...currentItem,
      ...formData,
    });
    setIsEditOpen(false);
  };

  const handleOpenAssign = (item: InventoryItem) => {
    setCurrentItem(item);
    setAssigneeId(item.assignedToId || "");
    setIsAssignOpen(true);
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItem) return;

    if (assigneeId === "") {
      // Unassign the item
      onUpdateInventory({
        ...currentItem,
        assignedToId: undefined,
        assignedToName: undefined,
        status: "Tersedia",
      });
    } else {
      const selectedStaff = staff.find((s) => s.id === assigneeId);
      onUpdateInventory({
        ...currentItem,
        assignedToId: assigneeId,
        assignedToName: selectedStaff ? selectedStaff.name : undefined,
        status: "Digunakan",
      });
    }
    setIsAssignOpen(false);
  };

  const handleUnassignQuick = (item: InventoryItem) => {
    onUpdateInventory({
      ...item,
      assignedToId: undefined,
      assignedToName: undefined,
      status: "Tersedia",
    });
  };

  const handleDownloadTemplate = () => {
    // Generate template data
    const templateData = [
      {
        "Jenis Aset": "Elektronik",
        "Nama": "Laptop Asus Vivobook",
        "Merk": "Asus",
        "Kode": "INV-1001",
        "Kategori": "IT",
        "Jumlah": 10,
        "Harga Satuan": 15000000,
        "Kondisi": "Tersedia",
        "Lokasi Penempatan": "Gudang Utama",
        "Tahun": "2024",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, "Template_Inventaris.xlsx");
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array", cellDates: true });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      // Expecting standard JSON array from worksheet
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      let successCount = 0;
      setImportProgress({ current: 0, total: jsonData.length });

      // Basic mapping: Maps excel column names to `Omit<InventoryItem, 'id'>`
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        // More robust key matching by checking keys dynamically if needed,
        // but let's check common casing:
        const name = row.name || row.Nama || row.nama || row["Nama Aset / Merk"] || row.NAME || row.Name;
        if (!name) {
            setImportProgress({ current: i + 1, total: jsonData.length });
            continue; // Skip empty rows
        }

        let dateStr = new Date().toISOString().split("T")[0];
        const rawDate = row.purchaseDate || row.Tahun || row.tahun || row.Tanggal || row.tanggal;
        if (rawDate instanceof Date) {
          dateStr = rawDate.toISOString().split("T")[0];
        } else if (typeof rawDate === "string" && rawDate.trim() !== "") {
          // If it's a 4 digit year, we can handle it
          if (rawDate.trim().length === 4) {
            dateStr = `${rawDate.trim()}-01-01`;
          } else {
            dateStr = rawDate.split("T")[0]; // basic safety
          }
        } else if (typeof rawDate === "number") {
          // Check if it looks like a year (e.g. 2024)
          if (rawDate > 1900 && rawDate < 2100) {
            dateStr = `${rawDate}-01-01`;
          } else {
            const jsDate = new Date((rawDate - 25569) * 86400 * 1000);
            if (!isNaN(jsDate.getTime())) {
               dateStr = jsDate.toISOString().split("T")[0];
            }
          }
        }

        let statusVal = String(row.status || row.Status || row.Kondisi || row.kondisi || "Tersedia").trim();

        let qty = parseInt(row.quantity || row.Jumlah || row.jumlah, 10);
        if (isNaN(qty)) qty = 1;

        let price = Number(
          row.unitPrice || row.price || row["Harga Satuan"] || row.Harga || row.harga,
        );
        if (isNaN(price)) price = 0;

        const newItem: Omit<InventoryItem, "id"> = {
          assetType: String(
            row.assetType || row["Jenis Aset"] || row.JenisAset || row.Jenis || row.jenis || "",
          ),
          name: String(name || "Tanpa Nama"),
          brand: String(row.brand || row.Merk || row.merk || ""),
          code: String(
            row.code ||
              row.Kode ||
              row["Kode Aset (No. Seri)"] ||
              row.kode ||
              `INV-${Math.floor(100 + Math.random() * 9000)}`,
          ),
          category: String(
            row.category || row.Kategori || row.kategori || "Lainnya",
          ),
          quantity: qty,
          unitPrice: price,
          status: statusVal as any,
          location: String(
            row.location || row["Lokasi Penempatan"] || row.Lokasi || row.lokasi || "Gudang",
          ).trim(),
          purchaseDate: dateStr.trim(),
        };
        
        await onAddInventory(newItem);
        successCount++;
        setImportProgress({ current: i + 1, total: jsonData.length });
      }

      alert(`Berhasil mengimpor ${successCount} data dari Excel!`);
    } catch (error) {
      console.error("Failed parsing Excel file", error);
      alert("Gagal memproses file Excel: " + (error as Error).message);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setIsImporting(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4 relative">
      {/* Progress Overlay */}
      {isImporting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl flex flex-col items-center">
            <RefreshCw className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-1">Mengimpor Excel</h3>
            <p className="text-sm text-slate-500 mb-4">
              Memproses baris ke-{importProgress.current} dari {importProgress.total}
            </p>
            <div className="w-full bg-slate-100 rounded-full h-2 mb-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${importProgress.total > 0 ? (importProgress.current / importProgress.total) * 100 : 0}%`,
                }}
              ></div>
            </div>
            <div className="text-xs font-bold text-emerald-600">
              {importProgress.total > 0
                ? Math.round((importProgress.current / importProgress.total) * 100)
                : 0}
              %
            </div>
          </div>
        </div>
      )}
      {/* Header section with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Daftar Peralatan
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Manajemen aset, alokasi inventaris, dan status kondisi peralatan.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleDownloadTemplate}
            className="relative overflow-hidden group bg-white border border-blue-200 text-blue-700 hover:text-blue-800 font-bold text-xs px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center space-x-2 uppercase"
          >
            <div className="absolute inset-0 bg-blue-50/50 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
            <Download className="w-4 h-4 relative z-10" />
            <span className="relative z-10 tracking-wider">Template</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="relative overflow-hidden group bg-white border border-emerald-200 text-emerald-700 hover:text-emerald-800 disabled:opacity-50 font-bold text-xs px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center space-x-2 uppercase"
          >
            <div className="absolute inset-0 bg-emerald-50/50 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
            {isImporting ? (
              <RefreshCw className="w-4 h-4 relative z-10 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 relative z-10" />
            )}
            <span className="relative z-10 tracking-wider">
              {isImporting ? "Mengimpor..." : "Import Excel"}
            </span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".xlsx,.xls,.csv"
            onChange={handleImportExcel}
            onClick={(e) => {
              (e.target as HTMLInputElement).value = "";
            }}
          />
          <button
            onClick={handleOpenAdd}
            className="relative overflow-hidden group bg-gradient-to-r from-slate-800 to-slate-900 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-[0_4px_12px_-4px_rgba(15,23,42,0.6)] hover:shadow-[0_8px_16px_-4px_rgba(15,23,42,0.8)] transition-all flex items-center space-x-2 uppercase transform hover:-translate-y-0.5"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-slate-700 to-slate-800 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Plus className="w-4 h-4 relative z-10" />
            <span className="relative z-10 tracking-wider">Tambah Aset</span>
          </button>
        </div>
      </div>

      {/* Filters and Search Bar Section */}
      <div className="bg-slate-50 p-2 border border-slate-200 rounded flex flex-col sm:flex-row gap-2">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari aset..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1 border border-slate-200 rounded text-[11px] bg-white focus:outline-none focus:border-slate-400 transition-all font-sans"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex gap-2">
          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:block" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-slate-200 rounded text-[11px] px-2 py-1 bg-white focus:outline-none focus:border-slate-400 font-semibold transition-colors cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "Semua" ? "Sem. Kategori" : cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-slate-200 rounded text-[11px] px-2 py-1 bg-white focus:outline-none focus:border-slate-400 font-semibold transition-colors cursor-pointer"
            >
              {statuses.map((st) => (
                <option key={st} value={st}>
                  {st === "Semua" ? "Sem. Status" : st}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table View */}
      <div className="card-container flex-1 min-h-[300px]">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center h-full">
            <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
              <HelpCircle className="w-5 h-5" />
            </div>
            <p className="mt-2 text-[11px] font-bold text-slate-800">
              Tidak ada aset ditemukan
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <table className="high-density-table whitespace-nowrap">
              <thead>
                <tr>
                  <th className="text-left">No</th>
                  <th className="text-left">Jenis Aset</th>
                  <th className="text-left">Nama</th>
                  <th className="text-left">Merk</th>
                  <th className="text-left">Kode</th>
                  <th className="text-left">Kategori</th>
                  <th className="text-center">Jumlah</th>
                  <th className="text-right">Harga Satuan</th>
                  <th className="text-right">Total</th>
                  <th className="text-center">Kondisi</th>
                  <th className="text-left">Lokasi Penempatan</th>
                  <th className="text-center">Tahun</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="text-[11px] text-slate-600">{index + 1}</td>
                    <td className="text-[11px] text-slate-600">
                      {item.assetType || "-"}
                    </td>
                    <td className="text-[11px] text-slate-600">{item.name}</td>
                    <td className="text-[11px] text-slate-600">
                      {item.brand || "-"}
                    </td>
                    <td className="text-[11px] text-slate-600">{item.code}</td>
                    <td className="text-[11px] text-slate-600">
                      {item.category}
                    </td>
                    <td className="text-center text-[11px] text-slate-600">
                      {item.quantity}
                    </td>
                    <td className="text-right text-[11px] text-slate-600">
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                      }).format(item.unitPrice || 0)}
                    </td>
                    <td className="text-right text-[11px] text-slate-600">
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                      }).format((item.unitPrice || 0) * item.quantity)}
                    </td>
                    <td className="text-center text-[11px] text-slate-600">
                      {item.status}
                    </td>
                    <td className="text-[11px] text-slate-600">
                      {item.location}
                    </td>
                    <td className="text-center text-[11px] text-slate-600">
                      {item.purchaseDate
                        ? String(item.purchaseDate).substring(0, 4)
                        : "-"}
                    </td>
                    <td className="text-right">
                      <div className="inline-flex items-center space-x-1">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1 text-slate-400 hover:text-indigo-600"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Hapus?")) onDeleteInventory(item.id);
                          }}
                          className="p-1 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal 1: Tambah Aset Baru */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-md">Tambah Aset Baru</h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Nama Barang / Aset
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Meja Lipat Aluminium"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Jenis Aset
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Laptop"
                    value={formData.assetType}
                    onChange={(e) =>
                      setFormData({ ...formData, assetType: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Merk / Brand
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: ASUS"
                    value={formData.brand}
                    onChange={(e) =>
                      setFormData({ ...formData, brand: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Kategori
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  >
                    {formCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Kode Barang
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Harga Satuan (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.unitPrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        unitPrice: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Jumlah (Quantity)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantity: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Lokasi Penempatan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Gudang GA"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Tanggal Pembelian
                  </label>
                  <input
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) =>
                      setFormData({ ...formData, purchaseDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Status Awal
                  </label>
                  <input
                    type="text"
                    list="kondisi-options"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  />
                  <datalist id="kondisi-options">
                    <option value="Tersedia" />
                    <option value="Dalam Perbaikan" />
                    <option value="Rusak" />
                  </datalist>
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
                  Simpan Aset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Ubah Aset */}
      {isEditOpen && currentItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-md">Ubah Rincian Aset</h3>
              <button
                onClick={() => setIsEditOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Nama Barang / Aset
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
                    Jenis Aset
                  </label>
                  <input
                    type="text"
                    value={formData.assetType}
                    onChange={(e) =>
                      setFormData({ ...formData, assetType: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Merk / Brand
                  </label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) =>
                      setFormData({ ...formData, brand: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Kategori
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  >
                    {formCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Kode Barang
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Harga Satuan (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.unitPrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        unitPrice: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Jumlah (Quantity)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantity: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Lokasi Penempatan
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Tanggal Pembelian
                  </label>
                  <input
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) =>
                      setFormData({ ...formData, purchaseDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Kondisi
                  </label>
                  <input
                    type="text"
                    list="kondisi-options-edit"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  />
                  <datalist id="kondisi-options-edit">
                    <option value="Tersedia" />
                    <option value="Digunakan" />
                    <option value="Dalam Perbaikan" />
                    <option value="Rusak" />
                  </datalist>
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

      {/* Modal 3: Alokasi Aset Ke Staf */}
      {isAssignOpen && currentItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-md">Alokasikan Aset Ke Staf</h3>
              <button
                onClick={() => setIsAssignOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAssignSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-indigo-50 text-indigo-950 rounded-lg space-y-1 border border-indigo-100/50">
                <span className="text-[10px] uppercase font-bold text-indigo-500 leading-tight block">
                  KETERANGAN ASET
                </span>
                <span className="font-semibold text-sm block leading-normal">
                  {currentItem.name}
                </span>
                <span className="text-xs font-mono text-indigo-600">
                  {currentItem.code} | Kondisi: {currentItem.status}
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Pilih Staf Penerima
                </label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all cursor-pointer"
                >
                  <option value="">
                    -- Letakkan di Gudang (Bebaskan Aset) --
                  </option>
                  {staff.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.role} - {member.department})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Menetapkan staf secara otomatis mengubah status aset menjadi{" "}
                  <strong className="text-slate-500 font-semibold">
                    "Digunakan"
                  </strong>
                  . Menghapusnya akan mengembalikan ke{" "}
                  <strong className="text-slate-500 font-semibold">
                    "Tersedia"
                  </strong>
                  .
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAssignOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 hover:shadow-sm transition-all"
                >
                  Terapkan Alokasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
