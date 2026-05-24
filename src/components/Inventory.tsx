import React, { useState } from 'react';
import { InventoryItem, StaffProfile } from '../types';
import { Plus, Search, Filter, Edit2, Trash2, CheckCircle2, UserCheck, X, RefreshCw, AlertTriangle, HelpCircle, FileSpreadsheet } from 'lucide-react';

interface InventoryProps {
  inventory: InventoryItem[];
  staff: StaffProfile[];
  onAddInventory: (item: Omit<InventoryItem, 'id'>) => void;
  onUpdateInventory: (item: InventoryItem) => void;
  onDeleteInventory: (id: string) => void;
}

export default function Inventory({
  inventory,
  staff,
  onAddInventory,
  onUpdateInventory,
  onDeleteInventory
}: InventoryProps) {
  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [selectedStatus, setSelectedStatus] = useState('Semua');

  // Modal States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);

  // Form States
  const [currentItem, setCurrentItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState({
    assetType: '',
    name: '',
    brand: '',
    code: '',
    category: 'Elektronik',
    quantity: 1,
    unitPrice: 0,
    status: 'Tersedia' as const,
    location: '',
    purchaseDate: new Date().toISOString().split('T')[0]
  });

  const [assigneeId, setAssigneeId] = useState('');

  // Dropdown options
  const categories = ['Semua', 'Elektronik', 'Furnitur', 'Perangkat Jaringan', 'Alat Tulis Kantor', 'Lainnya'];
  const formCategories = ['Elektronik', 'Furnitur', 'Perangkat Jaringan', 'Alat Tulis Kantor', 'Lainnya'];
  const statuses = ['Semua', 'Tersedia', 'Digunakan', 'Rusak', 'Dalam Perbaikan'];

  // Filter logic
  const filteredItems = inventory.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (item.assignedToName && item.assignedToName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'Semua' || item.category === selectedCategory;
    const matchesStatus = selectedStatus === 'Semua' || item.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleOpenAdd = () => {
    setFormData({
      assetType: '',
      name: '',
      brand: '',
      code: `INV-${Math.floor(100+Math.random()*900)}`,
      category: 'Elektronik',
      quantity: 1,
      unitPrice: 0,
      status: 'Tersedia',
      location: 'Gudang GA',
      purchaseDate: new Date().toISOString().split('T')[0]
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
      assetType: item.assetType || '',
      name: item.name,
      brand: item.brand || '',
      code: item.code,
      category: item.category,
      quantity: item.quantity,
      unitPrice: item.unitPrice || 0,
      status: item.status,
      location: item.location,
      purchaseDate: item.purchaseDate
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItem || !formData.name) return;
    onUpdateInventory({
      ...currentItem,
      ...formData
    });
    setIsEditOpen(false);
  };

  const handleOpenAssign = (item: InventoryItem) => {
    setCurrentItem(item);
    setAssigneeId(item.assignedToId || '');
    setIsAssignOpen(true);
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItem) return;

    if (assigneeId === '') {
      // Unassign the item
      onUpdateInventory({
        ...currentItem,
        assignedToId: undefined,
        assignedToName: undefined,
        status: 'Tersedia'
      });
    } else {
      const selectedStaff = staff.find(s => s.id === assigneeId);
      onUpdateInventory({
        ...currentItem,
        assignedToId: assigneeId,
        assignedToName: selectedStaff ? selectedStaff.name : undefined,
        status: 'Digunakan'
      });
    }
    setIsAssignOpen(false);
  };

  const handleUnassignQuick = (item: InventoryItem) => {
    onUpdateInventory({
      ...item,
      assignedToId: undefined,
      assignedToName: undefined,
      status: 'Tersedia'
    });
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header section with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500 drop-shadow-sm uppercase relative">
            Daftar Peralatan
            <div className="absolute -bottom-1 left-0 w-12 h-1 bg-gradient-to-r from-slate-800 to-transparent rounded-full border-0"></div>
          </h2>
        </div>

        <div className="flex items-center space-x-3">
          <button 
            className="relative overflow-hidden group bg-white border border-emerald-200 text-emerald-700 hover:text-emerald-800 font-bold text-xs px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center space-x-2 uppercase"
          >
            <div className="absolute inset-0 bg-emerald-50/50 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
            <FileSpreadsheet className="w-4 h-4 relative z-10" />
            <span className="relative z-10 tracking-wider">Import Excel</span>
          </button>
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
                <option key={cat} value={cat}>{cat === 'Semua' ? 'Sem. Kategori' : cat}</option>
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
                <option key={st} value={st}>{st === 'Semua' ? 'Sem. Status' : st}</option>
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
            <p className="mt-2 text-[11px] font-bold text-slate-800">Tidak ada aset ditemukan</p>
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
                    <td className="text-[11px] text-slate-600">{item.assetType || '-'}</td>
                    <td className="text-[11px] text-slate-600">{item.name}</td>
                    <td className="text-[11px] text-slate-600">{item.brand || '-'}</td>
                    <td className="text-[11px] text-slate-600">{item.code}</td>
                    <td className="text-[11px] text-slate-600">{item.category}</td>
                    <td className="text-center text-[11px] text-slate-600">{item.quantity}</td>
                    <td className="text-right text-[11px] text-slate-600">
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.unitPrice || 0)}
                    </td>
                    <td className="text-right text-[11px] text-slate-600">
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format((item.unitPrice || 0) * item.quantity)}
                    </td>
                    <td className="text-center text-[11px] text-slate-600">
                      {item.status}
                    </td>
                    <td className="text-[11px] text-slate-600">{item.location}</td>
                    <td className="text-center text-[11px] text-slate-600">
                      {item.purchaseDate.substring(0, 4)}
                    </td>
                    <td className="text-right">
                      <div className="inline-flex items-center space-x-1">
                        <button onClick={() => handleOpenEdit(item)} className="p-1 text-slate-400 hover:text-indigo-600">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => { if (confirm('Hapus?')) onDeleteInventory(item.id); }} className="p-1 text-slate-400 hover:text-red-600">
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
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Nama Barang / Aset</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Meja Lipat Aluminium"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Jenis Aset</label>
                  <input
                    type="text"
                    placeholder="Contoh: Laptop"
                    value={formData.assetType}
                    onChange={(e) => setFormData({...formData, assetType: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Merk / Brand</label>
                  <input
                    type="text"
                    placeholder="Contoh: ASUS"
                    value={formData.brand}
                    onChange={(e) => setFormData({...formData, brand: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Kategori</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  >
                    {formCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Kode Barang</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Harga Satuan (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({...formData, unitPrice: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Jumlah (Quantity)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 1})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Lokasi Penempatan</label>
                  <input
                    type="text"
                    placeholder="Contoh: Gudang GA"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Tanggal Pembelian</label>
                  <input
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({...formData, purchaseDate: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Status Awal</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  >
                    <option value="Tersedia">Tersedia</option>
                    <option value="Dalam Perbaikan">Dalam Perbaikan</option>
                    <option value="Rusak">Rusak</option>
                  </select>
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
              <button onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Nama Barang / Aset</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Jenis Aset</label>
                  <input
                    type="text"
                    value={formData.assetType}
                    onChange={(e) => setFormData({...formData, assetType: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Merk / Brand</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({...formData, brand: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Kategori</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  >
                    {formCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Kode Barang</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Harga Satuan (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({...formData, unitPrice: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Jumlah (Quantity)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 1})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Lokasi Penempatan</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Tanggal Pembelian</label>
                  <input
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({...formData, purchaseDate: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Kondisi</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  >
                    <option value="Tersedia">Tersedia</option>
                    <option value="Digunakan">Digunakan (Oleh Staf)</option>
                    <option value="Dalam Perbaikan">Dalam Perbaikan</option>
                    <option value="Rusak">Rusak</option>
                  </select>
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
              <button onClick={() => setIsAssignOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAssignSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-indigo-50 text-indigo-950 rounded-lg space-y-1 border border-indigo-100/50">
                <span className="text-[10px] uppercase font-bold text-indigo-500 leading-tight block">KETERANGAN ASET</span>
                <span className="font-semibold text-sm block leading-normal">{currentItem.name}</span>
                <span className="text-xs font-mono text-indigo-600">{currentItem.code} | Kondisi: {currentItem.status}</span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Pilih Staf Penerima</label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all cursor-pointer"
                >
                  <option value="">-- Letakkan di Gudang (Bebaskan Aset) --</option>
                  {staff.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.role} - {member.department})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Menetapkan staf secara otomatis mengubah status aset menjadi <strong className="text-slate-500 font-semibold">"Digunakan"</strong>. Menghapusnya akan mengembalikan ke <strong className="text-slate-500 font-semibold">"Tersedia"</strong>.
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
