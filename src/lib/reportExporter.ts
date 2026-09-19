import * as XLSX from 'xlsx';
import { Transaction, Maintenance, QcInspection, WorkSession, AuditLog, Room, User } from '../types';
import { formatIndonesianDate, formatRupiah, getRealTodayDate, addDaysToDateStr } from './utils';
import { downloadHtmlContentAsPdf, downloadReportPdfDirect } from './pdfDownloader';

export type ReportType = 'KAMAR' | 'MAINTENANCE' | 'QC' | 'SARAPAN' | 'JAM_KERJA' | 'AUDIT';
export type ExportFormat = 'PDF' | 'XLSX';
export type ReportPeriod = 'Harian' | 'Mingguan' | 'Bulanan' | 'Tahunan' | 'Semua';

export interface ReportExportParams {
  type: ReportType;
  format: ExportFormat;
  period: ReportPeriod;
  buildingFilter?: string;
  qcMode?: 'HISTORY' | 'READINESS';
  breakfastPriorityFilter?: 'ALL' | 'CHECKIN_ONLY' | 'BOOKED_ONLY';
  transactions: Transaction[];
  maintenances: Maintenance[];
  qcInspections?: QcInspection[];
  workSessions?: WorkSession[];
  auditLogs?: AuditLog[];
  rooms?: Room[];
  currentUser?: User | null;
}

export function filterDataByPeriod<T>(
  items: T[],
  period: ReportPeriod,
  dateExtractor: (item: T) => string
): T[] {
  if (period === 'Semua') return items;
  const now = new Date();
  const limit = new Date();
  if (period === 'Mingguan') {
    limit.setDate(now.getDate() - 7);
  } else if (period === 'Bulanan') {
    limit.setMonth(now.getMonth() - 1);
  } else if (period === 'Tahunan') {
    limit.setFullYear(now.getFullYear() - 1);
  } else {
    // Harian (Hari Ini)
    limit.setHours(0, 0, 0, 0);
  }

  return items.filter(item => {
    const rawDate = dateExtractor(item);
    if (!rawDate) return false;
    const itemDate = new Date(rawDate.includes(' ') ? rawDate.split(' ')[0] : rawDate);
    return itemDate >= limit;
  });
}

