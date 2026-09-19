import { User, Room, Transaction, Maintenance, AuditLog, WorkSession, QcInspection } from './types';
import { getRealTodayDate, getRealDateWithOffset } from './lib/utils';

export const OFFICIAL_TARIFFS: Record<string, any> = {
    "Gedung A (Arafah)": { category: "KAMAR", capacity: "3-4 Bed", desc: "VIP / Standar Arafah" },
    "Gedung B (Muzdalifah)": { category: "KAMAR", capacity: "4 Bed", desc: "Standar Muzdalifah" },
    "Gedung C (Mina)": { category: "KAMAR", capacity: "4 Bed", desc: "Standar Mina" },
    "Gedung D (Madinah)": { category: "KAMAR", capacity: "2-3 Bed (AC/TV)", desc: "Deluxe Madinah" },
    "Ruang Pertemuan": { category: "AULA", capacity: "100 - 1500 Orang", desc: "Sewa per Hari / Acara" }
};

export const initialUsers: User[] = [
    // 1 Super Admin
    { 
        id: 'u1', 
        username: 'admin', 
        fullName: 'Ahmad Faisal', 
        role: 'Super Admin', 
        department: 'Pimpinan & IT',
        supervisorId: null,
        assignedBuilding: 'Pusat Komando & Manajemen Terpadu UPT', 
        phone: '081211112222', 
        status: 'Aktif' 
    },

    // Divisi Resepsionis: 1 Manager membawahi 2 Resepsionis
    { 
        id: 'u2', 
        username: 'mgr_resepsionis', 
        fullName: 'Dra. Hj. Siti Rahmah', 
        role: 'Manager Resepsionis', 
        department: 'Divisi Resepsionis',
        supervisorId: 'u1',
        assignedBuilding: 'Sentra Front Office & Registrasi Kawasan', 
        phone: '081233334444', 
        status: 'Aktif' 
    },
    { 
        id: 'u3', 
        username: 'recep1', 
        fullName: 'Bambang Irawan', 
        role: 'Resepsionis', 
        department: 'Divisi Resepsionis',
        supervisorId: 'u2',
        assignedBuilding: 'Posko Layanan Gedung A & B (Arafah - Muzdalifah)', 
        phone: '081355556666', 
        status: 'Aktif' 
    },
    { 
        id: 'u4', 
        username: 'recep2', 
        fullName: 'Dewi Lestari', 
        role: 'Resepsionis', 
        department: 'Divisi Resepsionis',
        supervisorId: 'u2',
        assignedBuilding: 'Posko Layanan Gedung C, D & Ruang Pertemuan', 
        phone: '081377778888', 
        status: 'Aktif' 
    },

    // Divisi Quality Control (QC): 1 Manager membawahi 2 Quality Control (QC)
    { 
        id: 'u5', 
        username: 'mgr_qc', 
        fullName: 'Ir. Hendra Kusuma', 
        role: 'Manager QC', 
        department: 'Divisi Quality Control',
        supervisorId: 'u1',
        assignedBuilding: 'Divisi Penjamin Mutu & Kelayakan Fasilitas', 
        phone: '081288889999', 
        status: 'Aktif' 
    },
    { 
        id: 'u6', 
        username: 'qc1', 
        fullName: 'Farhan Maulana', 
        role: 'Quality Control', 
        department: 'Divisi Quality Control',
        supervisorId: 'u5',
        assignedBuilding: 'Inspeksi Standar Hunian Gedung A & B', 
        phone: '081244445555', 
        status: 'Aktif' 
    },
    { 
        id: 'u7', 
        username: 'qc2', 
        fullName: 'Nurul Hidayah', 
        role: 'Quality Control', 
        department: 'Divisi Quality Control',
        supervisorId: 'u5',
        assignedBuilding: 'Inspeksi Standar Hunian Gedung C, D & Aula', 
        phone: '081266667777', 
        status: 'Aktif' 
    },

    // Divisi Teknisi: 1 Manager membawahi 2 Teknisi
    { 
        id: 'u8', 
        username: 'mgr_teknisi', 
        fullName: 'H. Joko Susilo, ST', 
        role: 'Manager Teknisi', 
        department: 'Divisi Teknisi',
        supervisorId: 'u1',
        assignedBuilding: 'Sentra Pemeliharaan Sarana & Prasarana', 
        phone: '081511112222', 
        status: 'Aktif' 
    },
    { 
        id: 'u9', 
        username: 'tek1', 
        fullName: 'Budi Santoso', 
        role: 'Teknisi', 
        department: 'Divisi Teknisi',
        supervisorId: 'u8',
        assignedBuilding: 'Unit Mekanikal & Elektrikal Gedung A - B', 
        phone: '081512345678', 
        status: 'Aktif' 
    },
    { 
        id: 'u10', 
        username: 'tek2', 
        fullName: 'Dede Supriatna', 
        role: 'Teknisi', 
        department: 'Divisi Teknisi',
        supervisorId: 'u8',
        assignedBuilding: 'Unit Tata Udara AC, Sound & Ruang Pertemuan', 
        phone: '081523456789', 
        status: 'Aktif' 
    },

    // Divisi Koperasi: 1 Manager membawahi 1 Petugas Koperasi
    { 
        id: 'u11', 
        username: 'mgr_koperasi', 
        fullName: 'Hj. Rina Marlina', 
        role: 'Manager Koperasi', 
        department: 'Divisi Koperasi',
        supervisorId: 'u1',
        assignedBuilding: 'Sentra Layanan Konsumsi & Katering Terpadu', 
        phone: '081299991111', 
        status: 'Aktif' 
    },
    { 
        id: 'u12', 
        username: 'koperasi', 
        fullName: 'Siti Aminah', 
        role: 'Petugas Koperasi', 
        department: 'Divisi Koperasi',
        supervisorId: 'u11',
        assignedBuilding: 'Unit Katering Dapur & Distribusi Sarapan', 
        phone: '081299990000', 
        status: 'Aktif' 
    }
];

