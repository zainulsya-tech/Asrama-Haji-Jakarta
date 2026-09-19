import { ChatChannel, ChatMessage } from './types';

export const initialChatChannels: ChatChannel[] = [
  // 1. FORUM KOORDINASI ANTAR MANAGER (All Managers + Super Admin)
  {
    id: 'channel-all-managers',
    name: 'Forum Koordinasi Antar Manager',
    scope: 'ALL_MANAGERS_GROUP',
    type: 'GROUP',
    participantIds: ['u1', 'u2', 'u5', 'u8', 'u11'],
    description: 'Ruang koordinasi strategis pimpinan divisi operasional Asrama Haji.',
    icon: 'fa-users-gear',
    lastMessage: 'Terima kasih atas sinergi yang solid antar divisi. Pastikan kenyamanan jemaah menjadi prioritas utama.',
    lastMessageTime: '17:15',
    lastSenderName: 'Ahmad Faisal'
  },

  // 2. DIRECT MESSAGES ANTAR MANAGER
  {
    id: 'dm-u2-u5',
    name: 'Koordinasi Resepsionis - QC',
    scope: 'MANAGER_TO_MANAGER',
    type: 'DIRECT',
    participantIds: ['u2', 'u5'],
    description: 'Koordinasi kesiapan kamar pasca inspeksi QC untuk check-in.',
    icon: 'fa-clipboard-check',
    lastMessage: 'Bu Siti, kamar A-102 dan A-103 sudah lolos inspeksi kelayakan dan desinfektan.',
    lastMessageTime: '16:40',
    lastSenderName: 'Ir. Hendra Kusuma'
  },
  {
    id: 'dm-u5-u8',
    name: 'Koordinasi QC - Teknisi',
    scope: 'MANAGER_TO_MANAGER',
    type: 'DIRECT',
    participantIds: ['u5', 'u8'],
    description: 'Penyampaian temuan kerusakan dari QC ke teknisi untuk perbaikan.',
    icon: 'fa-wrench',
    lastMessage: 'Siap Pak Hendra, teknisi Budi Santoso sudah meluncur dengan sparepart baru.',
    lastMessageTime: '16:25',
    lastSenderName: 'H. Joko Susilo, ST'
  },
  {
    id: 'dm-u2-u11',
    name: 'Koordinasi Resepsionis - Koperasi',
    scope: 'MANAGER_TO_MANAGER',
    type: 'DIRECT',
    participantIds: ['u2', 'u11'],
    description: 'Sinkronisasi data sarapan jemaah check-in baru.',
    icon: 'fa-utensils',
    lastMessage: 'Siap Bu Siti, dapur utama langsung siapkan pesanan sarapan tepat waktu.',
    lastMessageTime: '15:50',
    lastSenderName: 'Hj. Rina Marlina'
  },
  {
    id: 'dm-u1-u2',
    name: 'Pimpinan - Manager Resepsionis',
    scope: 'MANAGER_TO_MANAGER',
    type: 'DIRECT',
    participantIds: ['u1', 'u2'],
    description: 'Arahan pimpinan operasional hunian dan alokasi kloter.',
    icon: 'fa-hotel',
    lastMessage: 'Laporan okupansi hari ini mencapai 85%, gedung Arafah dan Mina terisi penuh.',
    lastMessageTime: '14:30',
    lastSenderName: 'Dra. Hj. Siti Rahmah'
  },
  {
    id: 'dm-u1-u8',
    name: 'Pimpinan - Manager Teknisi',
    scope: 'MANAGER_TO_MANAGER',
    type: 'DIRECT',
    participantIds: ['u1', 'u8'],
    description: 'Pengawasan utilitas, genset, dan fasilitas gedung.',
    icon: 'fa-bolt',
    lastMessage: 'Genset utama 250 kVA sudah running test dan solar terisi penuh Pak Pimpinan.',
    lastMessageTime: '13:45',
    lastSenderName: 'H. Joko Susilo, ST'
  },
  {
    id: 'dm-u1-u5',
    name: 'Pimpinan - Manager QC',
    scope: 'MANAGER_TO_MANAGER',
    type: 'DIRECT',
    participantIds: ['u1', 'u5'],
    description: 'Laporan standar higienitas dan kepatuhan kelayakan hunian.',
    icon: 'fa-shield-check',
    lastMessage: 'Seluruh kamar kloter 01 dan 02 telah terverifikasi lolos uji kelayakan.',
    lastMessageTime: '13:10',
    lastSenderName: 'Ir. Hendra Kusuma'
  },
  {
    id: 'dm-u1-u11',
    name: 'Pimpinan - Manager Koperasi',
    scope: 'MANAGER_TO_MANAGER',
    type: 'DIRECT',
    participantIds: ['u1', 'u11'],
    description: 'Laporan suplai logistik dan konsumsi sarapan jemaah.',
    icon: 'fa-kitchen-set',
    lastMessage: 'Bahan baku makanan untuk 3 hari ke depan sudah tersedia lengkap di gudang dapur.',
    lastMessageTime: '12:20',
    lastSenderName: 'Hj. Rina Marlina'
  },

  // 3. GRUP DIVISI (Manager + Bawahan)
  {
    id: 'group-recep',
    name: 'Grup Divisi Resepsionis',
    scope: 'DIVISION_GROUP',
    type: 'GROUP',
    department: 'Divisi Resepsionis',
    participantIds: ['u1', 'u2', 'u3', 'u4'],
    description: 'Instruksi dan koordinasi pelayanan check-in, check-out, dan kunci kamar.',
    icon: 'fa-bell-concierge',
    lastMessage: 'Siap Bu Siti, kunci kamar B-101 s/d B-110 sudah siap di meja resepsionis.',
    lastMessageTime: '16:55',
    lastSenderName: 'Bambang Irawan'
  },
  {
    id: 'group-qc',
    name: 'Grup Divisi Quality Control',
    scope: 'DIVISION_GROUP',
    type: 'GROUP',
    department: 'Divisi Quality Control',
    participantIds: ['u1', 'u5', 'u6', 'u7'],
    description: 'Koordinasi inspeksi kebersihan, kelengkapan linen, dan sanitasi kamar.',
    icon: 'fa-list-check',
    lastMessage: 'Sedang berjalan inspeksi cek linen dan AC kamar C-201 sampai C-208 Pak Hendra.',
    lastMessageTime: '16:30',
    lastSenderName: 'Farhan Maulana'
  },
  {
    id: 'group-teknisi',
    name: 'Grup Divisi Teknisi & Perbaikan',
    scope: 'DIVISION_GROUP',
    type: 'GROUP',
    department: 'Divisi Teknisi',
    participantIds: ['u1', 'u8', 'u9', 'u10'],
    description: 'Penugasan darurat maintenance, kelistrikan, AC, dan perbaikan sanitasi.',
    icon: 'fa-screwdriver-wrench',
    lastMessage: 'Lapor Pak Joko, lampu koridor Gedung A sudah diganti baru dan menyala terang.',
    lastMessageTime: '16:15',
    lastSenderName: 'Budi Santoso'
  },
  {
    id: 'group-koperasi',
    name: 'Grup Divisi Koperasi & Konsumsi',
    scope: 'DIVISION_GROUP',
    type: 'GROUP',
    department: 'Divisi Koperasi',
    participantIds: ['u1', 'u11', 'u12'],
    description: 'Koordinasi persiapan sarapan pagi dan pengantaran makanan jemaah.',
    icon: 'fa-bread-slice',
    lastMessage: 'Baik Bu Rina, 40 box sarapan Gedung Muzdalifah sudah selesai diantar tepat waktu.',
    lastMessageTime: '15:20',
    lastSenderName: 'Siti Aminah'
  },

  // 4. DIRECT MESSAGES MANAGER KE BAWAHAN (1-on-1)
  {
    id: 'dm-u2-u3',
    name: 'Bambang Irawan (Resepsionis)',
    scope: 'MANAGER_TO_SUBORDINATE',
    type: 'DIRECT',
    department: 'Divisi Resepsionis',
    participantIds: ['u2', 'u3', 'u1'],
    description: 'Jalur koordinasi langsung Manager Resepsionis dengan petugas Bambang.',
    icon: 'fa-user-tie',
    lastMessage: 'Bambang, pastikan tanda terima kunci kamar Gedung A dicatat di formulir fisik juga ya.',
    lastMessageTime: '15:10',
    lastSenderName: 'Dra. Hj. Siti Rahmah'
  },
  {
    id: 'dm-u2-u4',
    name: 'Dewi Lestari (Resepsionis)',
    scope: 'MANAGER_TO_SUBORDINATE',
    type: 'DIRECT',
    department: 'Divisi Resepsionis',
    participantIds: ['u2', 'u4', 'u1'],
    description: 'Jalur koordinasi langsung Manager Resepsionis dengan petugas Dewi.',
    icon: 'fa-user-tie',
    lastMessage: 'Dewi, jemaah kloter lansia di Gedung C mohon dibantu proses check-in cepat di tempat.',
    lastMessageTime: '14:40',
    lastSenderName: 'Dra. Hj. Siti Rahmah'
  },
  {
    id: 'dm-u5-u6',
    name: 'Farhan Maulana (QC)',
    scope: 'MANAGER_TO_SUBORDINATE',
    type: 'DIRECT',
    department: 'Divisi Quality Control',
    participantIds: ['u5', 'u6', 'u1'],
    description: 'Penugasan dan arahan teknis inspeksi kelayakan kamar.',
    icon: 'fa-user-check',
    lastMessage: 'Farhan, prioritaskan cek sanitasi air panas di kamar Gedung Arafah lantai 2.',
    lastMessageTime: '15:35',
    lastSenderName: 'Ir. Hendra Kusuma'
  },
  {
    id: 'dm-u5-u7',
    name: 'Nurul Hidayah (QC)',
    scope: 'MANAGER_TO_SUBORDINATE',
    type: 'DIRECT',
    department: 'Divisi Quality Control',
    participantIds: ['u5', 'u7', 'u1'],
    description: 'Penugasan dan verifikasi standar linen dan kebersihan kamar.',
    icon: 'fa-user-check',
    lastMessage: 'Pak Hendra, sprei dan sarung bantal di Gedung Muzdalifah sudah 100% baru dan wangi.',
    lastMessageTime: '14:55',
    lastSenderName: 'Nurul Hidayah'
  },
  {
    id: 'dm-u8-u9',
    name: 'Budi Santoso (Teknisi)',
    scope: 'MANAGER_TO_SUBORDINATE',
    type: 'DIRECT',
    department: 'Divisi Teknisi',
    participantIds: ['u8', 'u9', 'u1'],
    description: 'Instruksi tugas perbaikan perpipaan, listrik, dan pendingin ruangan.',
    icon: 'fa-user-gear',
    lastMessage: 'Budi, tolong bawa multimeter dan cek MCB di panel lantai 1 Gedung Mina.',
    lastMessageTime: '15:40',
    lastSenderName: 'H. Joko Susilo, ST'
  },
  {
    id: 'dm-u8-u10',
    name: 'Dede Supriatna (Teknisi)',
    scope: 'MANAGER_TO_SUBORDINATE',
    type: 'DIRECT',
    department: 'Divisi Teknisi',
    participantIds: ['u8', 'u10', 'u1'],
    description: 'Instruksi perbaikan sanitasi dan perawatan rutin fasilitas.',
    icon: 'fa-user-gear',
    lastMessage: 'Pak Joko, pipa pembuangan wastafel C-104 sudah diganti seal baru dan tidak ada rembesan lagi.',
    lastMessageTime: '15:05',
    lastSenderName: 'Dede Supriatna'
  },
  {
    id: 'dm-u11-u12',
    name: 'Siti Aminah (Petugas Koperasi)',
    scope: 'MANAGER_TO_SUBORDINATE',
    type: 'DIRECT',
    department: 'Divisi Koperasi',
    participantIds: ['u11', 'u12', 'u1'],
    description: 'Koordinasi langsung produksi dan distribusi pesanan sarapan jemaah.',
    icon: 'fa-user-check',
    lastMessage: 'Mbak Siti, siapkan 25 porsi bubur ayam untuk lansia di Gedung D besok pagi ya.',
    lastMessageTime: '14:20',
    lastSenderName: 'Hj. Rina Marlina'
  }
];