export function generateReportData(params: ReportExportParams) {
  const { 
    type, 
    period, 
    buildingFilter = 'ALL', 
    qcMode = 'HISTORY',
    breakfastPriorityFilter = 'ALL',
    transactions, 
    maintenances, 
    qcInspections = [], 
    workSessions = [], 
    auditLogs = [],
    rooms = []
  } = params;

  let title = '';
  let filename = '';
  let headers: string[] = [];
  let rows: (string | number)[][] = [];
  let summaryStats: { label: string; value: string | number }[] = [];

  const realToday = getRealTodayDate();

  if (type === 'KAMAR') {
    title = 'LAPORAN REKAPITULASI HUNIAN KAMAR & BOOKING RUANG PERTEMUAN';
    filename = `Laporan_Hunian_Kamar_${period}_${realToday}`;
    headers = [
      'No',
      'ID Transaksi',
      'Kategori',
      'Tipe Fasilitas',
      'Gedung / Wilayah',
      'No. Kamar / Aula',
      'Nama Tamu / Penyewa',
      'Kloter Haji / Instansi',
      'Tgl Masuk',
      'Durasi',
      'Satuan',
      'Kontak HP',
      'Status Reservasi'
    ];

    let filtered = filterDataByPeriod(transactions, period, t => t.startDate);
    if (buildingFilter !== 'ALL') {
      filtered = filtered.filter(t => t.building === buildingFilter);
    }

    filtered.forEach((t, index) => {
      const isAula = t.building === 'Ruang Pertemuan';
      rows.push([
        index + 1,
        t.id,
        t.category,
        isAula ? 'Ruang Pertemuan (Aula)' : 'Kamar Penginapan',
        t.building,
        t.roomNumber,
        t.guestName,
        t.kloter || '-',
        t.startDate,
        t.duration,
        t.durationUnit || (isAula ? 'Jam' : 'Malam'),
        t.phone || '-',
        t.status
      ]);
    });

    const kamarList = filtered.filter(t => t.building !== 'Ruang Pertemuan');
    const aulaList = filtered.filter(t => t.building === 'Ruang Pertemuan');

    summaryStats = [
      { label: 'Total Transaksi', value: filtered.length },
      { label: 'Transaksi Kamar', value: kamarList.length },
      { label: 'Booking Aula', value: aulaList.length },
      { label: 'Check-In Aktif', value: filtered.filter(t => t.status === 'TERISI').length },
      { label: 'Reservasi Booked', value: filtered.filter(t => t.status === 'BOOKED').length },
      { label: 'Selesai / Riwayat', value: filtered.filter(t => t.status === 'SELESAI' || t.status === 'CHECKED_OUT').length },
    ];
  } else if (type === 'MAINTENANCE') {
    title = 'LAPORAN PERAWATAN & PERBAIKAN KERUSAKAN FASILITAS';
    filename = `Laporan_Maintenance_${period}_${realToday}`;
    headers = [
      'No',
      'Waktu Lapor',
      'Tipe Fasilitas',
      'Gedung',
      'No. Kamar / Aula',
      'Kategori Kerusakan',
      'Tingkat Urgensi',
      'Teknisi Bertugas',
      'Pelapor',
      'Deskripsi Kerusakan',
      'Status Tiket'
    ];

    let filtered = filterDataByPeriod(maintenances, period, m => m.reportTime);
    if (buildingFilter !== 'ALL') {
      filtered = filtered.filter(m => m.building === buildingFilter);
    }

    filtered.forEach((m, index) => {
      const isAula = m.building === 'Ruang Pertemuan';
      rows.push([
        index + 1,
        m.reportTime,
        isAula ? 'Ruang Pertemuan (Aula)' : 'Kamar Penginapan',
        m.building,
        m.roomNumber,
        m.category,
        m.urgency,
        m.technician || m.assignedTechnicianName || 'Belum Ditugaskan',
        m.reportedUser,
        m.description,
        m.status
      ]);
    });

    summaryStats = [
      { label: 'Total Laporan Kerusakan', value: filtered.length },
      { label: 'Selesai & Lolos QC', value: filtered.filter(m => m.status === 'SELESAI').length },
      { label: 'Dalam Pengerjaan', value: filtered.filter(m => m.status === 'PROSES').length },
      { label: 'Menunggu QC / Verifikasi', value: filtered.filter(m => m.status === 'MENUNGGU_QC').length },
    ];
  } else if (type === 'QC') {
    if (qcMode === 'READINESS') {
      title = 'AUDIT KESIAPAN & STANDAR MUTU KAMAR PENGINAPAN & RUANG PERTEMUAN (AULA)';
      filename = `Audit_Kesiapan_Mutu_${buildingFilter !== 'ALL' ? buildingFilter.replace(/\s+/g, '_') : 'Semua'}_${realToday}`;
      headers = [
        'No',
        'Tipe Fasilitas',
        'Gedung / Wilayah',
        'No. Kamar / Aula',
        'Tipe / Kelas',
        'Kapasitas (Pax)',
        'Status Fisik',
        'Vonis Kelayakan QC',
        'Tgl Cek Terakhir',
        'Petugas QC',
        'Evaluasi & Catatan Mutu'
      ];

      let targetRooms = rooms;
      if (buildingFilter !== 'ALL') {
        targetRooms = targetRooms.filter(r => r.building === buildingFilter);
      }

      targetRooms.forEach((r, idx) => {
        const isAula = r.building === 'Ruang Pertemuan' || r.roomNumber.toLowerCase().includes('aula');
        const qcStatus = r.qcStatus || 'PERLU_INSPEKSI';
        let qcLabel = 'BELUM DIINSPEKSI';
        if (qcStatus === 'LOLOS_QC') qcLabel = 'LOLOS STANDAR (LAYAK)';
        else if (qcStatus === 'MENUNGGU_QC') qcLabel = 'MENUNGGU VERIFIKASI QC';
        else if (qcStatus === 'PERLU_PERBAIKAN') qcLabel = 'PERLU PERBAIKAN FISIK';

        rows.push([
          idx + 1,
          isAula ? 'Ruang Pertemuan (Aula)' : 'Kamar Penginapan',
          r.building,
          r.roomNumber,
          r.type || (isAula ? 'Aula Serbaguna' : 'Standar'),
          `${r.capacity || (isAula ? 200 : 4)} Orang`,
          r.status,
          qcLabel,
          r.lastQcDate || '-',
          r.lastQcBy || '-',
          r.lastQcNotes || (qcStatus === 'LOLOS_QC' ? 'Sesuai SOP Standar Mutu Asrama Haji Jakarta' : 'Perlu atensi inspeksi berkala')
        ]);
      });

      const totalKamar = targetRooms.filter(r => r.building !== 'Ruang Pertemuan').length;
      const totalAula = targetRooms.filter(r => r.building === 'Ruang Pertemuan').length;
      const lolosCount = targetRooms.filter(r => r.qcStatus === 'LOLOS_QC').length;
      const perluCount = targetRooms.filter(r => r.qcStatus === 'PERLU_PERBAIKAN').length;
      const tungguCount = targetRooms.filter(r => r.qcStatus === 'MENUNGGU_QC').length;

      summaryStats = [
        { label: 'Total Fasilitas Terdata', value: targetRooms.length },
        { label: 'Kamar Penginapan', value: totalKamar },
        { label: 'Ruang Pertemuan (Aula)', value: totalAula },
        { label: 'Lolos Standar Mutu', value: `${lolosCount} (${targetRooms.length > 0 ? Math.round((lolosCount / targetRooms.length) * 100) : 0}%)` },
        { label: 'Perlu Perbaikan', value: perluCount },
        { label: 'Menunggu Verifikasi', value: tungguCount }
      ];
    } else {
      // HISTORY AUDIT LOG
      title = 'LAPORAN REKAPITULASI HASIL INSPEKSI QUALITY CONTROL (QC)';
      filename = `Laporan_Inspeksi_QC_${period}_${realToday}`;
      headers = [
        'No',
        'ID Inspeksi',
        'Waktu Pemeriksaan',
        'Tipe Fasilitas',
        'Gedung / Wilayah',
        'No. Kamar / Aula',
        'Petugas QC',
        'Kebersihan',
        'Linen / Tata Ruang',
        'AC & Kelistrikan',
        'Sanitasi / Air',
        'Amenities / Alat',
        'Hasil QC (Vonis)',
        'Tipe Alur',
        'Catatan Hasil Evaluasi'
      ];

      let filtered = filterDataByPeriod(qcInspections, period, q => q.inspectionDate);
      if (buildingFilter !== 'ALL') {
        filtered = filtered.filter(q => q.building === buildingFilter);
      }

      filtered.forEach((q, index) => {
        const isAula = q.building === 'Ruang Pertemuan' || q.roomNumber.toLowerCase().includes('aula');
        rows.push([
          index + 1,
          q.id,
          q.inspectionDate,
          isAula ? 'Ruang Pertemuan (Aula)' : 'Kamar Penginapan',
          q.building,
          q.roomNumber,
          q.inspectorName,
          q.cleanliness === 'BAIK' ? 'Baik' : q.cleanliness === 'CUKUP' ? 'Cukup' : 'Buruk',
          q.linenBed === 'LENGKAP_BERSIH' ? 'Lengkap & Bersih' : 'Perlu Ganti/Rapikan',
          q.acElectricity === 'NORMAL' ? 'Normal / Dingin' : 'Bermasalah',
          q.plumbingWater === 'LANCAR' ? 'Lancar / Bersih' : 'Bermasalah',
          q.amenities === 'LENGKAP' ? 'Lengkap Standar' : 'Kurang / Habis',
          q.result === 'LOLOS_QC' ? 'LOLOS QC (LAYAK PAKAI)' : 'PERLU PERBAIKAN',
          q.maintenanceIdCreated ? 'Pasca Perbaikan Teknisi' : 'Inspeksi Rutin',
          q.notes || '-'
        ]);
      });

      const lolos = filtered.filter(q => q.result === 'LOLOS_QC').length;
      const perbaikan = filtered.filter(q => q.result === 'PERLU_PERBAIKAN').length;
      const aulaCount = filtered.filter(q => q.building === 'Ruang Pertemuan' || q.roomNumber.toLowerCase().includes('aula')).length;
      const kamarCount = filtered.length - aulaCount;
      const kebersihanBaik = filtered.filter(q => q.cleanliness === 'BAIK').length;
      const acNormal = filtered.filter(q => q.acElectricity === 'NORMAL').length;

      summaryStats = [
        { label: 'Total Inspeksi Tercatat', value: filtered.length },
        { label: 'Lolos Standar QC', value: `${lolos} (${filtered.length > 0 ? Math.round((lolos / filtered.length) * 100) : 0}%)` },
        { label: 'Temuan Kerusakan', value: perbaikan },
        { label: 'Inspeksi Kamar', value: kamarCount },
        { label: 'Inspeksi Ruang Pertemuan (Aula)', value: aulaCount },
        { label: 'Kebersihan Sesuai Standar', value: `${kebersihanBaik} (${filtered.length > 0 ? Math.round((kebersihanBaik / filtered.length) * 100) : 0}%)` },
        { label: 'AC & Listrik Normal', value: `${acNormal} (${filtered.length > 0 ? Math.round((acNormal / filtered.length) * 100) : 0}%)` }
      ];
    }
  } else if (type === 'SARAPAN') {
    title = 'LAPORAN REKAPITULASI PESANAN SARAPAN KOPERASI & DISTRIBUSI KAMAR';
    filename = `Laporan_Pesanan_Sarapan_${period}_${realToday}`;
    headers = [
      'No',
      'ID Transaksi',
      'Status Kamar',
      'Prioritas Dapur',
      'Gedung',
      'No. Kamar',
      'Nama Pemesan / Jemaah',
      'Kloter / Instansi',
      'Kontak HP',
      'Tgl Mulai Sajian',
      'Pilihan Menu Sarapan',
      'Porsi / Hari',
      'Total Hari',
      'Total Box Akumulasi',
      'Status Dapur / Pengantaran',
      'Catatan Khusus / Diet / Alergi'
    ];

    // Filter breakfast orders for room guests
    let allBreakfast = transactions.filter(t => t.breakfast && t.building !== 'Ruang Pertemuan');

    // Date filtering: For 'Harian', include guests currently staying (TERISI) or today's arrivals
    let filtered = allBreakfast;
    if (period !== 'Semua') {
      const now = new Date();
      const limit = new Date();
      if (period === 'Mingguan') {
        limit.setDate(now.getDate() - 7);
        limit.setHours(0, 0, 0, 0);
        filtered = allBreakfast.filter(t => new Date(t.startDate + 'T00:00:00') >= limit);
      } else if (period === 'Bulanan') {
        limit.setMonth(now.getMonth() - 1);
        limit.setHours(0, 0, 0, 0);
        filtered = allBreakfast.filter(t => new Date(t.startDate + 'T00:00:00') >= limit);
      } else if (period === 'Tahunan') {
        limit.setFullYear(now.getFullYear() - 1);
        limit.setHours(0, 0, 0, 0);
        filtered = allBreakfast.filter(t => new Date(t.startDate + 'T00:00:00') >= limit);
      } else {
        // Harian (Hari Ini): Tamu TERISI saat ini WAJIB makan sarapan hari ini!
        filtered = allBreakfast.filter(t => {
          if (t.status === 'TERISI') return true;
          if (t.startDate === realToday) return true;
          return t.startDate <= realToday && addDaysToDateStr(t.startDate, t.duration || 1) >= realToday;
        });
      }
    }

    if (buildingFilter !== 'ALL') {
      filtered = filtered.filter(t => t.building === buildingFilter);
    }

    if (breakfastPriorityFilter === 'CHECKIN_ONLY') {
      filtered = filtered.filter(t => t.status === 'TERISI');
    } else if (breakfastPriorityFilter === 'BOOKED_ONLY') {
      filtered = filtered.filter(t => t.status === 'BOOKED');
    }

    // STRICT SORT: TERISI (sudah check-in) MUST come first!
    filtered.sort((a, b) => {
      if (a.status === 'TERISI' && b.status !== 'TERISI') return -1;
      if (a.status !== 'TERISI' && b.status === 'TERISI') return 1;
      return 0;
    });

    filtered.forEach((t, index) => {
      const isCheckedIn = t.status === 'TERISI';
      const portions = t.breakfastPortions || 1;
      const days = t.breakfastDays || t.duration || 1;
      const totalBox = portions * days;

      let statusDapur = 'Menunggu Antrean Dapur';
      if (t.breakfastStatus === 'SELESAI') statusDapur = 'Sudah Diantar / Selesai';
      else if (t.breakfastStatus === 'PENGANTARAN') statusDapur = 'Dalam Pengantaran ke Kamar';
      else if (t.breakfastStatus === 'SEDANG_DIBUAT') statusDapur = 'Sedang Dimasak Dapur';

      rows.push([
        index + 1,
        t.id,
        isCheckedIn ? 'SUDAH CHECK-IN (TERISI)' : 'RESERVASI (BOOKED)',
        isCheckedIn ? 'PRIORITAS 1 (ANTAR SEGERA)' : 'STANDBY (PERSIAPAN)',
        t.building,
        t.roomNumber,
        t.guestName,
        t.kloter || '-',
        t.phone || '-',
        t.startDate,
        t.breakfastMenu || 'Nasi Goreng Spesial + Telur',
        `${portions} Porsi`,
        `${days} Hari`,
        `${totalBox} Box`,
        statusDapur,
        t.notes || 'Standar tanpa alergi'
      ]);
    });

    const totalOrders = filtered.length;
    const totalDailyPortions = filtered.reduce((acc, curr) => acc + (curr.breakfastPortions || 1), 0);
    const totalAccumulatedBoxes = filtered.reduce((acc, curr) => acc + ((curr.breakfastPortions || 1) * (curr.breakfastDays || curr.duration || 1)), 0);
    const checkedInPortions = filtered.filter(t => t.status === 'TERISI').reduce((acc, curr) => acc + (curr.breakfastPortions || 1), 0);
    const bookedPortions = filtered.filter(t => t.status === 'BOOKED').reduce((acc, curr) => acc + (curr.breakfastPortions || 1), 0);

    const selesaiCount = filtered.filter(t => t.breakfastStatus === 'SELESAI').length;
    const pengantaranCount = filtered.filter(t => t.breakfastStatus === 'PENGANTARAN').length;
    const dimasakCount = filtered.filter(t => t.breakfastStatus === 'SEDANG_DIBUAT').length;
    const menungguCount = filtered.filter(t => !t.breakfastStatus || t.breakfastStatus === 'MENUNGGU').length;

    summaryStats = [
      { label: 'Total Pemesan Sarapan', value: totalOrders },
      { label: 'Total Porsi Harian', value: `${totalDailyPortions} Porsi/Hari` },
      { label: 'Total Box Periode', value: `${totalAccumulatedBoxes} Box` },
      { label: 'Porsi Check-In (Prioritas 1)', value: `${checkedInPortions} Porsi` },
      { label: 'Porsi Standby (Booked)', value: `${bookedPortions} Porsi` },
      { label: 'Status Antrean Dapur', value: `Menunggu: ${menungguCount} | Masak: ${dimasakCount} | Antar: ${pengantaranCount} | Selesai: ${selesaiCount}` }
    ];
  } else if (type === 'JAM_KERJA') {
    title = 'LAPORAN REKAPITULASI PRESENSI & JAM KERJA PETUGAS SHIFT';
    filename = `Laporan_Presensi_Jam_Kerja_${period}_${realToday}`;
    headers = [
      'No',
      'ID Sesi',
      'Nama Petugas',
      'Role / Jabatan',
      'Waktu Masuk (Check-In)',
      'Waktu Keluar (Check-Out)',
      'Durasi Kerja',
      'Status Sesi',
      'Catatan Petugas'
    ];

    let filtered = filterDataByPeriod(workSessions, period, s => s.loginTime);

    filtered.forEach((s, index) => {
      rows.push([
        index + 1,
        s.id,
        s.userName,
        s.userRole,
        s.loginTime,
        s.logoutTime || 'Masih Bertugas (Aktif)',
        s.durationFormatted || '-',
        s.status,
        s.notes || '-'
      ]);
    });

    summaryStats = [
      { label: 'Total Catatan Presensi', value: filtered.length },
      { label: 'Sesi Selesai', value: filtered.filter(s => s.status === 'SELESAI').length },
      { label: 'Sesi Sedang Aktif', value: filtered.filter(s => s.status === 'AKTIF').length },
    ];
  } else if (type === 'AUDIT') {
    title = 'LAPORAN LOG AUDIT AKTIVITAS SISTEM OPERASIONAL';
    filename = `Laporan_Audit_Log_${period}_${realToday}`;
    headers = [
      'No',
      'Waktu Aktivitas',
      'Nama Pengguna',
      'Role / Jabatan',
      'Tindakan (Action)',
      'Rincian Aktivitas'
    ];

    let filtered = filterDataByPeriod(auditLogs, period, a => a.timestamp);

    filtered.forEach((a, index) => {
      rows.push([
        index + 1,
        a.timestamp,
        a.user,
        a.role,
        a.action,
        a.details
      ]);
    });

    summaryStats = [
      { label: 'Total Log Tercatat', value: filtered.length },
    ];
  }

  return { title, filename, headers, rows, summaryStats };
}