export function getInitialRooms(): Room[] {
    const rooms: Room[] = [];
    const buildings = [
        { name: "Gedung A (Arafah)", code: "A" },
        { name: "Gedung B (Muzdalifah)", code: "B" },
        { name: "Gedung C (Mina)", code: "C" },
        { name: "Gedung D (Madinah)", code: "D" }
    ];

    buildings.forEach(b => {
        for (let i = 1; i <= 50; i++) {
            rooms.push({
                id: `room-${b.code}-${i}`,
                building: b.name,
                roomNumber: `${b.code}-${100 + i}`,
                type: "Kamar Penginapan",
                capacity: OFFICIAL_TARIFFS[b.name].capacity,
                status: "KOSONG",
                qcStatus: i % 7 === 0 ? "PERLU_INSPEKSI" : "LOLOS_QC",
                lastQcDate: "2026-09-15 10:00",
                lastQcBy: "Farhan Maulana (QC)",
                lastQcNotes: "Kamar bersih, linen rapi, AC dingin normal",
                activeTxId: null,
                activeMaintId: null
            });
        }
    });

    const meetingRooms = [
        "Gedung SG-1 (SG-1)", "Gedung SG-2 (SG-2)", "Gedung Multipurpose",
        "Aula Utama Arafah", "Aula Muzdalifah", "Aula Mina", "Ruang Rapat Bir Ali 1",
        "Ruang Rapat Bir Ali 2", "Ruang Rapat Bir Ali 3", "Auditorium Madinah",
        "Ruang VIP Quba", "Ruang VIP Uhud", "Ruang Pertemuan Nabawi"
    ];

    meetingRooms.forEach((mr, idx) => {
        rooms.push({
            id: `hall-${idx + 1}`,
            building: "Ruang Pertemuan",
            roomNumber: mr,
            type: "Ruang Pertemuan / Aula",
            capacity: "100 - 1500 Orang",
            status: "KOSONG",
            qcStatus: "LOLOS_QC",
            lastQcDate: "2026-09-16 14:00",
            lastQcBy: "Nurul Hidayah (QC)",
            lastQcNotes: "Sound system & AC aula siap pakai",
            activeTxId: null,
            activeMaintId: null
        });
    });
    
    // Seed initial data
    rooms[0].status = "TERISI";
    rooms[0].activeTxId = "TRX-101";

    rooms[1].status = "TERISI";
    rooms[1].activeTxId = "TRX-102";

    rooms[2].status = "TERISI";
    rooms[2].activeTxId = "TRX-105";

    rooms[5].status = "BOOKED";
    rooms[5].activeTxId = "TRX-106";

    const roomB5 = rooms.find(r => r.id === "room-B-5");
    if (roomB5) {
        roomB5.status = "TERISI";
        roomB5.activeTxId = "TRX-107";
    }

    const roomC5 = rooms.find(r => r.id === "room-C-5");
    if (roomC5) {
        roomC5.status = "BOOKED";
        roomC5.activeTxId = "TRX-103";
    }

    const roomD10 = rooms.find(r => r.id === "room-D-10");
    if (roomD10) {
        roomD10.status = "BOOKED";
        roomD10.activeTxId = "TRX-104";
    }

    const hall1 = rooms.find(r => r.id === "hall-1");
    if (hall1) {
        hall1.status = "BOOKED";
        hall1.activeTxId = "TRX-801";
    }

    const hall2 = rooms.find(r => r.id === "hall-2");
    if (hall2) {
        hall2.status = "BOOKED";
        hall2.activeTxId = "TRX-802";
    }
    
    const hall3 = rooms.find(r => r.id === "hall-3");
    if (hall3) {
        hall3.status = "BOOKED";
        hall3.activeTxId = "TRX-803";
    }

    rooms[51].status = "MAINTENANCE";
    rooms[51].activeMaintId = "M-901";
    rooms[51].qcStatus = "PERLU_PERBAIKAN";
    
    rooms[120].status = "MAINTENANCE"; // room-C-21
    rooms[120].activeMaintId = "M-902";
    rooms[120].qcStatus = "PERLU_PERBAIKAN";

    const roomD4 = rooms.find(r => r.id === "room-D-4");
    if (roomD4) {
        roomD4.status = "MAINTENANCE";
        roomD4.activeMaintId = "M-904";
        roomD4.qcStatus = "PERLU_PERBAIKAN";
        roomD4.lastQcDate = "2026-09-17 08:45";
        roomD4.lastQcBy = "Farhan Maulana (QC)";
        roomD4.lastQcNotes = "AC mati total dan kran wastafel bocor. Lapor tidak layak & butuh perbaikan teknisi.";
    }

    const hall6 = rooms.find(r => r.id === "hall-6");
    if (hall6) {
        hall6.status = "MAINTENANCE";
        hall6.activeMaintId = "M-905";
        hall6.qcStatus = "MENUNGGU_QC";
        hall6.lastQcDate = "2026-09-16 16:00";
        hall6.lastQcBy = "Nurul Hidayah (QC)";
        hall6.lastQcNotes = "Perbaikan teknisi telah selesai. WAJIB diverifikasi uji kelayakan oleh Tim QC sebelum aula dapat disewa.";
    }

    return rooms;
}

