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
  Archive,
  HelpCircle,
  Sparkles,
  Loader2,
  Tag,
  Inbox,
  Users,
  DollarSign,
  Calendar,
  ShieldCheck,
  Eye,
  LayoutGrid,
  List,
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
  const [layoutMode, setLayoutMode] = useState<"grid" | "list">("grid");

  // Manual Form State
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [manualForm, setManualForm] = useState({
    arsipType: "Naskah Dinas Masuk", // 'Arsip Umum', 'Naskah Dinas Masuk', 'Naskah Dinas Keluar'
    jenisNaskah: "",
    tanggal: "",
    perihal: "",
    name: "",
    category: "Arahan (Pengaturan)",
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

  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const baseCategories = [
    "Arahan (Pengaturan)",
    "Arahan (Penetapan)",
    "Arahan (Penugasan)",
    "Korespodensi (Internal)",
    "Korespodensi (Eksternal)",
    "Khusus",
  ];

  const formCategories = [...baseCategories, ...customCategories];
  const categories = ["Semua", ...formCategories];

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
      let guessedCategory: DocumentArchive["category"] = "Khusus";
      const nameLower = filename.toLowerCase();
      if (
        nameLower.includes("atur") ||
        nameLower.includes("aturan") ||
        nameLower.includes("sop") ||
        nameLower.includes("pedoman")
      ) {
        guessedCategory = "Arahan (Pengaturan)";
      } else if (
        nameLower.includes("tetap") ||
        nameLower.includes("keputusan") ||
        nameLower.includes("sk")
      ) {
        guessedCategory = "Arahan (Penetapan)";
      } else if (
        nameLower.includes("tugas") ||
        nameLower.includes("st") ||
        nameLower.includes("perintah")
      ) {
        guessedCategory = "Arahan (Penugasan)";
      } else if (
        nameLower.includes("internal") ||
        nameLower.includes("memo") ||
        nameLower.includes("nota")
      ) {
        guessedCategory = "Korespodensi (Internal)";
      } else if (
        nameLower.includes("eksternal") ||
        nameLower.includes("surat") ||
        nameLower.includes("undangan")
      ) {
        guessedCategory = "Korespodensi (Eksternal)";
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
      category: "Arahan (Pengaturan)",
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
    // Generate a simple blob as the downloaded file content
    const blob = new Blob(
      [
        `Ini adalah isi dari dokumen ${docName}.\n\n(Simulasi dokumen berhasil diunduh)`,
      ],
      { type: "text/plain" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = docName.includes(".") ? docName : `${docName}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setIsAlertDownload(
      `Mengunduh berkas "${docName}"... Berkas berhasil diunduh.`,
    );
    setTimeout(() => {
      setIsAlertDownload(null);
    }, 4500);
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header section with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Arsip Dokumen
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Penyimpanan dokumen, file surat, dan arsip kepegawaian perusahaan.
          </p>
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

        {/* Layout Toggle */}
        <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200 shrink-0">
          <button
            onClick={() => setLayoutMode("grid")}
            className={`p-1.5 rounded-lg transition-all flex items-center justify-center ${layoutMode === "grid" ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:bg-slate-200/50"}`}
            title="Tampilan Grid"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setLayoutMode("list")}
            className={`p-1.5 rounded-lg transition-all flex items-center justify-center ${layoutMode === "list" ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:bg-slate-200/50"}`}
            title="Tampilan List"
          >
            <List className="w-4 h-4" />
          </button>
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
          <div className={layoutMode === "grid" ? "grid grid-cols-1 xl:grid-cols-2 gap-6" : "flex flex-col space-y-4"}>
            {filteredDocs.map((doc) => {
              const baseCat =
                doc.category === "HR/SOP" ? "SOP Kantor" : doc.category;
              
              // Extracted values
              let docDateStr = doc.uploadDate || new Date().toISOString().split("T")[0];
              let docJenisNaskah = "Surat Dinas";
              let docPrihal = doc.name.replace(/\.[^/.]+$/, ""); // remove extension
              let docArsipType = "Arsip Umum";
              let docDescription = doc.description || "Pencatatan rincian dokumen diarsipkan secara manual.";

              if (doc.description && doc.description.includes(" - Tanggal: ")) {
                const descParts = doc.description.split(" - Tanggal: ");
                docArsipType = descParts[0];
                const restPart = descParts.slice(1).join(" - Tanggal: ");
                if (restPart && restPart.includes(" - ")) {
                  docDateStr = restPart.split(" - ")[0];
                  docDescription = restPart.split(" - ").slice(1).join(" - ");
                } else {
                  docDateStr = restPart;
                  docDescription = "-";
                }
              }

              if (doc.name.includes("_")) {
                const nameParts = doc.name.replace(/\.[^/.]+$/, "").split("_");
                docJenisNaskah = nameParts[0].replace(/-/g, " ");
                docPrihal = nameParts.slice(1).join(" ") || doc.name.replace(/\.[^/.]+$/, "");
              } else if (doc.category === "Arahan (Pengaturan)" || doc.category === "Arahan (Penetapan)" || doc.category === "Arahan (Penugasan)") {
                docJenisNaskah = "Naskah Arahan";
              } else if (doc.category.includes("Korespodensi")) {
                docJenisNaskah = "Surat Korespodensi";
              }

              if (docPrihal.length > 40) docPrihal = docPrihal.substring(0, 40) + "...";

              return (
                <div
                  key={doc.id}
                  className={`bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all relative ${layoutMode === "grid" ? "rounded-2xl p-6 flex flex-col space-y-5 h-full" : "rounded-xl p-5 flex flex-col sm:flex-row sm:items-start space-y-4 sm:space-y-0 sm:space-x-6"}`}
                >
                  <div className={layoutMode === "grid" ? "flex-1 flex flex-col" : "flex-1 min-w-0"}>
                    {/* Header Row */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <div className="bg-indigo-50 text-indigo-700 font-bold px-3 py-1 rounded-md text-[10px] sm:text-xs uppercase tracking-wider">
                          {baseCat}
                        </div>
                        <div className="bg-slate-100 text-slate-600 font-bold px-3 py-1 rounded-md text-[10px] sm:text-xs tracking-wider">
                          {docArsipType}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 text-slate-400">
                        <span className="text-xs font-mono">{docDateStr}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Hapus dokumen "${doc.name}" dari arsip?`)) {
                              onDeleteDocument(doc.id);
                            }
                          }}
                          className="hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-extrabold text-slate-800 leading-tight mb-4">
                      {docJenisNaskah}
                    </h3>

                    {/* Meta Info Box */}
                    <div className={`bg-slate-50/70 border border-slate-100 rounded-xl p-4 grid gap-4 mb-4 ${layoutMode === "grid" ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-3"}`}>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                          Prihal
                        </p>
                        <p className="text-sm font-semibold text-slate-700 break-words">
                          {docPrihal}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                          Jenis Naskah
                        </p>
                        <p className="text-sm font-semibold text-slate-700 flex items-center space-x-2">
                          <Inbox className="w-4 h-4 text-blue-500" />
                          <span>{docJenisNaskah}</span>
                        </p>
                      </div>
                      <div className={layoutMode === "grid" ? "col-span-2" : ""}>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                          Deskripsi Ringkas
                        </p>
                        <p className="text-xs font-medium text-slate-600 leading-relaxed">
                          {docDescription}
                        </p>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {doc.tags && doc.tags.length > 0 ? (
                        doc.tags.map((t) => (
                          <span
                            key={t}
                            className="flex items-center space-x-1.5 border border-slate-200 text-slate-600 bg-white px-2 py-1 rounded text-[10px] font-semibold uppercase"
                          >
                            <Tag className="w-3 h-3 text-slate-400" />
                            <span>{t}</span>
                          </span>
                        ))
                      ) : (
                        <>
                          <span className="flex items-center space-x-1.5 border border-slate-200 text-slate-600 bg-white px-2 py-1 rounded text-[10px] font-semibold uppercase ">
                            <Tag className="w-3 h-3 text-slate-400" />
                            <span>Umum</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className={layoutMode === "grid" ? "mt-auto" : "w-full sm:w-64 shrink-0 flex flex-col justify-between"}>
                    <div className="mb-4">
                      {/* Berkas Naskah Text */}
                      <h4 className="text-[13px] font-medium text-slate-500 mb-2">
                        Berkas Naskah
                      </h4>

                      {/* File Info Card */}
                      <div className="border border-dashed border-slate-300 bg-slate-50/30 rounded-xl p-3 flex items-center justify-between">
                        <div className="flex items-center space-x-3 overflow-hidden pr-3">
                          <div className="bg-blue-50 text-blue-600 font-extrabold text-[10px] px-2.5 py-1.5 rounded-lg shrink-0">
                            {doc.fileType.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-700 truncate">
                              {doc.name}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {doc.fileSize}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerSimulatedDownload(doc.name);
                          }}
                          className="shrink-0 p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <button className="flex items-center space-x-2 text-slate-600 hover:text-indigo-600 font-bold text-xs transition-colors">
                        <Eye className="w-4 h-4" />
                        <span>Intip Naskah Asli</span>
                      </button>
                      <span className="border border-emerald-200 text-emerald-600 bg-emerald-50 font-bold px-3 py-1 rounded-full text-xs">
                        Aktif
                      </span>
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
          <div className="bg-white rounded-xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-md">Indeks Arsip Kertas Manual</h3>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={submitManualForm} className="p-6 space-y-4 overflow-y-auto">
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
                  <label className="text-xs font-bold text-slate-700 flex justify-between items-center">
                    <span>Folder Kategori</span>
                    {!isAddingCategory && (
                      <button
                        type="button"
                        onClick={() => setIsAddingCategory(true)}
                        className="text-indigo-600 hover:text-indigo-700 flex items-center space-x-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span className="text-[10px]">Folder Baru</span>
                      </button>
                    )}
                  </label>
                  {isAddingCategory ? (
                    <div className="flex flex-col space-y-2">
                      <input
                        type="text"
                        placeholder="Nama folder baru..."
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all font-sans"
                        autoFocus
                      />
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (newCategoryName.trim()) {
                              setCustomCategories([
                                ...customCategories,
                                newCategoryName.trim(),
                              ]);
                              setManualForm({
                                ...manualForm,
                                category: newCategoryName.trim(),
                              });
                              setNewCategoryName("");
                              setIsAddingCategory(false);
                            }
                          }}
                          className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 font-semibold"
                        >
                          Simpan
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingCategory(false);
                            setNewCategoryName("");
                          }}
                          className="flex-1 px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm hover:bg-slate-200 font-semibold"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : (
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
                  )}
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

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Arsip Fisik (Upload File)
                </label>
                <input
                  type="file"
                  onChange={(e) => {
                     const file = e.target.files?.[0];
                     if (file) {
                        const ext = file.name.split('.').pop() || 'pdf';
                        setManualForm({
                           ...manualForm,
                           fileSize: formatBytes(file.size),
                           fileType: ext
                        });
                     }
                  }}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all font-sans file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>

              <div className="space-y-1 relative">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700">
                    Deskripsi Ringkas Dokumen
                  </label>
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