/**
 * Exports data as genuine Microsoft Excel (.xlsx) file using SheetJS (XLSX)
 */
export function exportToExcel(params: ReportExportParams) {
  const { title, filename, headers, rows, summaryStats } = generateReportData(params);

  // Construct sheet data with official header block
  const sheetData: (string | number)[][] = [
    ['UPT ASRAMA HAJI JAKARTA'],
    ['KEMENTERIAN HAJI DAN UMRAH REPUBLIK INDONESIA'],
    ['Jl. Raya Pondok Gede No. 23, Pinang Ranti, Kec. Makasar, Jakarta Timur 13810'],
    ['Telp: (021) 8094444 | Email: asramahaji.jakarta@haji.go.id'],
    [''],
    [title],
    [`Periode: ${params.period} | Filter Gedung: ${params.buildingFilter && params.buildingFilter !== 'ALL' ? params.buildingFilter : 'Semua Gedung & Aula'} | Tanggal Cetak: ${getRealTodayDate()}`],
    [`Dicetak oleh: ${params.currentUser?.fullName || 'Administrator'} (${params.currentUser?.role || 'Staff Operasional'})`],
    [''],
  ];

  // Add Summary Stats if present
  if (summaryStats.length > 0) {
    const statsRow = summaryStats.map(s => `${s.label}: ${s.value}`).join('  |  ');
    sheetData.push(['RINGKASAN EKSEKUTIF: ' + statsRow]);
    sheetData.push(['']);
  }

  // Add Table Headers and Data Rows
  sheetData.push(headers);
  rows.forEach(r => sheetData.push(r));

  // Add Sign-off block
  sheetData.push(['']);
  sheetData.push(['', '', '', '', '', '', 'Jakarta, ' + getRealTodayDate()]);
  sheetData.push(['', '', '', '', '', '', 'Mengetahui / Penanggung Jawab,']);
  sheetData.push(['']);
  sheetData.push(['']);
  sheetData.push(['', '', '', '', '', '', '( ' + (params.currentUser?.fullName || 'Kepala UPT Asrama Haji') + ' )']);
  sheetData.push(['', '', '', '', '', '', 'NIP. 19780512 200312 1 002']);

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Set column widths dynamically
  const colWidths = headers.map((h, i) => {
    let maxLen = h.length;
    rows.forEach(r => {
      const cellVal = String(r[i] ?? '');
      if (cellVal.length > maxLen) maxLen = Math.min(cellVal.length, 45);
    });
    return { wch: Math.max(maxLen + 3, 12) };
  });
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Laporan_Resmi');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/**
 * Helper to safely trigger document print via invisible iframe
 * and automatically deliver download of the formatted A4 document as PDF
 */
export function printOrDownloadHtmlDocument(htmlContent: string, filename: string, title: string) {
  // 1. Download official .pdf file
  try {
    downloadHtmlContentAsPdf(htmlContent, `${filename}.pdf`, {
      orientation: 'landscape',
      marginMm: 6,
      title
    }).catch(err => {
      console.warn('Direct PDF export error, attempting fallback:', err);
    });
  } catch (err) {
    console.warn('PDF exporter error:', err);
  }

  // 2. Direct hidden iframe print (reliable in iframes and triggers native print)
  try {
    const oldIframe = document.getElementById('report-print-iframe');
    if (oldIframe && document.body.contains(oldIframe)) {
      document.body.removeChild(oldIframe);
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'report-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.warn('Iframe print error:', e);
        }
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 60000);
      }, 500);
    }
  } catch (err) {
    console.warn('Iframe setup error:', err);
  }
}