export const initialTransactions: Transaction[] = [
    {
        id: "TRX-101",
        roomId: "room-A-1",
        building: "Gedung A (Arafah)",
        roomNumber: "A-101",
        category: "JEMAAH",
        guestName: "KBIHU Nurul Huda",
        kloter: "JKG-01",
        startDate: getRealDateWithOffset(-3),
        duration: 3,
        durationUnit: "Malam",
        phone: "081299887766",
        notes: "Jemaah Kloter 1 - Jadwal Check-Out Hari Ini",
        status: "TERISI",
        createdUser: "recep1",
        breakfast: true,
        breakfastMenu: "Nasi Goreng Spesial & Teh Hangat",
        breakfastPortions: 4,
        breakfastDays: 3,
        breakfastStatus: "SEDANG_DIBUAT"
    },
    {
        id: "TRX-102",
        roomId: "room-A-2",
        building: "Gedung A (Arafah)",
        roomNumber: "A-102",
        category: "JEMAAH",
        guestName: "KBIHU Nurul Huda (Rombongan 2)",
        kloter: "JKG-01",
        startDate: getRealDateWithOffset(-1),
        duration: 3,
        durationUnit: "Malam",
        phone: "081299887766",
        notes: "Jemaah Kloter 1",
        status: "TERISI",
        createdUser: "recep1",
        breakfast: true,
        breakfastMenu: "Lontong Sayur Betawi",
        breakfastPortions: 4,
        breakfastDays: 3,
        breakfastStatus: "PENGANTARAN"
    },
    {
        id: "TRX-105",
        roomId: "room-A-3",
        building: "Gedung A (Arafah)",
        roomNumber: "A-103",
        category: "UMUM",
        guestName: "Budi Santoso Family",
        kloter: "-",
        startDate: getRealTodayDate(),
        duration: 2,
        durationUnit: "Malam",
        phone: "085566778899",
        notes: "Liburan keluarga",
        status: "TERISI",
        createdUser: "recep1",
        breakfast: false
    },
    {
        id: "TRX-106",
        roomId: "room-A-6",
        building: "Gedung A (Arafah)",
        roomNumber: "A-106",
        category: "UMUM",
        guestName: "Dinas Kesehatan RI (Kunjungan Kerja)",
        kloter: "-",
        startDate: getRealTodayDate(),
        duration: 2,
        durationUnit: "Malam",
        phone: "081122334455",
        notes: "Kunjungan kerja - Jadwal Check-In Hari Ini",
        status: "BOOKED",
        createdUser: "admin",
        breakfast: true,
        breakfastMenu: "Nasi Uduk Komplit Telur Balado",
        breakfastPortions: 6,
        breakfastDays: 2,
        breakfastStatus: "MENUNGGU"
    },
    {
        id: "TRX-107",
        roomId: "room-B-5",
        building: "Gedung B (Muzdalifah)",
        roomNumber: "B-105",
        category: "JEMAAH",
        guestName: "Haji Mandiri (Rombongan Lansia)",
        kloter: "SOC-02",
        startDate: getRealDateWithOffset(-2),
        duration: 2,
        durationUnit: "Malam",
        phone: "087788990011",
        notes: "Jemaah lansia - Jadwal Check-Out Hari Ini",
        status: "TERISI",
        createdUser: "recep2",
        breakfast: true,
        breakfastMenu: "Bubur Ayam Gurih Spesial",
        breakfastPortions: 2,
        breakfastDays: 2,
        breakfastStatus: "SEDANG_DIBUAT"
    },
    {
        id: "TRX-801",
        roomId: "hall-1", 
        building: "Ruang Pertemuan",
        roomNumber: "Gedung SG-1 (SG-1)",
        category: "UMUM",
        guestName: "PT Manasik Mandiri (Manasik Haji Akbar)",
        kloter: "-",
        startDate: getRealTodayDate(),
        duration: 8,
        durationUnit: "Jam",
        phone: "081344556677",
        notes: "Manasik Haji Akbar - Booking Aktif Hari Ini",
        status: "BOOKED",
        createdUser: "recep3",
        breakfast: true,
        breakfastMenu: "Snack Box & Kopi Manasik",
        breakfastPortions: 120,
        breakfastDays: 1,
        breakfastStatus: "MENUNGGU"
    },
    {
        id: "TRX-103",
        roomId: "room-C-5",
        building: "Gedung C (Mina)",
        roomNumber: "C-105",
        category: "UMUM",
        guestName: "Rombongan Sekolah Al-Azhar",
        kloter: "-",
        startDate: getRealDateWithOffset(1),
        duration: 2,
        durationUnit: "Malam",
        phone: "081987654321",
        notes: "Study Tour",
        status: "BOOKED",
        createdUser: "recep2",
        breakfast: true,
        breakfastMenu: "Nasi Goreng Spesial",
        breakfastPortions: 3,
        breakfastDays: 2,
        breakfastStatus: "MENUNGGU"
    },
    {
        id: "TRX-104",
        roomId: "room-D-10",
        building: "Gedung D (Madinah)",
        roomNumber: "D-110",
        category: "JEMAAH",
        guestName: "KBIHU Al-Ittihad",
        kloter: "SOC-05",
        startDate: getRealDateWithOffset(2),
        duration: 4,
        durationUnit: "Malam",
        phone: "085512345678",
        notes: "Jemaah Kloter 5",
        status: "BOOKED",
        createdUser: "recep2",
        breakfast: true,
        breakfastMenu: "Nasi Uduk Komplit",
        breakfastPortions: 4,
        breakfastDays: 4,
        breakfastStatus: "MENUNGGU"
    },
    {
        id: "TRX-802",
        roomId: "hall-2", 
        building: "Ruang Pertemuan",
        roomNumber: "Aula Utama Arafah",
        category: "UMUM",
        guestName: "Pernikahan Ananda & Budi",
        kloter: "-",
        startDate: getRealDateWithOffset(3),
        duration: 12,
        durationUnit: "Jam",
        phone: "081223344556",
        notes: "Resepsi Pernikahan",
        status: "BOOKED",
        createdUser: "manager"
    },
    {
        id: "TRX-803",
        roomId: "hall-3", 
        building: "Ruang Pertemuan",
        roomNumber: "Gedung Multipurpose",
        category: "UMUM",
        guestName: "Bimtek Petugas Haji & Umrah RI",
        kloter: "-",
        startDate: getRealTodayDate(),
        duration: 8,
        durationUnit: "Jam",
        phone: "081399998888",
        notes: "Acara dinas Kemenhaj - Booking Aktif Hari Ini",
        status: "BOOKED",
        createdUser: "recep3",
        breakfast: false
    }
];

