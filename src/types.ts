export type UserRole = 
  | 'Super Admin' 
  | 'Manager Resepsionis' 
  | 'Resepsionis' 
  | 'Manager QC' 
  | 'Quality Control' 
  | 'Manager Teknisi' 
  | 'Teknisi' 
  | 'Manager Koperasi' 
  | 'Petugas Koperasi'
  | string;

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  department?: string;
  supervisorId?: string | null;
  assignedBuilding: string;
  phone: string;
  status: string;
}

export interface Room {
  id: string;
  building: string;
  roomNumber: string;
  type: string;
  capacity: string;
  status: "KOSONG" | "TERISI" | "BOOKED" | "MAINTENANCE";
  qcStatus?: "LOLOS_QC" | "PERLU_INSPEKSI" | "PERLU_PERBAIKAN" | "MENUNGGU_QC";
  lastQcDate?: string;
  lastQcBy?: string;
  lastQcNotes?: string;
  activeTxId: string | null;
  activeMaintId: string | null;
}

export interface QcInspection {
  id: string;
  roomId: string;
  building: string;
  roomNumber: string;
  inspectorId: string;
  inspectorName: string;
  inspectionDate: string;
  cleanliness: 'BAIK' | 'CUKUP' | 'BURUK';
  linenBed: 'LENGKAP_BERSIH' | 'PERLU_GANTI';
  acElectricity: 'NORMAL' | 'BERMASALAH';
  plumbingWater: 'LANCAR' | 'BOCOR_MAMPET';
  amenities: 'LENGKAP' | 'KURANG';
  result: 'LOLOS_QC' | 'PERLU_PERBAIKAN';
  notes: string;
  maintenanceIdCreated?: string;
  facilityType?: 'KAMAR' | 'RUANG_PERTEMUAN';
}

export type GroupType = 'JEMAAH_HAJI' | 'UMUM' | 'INSTANSI';

export interface GroupBooking {
  id: string;
  groupName: string;
  groupType: GroupType;
  picName: string;
  picPhone: string;
  agencyOrDocument?: string;
  estimatedMembers: number;
  startDate: string;
  duration: number;
  roomIds: string[];
  roomNumbers: string[];
  buildingList: string[];
  meetingRoomIds?: string[];
  breakfast: boolean;
  breakfastMenu?: string;
  breakfastPortions?: number;
  notes?: string;
  status: 'BOOKED' | 'TERISI' | 'SELESAI';
  createdAt: string;
  createdUser: string;
}

export interface Transaction {
  id: string;
  roomId: string;
  building: string;
  roomNumber: string;
  category: string;
  guestName: string;
  kloter: string;
  startDate: string;
  duration: number;
  phone: string;
  notes: string;
  status: string;
  createdUser: string;
  groupType?: GroupType;
  groupName?: string;
  groupPic?: string;
  groupId?: string;
  breakfast?: boolean;
  breakfastMenu?: string;
  breakfastPortions?: number;
  breakfastDays?: number;
  breakfastStatus?: 'MENUNGGU' | 'SEDANG_DIBUAT' | 'PENGANTARAN' | 'SELESAI';
  rentType?: string;
  durationUnit?: string;
  extraBed?: boolean;
  extraBedCount?: number;
  extraBedNotes?: string;
  checkInTime?: string;
  checkOutTime?: string;
  extendedCount?: number;
  extendHistory?: {
    date: string;
    addedDuration: number;
    unit: string;
    newTotalDuration: number;
    user: string;
    reason?: string;
  }[];
}

export interface Maintenance {
  id: string;
  roomId: string;
  building: string;
  roomNumber: string;
  category: string;
  urgency: string;
  technician: string;
  description: string;
  reportTime: string;
  status: 'MENUNGGU_PENUGASAN' | 'PROSES' | 'MENUNGGU_QC' | 'SELESAI' | string;
  reportedUser: string;
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  assignedByManager?: string;
  assignedTime?: string;
  managerNotes?: string;
  workCompletedTime?: string;
  technicianNotes?: string;
  resolvedTime?: string;
  qcInspectionId?: string;
  qcVerdict?: 'LOLOS_QC' | 'PERLU_PERBAIKAN';
  facilityType?: 'KAMAR' | 'RUANG_PERTEMUAN';
}

export interface AuditLog {
  timestamp: string;
  user: string;
  role: string;
  action: string;
  details: string;
  durationMinutes?: number;
}

export interface WorkSession {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  loginTime: string;       // "YYYY-MM-DD HH:mm:ss"
  logoutTime: string | null; // "YYYY-MM-DD HH:mm:ss" or null if currently active
  durationSeconds: number; // in seconds
  durationFormatted: string; // e.g. "8 Jam 15 Menit 30 Detik"
  status: 'AKTIF' | 'SELESAI';
  notes?: string;
}

export interface DailyWorkRecord {
  id: string;              // unique key `${userName}_${date}`
  date: string;            // "YYYY-MM-DD"
  userId: string;
  userName: string;
  userRole: string;
  sessionCount: number;
  totalDurationSeconds: number;
  totalDurationFormatted: string;
  firstLoginTime: string;
  lastLogoutTime: string | null;
  status: 'AKTIF' | 'SELESAI';
  sessions: WorkSession[];
}

export type ChatScope = 'MANAGER_TO_MANAGER' | 'MANAGER_TO_SUBORDINATE' | 'DIVISION_GROUP' | 'ALL_MANAGERS_GROUP';

export interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  senderDepartment?: string;
  message: string;
  timestamp: string;
  timeFormatted: string;
  priority?: 'NORMAL' | 'PENTING' | 'URGENT';
  isInstruction?: boolean;
  readBy: string[];
}

export interface ChatChannel {
  id: string;
  name: string;
  scope: ChatScope;
  type: 'DIRECT' | 'GROUP';
  department?: string;
  participantIds: string[];
  description?: string;
  icon?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  lastSenderName?: string;
}
