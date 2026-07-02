import React, { useState, useRef, useEffect } from "react";
import { DocumentArchive } from "../types";
import * as mammoth from "mammoth";
import * as XLSX from "xlsx";
import { supabase } from "../supabase";
import Swal from "sweetalert2";
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
  ChevronRight,
  ChevronDown,
} from "lucide-react";

const getBadgeColor = (text: string) => {
  if (!text) return 'bg-slate-100 text-slate-700 border border-slate-200';
  
  const textLower = text.toLowerCase();
  
  if (textLower.includes('sop') || textLower.includes('standar')) return 'bg-blue-50 text-blue-700 border border-blue-200';
  if (textLower.includes('pengaturan')) return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
  if (textLower.includes('penetapan')) return 'bg-purple-50 text-purple-700 border border-purple-200';
  if (textLower.includes('penugasan')) return 'bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200';
  if (textLower.includes('internal')) return 'bg-teal-50 text-teal-700 border border-teal-200';
  if (textLower.includes('eksternal')) return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  if (textLower.includes('khusus')) return 'bg-rose-50 text-rose-700 border border-rose-200';
  
  if (textLower.includes('vital')) return 'bg-red-50 text-red-700 border border-red-200';
  if (textLower.includes('terjaga')) return 'bg-amber-50 text-amber-700 border border-amber-200';
  if (textLower.includes('umum')) return 'bg-slate-50 text-slate-700 border border-slate-200';

  const hash = text.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
  const colorList = [
    'bg-blue-50 text-blue-700 border border-blue-200', 
    'bg-green-50 text-green-700 border border-green-200', 
    'bg-yellow-50 text-yellow-700 border border-yellow-200', 
    'bg-purple-50 text-purple-700 border border-purple-200', 
    'bg-pink-50 text-pink-700 border border-pink-200', 
    'bg-indigo-50 text-indigo-700 border border-indigo-200', 
    'bg-teal-50 text-teal-700 border border-teal-200', 
    'bg-orange-50 text-orange-700 border border-orange-200'
  ];
  return colorList[hash % colorList.length];
};