export const initialMaintenances: Maintenance[] = [
    {
        id: "M-901",
        roomId: "room-B-2",
        building: "Gedung B (Muzdalifah)",
        roomNumber: "B-102",
        category: "Kerusakan Besar",
        urgency: "Urgent",
        technician: "Budi Santoso",
        assignedTechnicianId: "u9",
        assignedTechnicianName: "Budi Santoso",
        assignedByManager: "H. Joko Susilo, ST (Manager Teknisi)",
        assignedTime: "2026-03-16 08:45",
        managerNotes: "Prioritaskan penggantian breaker utama panel listrik & isi freon AC.",
        description: "Korsleting breaker utama & AC bocor freon mendesak",
        reportTime: "2026-03-16 08:30",
        status: "PROSES",
        reportedUser: "Farhan Maulana (QC)",
        facilityType: "KAMAR"
    },
    {
        id: "M-904",
        roomId: "room-D-4",
        building: "Gedung D (Madinah)",
        roomNumber: "D-104",
        category: "Kerusakan Kamar (Temuan QC)",
        urgency: "Tinggi",
        technician: "Menunggu Penugasan Manager Teknisi",
        description: "Temuan QC Farhan Maulana: AC mati total, remote rusak, dan kran wastafel bocor.",
        reportTime: "2026-09-17 08:45",
        status: "MENUNGGU_PENUGASAN",
        reportedUser: "Farhan Maulana (QC)",
        facilityType: "KAMAR"
    },
    {
        id: "M-905",
        roomId: "hall-6",
        building: "Ruang Pertemuan",
        roomNumber: "Aula Mina",
        category: "Sound System & AC Aula",
        urgency: "Tinggi",
        technician: "Dede Supriatna",
        assignedTechnicianId: "u10",
        assignedTechnicianName: "Dede Supriatna",
        assignedByManager: "H. Joko Susilo, ST (Manager Teknisi)",
        assignedTime: "2026-09-16 16:30",
        managerNotes: "Periksa jalur mixer panggung dan fan coil unit AC Aula.",
        description: "Temuan QC Nurul Hidayah: Sound system mendengung dan AC sentral bagian utara mati.",
        reportTime: "2026-09-16 16:00",
        workCompletedTime: "2026-09-17 11:30",
        technicianNotes: "Kabel input audio panggung telah disolder ulang dan filter trafo AC dibersihkan. Menunggu verifikasi lolos QC.",
        status: "MENUNGGU_QC",
        reportedUser: "Nurul Hidayah (QC)",
        facilityType: "RUANG_PERTEMUAN"
    },
    {
        id: "M-902",
        roomId: "room-C-21",
        building: "Gedung C (Mina)",
        roomNumber: "C-121",
        category: "Kerusakan Ringan",
        urgency: "Normal",
        technician: "Dede Supriatna",
        assignedTechnicianId: "u10",
        assignedTechnicianName: "Dede Supriatna",
        assignedByManager: "H. Joko Susilo, ST (Manager Teknisi)",
        assignedTime: "2026-09-17 09:20",
        description: "Kran air kamar mandi bocor menetes",
        reportTime: new Date().toISOString().split('T')[0] + " 09:15",
        status: "PROSES",
        reportedUser: "Nurul Hidayah (QC)",
        facilityType: "KAMAR"
    },
    {
        id: "M-903",
        roomId: "room-A-15",
        building: "Gedung A (Arafah)",
        roomNumber: "A-115",
        category: "Pembersihan",
        urgency: "Normal",
        technician: "Tim Cleaning & Teknisi",
        description: "Pembersihan menyeluruh & perbaikan grendel pintu kamar",
        reportTime: new Date(Date.now() - 86400000).toISOString().split('T')[0] + " 14:00",
        status: "SELESAI",
        reportedUser: "recep1",
        resolvedTime: new Date(Date.now() - 86400000).toISOString().split('T')[0] + " 16:30",
        qcVerdict: "LOLOS_QC",
        facilityType: "KAMAR"
    }
];

