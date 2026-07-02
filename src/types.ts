export interface StaffProfile {
  id: string;
  employeeId?: string;
  name: string;
  birthPlaceAndDate?: string;
  address?: string;
  education?: string;
  trainingHistory?: string;
  role: string;
  jabatan?: string;
  department: string;
  email: string;
  phone: string;
  status: 'Aktif' | 'Cuti' | 'Nonaktif';
  joinDate: string;
  avatarUrl?: string;
  allocationsCount?: number;
  leaveBalance: number;
  specialLeaveBalance?: number;
  permissions?: string[];
  lastLogin?: string;
  activityLog?: Array<{
    id: string;
    action: string;
    date: string;
    details?: string;
  }>;
}

export interface InventoryItem {
  id: string;
  assetType?: string;
  name: string;
  brand?: string;
  code: string;
  category: string;
  quantity: number;
  unitPrice?: number;
  assignedToId?: string; // Reference to StaffProfile.id
  assignedToName?: string;
  status: string; // Changed to allow any string
  location: string;
  purchaseDate: string;
}

export interface LeaveRequest {
  id: string;
  staffId: string;
  staffName: string;
  leaveType: 'Cuti Tahunan' | 'Sakit' | 'Izin Khusus' | 'Cuti Melahirkan';
  startDate: string;
  endDate: string;
  durationDays: number;
  reason: string;
  status: 'Pending' | 'Disetujui' | 'Ditolak';
  requestDate: string;
}

export interface DocumentFile {
  name: string;
  size: string;
  type: string;
  url: string;
}

export interface DocumentArchive {
  id: string;
  name: string;
  category: string;
  uploadDate: string;
  fileSize: string;
  description: string;
  fileType: string;
  tags?: string[];
  fileUrl?: string;
  files?: DocumentFile[];
}

// Initial Mock Data
export const INITIAL_STAFF: StaffProfile[] = [];

export const INITIAL_INVENTORY: InventoryItem[] = [];

export const INITIAL_LEAVE: LeaveRequest[] = [];

export const INITIAL_DOCUMENTS: DocumentArchive[] = [];
