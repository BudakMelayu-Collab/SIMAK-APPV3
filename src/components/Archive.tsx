import React, { useState, useRef } from "react";
import { DocumentArchive } from "../types";
import {
  FileText,
  Search,
  Plus,
  Trash2,
  Filter,
  Download,
  X,
  Check,
  FileCode,
  Archive,
  HelpCircle,
  Sparkles,
  Loader2,
} from "lucide-react";

interface ArchiveProps {
  documents: DocumentArchive[];
  onAddDocument: (doc: Omit<DocumentArchive, "id" | "uploadDate">) => void;
  onDeleteDocument: (id: string) => void;
}

export default function DocumentArchiveView({
  documents,
  onAddDocument,
  onDeleteDocument,
}: ArchiveProps) {
  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");

  // Drag-and-drop Highlight State
  const [isDragging, setIsDragging] = useState(false);

  // Dialog State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAlertDownload, setIsAlertDownload] = useState<string | null>(null);

  // Manual Form State
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [manualForm, setManualForm] = useState({
    arsipType: "Naskah Dinas Masuk", // 'Arsip Umum', 'Naskah Dinas Masuk', 'Naskah Dinas Keluar'
    jenisNaskah: "",
    tanggal: "",
    perihal: "",
    name: "",
    category: "Memo/Umum" as const,
    fileSize: "",
    description: "",
    fileType: "pdf",
    tags: "",
  });

  const handleAiSuggest = async (type: "tags" | "summarize") => {
    const textToAnalyze =
      manualForm.arsipType === "Arsip Umum"
        ? manualForm.name + " " + manualForm.description
        : manualForm.jenisNaskah +
          " " +
          manualForm.perihal +
          " " +
          manualForm.description;
    if (!textToAnalyze.trim()) {
      alert("Harap isi deskripsi atau nama/perihal dokumen terlebih dahulu.");
      return;
    }

    setIsGeneratingAi(true);
    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToAnalyze, type }),
      });
      const data = await res.json();
      if (res.ok && data.result) {
        if (type === "tags") {
          setManualForm({ ...manualForm, tags: data.result });
        } else {
          setManualForm({ ...manualForm, description: data.result });
        }
      } else {
        alert(data.error || "Gagal mendapatkan saran AI");
      }
    } catch (e) {
      alert("Terjadi kesalahan dengan server AI");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const categories = [
    "Semua",
    "Laporan",
    "Legal",
    "Keuangan",
    "HR/SOP",
    "Memo/Umum",
  ];
  const formCategories = [
    "Laporan",
    "Legal",
    "Keuangan",
    "HR/SOP",
    "Memo/Umum",
  ];

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter logic
  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "Semua" || doc.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Calculate generic file sizes helper
  const formatBytes = (bytes: number, decimals = 1): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processIncomingFiles(files);
    }
  };

  const handleManualFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processIncomingFiles(files);
    }
  };

  // Process selected or dropped file
  const processIncomingFiles = (files: FileList) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filename = file.name;
      const sizeStr = formatBytes(file.size);

      // Extract file type extension
      const ext = filename.split(".").pop() || "pdf";

      // Guess category based on name
      let guessedCategory: DocumentArchive["category"] = "Memo/Umum";
      const nameLower = filename.toLowerCase();
      if (nameLower.includes("laporan") || nameLower.includes("report")) {
        guessedCategory = "Laporan";
      } else if (
        nameLower.includes("kontrak") ||
        nameLower.includes("perjanjian") ||
        nameLower.includes("legal")
      ) {
        guessedCategory = "Legal";
      } else if (
        nameLower.includes("uangan") ||
        nameLower.includes("rekap") ||
        nameLower.includes("keuangan") ||
        nameLower.includes("finance")
      ) {
        guessedCategory = "Keuangan";
      } else if (
        nameLower.includes("sop") ||
        nameLower.includes("panduan") ||
        nameLower.includes("karyawan") ||
        nameLower.includes("hr")
      ) {
        guessedCategory = "HR/SOP";
      }

      onAddDocument({
        name: filename,
        category: guessedCategory,
        fileSize: sizeStr,
        description: `Berkas fisik asli diunggah mandiri via sirkulasi admin (Format: ${ext.toUpperCase()}).`,
        fileType: ext,
      });
    }

    // Elegant feedback
    setIsAlertDownload(
      "Berkas berhasil diproses dan disimpan ke arsip kantor.",
    );
    setTimeout(() => {
      setIsAlertDownload(null);
    }, 3000);
  };

  const submitManualForm = (e: React.FormEvent) => {
    e.preventDefault();

    let finalName = "";
    let finalDesc = "";

    if (manualForm.arsipType === "Arsip Umum") {
      if (!manualForm.name) return;
      finalName = manualForm.name.endsWith(`.${manualForm.fileType}`)
        ? manualForm.name
        : `${manualForm.name}.${manualForm.fileType}`;
      finalDesc =
        manualForm.description ||
        "Pencatatan rincian dokumen diarsipkan secara manual.";
    } else {
      if (!manualForm.perihal || !manualForm.jenisNaskah) return;
      const formattedName =
        `${manualForm.jenisNaskah}_${manualForm.perihal}`.replace(/\s+/g, "_");
      finalName = formattedName.endsWith(`.${manualForm.fileType}`)
        ? formattedName
        : `${formattedName}.${manualForm.fileType}`;
      finalDesc = `${manualForm.arsipType} - Tanggal: ${manualForm.tanggal} - ${manualForm.description || "Arsip naskah dinas"}`;
    }

    onAddDocument({
      name: finalName,
      category: manualForm.category,
      fileSize: manualForm.fileSize || "Unknown",
      description: finalDesc,
      fileType: manualForm.fileType,
      tags: manualForm.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });

    setIsUploadOpen(false);
    // Reset manual form
    setManualForm({
      arsipType: "Naskah Dinas Masuk",
      jenisNaskah: "",
      tanggal: "",
      perihal: "",
      name: "",
      category: "Memo/Umum",
      fileSize: "",
      description: "",
      fileType: "pdf",
      tags: "",
    });

    setIsAlertDownload("Catatan dokumen manual berhasil ditambahkan.");
    setTimeout(() => {
      setIsAlertDownload(null);
    }, 3000);
  };

  const selectManualUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const triggerSimulatedDownload = (docName: string) => {
    setIsAlertDownload(
      `Mengunduh berkas "${docName}"... Berkas berhasil diunduh ke folder Downloads Anda.`,
    );
    setTimeout(() => {
      setIsAlertDownload(null);
    }, 4500);
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header section with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-indigo-900 via-indigo-700 to-indigo-500 drop-shadow-sm uppercase relative">
            Arsip Dokumen
            <div className="absolute -bottom-1 left-0 w-12 h-1 bg-gradient-to-r from-indigo-800 to-transparent rounded-full border-0"></div>
          </h2>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="relative overflow-hidden group bg-gradient-to-r from-indigo-600 to-indigo-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-[0_4px_12px_-4px_rgba(79,70,229,0.5)] hover:shadow-[0_8px_16px_-4px_rgba(79,70,229,0.7)] transition-all flex items-center space-x-2 uppercase transform hover:-translate-y-0.5"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <Plus className="w-4 h-4 relative z-10" />
          <span className="relative z-10 tracking-wider">Indeks Manual</span>
        </button>
      </div>

      {/* Elegant Toast notification area for sirkulasi */}
      {isAlertDownload && (
        <div className="bg-slate-800 text-white text-[10px] font-bold px-3 py-2 rounded flex items-center justify-between shadow-xl fixed bottom-4 right-4 z-50 max-w-sm">
          <div className="flex items-center space-x-2">
            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{isAlertDownload}</span>
          </div>
          <button
            onClick={() => setIsAlertDownload(null)}
            className="text-slate-400 hover:text-white ml-3"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Drag & Drop Zone + Picker (Flexible usability pattern constraint!) */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={selectManualUpload}
        className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-4 relative group overflow-hidden shadow-sm ${
          isDragging
            ? "border-indigo-400 bg-indigo-50 scale-[0.99]"
            : "border-slate-200 bg-gradient-to-br from-slate-50 to-white hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-900/5"
        }`}
      >
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-100/40 rounded-full blur-3xl group-hover:bg-indigo-300/30 transition-colors"></div>
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-blue-100/40 rounded-full blur-3xl group-hover:bg-blue-300/30 transition-colors"></div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleManualFileSelect}
          className="hidden"
          multiple
        />

        <div
          className={`p-4 rounded-2xl transition-all relative shadow-sm ${isDragging ? "bg-indigo-500 text-white animate-bounce" : "bg-white text-slate-400 group-hover:bg-indigo-500 group-hover:text-white border border-slate-100 group-hover:border-indigo-500"}`}
        >
          <Archive className="w-8 h-8" />
        </div>

        <div className="relative z-10">
          <p className="text-sm font-bold text-slate-800 tracking-tight">
            {isDragging
              ? "Lepaskan Berkas Sekarang!"
              : "Seret & Letakkan Berkas di Sini"}
          </p>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Mendukung PDF, Excel, Word, & Gambar
          </p>
        </div>
      </div>

      {/* Filters & search index area */}
      <div className="bg-white p-3 shadow-md shadow-slate-100 border border-slate-100 rounded-2xl flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1 group">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input
            type="text"
            placeholder="Cari nama atau deskripsi dokumen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-transparent hover:border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all font-sans"
          />
        </div>

        {/* Category select Filter */}
        <div className="flex items-center space-x-2 bg-slate-50 rounded-xl px-2 border border-transparent hover:border-slate-200 transition-all focus-within:border-indigo-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-500/10">
          <Filter className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-transparent border-none text-sm px-2 py-2 focus:outline-none font-semibold text-slate-700 cursor-pointer w-full sm:w-auto min-w-[140px]"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === "Semua" ? "Semua Kategori" : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Documents Grid / Layout cards */}
      <div className="flex-1 overflow-auto">
        {filteredDocs.length === 0 ? (
          <div className="card-container p-8 text-center flex flex-col items-center justify-center h-full">
            <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
              <HelpCircle className="w-5 h-5" />
            </div>
            <p className="mt-2 text-[11px] font-bold text-slate-800">
              Arsip dokumen tidak ditemukan
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredDocs.map((doc) => {
              return (
                <div
                  key={doc.id}
                  className="bg-white rounded-2xl p-5 border border-slate-100 hover:border-indigo-200 shadow-sm hover:shadow-xl hover:shadow-indigo-900/10 cursor-pointer relative group flex flex-col justify-between transition-all transform hover:-translate-y-1 overflow-hidden"
                >
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-slate-50 to-slate-100 rounded-full group-hover:scale-150 transition-transform duration-500 ease-in-out z-0"></div>
                  <div className="space-y-4 relative z-10">
                    <div className="flex items-start justify-between">
                      {/* Unique Category Badge */}
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md tracking-wider ${
                          doc.category === "Laporan"
                            ? "bg-indigo-100 text-indigo-800"
                            : doc.category === "Keuangan"
                              ? "bg-emerald-100 text-emerald-800"
                              : doc.category === "Legal"
                                ? "bg-rose-100 text-rose-800"
                                : doc.category === "HR/SOP"
                                  ? "bg-cyan-100 text-cyan-800"
                                  : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {doc.category}
                      </span>

                      {/* Meta info size */}
                      <span className="text-[10px] text-slate-400 font-mono font-bold bg-slate-50 px-2 py-1 rounded-md">
                        {doc.fileSize}
                      </span>
                    </div>

                    {/* File title */}
                    <div className="flex items-start space-x-3">
                      <div className="p-2.5 bg-gradient-to-br from-slate-50 to-slate-100 text-slate-500 rounded-xl group-hover:from-indigo-500 group-hover:to-indigo-600 group-hover:text-white transition-all shadow-inner shrink-0">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="min-w-0 mt-0.5">
                        <h4
                          className="font-bold text-sm text-slate-800 leading-tight group-hover:text-indigo-700 transition-colors line-clamp-2"
                          title={doc.name}
                        >
                          {doc.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-mono mt-1">
                          {doc.id} &bull; {doc.uploadDate || "24/05/2026"}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-500 leading-relaxed font-sans line-clamp-2">
                      {doc.description}
                    </p>

                    {/* Tags */}
                    {doc.tags && doc.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {doc.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="text-[9px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md"
                          >
                            #{tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card footer options */}
                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between relative z-10">
                    {/* Extension banner */}
                    <span className="text-[10px] font-mono bg-slate-100/80 text-slate-500 px-2.5 py-1 rounded-md font-extrabold uppercase">
                      .{doc.fileType}
                    </span>

                    <div className="flex opacity-0 group-hover:opacity-100 transition-opacity space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerSimulatedDownload(doc.name);
                        }}
                        className="px-3 py-1.5 text-[10px] font-bold text-indigo-700 hover:text-white bg-indigo-50 hover:bg-indigo-600 rounded-lg transition-all"
                        title="Download Dokumen"
                      >
                        Unduh
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            confirm(`Hapus dokumen "${doc.name}" dari arsip?`)
                          ) {
                            onDeleteDocument(doc.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-rose-500 rounded-lg transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Manual Upload Indeksation Dialog */}
      {isUploadOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-md">Indeks Arsip Kertas Manual</h3>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={submitManualForm} className="p-6 space-y-4">
              <div className="p-3 bg-indigo-50/50 border border-indigo-100 text-indigo-950 rounded-lg text-xs leading-normal">
                Gunakan menu ini jika berkas fisik dalam bentuk kertas keras
                (hardcopy) dan Anda hanya ingin mencatatkan metadata penempatan
                pengarsipannya.
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Tipe Arsip
                </label>
                <select
                  value={manualForm.arsipType}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, arsipType: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-sans cursor-pointer"
                >
                  <option value="Arsip Umum">Arsip Umum</option>
                  <option value="Naskah Dinas Masuk">Naskah Dinas Masuk</option>
                  <option value="Naskah Dinas Keluar">
                    Naskah Dinas Keluar
                  </option>
                </select>
              </div>

              {manualForm.arsipType === "Arsip Umum" ? (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Nama Dokumen / Berkas
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Lampiran_MoU_Sewa_Gedung"
                    value={manualForm.name}
                    onChange={(e) =>
                      setManualForm({ ...manualForm, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-sans"
                  />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">
                        Jenis Naskah Dinas
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Surat Edaran"
                        value={manualForm.jenisNaskah}
                        onChange={(e) =>
                          setManualForm({
                            ...manualForm,
                            jenisNaskah: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-sans"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">
                        Tanggal
                      </label>
                      <input
                        type="date"
                        required
                        value={manualForm.tanggal}
                        onChange={(e) =>
                          setManualForm({
                            ...manualForm,
                            tanggal: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-sans"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      Prihal (Hal)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Undangan Rapat Koordinasi"
                      value={manualForm.perihal}
                      onChange={(e) =>
                        setManualForm({
                          ...manualForm,
                          perihal: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-sans"
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Folder Kategori
                  </label>
                  <select
                    value={manualForm.category}
                    onChange={(e) =>
                      setManualForm({
                        ...manualForm,
                        category: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all font-sans cursor-pointer"
                  >
                    {formCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Format Ekstensi
                  </label>
                  <select
                    value={manualForm.fileType}
                    onChange={(e) =>
                      setManualForm({ ...manualForm, fileType: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all font-sans cursor-pointer"
                  >
                    <option value="pdf">PDF (.pdf)</option>
                    <option value="docx">Word (.docx)</option>
                    <option value="xlsx">Excel (.xlsx)</option>
                    <option value="zip">Arsip ZIP (.zip)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Ukuran Taksiran Berkas
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 1.5 MB atau 450 KB"
                    value={manualForm.fileSize}
                    onChange={(e) =>
                      setManualForm({ ...manualForm, fileSize: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Arsip Fisik (Upload File)
                  </label>
                  <input
                    type="file"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all font-sans file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                </div>
              </div>

              <div className="space-y-1 relative">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700">
                    Deskripsi Ringkas Dokumen
                  </label>
                  <button
                    type="button"
                    onClick={() => handleAiSuggest("summarize")}
                    disabled={isGeneratingAi}
                    className="text-[10px] flex items-center space-x-1 font-bold text-indigo-600 hover:text-indigo-800 transition-colors disabled:opacity-50"
                  >
                    {isGeneratingAi ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                    <span>AI Rewrite</span>
                  </button>
                </div>
                <textarea
                  required={manualForm.arsipType === "Arsip Umum"}
                  rows={2}
                  placeholder="Tulis ringkasan isi dokumen atau lokasi penempatan binder fisik di lemari arsip..."
                  value={manualForm.description}
                  onChange={(e) =>
                    setManualForm({
                      ...manualForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-sans"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700">
                    Tag / Label (Pisahkan dengan koma)
                  </label>
                  <button
                    type="button"
                    onClick={() => handleAiSuggest("tags")}
                    disabled={isGeneratingAi}
                    className="text-[10px] flex items-center space-x-1 font-bold text-indigo-600 hover:text-indigo-800 transition-colors disabled:opacity-50"
                  >
                    {isGeneratingAi ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                    <span>AI Generate Tags</span>
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Contoh: hrd, internal, rahasia"
                  value={manualForm.tags}
                  onChange={(e) =>
                    setManualForm({
                      ...manualForm,
                      tags: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-sans"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 hover:shadow-sm transition-all"
                >
                  Arsipkan Dokumen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