export const initialQcInspections: QcInspection[] = [
    {
        id: 'QC-101',
        roomId: 'room-A-1',
        building: 'Gedung A (Arafah)',
        roomNumber: 'A-101',
        inspectorId: 'u6',
        inspectorName: 'Farhan Maulana',
        inspectionDate: '2026-09-17 08:30',
        cleanliness: 'BAIK',
        linenBed: 'LENGKAP_BERSIH',
        acElectricity: 'NORMAL',
        plumbingWater: 'LANCAR',
        amenities: 'LENGKAP',
        result: 'LOLOS_QC',
        notes: 'Kondisi kamar sangat bersih, handuk & sabun lengkap, AC dingin normal.'
    },
    {
        id: 'QC-102',
        roomId: 'room-C-21',
        building: 'Gedung C (Mina)',
        roomNumber: 'C-121',
        inspectorId: 'u7',
        inspectorName: 'Nurul Hidayah',
        inspectionDate: '2026-09-17 09:00',
        cleanliness: 'CUKUP',
        linenBed: 'LENGKAP_BERSIH',
        acElectricity: 'NORMAL',
        plumbingWater: 'BOCOR_MAMPET',
        amenities: 'LENGKAP',
        result: 'PERLU_PERBAIKAN',
        notes: 'Kran wastafel bocor menetes terus menerus. Perlu penanganan teknisi plumbing segera.',
        maintenanceIdCreated: 'M-902'
    },
    {
        id: 'QC-103',
        roomId: 'room-B-2',
        building: 'Gedung B (Muzdalifah)',
        roomNumber: 'B-102',
        inspectorId: 'u5',
        inspectorName: 'Ir. Hendra Kusuma (Manager QC)',
        inspectionDate: '2026-09-16 15:20',
        cleanliness: 'BAIK',
        linenBed: 'LENGKAP_BERSIH',
        acElectricity: 'NORMAL',
        plumbingWater: 'LANCAR',
        amenities: 'LENGKAP',
        result: 'LOLOS_QC',
        notes: 'Audit supervisi berkala kamar VIP: Standar kebersihan & kenyamanan terpenuhi.'
    }
];