/**
 * Generates and triggers clean official PDF print document
 */
export function exportToPDF(params: ReportExportParams) {
  const { title, filename, headers, rows, summaryStats } = generateReportData(params);

  // Directly download official vector PDF with single manager signature & precision columns
  downloadReportPdfDirect(
    title,
    filename,
    headers,
    rows,
    summaryStats,
    params.currentUser?.fullName || 'Administrator Operasional',
    params.currentUser?.role || 'Pimpinan Divisi',
    params.type
  );
  return;
  const realToday = getRealTodayDate();

  const tableHeaderHtml = headers.map(h => `<th style="border: 1px solid #cbd5e1; padding: 8px 6px; background-color: #f1f5f9; font-size: 10px; text-transform: uppercase; font-weight: 700; color: #1e293b; text-align: left;">${h}</th>`).join('');

  const tableRowsHtml = rows.map((r, rIdx) => {
    const bg = rIdx % 2 === 0 ? '#ffffff' : '#f8fafc';
    const cells = r.map((c, cIdx) => {
      const align = cIdx === 0 ? 'center' : 'left';
      return `<td style="border: 1px solid #e2e8f0; padding: 6px; font-size: 10px; color: #334155; text-align: ${align};">${c}</td>`;
    }).join('');
    return `<tr style="background-color: ${bg};">${cells}</tr>`;
  }).join('');

  const summaryHtml = summaryStats.map(s => `
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; display: inline-block; margin-right: 12px; margin-bottom: 8px;">
      <div style="font-size: 9px; text-transform: uppercase; color: #64748b; font-weight: 600;">${s.label}</div>
      <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-top: 2px;">${s.value}</div>
    </div>
  `).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>${title} - ${filename}</title>
      <style>
        @page {
          size: A4 landscape;
          margin: 15mm 12mm 15mm 12mm;
        }
        body {
          font-family: Arial, Helvetica, sans-serif;
          margin: 0;
          padding: 20px;
          color: #0f172a;
          background: #ffffff;
        }
        .header-kop {
          text-align: center;
          position: relative;
          padding-bottom: 12px;
          border-bottom: 3px double #0f172a;
          margin-bottom: 16px;
        }
        .header-kop h2 {
          margin: 0;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.5px;
          color: #0f172a;
        }
        .header-kop h1 {
          margin: 2px 0;
          font-size: 16px;
          font-weight: 900;
          letter-spacing: 1px;
          color: #047857;
        }
        .header-kop p {
          margin: 2px 0 0;
          font-size: 9.5px;
          color: #475569;
        }
        .doc-title {
          text-align: center;
          margin: 14px 0 10px;
        }
        .doc-title h3 {
          margin: 0;
          font-size: 13px;
          font-weight: 800;
          text-decoration: underline;
          color: #0f172a;
          letter-spacing: 0.5px;
        }
        .meta-info {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: #475569;
          margin-bottom: 12px;
          border-bottom: 1px dashed #cbd5e1;
          padding-bottom: 8px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        .sign-container {
          margin-top: 35px;
          display: flex;
          justify-content: flex-end;
          page-break-inside: avoid;
        }
        .sign-box {
          text-align: center;
          width: 250px;
          font-size: 10.5px;
        }
        .sign-space {
          height: 55px;
        }
        @media print {
          body {
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 10px 16px; border-radius: 8px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between;">
        <div style="font-size: 12px; font-weight: bold; color: #065f46;">
          📄 Dokumen Resmi Siap Cetak (A4 PDF / Cetak Mandiri)
        </div>
        <div>
          <button onclick="window.print()" style="background-color: #059669; color: white; border: none; padding: 6px 14px; border-radius: 6px; font-size: 12px; font-weight: bold; cursor: pointer; margin-right: 8px;">
            🖨️ Cetak Dokumen Ini
          </button>
          <button onclick="window.close()" style="background-color: #e2e8f0; color: #334155; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: bold; cursor: pointer;">
            Tutup
          </button>
        </div>
      </div>

      <div class="header-kop">
        <h1>UPT ASRAMA HAJI JAKARTA</h1>
        <h2>KEMENTERIAN HAJI DAN UMRAH REPUBLIK INDONESIA</h2>
        <p>Jl. Raya Pondok Gede No. 23, Pinang Ranti, Kec. Makasar, Kota Jakarta Timur 13810</p>
        <p>Telp: (021) 8094444 | Email: asramahaji.jakarta@haji.go.id | Website: haji.go.id</p>
      </div>

      <div class="doc-title">
        <h3>${title}</h3>
      </div>

      <div class="meta-info">
        <div>
          <strong>Periode:</strong> ${params.period} &nbsp;|&nbsp; 
          <strong>Wilayah:</strong> ${params.buildingFilter && params.buildingFilter !== 'ALL' ? params.buildingFilter : 'Semua Gedung & Aula'}
        </div>
        <div>
          <strong>Dicetak Oleh:</strong> ${params.currentUser?.fullName || 'Administrator'} (${params.currentUser?.role || 'Staff'}) &nbsp;|&nbsp; 
          <strong>Tgl:</strong> ${realToday}
        </div>
      </div>

      ${summaryStats.length > 0 ? `<div style="margin-bottom: 12px;">${summaryHtml}</div>` : ''}

      <table>
        <thead>
          <tr>${tableHeaderHtml}</tr>
        </thead>
        <tbody>
          ${tableRowsHtml}
        </tbody>
      </table>

      <div class="sign-container">
        <div class="sign-box">
          <div>Jakarta, ${formatIndonesianDate(realToday)}</div>
          <div style="font-weight: bold; margin-top: 4px;">Mengetahui / Penanggung Jawab,</div>
          <div class="sign-space"></div>
          <div style="font-weight: bold; text-decoration: underline;">${params.currentUser?.fullName || 'Ir. Hendra Kusuma'}</div>
          <div style="color: #64748b; font-size: 9.5px;">${params.currentUser?.role || 'Kepala Divisi Operasional'}</div>
          <div style="color: #94a3b8; font-size: 9px; margin-top: 2px;">NIP. 19800615 200501 1 003</div>
        </div>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 400);
        };
      </script>
    </body>
    </html>
  `;

  printOrDownloadHtmlDocument(htmlContent, filename, title);
}
