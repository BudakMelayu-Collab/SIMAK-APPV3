import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { X, User as UserIcon, Camera, Loader2, UploadCloud } from "lucide-react";
import { supabase } from "../supabase";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  onProfileUpdated: (user?: any) => void;
}

export default function EditProfileModal({ isOpen, onClose, currentUser, onProfileUpdated }: EditProfileModalProps) {
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentUser && isOpen) {
      setFullName(currentUser.user_metadata?.full_name || "");
      setAvatarUrl(currentUser.user_metadata?.avatar_url || "");
      setPreviewUrl(currentUser.user_metadata?.avatar_url || "");
      setSelectedFile(null);
    }
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran file terlalu besar. Maksimal 2MB.");
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      let finalAvatarUrl = avatarUrl;

      // Jika ada file yang dipilih, unggah ke storage Supabase
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${currentUser.id}-${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, selectedFile);

        if (uploadError) {
          throw uploadError;
        }

        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
        finalAvatarUrl = data.publicUrl;
      }

      const { data: updatedUserData, error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          avatar_url: finalAvatarUrl,
        }
      });
      
      if (error) throw error;
      
      // Update data staf di database juga jika email cocok
      if (currentUser.email) {
        const { data: existingStaff } = await supabase.from("staff").select("*").eq("contact", currentUser.email).single();
        if (existingStaff) {
          let notesObj: any = {};
          try {
            if (existingStaff.notes) {
              notesObj = JSON.parse(existingStaff.notes);
            }
          } catch(e) {}
          notesObj.avatarUrl = finalAvatarUrl;

          await supabase.from("staff").update({
             name: fullName,
             notes: JSON.stringify(notesObj)
          }).eq("id", existingStaff.id);
        }
      }

      onProfileUpdated(updatedUserData.user);
      onClose();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      if (error.message === "Bucket not found" || error.statusCode === '404') {
        alert("Bucket 'avatars' belum ada di Supabase Storage. Sebagai administrator, silakan buat bucket bernama 'avatars' di menu Storage Supabase Anda dan jadikan Public.");
      } else if (error.message?.includes("row-level security policy")) {
         alert("Gagal mengunggah foto. Pastikan Anda telah menambahkan policy (RLS) di bucket 'avatars' untuk mengizinkan insert/update untuk public/authenticated user.");
      } else {
        alert(`Gagal memperbarui profil: ${error.message || "Kesalahan tidak diketahui"}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative z-10"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">Edit Profil</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-50 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="flex justify-center mb-6">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="w-24 h-24 rounded-2xl overflow-hidden ring-4 ring-slate-50 bg-slate-100 relative">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <UserIcon className="w-10 h-10" />
                  </div>
                )}
                
                {/* Hover overlay for image */}
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6 text-white mb-1" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">Ubah</span>
                </div>
              </div>
            </div>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Nama Lengkap
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <UserIcon className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder="Masukkan nama lengkap"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Unggah Foto Profil
            </label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 border-dashed rounded-xl text-slate-500 hover:bg-slate-100 hover:border-blue-300 transition-all cursor-pointer flex items-center justify-center space-x-2"
            >
              <UploadCloud className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium">Klik untuk memilih foto profil</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 flex justify-between">
              <span>Format: JPG, PNG.</span>
              <span>Maksimal 2MB.</span>
            </p>
          </div>

          <div className="pt-4 flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 hover:text-slate-700 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-70"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Simpan Perubahan</span>}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