export const initialAuditLogs: AuditLog[] = [
    {
        timestamp: new Date(Date.now() - 172800000).toISOString().replace('T', ' ').substring(0, 19),
        user: 'admin',
        role: 'Super Admin',
        action: 'System Initialization',
        details: 'Data master sistem & pembagian divisi operasional asrama haji dikonfigurasi'
    },
    {
        timestamp: new Date(Date.now() - 86400000).toISOString().replace('T', ' ').substring(0, 19),
        user: 'recep1',
        role: 'Resepsionis',
        action: 'CHECKIN',
        details: 'Untuk A-101 (KBIHU Nurul Huda - Kloter 02)'
    },
    {
        timestamp: new Date(Date.now() - 43200000).toISOString().replace('T', ' ').substring(0, 19),
        user: 'qc1',
        role: 'Quality Control',
        action: 'INSPEKSI_QC',
        details: 'Inspeksi kesiapan kamar A-101: Status Lolos QC siap check-in'
    },
    {
        timestamp: new Date(Date.now() - 21600000).toISOString().replace('T', ' ').substring(0, 19),
        user: 'tek1',
        role: 'Teknisi',
        action: 'UPDATE_MAINTENANCE',
        details: 'Pemeriksaan MCB dan freon AC kamar B-102 selesai diganti'
    },
    {
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        user: 'koperasi',
        role: 'Petugas Koperasi',
        action: 'DISTRIBUSI_SARAPAN',
        details: 'Pengantaran paket sarapan pagi ke kamar Gedung A & B'
    }
];

