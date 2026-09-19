import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Room, Transaction, Maintenance, AuditLog, WorkSession, QcInspection, ChatChannel, ChatMessage } from './types';
import { initialUsers, getInitialRooms, initialTransactions, initialMaintenances, initialAuditLogs, initialWorkSessions, initialQcInspections } from './data';
import { initialChatChannels, initialChatMessages } from './chatData';
import { playNotificationSound } from './lib/sound';
import { getRealTodayDate, formatIndonesianDate, addDaysToDateStr } from './lib/utils';

export function formatHMS(totalSeconds: number): string {
  if (totalSeconds < 0) totalSeconds = 0;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours} Jam ${minutes} Menit ${seconds} Detik`;
}

// Role Authorization Helpers
export function isSuperAdmin(role?: string): boolean {
  return role === 'Super Admin' || role === 'Admin';
}
export function isManagerTeknisi(role?: string): boolean {
  return role === 'Manager Teknisi' || isSuperAdmin(role);
}
export function isManagerQc(role?: string): boolean {
  return role === 'Manager QC' || isSuperAdmin(role);
}
export function isManagerRecep(role?: string): boolean {
  return role === 'Manager Resepsionis' || isSuperAdmin(role);
}
export function isManagerKoperasi(role?: string): boolean {
  return role === 'Manager Koperasi' || isSuperAdmin(role);
}
export function isManagerRole(role?: string): boolean {
  return isSuperAdmin(role) || 
         role === 'Manager Resepsionis' || 
         role === 'Manager QC' || 
         role === 'Manager Teknisi' || 
         role === 'Manager Koperasi';
}
export function isRecepRole(role?: string): boolean {
  return role === 'Resepsionis' || role === 'Manager Resepsionis' || isSuperAdmin(role);
}
export function isTeknisiRole(role?: string): boolean {
  return role === 'Teknisi' || role === 'Manager Teknisi' || isSuperAdmin(role);
}
export function isQcRole(role?: string): boolean {
  return role === 'Quality Control' || role === 'Manager QC' || isSuperAdmin(role);
}
export function isKoperasiRole(role?: string): boolean {
  return role === 'Petugas Koperasi' || role === 'Manager Koperasi' || role === 'Koperasi' || isSuperAdmin(role);
}

interface AppContextType {
  currentUser: User | null;
  users: User[];
  rooms: Room[];
  transactions: Transaction[];
  maintenances: Maintenance[];
  auditLogs: AuditLog[];
  workSessions: WorkSession[];
  qcInspections: QcInspection[];
  activeSessionId: string | null;
  activeTab: string;
  toasts: { id: string, msg: string, type: string }[];
  modalState: { [key: string]: any };
  
  // Chat State & Methods
  chatChannels: ChatChannel[];
  chatMessages: ChatMessage[];
  isChatOpen: boolean;
  activeChatChannelId: string | null;
  chatSoundEnabled: boolean;
  chatNotificationToast: { message: ChatMessage; channelName: string; channelId: string } | null;
  unreadTotalCount: number;
  openChat: (channelId?: string) => void;
  closeChat: () => void;
  setActiveChatChannelId: (channelId: string | null) => void;
  toggleChatSound: () => void;
  sendChatMessage: (channelId: string, text: string, priority?: 'NORMAL' | 'PENTING' | 'URGENT', isInstruction?: boolean) => void;
  markChannelAsRead: (channelId: string) => void;
  dismissChatNotification: () => void;
  simulateIncomingChatMessage: (channelId?: string) => void;
  
  login: (user: User) => void;
  logout: () => void;
  setActiveTab: (tab: string) => void;
  addUser: (user: User) => void;
  updateUser: (user: User) => void;
  toggleUserStatus: (userId: string) => void;
  deleteUser: (userId: string) => void;
  
  addTransaction: (tx: Transaction) => void;
  addGroupBooking: (txs: Transaction[], groupName: string) => void;
  updateTransaction: (tx: Transaction) => void;
  updateBreakfastStatus: (txId: string, status: 'MENUNGGU' | 'SEDANG_DIBUAT' | 'PENGANTARAN' | 'SELESAI') => void;
  checkoutRoom: (roomId: string, txId?: string) => void;
  activateCheckin: (roomId: string, targetTxId?: string) => void;
  cancelBooking: (roomId: string, txId?: string) => void;
  extendTransaction: (txId: string, additionalDuration: number, extendBreakfast?: boolean, extendExtraBed?: boolean, reason?: string) => boolean;
  
  addMaintenance: (maint: Maintenance) => void;
  assignTechnicianToMaintenance: (maintId: string, technicianId: string, technicianName: string, managerNotes?: string) => boolean;
  markMaintenanceRepaired: (maintId: string, technicianNotes: string) => boolean;
  updateMaintenanceStatus: (maintId: string, newStatus: 'MENUNGGU_PENUGASAN' | 'PROSES' | 'MENUNGGU_QC' | 'SELESAI', technicianNotes?: string) => boolean;
  finishMaintenance: (roomId: string) => boolean;

  addQcInspection: (inspection: QcInspection) => void;
  
  logAudit: (action: string, details: string, durationMinutes?: number) => void;
  showToast: (msg: string, type?: string) => void;
  removeToast: (id: string) => void;
  
  openModal: (modalId: string, data?: any) => void;
  closeModal: (modalId: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [rooms, setRooms] = useState<Room[]>(getInitialRooms());
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const today = getRealTodayDate();
    return initialTransactions.map(t => {
      if (t.building === 'Ruang Pertemuan' && t.startDate < today && t.status !== 'DIBATALKAN') {
        return { ...t, status: 'SELESAI' as const };
      }
      return t;
    });
  });
  const [maintenances, setMaintenances] = useState<Maintenance[]>(initialMaintenances);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs);
  const [workSessions, setWorkSessions] = useState<WorkSession[]>(initialWorkSessions);
  const [qcInspections, setQcInspections] = useState<QcInspection[]>(initialQcInspections);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toasts, setToasts] = useState<{ id: string, msg: string, type: string }[]>([]);
  const [modalState, setModalState] = useState<{ [key: string]: any }>({});

  // Chat States
  const [chatChannels, setChatChannels] = useState<ChatChannel[]>(initialChatChannels);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialChatMessages);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [activeChatChannelId, setActiveChatChannelId] = useState<string | null>(null);
  const [chatSoundEnabled, setChatSoundEnabled] = useState<boolean>(true);
  const [chatNotificationToast, setChatNotificationToast] = useState<{ message: ChatMessage; channelName: string; channelId: string } | null>(null);

  // Auto-dismiss notification toast after 7 seconds
  useEffect(() => {
    if (!chatNotificationToast) return;
    const timer = setTimeout(() => {
      setChatNotificationToast(null);
    }, 7000);
    return () => clearTimeout(timer);
  }, [chatNotificationToast]);

  // Dynamic calculation of unread messages for current user
  const unreadTotalCount = currentUser
    ? chatMessages.filter(m => {
        if (m.senderId === currentUser.id) return false;
        if (m.readBy.includes(currentUser.id)) return false;
        const channel = chatChannels.find(c => c.id === m.channelId);
        if (!channel) return false;
        return isSuperAdmin(currentUser.role) || channel.participantIds.includes(currentUser.id);
      }).length
    : 0;

  const markChannelAsRead = (channelId: string) => {
    if (!currentUser) return;
    setChatMessages(prev => prev.map(m => {
      if (m.channelId === channelId && !m.readBy.includes(currentUser.id)) {
        return { ...m, readBy: [...m.readBy, currentUser.id] };
      }
      return m;
    }));
  };

  const openChat = (channelId?: string) => {
    setIsChatOpen(true);
    if (channelId) {
      setActiveChatChannelId(channelId);
      markChannelAsRead(channelId);
    } else if (!activeChatChannelId) {
      // Find first accessible channel for currentUser
      const accessible = chatChannels.filter(c => {
        if (!currentUser) return true;
        if (isSuperAdmin(currentUser.role)) return true;
        return c.participantIds.includes(currentUser.id);
      });
      if (accessible.length > 0) {
        setActiveChatChannelId(accessible[0].id);
        markChannelAsRead(accessible[0].id);
      }
    } else {
      markChannelAsRead(activeChatChannelId);
    }
  };

  const closeChat = () => {
    setIsChatOpen(false);
  };

  const handleSetActiveChatChannelId = (channelId: string | null) => {
    setActiveChatChannelId(channelId);
    if (channelId) {
      markChannelAsRead(channelId);
    }
  };

  const toggleChatSound = () => {
    setChatSoundEnabled(prev => {
      const next = !prev;
      if (next) {
        playNotificationSound();
        showToast("Suara notifikasi pesan diaktifkan", "info");
      } else {
        showToast("Suara notifikasi pesan dinonaktifkan (senyap)", "warning");
      }
      return next;
    });
  };

  const dismissChatNotification = () => {
    setChatNotificationToast(null);
  };

  const sendChatMessage = (channelId: string, text: string, priority: 'NORMAL' | 'PENTING' | 'URGENT' = 'NORMAL', isInstruction: boolean = false) => {
    if (!currentUser || !text.trim()) return;

    const now = new Date();
    const timeFormatted = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      channelId,
      senderId: currentUser.id,
      senderName: currentUser.fullName,
      senderRole: currentUser.role,
      senderDepartment: currentUser.department || 'Operasional',
      message: text.trim(),
      timestamp,
      timeFormatted,
      priority,
      isInstruction,
      readBy: [currentUser.id]
    };

    setChatMessages(prev => [...prev, newMsg]);

    setChatChannels(prev => prev.map(c => {
      if (c.id === channelId) {
        return {
          ...c,
          lastMessage: text.trim(),
          lastMessageTime: timeFormatted,
          lastSenderName: currentUser.fullName
        };
      }
      return c;
    }));

    if (isInstruction || priority === 'URGENT') {
      logAudit(
        isInstruction ? 'Instruksi Chat Resmi' : 'Chat Urgent',
        `${currentUser.fullName} (${currentUser.role}) mengirimkan ${isInstruction ? 'instruksi tugas' : 'pesan mendesak'}: "${text.trim().substring(0, 75)}..."`
      );
    }
  };

  const simulateIncomingChatMessage = (targetChannelId?: string) => {
    if (!currentUser) return;

    let targetChannel: ChatChannel | undefined;
    let sender: User | undefined;
    let text = '';
    let priority: 'NORMAL' | 'PENTING' | 'URGENT' = 'NORMAL';
    let isInstruction = false;

    if (targetChannelId) {
      targetChannel = chatChannels.find(c => c.id === targetChannelId);
    }

    if (targetChannel) {
      const otherParticipantId = targetChannel.participantIds.find(id => id !== currentUser.id);
      sender = users.find(u => u.id === otherParticipantId);
    }

    if (!targetChannel || !sender) {
      if (currentUser.role === 'Manager Resepsionis') {
        targetChannel = chatChannels.find(c => c.id === 'dm-u2-u5') || chatChannels[0];
        sender = users.find(u => u.id === 'u5'); // Ir. Hendra Kusuma (Manager QC)
        text = 'Bu Siti, kamar A-105 dan A-106 baru selesai diverifikasi dan LOLOS QC. Siap untuk check-in jemaah sore ini!';
        priority = 'PENTING';
      } else if (currentUser.role === 'Manager QC') {
        targetChannel = chatChannels.find(c => c.id === 'dm-u5-u8') || chatChannels[0];
        sender = users.find(u => u.id === 'u8'); // H. Joko Susilo, ST (Manager Teknisi)
        text = 'Pak Hendra, perbaikan keran wastafel dan shower di C-104 sudah tuntas diganti part baru. Mohon tim QC verifikasi kelayakannya.';
        priority = 'NORMAL';
      } else if (currentUser.role === 'Manager Teknisi') {
        targetChannel = chatChannels.find(c => c.id === 'dm-u5-u8') || chatChannels[0];
        sender = users.find(u => u.id === 'u5'); // Ir. Hendra Kusuma (Manager QC)
        text = 'Pak Joko, ada temuan rembesan AC di Gedung Mina kamar 208 saat inspeksi. Mohon segera kirim teknisi untuk penanganan darurat ya!';
        priority = 'URGENT';
        isInstruction = true;
      } else if (currentUser.role === 'Manager Koperasi') {
        targetChannel = chatChannels.find(c => c.id === 'dm-u2-u11') || chatChannels[0];
        sender = users.find(u => u.id === 'u2'); // Dra. Hj. Siti Rahmah (Manager Resepsionis)
        text = 'Bu Rina, rombongan jemaah Kloter 03 sebanyak 120 orang tiba malam ini. Mohon disiapkan sarapan pagi box jam 05.30 WIB.';
        priority = 'PENTING';
      } else if (currentUser.role.includes('Teknisi')) {
        targetChannel = chatChannels.find(c => c.id === `dm-u8-${currentUser.id}` || c.id === 'group-teknisi') || chatChannels[0];
        sender = users.find(u => u.id === 'u8'); // Manager Teknisi
        text = `Instruksi Segera: Lakukan pengecekan darurat fasilitas pompa air Gedung Arafah. Pastikan seluruh debit air lancar!`;
        priority = 'URGENT';
        isInstruction = true;
      } else if (currentUser.role.includes('Resepsionis')) {
        targetChannel = chatChannels.find(c => c.id === `dm-u2-${currentUser.id}` || c.id === 'group-recep') || chatChannels[0];
        sender = users.find(u => u.id === 'u2'); // Manager Resepsionis
        text = `Arahan Manager: Pastikan formulir data jemaah lansia dan kunci kamar cadangan sudah disiapkan rapi di meja lobi ya.`;
        priority = 'PENTING';
        isInstruction = true;
      } else if (currentUser.role.includes('QC') || currentUser.role.includes('Quality')) {
        targetChannel = chatChannels.find(c => c.id === `dm-u5-${currentUser.id}` || c.id === 'group-qc') || chatChannels[0];
        sender = users.find(u => u.id === 'u5'); // Manager QC
        text = `Instruksi Manager: Tolong prioritaskan uji sanitasi dan kelayakan linen di lantai 2 Gedung Muzdalifah sebelum pukul 17.00.`;
        priority = 'PENTING';
        isInstruction = true;
      } else if (currentUser.role.includes('Koperasi')) {
        targetChannel = chatChannels.find(c => c.id === 'group-koperasi' || c.id === 'dm-u11-u12') || chatChannels[0];
        sender = users.find(u => u.id === 'u11'); // Manager Koperasi
        text = `Siti, koordinasikan tim dapur untuk pengemasan box sarapan higienis jemaah kloter baru.`;
        priority = 'NORMAL';
        isInstruction = true;
      } else {
        targetChannel = chatChannels.find(c => c.id === 'channel-all-managers') || chatChannels[0];
        sender = users.find(u => u.id === 'u2') || users[1];
        text = 'Lapor Pak Pimpinan, seluruh koordinasi operasional antar divisi hari ini berjalan optimal dan tertib.';
        priority = 'NORMAL';
      }
    }

    if (!sender) {
      sender = users.find(u => u.id !== currentUser.id) || users[0];
    }
    if (!text) {
      text = 'Halo, koordinasi operasional Asrama Haji terpantau aman dan terkendali.';
    }

    const now = new Date();
    const timeFormatted = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);

    const incomingMsg: ChatMessage = {
      id: `sim-msg-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      channelId: targetChannel.id,
      senderId: sender.id,
      senderName: sender.fullName,
      senderRole: sender.role,
      senderDepartment: sender.department || 'Operasional',
      message: text,
      timestamp,
      timeFormatted,
      priority,
      isInstruction,
      readBy: [sender.id]
    };

    setChatMessages(prev => [...prev, incomingMsg]);

    setChatChannels(prev => prev.map(c => {
      if (c.id === targetChannel!.id) {
        return {
          ...c,
          lastMessage: text,
          lastMessageTime: timeFormatted,
          lastSenderName: sender!.fullName
        };
      }
      return c;
    }));

    if (chatSoundEnabled) {
      playNotificationSound();
    }

    setChatNotificationToast({
      message: incomingMsg,
      channelName: targetChannel.name,
      channelId: targetChannel.id
    });
  };

  const [loginTime, setLoginTime] = useState<number | null>(null);

  const showToast = (msg: string, type: string = 'info') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const logAudit = (action: string, details: string, durationMinutes?: number) => {
    setAuditLogs(prev => [{
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user: currentUser ? currentUser.fullName : 'System',
      role: currentUser ? currentUser.role : 'System',
      action,
      details,
      durationMinutes
    }, ...prev]);
  };

  const login = (user: User) => {
    setCurrentUser(user);
    const now = new Date();
    const loginTimeStr = now.toISOString().replace('T', ' ').substring(0, 19);
    setLoginTime(now.getTime());

    const newSessionId = `SESI-${Date.now().toString().slice(-4)}`;
    setActiveSessionId(newSessionId);

    const newSession: WorkSession = {
      id: newSessionId,
      userId: user.id,
      userName: user.fullName,
      userRole: user.role,
      loginTime: loginTimeStr,
      logoutTime: null,
      durationSeconds: 0,
      durationFormatted: 'Sedang Berjalan (Aktif)',
      status: 'AKTIF',
      notes: `Sesi login bertugas (${user.role} - ${user.department || 'Operasional'})`
    };

    setWorkSessions(prev => [newSession, ...prev]);
    logAudit("Login System", `Petugas ${user.fullName} (${user.role}) masuk bertugas pada ${loginTimeStr}`);
    showToast(`Selamat datang, ${user.fullName} (${user.role})!`, "success");

    // All roles land on Dashboard as requested, tailored per role
    setActiveTab('dashboard');
  };

  const logout = () => {
    if (currentUser) {
      const now = new Date();
      const logoutTimeStr = now.toISOString().replace('T', ' ').substring(0, 19);
      let totalSeconds = 0;
      let durationStr = "0 Jam 0 Menit 0 Detik";

      if (loginTime) {
        totalSeconds = Math.max(1, Math.floor((now.getTime() - loginTime) / 1000));
        durationStr = formatHMS(totalSeconds);
      }

      setWorkSessions(prev => prev.map(s => {
        if (s.id === activeSessionId || (s.userId === currentUser.id && s.status === 'AKTIF')) {
          return {
            ...s,
            logoutTime: logoutTimeStr,
            durationSeconds: totalSeconds,
            durationFormatted: durationStr,
            status: 'SELESAI'
          };
        }
        return s;
      }));

      const totalMins = Math.floor(totalSeconds / 60);
      logAudit(
        "Logout System",
        `Petugas ${currentUser.fullName} (${currentUser.role}) checkout tugas pada ${logoutTimeStr}. Durasi kerja: ${durationStr}.`,
        totalMins
      );
    }
    setCurrentUser(null);
    setLoginTime(null);
    setActiveSessionId(null);
    showToast("Anda telah keluar dari sistem (Check-Out Shift).", "info");
  };

  const addUser = (user: User) => {
    if (!isSuperAdmin(currentUser?.role)) {
      showToast("Akses Ditolak: Hanya Super Admin yang berwenang menambah akun petugas!", "error");
      return;
    }
    setUsers(prev => [...prev, user]);
    logAudit("Tambah User", `Membuat akun baru: ${user.username} (${user.role}) - ${user.department || 'Operasional'}`);
    showToast(`Akun petugas ${user.fullName} (${user.role}) berhasil ditambahkan!`, "success");
  };

  const updateUser = (updatedUser: User) => {
    if (!isSuperAdmin(currentUser?.role)) {
      showToast("Akses Ditolak: Hanya Super Admin yang berwenang mengubah data akun petugas!", "error");
      return;
    }
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    logAudit("Ubah Akun", `Memperbarui akun: ${updatedUser.username} (${updatedUser.fullName}) - ${updatedUser.role}`);
    showToast(`Data petugas ${updatedUser.fullName} berhasil diperbarui!`, "success");
  };

  const toggleUserStatus = (userId: string) => {
    if (!isSuperAdmin(currentUser?.role)) {
      showToast("Akses Ditolak: Hanya Super Admin yang berwenang mengubah status akun!", "error");
      return;
    }
    const target = users.find(u => u.id === userId);
    if (!target) return;
    if (target.id === currentUser?.id) {
      showToast("Anda tidak dapat menonaktifkan akun yang sedang aktif Anda gunakan!", "warning");
      return;
    }
    const newStatus = target.status === 'Aktif' ? 'Non-Aktif' : 'Aktif';
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    logAudit("Status User", `Mengubah status akun ${target.username} (${target.fullName}) menjadi ${newStatus}`);
    showToast(`Status akun ${target.fullName} diubah menjadi ${newStatus}`, newStatus === 'Aktif' ? 'success' : 'info');
  };

  const deleteUser = (userId: string) => {
    if (!isSuperAdmin(currentUser?.role)) {
      showToast("Akses Ditolak: Hanya Super Admin yang berwenang menghapus akun!", "error");
      return;
    }
    const target = users.find(u => u.id === userId);
    if (!target) return;
    if (target.id === currentUser?.id) {
      showToast("Anda tidak dapat menghapus akun Anda sendiri!", "warning");
      return;
    }
    setUsers(prev => prev.filter(u => u.id !== userId));
    logAudit("Hapus User", `Menghapus akun ${target.username} (${target.fullName})`);
    showToast(`Akun ${target.fullName} berhasil dihapus dari sistem.`, "info");
  };

  const addTransaction = (tx: Transaction) => {
    if (!isRecepRole(currentUser?.role)) {
      showToast("Akses Ditolak: Hanya staf Resepsionis yang berwenang memproses Check-In & Booking!", "error");
      return;
    }
    setTransactions(prev => [...prev, tx]);
    setRooms(prev => prev.map(r => {
      if (r.id === tx.roomId) {
        if (r.status === 'KOSONG') {
          return { ...r, status: tx.status as any, activeTxId: tx.id };
        }
        if (tx.status === 'TERISI') {
          return { ...r, status: tx.status as any, activeTxId: tx.id };
        }
      }
      return r;
    }));
    logAudit(tx.status === 'BOOKED' ? "BOOKING" : "CHECKIN", `Untuk ${tx.roomNumber} (${tx.guestName})`);
    showToast(`Transaksi berhasil dikonfirmasi!`, "success");
  };

  const addGroupBooking = (txList: Transaction[], groupName: string) => {
    if (!isRecepRole(currentUser?.role)) {
      showToast("Akses Ditolak: Hanya staf Resepsionis & Admin yang berwenang mendaftarkan rombongan!", "error");
      return;
    }
    setTransactions(prev => [...prev, ...txList]);
    setRooms(prev => prev.map(r => {
      const matchTx = txList.find(t => t.roomId === r.id);
      if (matchTx) {
        return { ...r, status: matchTx.status as any, activeTxId: matchTx.id };
      }
      return r;
    }));
    logAudit("REGISTRASI_ROMBONGAN", `Mendaftarkan rombongan "${groupName}" sebanyak ${txList.length} fasilitas.`);
    showToast(`Rombongan "${groupName}" (${txList.length} kamar/fasilitas) berhasil didaftarkan!`, "success");
  };

  const updateTransaction = (updatedTx: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === updatedTx.id ? updatedTx : t));
  };

  const updateBreakfastStatus = (txId: string, status: 'MENUNGGU' | 'SEDANG_DIBUAT' | 'PENGANTARAN' | 'SELESAI') => {
    if (!isKoperasiRole(currentUser?.role)) {
      showToast("Akses Ditolak: Hanya Petugas Koperasi yang berwenang memperbarui status produksi & pengantaran sarapan!", "error");
      return;
    }
    setTransactions(prev => prev.map(t => t.id === txId ? { ...t, breakfastStatus: status } : t));
    const statusLabel = status === 'SEDANG_DIBUAT' ? 'Sedang Dibuat di Dapur' : status === 'PENGANTARAN' ? 'Sedang Pengantaran ke Kamar' : status === 'SELESAI' ? 'Selesai Diantar' : 'Menunggu';
    const tx = transactions.find(t => t.id === txId);
    logAudit("Status Sarapan", `Petugas Koperasi ${currentUser?.fullName} mengubah status pesanan sarapan ${tx?.roomNumber || txId} (${tx?.guestName || ''}) menjadi: ${statusLabel}`);
    showToast(`Status sarapan diperbarui: ${statusLabel}`, "success");
  };

  const checkoutRoom = (roomId: string, txId?: string) => {
    if (!isRecepRole(currentUser?.role)) {
      showToast("Akses Ditolak: Hanya staf Resepsionis yang berwenang memproses Check-Out!", "error");
      return;
    }
    let targetTxId: string | null = txId || null;
    if (!targetTxId) {
      const room = rooms.find(r => r.id === roomId);
      if (room && room.activeTxId) {
        targetTxId = room.activeTxId;
      }
    }

    if (targetTxId) {
      const targetTx = transactions.find(t => t.id === targetTxId);
      const room = rooms.find(r => r.id === roomId);
      const guestName = targetTx?.guestName || 'Tamu';

      const updatedTxs = transactions.map(t => t.id === targetTxId ? { ...t, status: "SELESAI" as const } : t);
      setTransactions(updatedTxs);
      
      setRooms(prev => prev.map(r => {
        if (r.id === roomId) {
          const activeTxs = updatedTxs.filter(t => t.roomId === roomId && (t.status === 'TERISI' || t.status === 'BOOKED'));
          const stillTerisi = activeTxs.find(t => t.status === 'TERISI');
          if (stillTerisi) {
            return { ...r, status: "TERISI", activeTxId: stillTerisi.id };
          }
          const nextBooked = activeTxs.find(t => t.status === 'BOOKED');
          if (nextBooked) {
            return { ...r, status: "BOOKED", activeTxId: nextBooked.id, qcStatus: "PERLU_INSPEKSI" };
          }
          return { ...r, status: "KOSONG", activeTxId: null, qcStatus: "PERLU_INSPEKSI" };
        }
        return r;
      }));
      
      logAudit("Check-Out", `Check-out berhasil untuk ${guestName} di ruangan ${room?.roomNumber || roomId}. Status kamar kini Perlu Inspeksi QC.`);
      showToast(`Check-Out untuk ${guestName} (${room?.roomNumber || roomId}) berhasil! Kamar siap diinspeksi kebersihan QC.`, "success");
    }
  };

  const cancelBooking = (roomId: string, txId?: string) => {
    if (!isRecepRole(currentUser?.role)) {
      showToast("Akses Ditolak: Hanya staf Resepsionis yang berwenang membatalkan booking!", "error");
      return;
    }
    let targetTxId: string | null = txId || null;
    if (!targetTxId) {
      const room = rooms.find(r => r.id === roomId);
      if (room && room.activeTxId) {
        targetTxId = room.activeTxId;
      }
    }

    if (targetTxId) {
      const targetTx = transactions.find(t => t.id === targetTxId);
      const room = rooms.find(r => r.id === roomId);
      const guestName = targetTx?.guestName || 'Reservasi';

      const updatedTxs = transactions.map(t => t.id === targetTxId ? { ...t, status: "DIBATALKAN" as const } : t);
      setTransactions(updatedTxs);
      
      setRooms(prev => prev.map(r => {
        if (r.id === roomId) {
          const activeTxs = updatedTxs.filter(t => t.roomId === roomId && (t.status === 'TERISI' || t.status === 'BOOKED'));
          const stillTerisi = activeTxs.find(t => t.status === 'TERISI');
          if (stillTerisi) {
            return { ...r, status: "TERISI", activeTxId: stillTerisi.id };
          }
          const nextBooked = activeTxs.find(t => t.status === 'BOOKED');
          if (nextBooked) {
            return { ...r, status: "BOOKED", activeTxId: nextBooked.id };
          }
          return { ...r, status: "KOSONG", activeTxId: null };
        }
        return r;
      }));
      
      logAudit("Batal Booking", `Booking ${guestName} dibatalkan untuk ruangan ${room?.roomNumber || roomId}`);
      showToast(`Booking ${guestName} (${room?.roomNumber || roomId}) telah berhasil dibatalkan.`, "success");
    }
  };

  const activateCheckin = (roomId: string, targetTxId?: string) => {
    if (!isRecepRole(currentUser?.role)) {
      showToast("Akses Ditolak: Hanya staf Resepsionis yang berwenang mengaktifkan Check-In!", "error");
      return;
    }
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    const txIdToActivate = targetTxId || room.activeTxId;
    if (!txIdToActivate) return;

    const targetTx = transactions.find(t => t.id === txIdToActivate);
    const guestName = targetTx?.guestName || 'Tamu';

    const updatedTxs = transactions.map(t => t.id === txIdToActivate ? { ...t, status: "TERISI" as const } : t);
    setTransactions(updatedTxs);
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, status: "TERISI", activeTxId: txIdToActivate } : r));

    logAudit("Aktivasi Check-In", `Aktivasi status terisi dari booking ${room.roomNumber} (${guestName})`);
    showToast(`Check-In untuk ${room.roomNumber} (${guestName}) berhasil diaktifkan!`, "success");
  };

  const extendTransaction = (
    txId: string, 
    additionalDuration: number, 
    extendBreakfast: boolean = false, 
    extendExtraBed: boolean = false,
    reason?: string
  ): boolean => {
    if (!isRecepRole(currentUser?.role)) {
      showToast("Akses Ditolak: Hanya staf Resepsionis yang berwenang memproses perpanjangan sewa (Extend)!", "error");
      return false;
    }

    const tx = transactions.find(t => t.id === txId);
    if (!tx) {
      showToast("Data transaksi tidak ditemukan.", "error");
      return false;
    }

    const isAula = tx.building === 'Ruang Pertemuan';
    const currentDuration = Number(tx.duration) || 1;
    const added = Number(additionalDuration) || 1;
    const newTotalDuration = currentDuration + added;
    const unit = tx.durationUnit || (isAula ? 'Jam' : 'Malam');

    // Conflict detection
    if (!isAula) {
      const currentCheckout = addDaysToDateStr(tx.startDate, currentDuration);
      const newCheckout = addDaysToDateStr(tx.startDate, newTotalDuration);

      const conflict = transactions.find(other => {
        if (other.id === tx.id || other.roomId !== tx.roomId) return false;
        if (other.status === 'DIBATALKAN' || other.status === 'SELESAI') return false;

        const otherStart = other.startDate;
        return otherStart >= currentCheckout && otherStart < newCheckout;
      });

      if (conflict) {
        showToast(`Tidak dapat memperpanjang sewa! Kamar sudah di-booking oleh ${conflict.guestName} mulai tanggal ${formatIndonesianDate(conflict.startDate)}.`, "error");
        return false;
      }
    } else {
      if (unit === 'Jam' && newTotalDuration > 12) {
        showToast(`Maksimal durasi sewa aula dalam 1 hari adalah 12 Jam (Full Day). Durasi sewa (${newTotalDuration} Jam) melebihi batas.`, "error");
        return false;
      }
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const historyItem = {
      date: nowStr,
      addedDuration: added,
      unit,
      newTotalDuration,
      user: currentUser?.fullName || 'Resepsionis',
      reason: reason || 'Permintaan perpanjangan masa sewa oleh tamu / jemaah'
    };

    const newBreakfastDays = extendBreakfast 
      ? (tx.breakfastDays || tx.duration) + added 
      : tx.breakfastDays;

    const updatedTx: Transaction = {
      ...tx,
      duration: newTotalDuration,
      breakfastDays: newBreakfastDays,
      extendedCount: (tx.extendedCount || 0) + 1,
      extendHistory: [...(tx.extendHistory || []), historyItem],
      notes: tx.notes 
        ? `${tx.notes} | [Extend +${added} ${unit} pada ${formatIndonesianDate(nowStr.substring(0, 10))}]`
        : `[Extend +${added} ${unit} pada ${formatIndonesianDate(nowStr.substring(0, 10))}]`
    };

    if (extendExtraBed) {
      updatedTx.extraBed = true;
      updatedTx.extraBedCount = (tx.extraBedCount || 0) > 0 ? tx.extraBedCount : 1;
    }

    setTransactions(prev => prev.map(t => t.id === tx.id ? updatedTx : t));

    const newCheckoutDateStr = !isAula ? addDaysToDateStr(tx.startDate, newTotalDuration) : tx.startDate;

    logAudit(
      "Extend Sewa",
      `Petugas ${currentUser?.fullName} memperpanjang sewa ${tx.roomNumber} (${tx.guestName}) sebanyak +${added} ${unit}. Total durasi baru: ${newTotalDuration} ${unit}.${extendBreakfast ? ' Termasuk sarapan.' : ''}`
    );

    showToast(
      `Perpanjangan sewa ${tx.roomNumber} (${tx.guestName}) berhasil! (+${added} ${unit})${!isAula ? ` hingga ${formatIndonesianDate(newCheckoutDateStr)}` : ''}`,
      "success"
    );

    return true;
  };

  const addMaintenance = (maint: Maintenance) => {
    setMaintenances(prev => [...prev, maint]);
    setRooms(prev => prev.map(r => r.id === maint.roomId ? { ...r, status: "MAINTENANCE", activeMaintId: maint.id, qcStatus: "PERLU_PERBAIKAN" } : r));
    logAudit("Lapor Maintenance", `Laporan perawatan ${maint.category} (${maint.urgency}) di ${maint.roomNumber} (${maint.building})`);
    showToast(`Tiket perbaikan ${maint.roomNumber} berhasil dicatat dan menunggu penugasan Manager Teknisi!`, "warning");
  };

  const assignTechnicianToMaintenance = (maintId: string, technicianId: string, technicianName: string, managerNotes?: string): boolean => {
    if (!isManagerTeknisi(currentUser?.role)) {
      showToast("Akses Ditolak: Hanya Manager Teknisi atau Super Admin yang berwenang menugaskan teknisi!", "error");
      return false;
    }

    const maint = maintenances.find(m => m.id === maintId);
    if (!maint) {
      showToast("Data perawatan tidak ditemukan.", "error");
      return false;
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    setMaintenances(prev => prev.map(m => {
      if (m.id === maintId) {
        return {
          ...m,
          status: 'PROSES',
          assignedTechnicianId: technicianId,
          assignedTechnicianName: technicianName,
          assignedByManager: currentUser.fullName,
          assignedTime: nowStr,
          managerNotes: managerNotes || m.managerNotes,
          technician: technicianName
        };
      }
      return m;
    }));

    setRooms(prev => prev.map(r => r.id === maint.roomId ? { ...r, status: "MAINTENANCE", activeMaintId: maint.id } : r));

    logAudit(
      "Penugasan Teknisi", 
      `Manager Teknisi ${currentUser.fullName} menugaskan ${technicianName} untuk memperbaiki ${maint.roomNumber} (${maint.building})${managerNotes ? `. Instruksi: ${managerNotes}` : ''}`
    );
    showToast(`Tugas perbaikan ${maint.roomNumber} berhasil didelegasikan kepada ${technicianName}!`, "success");
    return true;
  };

  const markMaintenanceRepaired = (maintId: string, technicianNotes: string): boolean => {
    if (!isTeknisiRole(currentUser?.role)) {
      showToast("Akses Ditolak: Hanya petugas Teknisi / Manager Teknisi yang berwenang memperbarui status perbaikan!", "error");
      return false;
    }

    const maint = maintenances.find(m => m.id === maintId);
    if (!maint) {
      showToast("Data perawatan tidak ditemukan.", "error");
      return false;
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    setMaintenances(prev => prev.map(m => {
      if (m.id === maintId) {
        return {
          ...m,
          status: 'MENUNGGU_QC',
          workCompletedTime: nowStr,
          technicianNotes: technicianNotes || m.technicianNotes || 'Pekerjaan perbaikan fisik telah diselesaikan teknisi.'
        };
      }
      return m;
    }));

    setRooms(prev => prev.map(r => {
      if (r.id === maint.roomId) {
        return { 
          ...r, 
          status: "MAINTENANCE", 
          qcStatus: "MENUNGGU_QC",
          lastQcNotes: `Perbaikan teknisi telah selesai (${nowStr}). Menunggu inspeksi & pengesahan Tim QC.`
        };
      }
      return r;
    }));

    logAudit(
      "Perbaikan Selesai - Menunggu QC", 
      `Petugas ${currentUser.fullName} menyatakan perbaikan ${maint.roomNumber} telah selesai. Kamar/ruangan berstatus MENUNGGU_QC untuk diverifikasi Tim Quality Control.`
    );
    showToast(`Perbaikan ${maint.roomNumber} selesai diperbaiki! Menunggu verifikasi & uji kelayakan QC.`, "info");
    return true;
  };

  const updateMaintenanceStatus = (maintId: string, newStatus: 'MENUNGGU_PENUGASAN' | 'PROSES' | 'MENUNGGU_QC' | 'SELESAI', technicianNotes?: string): boolean => {
    if (!isTeknisiRole(currentUser?.role)) {
      showToast("Akses Ditolak: Hanya petugas Teknisi yang berwenang memperbarui status perawatan!", "error");
      return false;
    }

    const maint = maintenances.find(m => m.id === maintId);
    if (!maint) {
      showToast("Data perawatan tidak ditemukan.", "error");
      return false;
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    setMaintenances(prev => prev.map(m => {
      if (m.id === maintId) {
        return {
          ...m,
          status: newStatus,
          resolvedTime: newStatus === 'SELESAI' ? nowStr : m.resolvedTime,
          technicianNotes: technicianNotes !== undefined ? technicianNotes : m.technicianNotes,
          technician: m.technician || currentUser.fullName
        };
      }
      return m;
    }));

    setRooms(prev => prev.map(r => {
      if (r.id === maint.roomId) {
        if (newStatus === 'SELESAI') {
          return { ...r, status: "KOSONG", activeMaintId: null, qcStatus: "LOLOS_QC" };
        } else if (newStatus === 'MENUNGGU_QC') {
          return { ...r, status: "MAINTENANCE", activeMaintId: maint.id, qcStatus: "MENUNGGU_QC" };
        } else {
          return { ...r, status: "MAINTENANCE", activeMaintId: maint.id };
        }
      }
      return r;
    }));

    const statusLabel = newStatus === 'SELESAI' 
      ? 'Selesai & Disahkan Lolos' 
      : newStatus === 'MENUNGGU_QC' 
      ? 'Perbaikan Selesai (Menunggu QC)' 
      : newStatus === 'PROSES' 
      ? 'Dalam Pengerjaan Teknisi' 
      : 'Menunggu Penugasan';

    logAudit(
      "Update Status Maintenance", 
      `${currentUser.fullName} mengubah status perbaikan fasilitas ${maint.roomNumber} (${maint.building}) menjadi "${statusLabel}"`
    );
    showToast(`Status perbaikan ${maint.roomNumber} diperbarui: ${statusLabel}`, "success");
    return true;
  };

  const finishMaintenance = (roomId: string): boolean => {
    if (!isTeknisiRole(currentUser?.role)) {
      showToast("Akses Ditolak: Hanya petugas Teknisi yang berwenang memperbarui status perbaikan!", "error");
      return false;
    }

    const room = rooms.find(r => r.id === roomId);
    if (!room) return false;

    const targetMaint = maintenances.find(m => m.roomId === roomId && (m.status === 'PROSES' || m.status === 'MENUNGGU_PENUGASAN'));

    if (targetMaint) {
      return markMaintenanceRepaired(targetMaint.id, 'Perbaikan diselesaikan langsung oleh teknisi. Menunggu verifikasi QC.');
    } else {
      setRooms(prev => prev.map(r => r.id === roomId ? { ...r, status: "MAINTENANCE", qcStatus: "MENUNGGU_QC" } : r));
      logAudit("Selesai Pekerjaan Teknisi", `Teknisi ${currentUser.fullName} menyelesaikan pekerjaan pada ${room.roomNumber}. Menunggu pengesahan QC.`);
      showToast(`${room.roomNumber} telah selesai diperbaiki! Wajib diverifikasi QC sebelum disewakan.`, "info");
      return true;
    }
  };

  const addQcInspection = (inspection: QcInspection) => {
    if (!isQcRole(currentUser?.role)) {
      showToast("Akses Ditolak: Hanya petugas Quality Control yang berwenang melakukan inspeksi!", "error");
      return;
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    setQcInspections(prev => [inspection, ...prev]);

    if (inspection.result === 'LOLOS_QC') {
      // 1. Mark Room / Meeting Hall as KOSONG & LOLOS_QC (Siap Huni / Disewa)
      setRooms(prev => prev.map(r => {
        if (r.id === inspection.roomId) {
          return {
            ...r,
            status: 'KOSONG',
            activeMaintId: null,
            qcStatus: 'LOLOS_QC',
            lastQcDate: inspection.inspectionDate,
            lastQcBy: inspection.inspectorName,
            lastQcNotes: inspection.notes || 'Kondisi kamar/gedung bersih, fasilitas normal, dan LOLOS standar QC'
          };
        }
        return r;
      }));

      // 2. Resolve any associated maintenance tickets
      setMaintenances(prev => prev.map(m => {
        if (m.roomId === inspection.roomId && (m.status === 'MENUNGGU_QC' || m.status === 'PROSES' || m.status === 'MENUNGGU_PENUGASAN')) {
          return {
            ...m,
            status: 'SELESAI',
            resolvedTime: nowStr,
            qcVerdict: 'LOLOS_QC',
            qcInspectionId: inspection.id
          };
        }
        return m;
      }));

      logAudit(
        "Inspeksi QC Disahkan (Lolos)",
        `Tim QC (${inspection.inspectorName}) menyatakan fasilitas ${inspection.roomNumber} (${inspection.building}) RESMI LOLOS QC. Ruangan/kamar telah dipulihkan menjadi KOSONG dan siap digunakan!`
      );
      showToast(`Fasilitas ${inspection.roomNumber} terverifikasi LOLOS QC & SIAP HUNI!`, "success");

    } else {
      // PERLU PERBAIKAN: Room remains / becomes MAINTENANCE
      const newMaintId = `MNT-QC-${Date.now().toString().slice(-4)}`;

      setRooms(prev => prev.map(r => {
        if (r.id === inspection.roomId) {
          return {
            ...r,
            status: 'MAINTENANCE',
            activeMaintId: newMaintId,
            qcStatus: 'PERLU_PERBAIKAN',
            lastQcDate: inspection.inspectionDate,
            lastQcBy: inspection.inspectorName,
            lastQcNotes: inspection.notes || 'Ditemukan ketidaklayakan saat inspeksi QC. Diteruskan ke Manager Teknisi.'
          };
        }
        return r;
      }));

      const newMaint: Maintenance = {
        id: newMaintId,
        roomId: inspection.roomId,
        roomNumber: inspection.roomNumber,
        building: inspection.building,
        category: 'Temuan Tidak Layak QC',
        urgency: 'Tinggi',
        description: `Laporan QC (${inspection.inspectorName}): ${inspection.notes || 'Fasilitas tidak memenuhi standar kelayakan, butuh perbaikan teknisi.'}`,
        reportedUser: `QC - ${inspection.inspectorName}`,
        reportTime: inspection.inspectionDate,
        status: 'MENUNGGU_PENUGASAN',
        technician: 'Menunggu Penugasan Manager Teknisi',
        facilityType: inspection.facilityType || (inspection.roomNumber.includes('Aula') ? 'RUANG_PERTEMUAN' : 'KAMAR')
      };

      setMaintenances(prev => [newMaint, ...prev]);

      logAudit(
        "Temuan QC: Tidak Layak",
        `QC ${inspection.inspectorName} menyatakan ${inspection.roomNumber} (${inspection.building}) TIDAK LAYAK. Tiket dibuat dengan status MENUNGGU PENUGASAN dari Manager Teknisi.`
      );
      showToast(`Laporan QC tersimpan: ${inspection.roomNumber} TIDAK LAYAK. Diteruskan ke Manager Teknisi!`, "warning");
    }
  };

  const openModal = (modalId: string, data?: any) => {
    setModalState(prev => ({ ...prev, [modalId]: { isOpen: true, data } }));
  };

  const closeModal = (modalId: string) => {
    setModalState(prev => ({ ...prev, [modalId]: { isOpen: false, data: null } }));
  };

  // Modal scroll lock on body
  useEffect(() => {
    const isAnyModalOpen = Object.values(modalState).some((m: any) => Boolean(m?.isOpen));
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [modalState]);

  return (
    <AppContext.Provider value={{
      currentUser, users, rooms, transactions, maintenances, auditLogs, workSessions, qcInspections, activeSessionId, activeTab, toasts, modalState,
      chatChannels, chatMessages, isChatOpen, activeChatChannelId, chatSoundEnabled, chatNotificationToast, unreadTotalCount,
      openChat, closeChat, setActiveChatChannelId: handleSetActiveChatChannelId, toggleChatSound, sendChatMessage,
      markChannelAsRead, dismissChatNotification, simulateIncomingChatMessage,
      login, logout, setActiveTab, addUser, updateUser, toggleUserStatus, deleteUser, addTransaction, addGroupBooking, updateTransaction, updateBreakfastStatus, checkoutRoom, activateCheckin, cancelBooking, extendTransaction,
      addMaintenance, assignTechnicianToMaintenance, markMaintenanceRepaired, updateMaintenanceStatus, finishMaintenance, addQcInspection, logAudit, showToast, removeToast, openModal, closeModal
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
}