const getFileTypeBadgeColor = (type: string) => {
  if (!type) return 'bg-slate-100 text-slate-600 border border-slate-200';
  const t = type.toLowerCase();
  if (['pdf'].includes(t)) return 'bg-red-50 text-red-700 border border-red-200';
  if (['doc', 'docx'].includes(t)) return 'bg-blue-50 text-blue-700 border border-blue-200';
  if (['xls', 'xlsx', 'csv'].includes(t)) return 'bg-green-50 text-green-700 border border-green-200';
  if (['ppt', 'pptx'].includes(t)) return 'bg-orange-50 text-orange-700 border border-orange-200';
  if (['jpg', 'jpeg', 'png', 'svg', 'webp'].includes(t)) return 'bg-purple-50 text-purple-700 border border-purple-200';
  return 'bg-slate-100 text-slate-600 border border-slate-200';
};

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
  const [selectedDate, setSelectedDate] = useState("Semua");

  // Drag-and-drop Highlight State
  const [isDragging, setIsDragging] = useState(false);

  // Dialog State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAlertDownload, setIsAlertDownload] = useState<string | null>(null);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const [documentToPreview, setDocumentToPreview] = useState<DocumentArchive | null>(null);
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Manual Form State
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [manualForm, setManualForm] = useState({
    arsipType: "Naskah Dinas Masuk", // 'Arsip Umum', 'Naskah Dinas Masuk', 'Naskah Dinas Keluar'
    jenisNaskah: "",
    tanggal: "",
    perihal: "",
    category: "Arahan (Pengaturan)",
    fileSize: "",
    description: "",
    fileType: "pdf",
    tags: "",
    originalFileName: "",
    fileUrl: "",
    noSurats: [] as string[],
    descriptions: [] as string[],
    tagsList: [] as string[],
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

  // Date formatting helper
  const formatDateForDisplay = (isoDate: string) => {
    if (!isoDate) return "";
    const parts = isoDate.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoDate;
  };

  // Filter logic
  const docsForDateCounting = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "Semua" || doc.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Helper to extract actual document date (including from metadata)
  const getDocDate = (doc: DocumentArchive) => {
    let docDateStr = doc.uploadDate || new Date().toISOString().split("T")[0];
    if (doc.description && doc.description.startsWith("JSON_META:")) {
      try {
        const meta = JSON.parse(doc.description.substring(10));
        if (meta.tanggal) docDateStr = meta.tanggal;
      } catch (e) {}
    }
    return docDateStr;
  };

  const dateCounts = docsForDateCounting.reduce((acc, doc) => {
    const docDate = getDocDate(doc);
    const displayDate = formatDateForDisplay(docDate);
    acc[displayDate] = (acc[displayDate] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const filteredDocs = docsForDateCounting.filter((doc) => {
    const docDate = getDocDate(doc);
    const displayDate = formatDateForDisplay(docDate);
    return selectedDate === "Semua" || displayDate === selectedDate;
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
    const fileArray = Array.from(files);
    setSelectedFiles(fileArray);
    
    if (fileArray.length > 0) {
       const firstFile = fileArray[0];
       const filename = firstFile.name;
       const ext = filename.split(".").pop() || "pdf";
       
       let guessedCategory: DocumentArchive["category"] = "Khusus";
       const nameLower = filename.toLowerCase();
       if (nameLower.includes("atur") || nameLower.includes("aturan") || nameLower.includes("sop") || nameLower.includes("pedoman")) {
          guessedCategory = "Arahan (Pengaturan)";
       } else if (nameLower.includes("tetap") || nameLower.includes("keputusan") || nameLower.includes("sk")) {
          guessedCategory = "Arahan (Penetapan)";
       } else if (nameLower.includes("tugas") || nameLower.includes("st") || nameLower.includes("perintah")) {
          guessedCategory = "Arahan (Penugasan)";
       } else if (nameLower.includes("internal") || nameLower.includes("memo") || nameLower.includes("nota")) {
          guessedCategory = "Korespodensi (Internal)";
       } else if (nameLower.includes("eksternal") || nameLower.includes("surat") || nameLower.includes("undangan")) {
          guessedCategory = "Korespodensi (Eksternal)";
       }
       
       setManualForm({
          ...manualForm,
          fileSize: formatBytes(firstFile.size),
          fileType: ext,
          originalFileName: filename,
          perihal: filename.replace(/\.[^/.]+$/, ""),
          category: guessedCategory
       });
       
       setIsUploadOpen(true);
    }
  };

  const submitManualForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!manualForm.perihal || !manualForm.jenisNaskah) return;
    
    setIsUploadingFiles(true);
    let uploadedFilesData: {name: string, size: string, type: string, url: string}[] = [];
    const totalFiles = selectedFiles.length;

    Swal.fire({
      toast: true,
      position: 'bottom-end',
      title: 'Mengarsipkan Dokumen',
      html: `Menyiapkan pengunggahan...<br><br><div class="w-full bg-slate-200 rounded-full h-1.5 mt-2"><div class="bg-indigo-600 h-1.5 rounded-full" style="width: 0%"></div></div>`,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    
    try {
       // Attempt to create the bucket if it doesn't exist (might fail depending on RLS, but safe to try)
       await supabase.storage.createBucket('documents', { public: true });
    } catch (e) {
       // Ignore error, bucket might already exist or we don't have permission to create it from client
    }
    
    try {
       for (let i = 0; i < totalFiles; i++) {
          const file = selectedFiles[i];
          const progressPercent = Math.round(((i) / Math.max(1, totalFiles)) * 100);
          
          Swal.update({
            html: `Mengunggah berkas ${i + 1} dari ${totalFiles}...<br><br><div class="w-full bg-slate-200 rounded-full h-1.5 mt-2 transition-all duration-300"><div class="bg-indigo-600 h-1.5 rounded-full" style="width: ${progressPercent}%"></div></div>`
          });

          const fileExt = file.name.split('.').pop() || '';
          const fileName = `DOC-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `${fileName}`;
          
          let publicUrl = "";
          try {
            const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, file);
            if (uploadError) throw uploadError;
            const { data } = supabase.storage.from('documents').getPublicUrl(filePath);
            publicUrl = data.publicUrl;
          } catch (storageErr: any) {
            console.warn(`Gagal mengunggah ke Supabase Storage (${storageErr.message}), beralih ke penyimpanan lokal sementara.`);
            publicUrl = URL.createObjectURL(file); // Fallback to ephemeral URL
          }
          
          uploadedFilesData.push({
             name: file.name,
             size: formatBytes(file.size),
             type: fileExt,
             url: publicUrl
          });
       }
       
       Swal.update({
         html: `Menyelesaikan pengarsipan...<br><br><div class="w-full bg-slate-200 rounded-full h-1.5 mt-2 transition-all duration-300"><div class="bg-indigo-600 h-1.5 rounded-full" style="width: 100%"></div></div>`
       });
       
    } catch (error: any) {
       console.error("Error processing files:", error);
       Swal.fire({
         toast: true,
         position: 'bottom-end',
         icon: 'error',
         title: 'Gagal Mengarsipkan',
         text: `Gagal memproses berkas: ${error.message || "Kesalahan tidak diketahui"}`,
         showConfirmButton: false,
         timer: 4000
       });
       setIsUploadingFiles(false);
       return;
    }
    
    // finalName will just be the file name if uploaded, or a generated name
    let finalName = `Berkas_Fisik_${Date.now()}.${manualForm.fileType}`;
    if (manualForm.originalFileName) {
      finalName = manualForm.originalFileName;
    } else if (uploadedFilesData.length > 0) {
      finalName = uploadedFilesData[0].name;
    }
      
    // Store all metadata into description as JSON
    const metadata: any = {
      arsipType: manualForm.arsipType,
      tanggal: manualForm.tanggal,
      jenisNaskah: manualForm.jenisNaskah,
      perihal: manualForm.perihal,
      noSurats: manualForm.noSurats,
      descriptions: manualForm.descriptions,
      tagsList: manualForm.tagsList,
      originalFileName: manualForm.originalFileName || (uploadedFilesData.length > 0 ? uploadedFilesData[0].name : ""),
      notes: manualForm.description || "Arsip naskah dinas"
    };

    if (uploadedFilesData.length > 0) {
      metadata.files = uploadedFilesData;
    }

    onAddDocument({
      name: finalName,
      category: manualForm.category,
      fileSize: uploadedFilesData.length > 0 ? uploadedFilesData[0].size : (manualForm.fileSize || "Unknown"),
      description: "JSON_META:" + JSON.stringify(metadata),
      fileType: uploadedFilesData.length > 0 ? uploadedFilesData[0].type : manualForm.fileType,
      fileUrl: uploadedFilesData.length > 0 ? uploadedFilesData[0].url : manualForm.fileUrl,
      files: uploadedFilesData,
      tags: manualForm.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });

    setIsUploadOpen(false);
    setIsUploadingFiles(false);
    setSelectedFiles([]);
    // Reset manual form
    setManualForm({
      arsipType: "Naskah Dinas Masuk",
      jenisNaskah: "",
      tanggal: "",
      perihal: "",
      category: "Arahan (Pengaturan)",
      fileSize: "",
      description: "",
      fileType: "pdf",
      tags: "",
      originalFileName: "",
      fileUrl: "",
      noSurats: [] as string[],
      descriptions: [] as string[],
      tagsList: [] as string[],
    });

    Swal.fire({
      toast: true,
      position: 'bottom-end',
      icon: 'success',
      title: 'Berhasil diarsipkan',
      text: 'Catatan dokumen manual berhasil ditambahkan.',
      timer: 3000,
      showConfirmButton: false
    });
  };

  const selectManualUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const triggerDownload = (doc: DocumentArchive) => {
    const downloadFile = (url: string, filename: string) => {
      try {
        const downloadUrl = url.includes('supabase.co') && !url.includes('?download=') 
            ? `${url}?download=` 
            : url;
            
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = filename;
        a.target = "_blank"; // Open in top window to bypass iframe download restrictions
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (e) {
        console.error("Gagal mengunduh berkas", e);
      }
    };

    if (doc.files && doc.files.length > 0) {
      doc.files.forEach((f, index) => {
         downloadFile(f.url, f.name);
      });
      setIsAlertDownload(`Mengunduh ${doc.files.length} berkas...`);
      setTimeout(() => {
        setIsAlertDownload(null);
      }, 4500);
      return;
    }

    if (doc.fileUrl) {
      downloadFile(doc.fileUrl, doc.name);
      setIsAlertDownload(`Mengunduh berkas "${doc.name}"...`);
      setTimeout(() => {
        setIsAlertDownload(null);
      }, 4500);
      return;
    }

    // Generate a simple blob as the downloaded file content
    const blob = new Blob(
      [
        `[BERKAS SIMULASI]\n\nIni adalah isi dari dokumen ${doc.name}.\n\n(Catatan: Berkas ini adalah simulasi karena file asli tidak tersedia pada mode penyimpanan saat ini. Jika Anda mengunggah file sebelumnya dan memuat ulang halaman, file fisik tidak tersimpan di server database simulasi.)`,
      ],
      { type: "text/plain" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    
    // Always force .txt extension to prevent Office programs from trying to parse it as docx/xlsx
    const baseName = doc.name.replace(/\.[^/.]+$/, "");
    a.download = `${baseName}_simulasi.txt`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setIsAlertDownload(
      `Mengunduh berkas simulasi "${a.download}"...`,
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

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Left Side Panel */}
        <div className="hidden md:flex w-56 shrink-0 bg-white border border-slate-200 rounded-2xl flex-col p-4 shadow-sm overflow-y-auto">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Filter Tanggal</h3>
          
          <div className="space-y-1">
            <button 
              onClick={() => setSelectedDate("Semua")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm font-medium border ${
                selectedDate === "Semua" 
                  ? "bg-indigo-50 text-indigo-700 border-indigo-100" 
                  : "text-slate-600 hover:bg-slate-50 border-transparent"
              }`}
            >
              <span>Semua Tanggal</span>
              <span className={`text-[10px] py-0.5 px-2 rounded-full font-bold shadow-sm ${
                selectedDate === "Semua" ? "bg-white text-indigo-700" : "bg-slate-100 text-slate-500"
              }`}>
                {docsForDateCounting.length}
              </span>
            </button>
            {Object.entries(dateCounts).map(([dateStr, count]) => (
              <button 
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm font-medium border ${
                  selectedDate === dateStr
                    ? "bg-indigo-50 text-indigo-700 border-indigo-100"
                    : "text-slate-600 hover:bg-slate-50 border-transparent"
                }`}
              >
                <span>{dateStr}</span>
                <span className={`text-[10px] py-0.5 px-2 rounded-full font-bold ${
                  selectedDate === dateStr ? "bg-white text-indigo-700 shadow-sm" : "bg-slate-100 text-slate-500"
                }`}>
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col space-y-4 min-w-0">
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
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 transition-all font-sans"
          />
        </div>

        {/* Category select Filter */}
        <div className="flex items-center space-x-2 bg-white rounded-xl px-2 border border-slate-200 transition-all focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-500/10">
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
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white border-b border-slate-200 text-slate-700">
                  <tr>
                    <th className="px-6 py-4 font-semibold w-10">
                      <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                    </th>
                    <th className="px-6 py-4 font-semibold w-10">No</th>
                    <th className="px-6 py-4 font-semibold w-10"></th>
                    <th className="px-6 py-4 font-semibold">Tanggal</th>
                    <th className="px-6 py-4 font-semibold">Tipe Arsip</th>
                    <th className="px-6 py-4 font-semibold">Kategori</th>
                    <th className="px-6 py-4 font-semibold">Perihal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDocs.map((doc, index) => {
                    const baseCat = doc.category === "HR/SOP" ? "SOP Kantor" : doc.category;
                    
                    let docDateStr = doc.uploadDate || new Date().toISOString().split("T")[0];
                    let docJenisNaskah = "Surat Dinas";
                    let docPrihal = doc.name.replace(/\.[^/.]+$/, ""); // remove extension
                    let docArsipType = "Arsip Umum";
                    let docDescription = doc.description || "Pencatatan rincian dokumen diarsipkan secara manual.";
                    let displayedFileName = doc.name;
                    let docNoSurats: string[] = [];
                    let docDescriptions: string[] = [];
                    let docTagsList: string[] = [];

                    if (doc.description && doc.description.startsWith("JSON_META:")) {
                      try {
                        const meta = JSON.parse(doc.description.substring(10));
                        docArsipType = meta.arsipType || docArsipType;
                        docDateStr = meta.tanggal || docDateStr;
                        docJenisNaskah = meta.jenisNaskah || docJenisNaskah;
                        docPrihal = meta.perihal || docPrihal;
                        docDescription = meta.notes || "";
                        if (meta.noSurats && Array.isArray(meta.noSurats)) {
                           docNoSurats = meta.noSurats;
                        }
                        if (meta.descriptions && Array.isArray(meta.descriptions)) {
                           docDescriptions = meta.descriptions;
                        }
                        if (meta.tagsList && Array.isArray(meta.tagsList)) {
                           docTagsList = meta.tagsList;
                        }
                        if (meta.originalFileName) {
                           displayedFileName = meta.originalFileName;
                        } else {
                           displayedFileName = "";
                        }
                      } catch (e) {
                        console.error(e);
                      }
                    } else if (doc.description && doc.description.includes(" - Tanggal: ")) {
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
                      
                      if (doc.name.includes("_")) {
                        const nameParts = doc.name.replace(/\.[^/.]+$/, "").split("_");
                        docJenisNaskah = nameParts[0].replace(/-/g, " ");
                        docPrihal = nameParts.slice(1).join(" ") || doc.name.replace(/\.[^/.]+$/, "");
                      }
                    } else {
                      if (doc.description && doc.description.includes("Berkas fisik asli diunggah mandiri")) {
                        docJenisNaskah = "Arsip Digital";
                        // Restore reading the file name for perihal when directly uploaded
                        docPrihal = doc.name.replace(/\.[^/.]+$/, "");
                        displayedFileName = doc.name;
                      } else if (doc.name.includes("_")) {
                        const nameParts = doc.name.replace(/\.[^/.]+$/, "").split("_");
                        docJenisNaskah = nameParts[0].replace(/-/g, " ");
                        docPrihal = nameParts.slice(1).join(" ") || doc.name.replace(/\.[^/.]+$/, "");
                      } else if (doc.category === "Arahan (Pengaturan)" || doc.category === "Arahan (Penetapan)" || doc.category === "Arahan (Penugasan)") {
                        docJenisNaskah = "Naskah Arahan";
                      } else if (doc.category.includes("Korespodensi")) {
                        docJenisNaskah = "Surat Korespodensi";
                      }
                    }

                    if (docPrihal.length > 40) docPrihal = docPrihal.substring(0, 40) + "...";

                    return (
                      <React.Fragment key={doc.id}>
                        <tr 
                          className="hover:bg-slate-50 transition-colors cursor-pointer"
                          onClick={() => setExpandedRows(prev => ({...prev, [doc.id]: prev[doc.id] === false ? true : false}))}
                        >
                          <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                            <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                          </td>
                          <td className="px-6 py-4 text-slate-700 text-sm">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 text-slate-400">
                            {expandedRows[doc.id] !== false ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                          </td>
                          <td className="px-6 py-4 text-slate-700 text-sm">
                            {docDateStr}
                          </td>
                          <td className="px-6 py-4 text-slate-700 text-sm">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getBadgeColor(docArsipType)}`}>
                              {docArsipType}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-700 text-sm">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getBadgeColor(baseCat)}`}>
                              {baseCat}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-700 text-sm">
                            <p className="break-words" title={docPrihal}>{docPrihal}</p>
                          </td>
                        </tr>
                        {expandedRows[doc.id] !== false && (
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <td colSpan={8} className="px-6 py-4">
                              <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left text-sm">
                                    <thead className="bg-white border-b border-slate-200 text-slate-700">
                                      <tr>
                                        <th className="px-4 py-2 font-semibold w-10">
                                          <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                                        </th>
                                        <th className="px-4 py-2 font-semibold w-10">No</th>
                                        <th className="px-4 py-2 font-semibold">Jenis Naskah</th>
                                        <th className="px-4 py-2 font-semibold">No Surat</th>
                                        <th className="px-4 py-2 font-semibold">Deskripsi</th>
                                        <th className="px-4 py-2 font-semibold">Tags</th>
                                        <th className="px-4 py-2 font-semibold">Berkas</th>
                                        <th className="px-4 py-2 font-semibold text-right">Aksi</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      <tr>
                                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                          <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                                        </td>
                                        <td className="px-4 py-3 text-slate-700 text-sm">
                                          1
                                        </td>
                                        <td className="px-4 py-3 text-slate-700 text-sm">
                                          {docJenisNaskah}
                                        </td>
                                        <td className="px-4 py-3 text-slate-700 text-sm">
                                          {doc.files && doc.files.length > 0 ? (
                                            <div className="flex flex-col gap-2">
                                              {doc.files.map((f, i) => (
                                                <div key={i} className="h-6 flex items-center">
                                                  <span className="truncate" title={docNoSurats[i] || "-"}>{docNoSurats[i] || "-"}</span>
                                                </div>
                                              ))}
                                            </div>
                                          ) : (
                                            <div className="h-6 flex items-center">
                                              <span className="truncate" title={docNoSurats[0] || "-"}>{docNoSurats[0] || "-"}</span>
                                            </div>
                                          )}
                                        </td>
                                        <td className="px-4 py-3 text-slate-700 text-sm">
                                          {doc.files && doc.files.length > 0 ? (
                                            <div className="flex flex-col gap-2">
                                              {doc.files.map((f, i) => (
                                                <div key={i} className="h-6 flex items-center">
                                                  <span className="truncate" title={docDescriptions[i] || docDescription || "-"}>{docDescriptions[i] || docDescription || "-"}</span>
                                                </div>
                                              ))}
                                            </div>
                                          ) : (
                                            <div className="h-6 flex items-center">
                                              <span className="truncate" title={docDescriptions[0] || docDescription || "-"}>{docDescriptions[0] || docDescription || "-"}</span>
                                            </div>
                                          )}
                                        </td>
                                        <td className="px-4 py-3 text-slate-700 text-sm">
                                          {doc.files && doc.files.length > 0 ? (
                                            <div className="flex flex-col gap-2">
                                              {doc.files.map((f, i) => (
                                                <div key={i} className="h-6 flex items-center">
                                                  <span className="truncate" title={docTagsList[i] || doc.tags?.join(", ") || "-"}>{docTagsList[i] || doc.tags?.join(", ") || "-"}</span>
                                                </div>
                                              ))}
                                            </div>
                                          ) : (
                                            <div className="h-6 flex items-center">
                                              <span className="truncate" title={docTagsList[0] || doc.tags?.join(", ") || "-"}>{docTagsList[0] || doc.tags?.join(", ") || "-"}</span>
                                            </div>
                                          )}
                                        </td>
                                        <td className="px-4 py-3 text-slate-700 text-sm">
                                          {doc.files && doc.files.length > 0 ? (
                                            <div className="flex flex-col gap-2">
                                               {doc.files.map((f, i) => (
                                                 <div key={i} className="flex items-center gap-2 h-6 w-full max-w-[200px]">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold shrink-0 uppercase ${getFileTypeBadgeColor(f.type)}`}>
                                                      {f.type}
                                                    </span>
                                                    <span className="break-words line-clamp-1 flex-1" title={f.name}>{f.name.replace(/\.[^/.]+$/, "")}</span>
                                                    <button
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        triggerDownload({ ...doc, files: [f], fileUrl: f.url, name: f.name });
                                                      }}
                                                      className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                                                      title="Unduh Berkas Ini"
                                                    >
                                                      <Download className="w-3.5 h-3.5" />
                                                    </button>
                                                 </div>
                                               ))}
                                            </div>
                                          ) : displayedFileName ? (
                                            <div className="flex items-center gap-2 h-6 w-full max-w-[200px]">
                                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold shrink-0 uppercase ${getFileTypeBadgeColor(doc.fileType)}`}>
                                                {doc.fileType}
                                              </span>
                                              <span className="break-words line-clamp-1 flex-1" title={displayedFileName}>{displayedFileName.replace(/\.[^/.]+$/, "")}</span>
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  triggerDownload(doc);
                                                }}
                                                className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                                                title="Unduh Berkas Ini"
                                              >
                                                <Download className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                          ) : (
                                            <span className="text-slate-400 italic text-xs h-6 flex items-center">Tidak ada berkas fisik</span>
                                          )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                          <div className="flex justify-end space-x-2">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setActivePreviewIndex(0);
                                                setDocumentToPreview(doc);
                                              }}
                                              className="p-1.5 text-slate-500 hover:text-indigo-600 transition-colors bg-white border border-slate-200 rounded hover:bg-slate-50"
                                              title="Intip Naskah Asli"
                                            >
                                              <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                triggerDownload(doc);
                                              }}
                                              className="p-1.5 text-slate-500 hover:text-indigo-600 transition-colors bg-white border border-slate-200 rounded hover:bg-slate-50"
                                              title="Unduh"
                                            >
                                              <Download className="w-4 h-4" />
                                            </button>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setDocumentToDelete(doc.id);
                                              }}
                                              className="p-1.5 text-slate-500 hover:text-rose-500 transition-colors bg-white border border-slate-200 rounded hover:bg-rose-50"
                                              title="Hapus"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
        </div>
      </div>

      {documentToPreview && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setDocumentToPreview(null)}>
          <div className="bg-slate-200 rounded-xl shadow-2xl border border-slate-300 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            {/* Toolbar */}
            <div className="bg-slate-800 text-white px-4 py-3 flex items-center justify-between shrink-0 shadow-sm z-10">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 border-r border-slate-600 pr-4">
                  <FileText className="w-5 h-5 text-slate-300" />
                  <span className="font-medium text-sm max-w-md truncate">{documentToPreview.name}</span>
                </div>
                <span className="text-xs text-slate-400 font-mono bg-slate-900 px-2 py-1 rounded">
                  {documentToPreview.fileSize} • {documentToPreview.fileType.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => triggerDownload(documentToPreview)}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Asli</span>
                </button>
                <div className="w-px h-6 bg-slate-600 mx-1"></div>
                <button
                  onClick={() => setDocumentToPreview(null)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                  title="Tutup Pratinjau"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Document Viewer Area */}
            <div className="flex-1 overflow-auto p-4 sm:p-8 flex justify-center bg-slate-200/50">
              <div className="bg-white shadow-md w-full max-w-4xl p-6 sm:p-8 flex flex-col rounded-lg">
                {(() => {
                  let docDateStr = documentToPreview.uploadDate || new Date().toISOString().split("T")[0];
                  let docJenisNaskah = "Surat Dinas";
                  let docPrihal = documentToPreview.name.replace(/\.[^/.]+$/, ""); // remove extension
                  let docArsipType = "Arsip Umum";
                  let docDescription = documentToPreview.description || "Pencatatan rincian dokumen diarsipkan secara manual.";
                  let displayedFileName = documentToPreview.name;
                  let baseCat = documentToPreview.category === "HR/SOP" ? "SOP Kantor" : documentToPreview.category;

                  if (documentToPreview.description && documentToPreview.description.startsWith("JSON_META:")) {
                    try {
                      const meta = JSON.parse(documentToPreview.description.substring(10));
                      docArsipType = meta.arsipType || docArsipType;
                      docDateStr = meta.tanggal || docDateStr;
                      docJenisNaskah = meta.jenisNaskah || docJenisNaskah;
                      docPrihal = meta.perihal || docPrihal;
                      docDescription = meta.notes || "";
                      if (meta.originalFileName) {
                         displayedFileName = meta.originalFileName;
                      } else {
                         displayedFileName = "";
                      }
                    } catch (e) {
                      console.error(e);
                    }
                  } else if (documentToPreview.description && documentToPreview.description.includes(" - Tanggal: ")) {
                    const descParts = documentToPreview.description.split(" - Tanggal: ");
                    docArsipType = descParts[0];
                    const restPart = descParts.slice(1).join(" - Tanggal: ");
                    if (restPart && restPart.includes(" - ")) {
                      docDateStr = restPart.split(" - ")[0];
                      docDescription = restPart.split(" - ").slice(1).join(" - ");
                    } else {
                      docDateStr = restPart;
                      docDescription = "-";
                    }
                    
                    if (documentToPreview.name.includes("_")) {
                      const nameParts = documentToPreview.name.replace(/\.[^/.]+$/, "").split("_");
                      docJenisNaskah = nameParts[0].replace(/-/g, " ");
                      docPrihal = nameParts.slice(1).join(" ") || documentToPreview.name.replace(/\.[^/.]+$/, "");
                    }
                  } else {
                    if (documentToPreview.description && documentToPreview.description.includes("Berkas fisik asli diunggah mandiri")) {
                      docJenisNaskah = "Arsip Digital";
                      docPrihal = documentToPreview.name.replace(/\.[^/.]+$/, "");
                      displayedFileName = documentToPreview.name;
                    } else if (documentToPreview.name.includes("_")) {
                      const nameParts = documentToPreview.name.replace(/\.[^/.]+$/, "").split("_");
                      docJenisNaskah = nameParts[0].replace(/-/g, " ");
                      docPrihal = nameParts.slice(1).join(" ") || documentToPreview.name.replace(/\.[^/.]+$/, "");
                    } else if (documentToPreview.category === "Arahan (Pengaturan)" || documentToPreview.category === "Arahan (Penetapan)" || documentToPreview.category === "Arahan (Penugasan)") {
                      docJenisNaskah = "Naskah Arahan";
                    } else if (documentToPreview.category.includes("Korespodensi")) {
                      docJenisNaskah = "Surat Korespodensi";
                    }
                  }

                  return (
                    <div className="mb-6 flex flex-col h-full">
                       <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">Informasi Arsip</h3>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-6 text-sm text-slate-600">
                          <div>
                            <span className="font-semibold text-slate-400 text-xs uppercase tracking-wider block mb-1">Nama Berkas</span>
                            <span className="text-slate-800 break-words">{displayedFileName || documentToPreview.name}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-slate-400 text-xs uppercase tracking-wider block mb-1">Kategori & Tipe</span>
                            <span className="text-slate-800 inline-flex items-center gap-1.5"><span className={`px-2 py-0.5 rounded-md ${getBadgeColor(baseCat)}`}>{baseCat}</span> <span className="text-slate-400">•</span> <span className={`px-2 py-0.5 rounded-md ${getBadgeColor(docArsipType)}`}>{docArsipType}</span></span>
                          </div>
                          <div>
                            <span className="font-semibold text-slate-400 text-xs uppercase tracking-wider block mb-1">Tanggal & Jenis Naskah</span>
                            <span className="text-slate-800 inline-flex items-center gap-1.5">{docDateStr} <span className="text-slate-400">•</span> {docJenisNaskah}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-slate-400 text-xs uppercase tracking-wider block mb-1">Format & Ukuran</span>
                            {documentToPreview.files && documentToPreview.files.length > 0 ? (
                               <span className="text-slate-800 font-mono text-xs bg-slate-100 px-2 py-0.5 rounded-md">{documentToPreview.files.length} Berkas</span>
                            ) : (
                               <span className="text-slate-800 font-mono text-xs bg-slate-100 px-2 py-0.5 rounded-md">{documentToPreview.fileType.toUpperCase()} ({documentToPreview.fileSize})</span>
                            )}
                          </div>
                       </div>
                       
                       <div className="mt-5 text-sm">
                         <span className="font-semibold text-slate-400 text-xs uppercase tracking-wider block mb-1">Perihal</span>
                         <div className="text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-100">
                           {docPrihal}
                         </div>
                       </div>
                       
                       {docDescription && docDescription !== "-" && (
                         <div className="mt-5 pt-5 border-t border-slate-100 text-sm">
                           <span className="font-semibold text-slate-400 text-xs uppercase tracking-wider block mb-2">Catatan Tambahan</span>
                           <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{docDescription}</p>
                         </div>
                       )}
                       {documentToPreview.files && documentToPreview.files.length > 1 && (
                         <div className="mt-5 pt-5 border-t border-slate-100">
                           <span className="font-semibold text-slate-400 text-xs uppercase tracking-wider block mb-2">Daftar Berkas ({documentToPreview.files.length})</span>
                           <div className="flex flex-wrap gap-2">
                             {documentToPreview.files.map((f, i) => (
                               <button 
                                  key={i}
                                  onClick={() => setActivePreviewIndex(i)}
                                  className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 border transition-colors ${activePreviewIndex === i ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                               >
                                  <span className={`px-1.5 py-0.5 rounded uppercase text-[9px] ${getFileTypeBadgeColor(f.type)}`}>{f.type}</span>
                                  <span className="truncate max-w-[120px]">{f.name.replace(/\.[^/.]+$/, "")}</span>
                               </button>
                             ))}
                           </div>
                         </div>
                       )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {documentToDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-100 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-6 flex flex-col space-y-4">
            <h3 className="font-bold text-slate-800 text-lg">Konfirmasi Hapus</h3>
            <p className="text-sm text-slate-600">
              Apakah Anda yakin ingin menghapus dokumen ini dari arsip? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex items-center justify-end space-x-3 pt-4">
              <button
                onClick={() => setDocumentToDelete(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg text-sm hover:bg-slate-200 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onDeleteDocument(documentToDelete);
                  setDocumentToDelete(null);
                }}
                className="px-4 py-2 bg-rose-600 text-white font-semibold rounded-lg text-sm hover:bg-rose-700 transition-colors"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

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

                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">
                        Naskah
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
                      Prihal
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

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700">
                      No Surat {selectedFiles.length > 1 ? `(${selectedFiles.length} Berkas)` : ""}
                    </label>
                    {Array.from({ length: Math.max(1, selectedFiles.length) }).map((_, index) => (
                      <input
                        key={index}
                        type="text"
                        placeholder={selectedFiles.length > 0 ? `No Surat untuk ${selectedFiles[index]?.name || "berkas " + (index + 1)}` : "Contoh: 001/SK/2026"}
                        value={manualForm.noSurats[index] || ""}
                        onChange={(e) => {
                          const newNoSurats = [...manualForm.noSurats];
                          newNoSurats[index] = e.target.value;
                          setManualForm({ ...manualForm, noSurats: newNoSurats });
                        }}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-sans"
                      />
                    ))}
                  </div>
                </>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex justify-between items-center">
                    <span>Kategori</span>
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
                    Tipe Berkas
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
                  Berkas (Upload File)
                </label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => {
                     const files = e.target.files;
                     if (files && files.length > 0) {
                        const fileArray = Array.from(files) as File[];
                        setSelectedFiles(fileArray);
                        
                        // Set perihal using the first file's name if empty
                        if (!manualForm.perihal) {
                           const firstFile = fileArray[0];
                           const fileNameWithoutExt = firstFile.name.replace(/\.[^/.]+$/, "");
                           const ext = firstFile.name.split('.').pop() || 'pdf';
                           setManualForm({
                              ...manualForm,
                              fileSize: formatBytes(firstFile.size),
                              fileType: ext,
                              originalFileName: firstFile.name,
                              perihal: fileNameWithoutExt
                           });
                        }
                     } else {
                        setSelectedFiles([]);
                     }
                  }}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all font-sans file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                {selectedFiles.length > 0 && (
                   <div className="mt-2 space-y-1">
                      <p className="text-xs font-semibold text-slate-600">{selectedFiles.length} berkas dipilih:</p>
                      <ul className="text-xs text-slate-500 max-h-20 overflow-y-auto bg-white border border-slate-100 p-2 rounded-md">
                         {selectedFiles.map((f, i) => (
                            <li key={i} className="truncate">- {f.name} ({formatBytes(f.size)})</li>
                         ))}
                      </ul>
                   </div>
                )}
              </div>

              <div className="space-y-1 relative">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700">
                    Deskripsi Ringkas Dokumen {selectedFiles.length > 1 ? `(${selectedFiles.length} Berkas)` : ""}
                  </label>
                </div>
                {Array.from({ length: Math.max(1, selectedFiles.length) }).map((_, index) => (
                  <textarea
                    key={`desc-${index}`}
                    required={manualForm.arsipType === "Arsip Umum"}
                    rows={2}
                    placeholder={selectedFiles.length > 0 ? `Tulis ringkasan isi dokumen untuk ${selectedFiles[index]?.name || "berkas " + (index + 1)}...` : "Tulis ringkasan isi dokumen atau lokasi penempatan binder fisik di lemari arsip..."}
                    value={selectedFiles.length > 0 ? (manualForm.descriptions[index] || "") : manualForm.description}
                    onChange={(e) => {
                      if (selectedFiles.length > 0) {
                        const newDescriptions = [...manualForm.descriptions];
                        newDescriptions[index] = e.target.value;
                        setManualForm({ ...manualForm, descriptions: newDescriptions });
                      } else {
                        setManualForm({ ...manualForm, description: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-sans mb-2"
                  />
                ))}
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700">
                    Tag / Label (Pisahkan dengan koma) {selectedFiles.length > 1 ? `(${selectedFiles.length} Berkas)` : ""}
                  </label>
                </div>
                {Array.from({ length: Math.max(1, selectedFiles.length) }).map((_, index) => (
                  <input
                    key={`tag-${index}`}
                    type="text"
                    placeholder={selectedFiles.length > 0 ? `Contoh: hrd, internal, rahasia untuk ${selectedFiles[index]?.name || "berkas " + (index + 1)}` : "Contoh: hrd, internal, rahasia"}
                    value={selectedFiles.length > 0 ? (manualForm.tagsList[index] || "") : manualForm.tags}
                    onChange={(e) => {
                      if (selectedFiles.length > 0) {
                        const newTagsList = [...manualForm.tagsList];
                        newTagsList[index] = e.target.value;
                        setManualForm({ ...manualForm, tagsList: newTagsList });
                      } else {
                        setManualForm({ ...manualForm, tags: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-sans mb-2"
                  />
                ))}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  disabled={isUploadingFiles}
                  className="px-4 py-2 border border-slate-200 text-slate-500 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUploadingFiles}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 hover:shadow-sm transition-all flex items-center space-x-2 disabled:opacity-50"
                >
                  {isUploadingFiles ? (
                     <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Mengunggah...</span>
                     </>
                  ) : (
                     <span>Arsipkan Dokumen</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