const getDayStr = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
};

const d0 = getDayStr(0);
const d1 = getDayStr(-1);
const d2 = getDayStr(-2);

export const initialWorkSessions: WorkSession[] = [
    {
        id: 'SESI-001',
        userId: 'u3',
        userName: 'Bambang Irawan',
        userRole: 'Resepsionis',
        loginTime: `${d2} 07:02:14`,
        logoutTime: `${d2} 15:08:35`,
        durationSeconds: 29181,
        durationFormatted: '8 Jam 6 Menit 21 Detik',
        status: 'SELESAI',
        notes: 'Shift Pagi Gedung A & B'
    },
    {
        id: 'SESI-002',
        userId: 'u4',
        userName: 'Dewi Lestari',
        userRole: 'Resepsionis',
        loginTime: `${d2} 14:55:00`,
        logoutTime: `${d2} 23:02:12`,
        durationSeconds: 29232,
        durationFormatted: '8 Jam 7 Menit 12 Detik',
        status: 'SELESAI',
        notes: 'Shift Siang Gedung C & D & Aula'
    },
    {
        id: 'SESI-003',
        userId: 'u9',
        userName: 'Budi Santoso',
        userRole: 'Teknisi',
        loginTime: `${d2} 08:00:10`,
        logoutTime: `${d2} 17:15:45`,
        durationSeconds: 33335,
        durationFormatted: '9 Jam 15 Menit 35 Detik',
        status: 'SELESAI',
        notes: 'Maintenance AC & Kelistrikan'
    },
    {
        id: 'SESI-004',
        userId: 'u12',
        userName: 'Siti Aminah',
        userRole: 'Petugas Koperasi',
        loginTime: `${d2} 05:40:00`,
        logoutTime: `${d2} 14:20:18`,
        durationSeconds: 31218,
        durationFormatted: '8 Jam 40 Menit 18 Detik',
        status: 'SELESAI',
        notes: 'Layanan Sarapan Pagi Jemaah'
    },
    {
        id: 'SESI-005',
        userId: 'u3',
        userName: 'Bambang Irawan',
        userRole: 'Resepsionis',
        loginTime: `${d1} 07:05:40`,
        logoutTime: `${d1} 15:12:15`,
        durationSeconds: 29195,
        durationFormatted: '8 Jam 6 Menit 35 Detik',
        status: 'SELESAI',
        notes: 'Shift Pagi Gedung A & B'
    },
    {
        id: 'SESI-006',
        userId: 'u6',
        userName: 'Farhan Maulana',
        userRole: 'Quality Control',
        loginTime: `${d1} 08:00:00`,
        logoutTime: `${d1} 16:30:00`,
        durationSeconds: 30600,
        durationFormatted: '8 Jam 30 Menit 0 Detik',
        status: 'SELESAI',
        notes: 'Audit Kesiapan Kamar Gedung A'
    },
    {
        id: 'SESI-007',
        userId: 'u4',
        userName: 'Dewi Lestari',
        userRole: 'Resepsionis',
        loginTime: `${d1} 14:58:30`,
        logoutTime: `${d1} 23:10:45`,
        durationSeconds: 29535,
        durationFormatted: '8 Jam 12 Menit 15 Detik',
        status: 'SELESAI',
        notes: 'Shift Siang Gedung C & D'
    },
    {
        id: 'SESI-008',
        userId: 'u9',
        userName: 'Budi Santoso',
        userRole: 'Teknisi',
        loginTime: `${d1} 08:05:22`,
        logoutTime: `${d1} 17:00:00`,
        durationSeconds: 32078,
        durationFormatted: '8 Jam 54 Menit 38 Detik',
        status: 'SELESAI',
        notes: 'Perbaikan Plumbing Gedung B'
    },
    {
        id: 'SESI-009',
        userId: 'u12',
        userName: 'Siti Aminah',
        userRole: 'Petugas Koperasi',
        loginTime: `${d1} 05:35:10`,
        logoutTime: `${d1} 14:15:22`,
        durationSeconds: 31212,
        durationFormatted: '8 Jam 40 Menit 12 Detik',
        status: 'SELESAI',
        notes: 'Distribusi Sarapan Gedung A & C'
    },
    {
        id: 'SESI-010',
        userId: 'u10',
        userName: 'Dede Supriatna',
        userRole: 'Teknisi',
        loginTime: `${d1} 22:00:00`,
        logoutTime: `${d0} 06:15:30`,
        durationSeconds: 29730,
        durationFormatted: '8 Jam 15 Menit 30 Detik',
        status: 'SELESAI',
        notes: 'Shift Malam Lintas Hari (Standby Emergency)'
    },
    {
        id: 'SESI-011',
        userId: 'u3',
        userName: 'Bambang Irawan',
        userRole: 'Resepsionis',
        loginTime: `${d0} 07:00:12`,
        logoutTime: `${d0} 15:02:40`,
        durationSeconds: 28948,
        durationFormatted: '8 Jam 2 Menit 28 Detik',
        status: 'SELESAI',
        notes: 'Shift Pagi Check-In Jemaah'
    },
    {
        id: 'SESI-012',
        userId: 'u12',
        userName: 'Siti Aminah',
        userRole: 'Petugas Koperasi',
        loginTime: `${d0} 05:45:00`,
        logoutTime: `${d0} 14:10:15`,
        durationSeconds: 30315,
        durationFormatted: '8 Jam 25 Menit 15 Detik',
        status: 'SELESAI',
        notes: 'Distribusi Menu Sarapan Pagi'
    },
    // Contoh akumulasi tgl yg sama (user admin checkin pagi lalu siang masuk lagi)
    {
        id: 'SESI-013',
        userId: 'u1',
        userName: 'Ahmad Faisal',
        userRole: 'Super Admin',
        loginTime: `${d0} 08:00:00`,
        logoutTime: `${d0} 12:00:00`,
        durationSeconds: 14400,
        durationFormatted: '4 Jam 0 Menit 0 Detik',
        status: 'SELESAI',
        notes: 'Shift Pagi: Monitoring Operasional & Cek Fasilitas'
    },
    {
        id: 'SESI-014',
        userId: 'u1',
        userName: 'Ahmad Faisal',
        userRole: 'Super Admin',
        loginTime: `${d0} 13:00:00`,
        logoutTime: `${d0} 17:00:00`,
        durationSeconds: 14400,
        durationFormatted: '4 Jam 0 Menit 0 Detik',
        status: 'SELESAI',
        notes: 'Shift Siang: Rekap Laporan & Verifikasi Keuangan'
    }
];