export const initialChatMessages: ChatMessage[] = [
  // FORUM ANTAR MANAGER
  {
    id: 'msg-1',
    channelId: 'channel-all-managers',
    senderId: 'u5',
    senderName: 'Ir. Hendra Kusuma',
    senderRole: 'Manager QC',
    senderDepartment: 'Divisi Quality Control',
    message: "Assalamu'alaikum para Manager, Gedung Arafah (A) lantai 1 sudah lolos inspeksi QC 100%. Siap menerima jemaah Kloter 02.",
    timestamp: '2026-09-18 16:10:00',
    timeFormatted: '16:10',
    priority: 'PENTING',
    isInstruction: false,
    readBy: ['u5', 'u2', 'u8']
  },
  {
    id: 'msg-2',
    channelId: 'channel-all-managers',
    senderId: 'u2',
    senderName: 'Dra. Hj. Siti Rahmah',
    senderRole: 'Manager Resepsionis',
    senderDepartment: 'Divisi Resepsionis',
    message: "Wa'alaikumsalam Pak Hendra, terima kasih laporannya. Kami segera proses check-in untuk rombongan jemaah yang baru mendarat.",
    timestamp: '2026-09-18 16:15:00',
    timeFormatted: '16:15',
    priority: 'NORMAL',
    readBy: ['u2', 'u5', 'u8']
  },
  {
    id: 'msg-3',
    channelId: 'channel-all-managers',
    senderId: 'u8',
    senderName: 'H. Joko Susilo, ST',
    senderRole: 'Manager Teknisi',
    senderDepartment: 'Divisi Teknisi',
    message: "Untuk AC di Gedung C Mina kamar 205 sudah selesai diganti kapasitor oleh teknisi kami. Mohon tim QC cek kelayakan pendinginannya.",
    timestamp: '2026-09-18 16:35:00',
    timeFormatted: '16:35',
    priority: 'NORMAL',
    readBy: ['u8', 'u5']
  },
  {
    id: 'msg-4',
    channelId: 'channel-all-managers',
    senderId: 'u11',
    senderName: 'Hj. Rina Marlina',
    senderRole: 'Manager Koperasi',
    senderDepartment: 'Divisi Koperasi',
    message: "Noted Bapak/Ibu. Menu sarapan pagi besok untuk 120 jemaah Kloter 02 sudah siap didistribusikan mulai pukul 05.30 WIB.",
    timestamp: '2026-09-18 17:00:00',
    timeFormatted: '17:00',
    priority: 'NORMAL',
    readBy: ['u11', 'u2']
  },
  {
    id: 'msg-5',
    channelId: 'channel-all-managers',
    senderId: 'u1',
    senderName: 'Ahmad Faisal',
    senderRole: 'Super Admin',
    senderDepartment: 'Pimpinan & IT',
    message: "Terima kasih atas sinergi yang solid antar divisi. Pastikan kenyamanan jemaah menjadi prioritas utama kita bersama.",
    timestamp: '2026-09-18 17:15:00',
    timeFormatted: '17:15',
    priority: 'PENTING',
    isInstruction: true,
    readBy: ['u1', 'u2']
  },

  // DM RESEPSIONIS - QC
  {
    id: 'msg-dm-1',
    channelId: 'dm-u2-u5',
    senderId: 'u2',
    senderName: 'Dra. Hj. Siti Rahmah',
    senderRole: 'Manager Resepsionis',
    senderDepartment: 'Divisi Resepsionis',
    message: "Pak Hendra, apakah kamar A-102 dan A-103 sudah bisa kami masukkan tamu VIP sore ini?",
    timestamp: '2026-09-18 16:30:00',
    timeFormatted: '16:30',
    priority: 'NORMAL',
    readBy: ['u2', 'u5']
  },
  {
    id: 'msg-dm-2',
    channelId: 'dm-u2-u5',
    senderId: 'u5',
    senderName: 'Ir. Hendra Kusuma',
    senderRole: 'Manager QC',
    senderDepartment: 'Divisi Quality Control',
    message: "Bu Siti, kamar A-102 dan A-103 sudah lolos inspeksi kelayakan dan desinfektan. Aman untuk ditempati!",
    timestamp: '2026-09-18 16:40:00',
    timeFormatted: '16:40',
    priority: 'PENTING',
    readBy: ['u5', 'u2']
  },

  // DM QC - TEKNISI
  {
    id: 'msg-dm-3',
    channelId: 'dm-u5-u8',
    senderId: 'u5',
    senderName: 'Ir. Hendra Kusuma',
    senderRole: 'Manager QC',
    senderDepartment: 'Divisi Quality Control',
    message: "Pak Joko, ada temuan keran wastafel bocor di kamar C-104 saat inspeksi tadi. Mohon ditugaskan teknisi ya.",
    timestamp: '2026-09-18 16:20:00',
    timeFormatted: '16:20',
    priority: 'URGENT',
    isInstruction: true,
    readBy: ['u5', 'u8']
  },
  {
    id: 'msg-dm-4',
    channelId: 'dm-u5-u8',
    senderId: 'u8',
    senderName: 'H. Joko Susilo, ST',
    senderRole: 'Manager Teknisi',
    senderDepartment: 'Divisi Teknisi',
    message: "Siap Pak Hendra, teknisi Budi Santoso sudah meluncur dengan sparepart baru.",
    timestamp: '2026-09-18 16:25:00',
    timeFormatted: '16:25',
    priority: 'NORMAL',
    readBy: ['u8', 'u5']
  },

  // GRUP DIVISI TEKNISI
  {
    id: 'msg-tek-1',
    channelId: 'group-teknisi',
    senderId: 'u8',
    senderName: 'H. Joko Susilo, ST',
    senderRole: 'Manager Teknisi',
    senderDepartment: 'Divisi Teknisi',
    message: "Budi dan Dede, segera selesaikan tiket perbaikan pending di sistem sebelum pergantian shift ya. Utamakan kebocoran air di C-104.",
    timestamp: '2026-09-18 15:30:00',
    timeFormatted: '15:30',
    priority: 'PENTING',
    isInstruction: true,
    readBy: ['u8', 'u9', 'u10']
  },
  {
    id: 'msg-tek-2',
    channelId: 'group-teknisi',
    senderId: 'u9',
    senderName: 'Budi Santoso',
    senderRole: 'Teknisi',
    senderDepartment: 'Divisi Teknisi',
    message: "Lapor Pak Joko, lampu koridor Gedung A sudah diganti baru dan menyala terang. Sekarang saya meluncur ke C-104.",
    timestamp: '2026-09-18 16:15:00',
    timeFormatted: '16:15',
    priority: 'NORMAL',
    readBy: ['u9', 'u8']
  },

  // GRUP DIVISI RESEPSIONIS
  {
    id: 'msg-rec-1',
    channelId: 'group-recep',
    senderId: 'u2',
    senderName: 'Dra. Hj. Siti Rahmah',
    senderRole: 'Manager Resepsionis',
    senderDepartment: 'Divisi Resepsionis',
    message: "Bambang dan Dewi, Kloter 03 diperkirakan tiba jam 17.30 WIB. Pastikan kartu registrasi dan kunci kamar Gedung B sudah terkelompokan rapi.",
    timestamp: '2026-09-18 16:45:00',
    timeFormatted: '16:45',
    priority: 'PENTING',
    isInstruction: true,
    readBy: ['u2', 'u3', 'u4']
  },
  {
    id: 'msg-rec-2',
    channelId: 'group-recep',
    senderId: 'u3',
    senderName: 'Bambang Irawan',
    senderRole: 'Resepsionis',
    senderDepartment: 'Divisi Resepsionis',
    message: "Siap Bu Siti, kunci kamar B-101 s/d B-110 sudah siap di meja resepsionis.",
    timestamp: '2026-09-18 16:55:00',
    timeFormatted: '16:55',
    priority: 'NORMAL',
    readBy: ['u3', 'u2']
  },

  // GRUP DIVISI QC
  {
    id: 'msg-qc-1',
    channelId: 'group-qc',
    senderId: 'u5',
    senderName: 'Ir. Hendra Kusuma',
    senderRole: 'Manager QC',
    senderDepartment: 'Divisi Quality Control',
    message: "Farhan dan Nurul, mohon prioritaskan inspeksi akhir untuk Gedung Mina lantai 2 ya.",
    timestamp: '2026-09-18 16:00:00',
    timeFormatted: '16:00',
    priority: 'PENTING',
    isInstruction: true,
    readBy: ['u5', 'u6', 'u7']
  },
  {
    id: 'msg-qc-2',
    channelId: 'group-qc',
    senderId: 'u6',
    senderName: 'Farhan Maulana',
    senderRole: 'Quality Control',
    senderDepartment: 'Divisi Quality Control',
    message: "Sedang berjalan inspeksi cek linen dan AC kamar C-201 sampai C-208 Pak Hendra. Sejauh ini kondisi bersih.",
    timestamp: '2026-09-18 16:30:00',
    timeFormatted: '16:30',
    priority: 'NORMAL',
    readBy: ['u6', 'u5']
  },

  // GRUP DIVISI KOPERASI
  {
    id: 'msg-kop-1',
    channelId: 'group-koperasi',
    senderId: 'u11',
    senderName: 'Hj. Rina Marlina',
    senderRole: 'Manager Koperasi',
    senderDepartment: 'Divisi Koperasi',
    message: "Mbak Siti, mohon update status pengantaran sarapan di dashboard begitu selesai diantar ke kamar jemaah ya.",
    timestamp: '2026-09-18 15:00:00',
    timeFormatted: '15:00',
    priority: 'NORMAL',
    readBy: ['u11', 'u12']
  },
  {
    id: 'msg-kop-2',
    channelId: 'group-koperasi',
    senderId: 'u12',
    senderName: 'Siti Aminah',
    senderRole: 'Petugas Koperasi',
    senderDepartment: 'Divisi Koperasi',
    message: "Baik Bu Rina, 40 box sarapan Gedung Muzdalifah sudah selesai diantar tepat waktu.",
    timestamp: '2026-09-18 15:20:00',
    timeFormatted: '15:20',
    priority: 'NORMAL',
    readBy: ['u12', 'u11']
  },

  // DM MANAGER TO SUBORDINATE
  {
    id: 'msg-dm-u8-u9-1',
    channelId: 'dm-u8-u9',
    senderId: 'u8',
    senderName: 'H. Joko Susilo, ST',
    senderRole: 'Manager Teknisi',
    senderDepartment: 'Divisi Teknisi',
    message: "Budi, tolong bawa multimeter dan cek MCB di panel lantai 1 Gedung Mina.",
    timestamp: '2026-09-18 15:40:00',
    timeFormatted: '15:40',
    priority: 'PENTING',
    isInstruction: true,
    readBy: ['u8', 'u9']
  },
  {
    id: 'msg-dm-u2-u3-1',
    channelId: 'dm-u2-u3',
    senderId: 'u2',
    senderName: 'Dra. Hj. Siti Rahmah',
    senderRole: 'Manager Resepsionis',
    senderDepartment: 'Divisi Resepsionis',
    message: "Bambang, pastikan tanda terima kunci kamar Gedung A dicatat di formulir fisik juga ya selain di sistem.",
    timestamp: '2026-09-18 15:10:00',
    timeFormatted: '15:10',
    priority: 'NORMAL',
    readBy: ['u2', 'u3']
  }
];
