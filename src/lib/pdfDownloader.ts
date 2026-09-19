import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Transaction, Room } from '../types';
import { formatIndonesianDate, getRealTodayDate, addDaysToDateStr } from './utils';

/**
 * Generates an official, beautifully formatted Ministry Invoice PDF directly via jsPDF.
 * 100% reliable, zero external network calls, zero CORS canvas issues, and downloads instantly.
 */
export function downloadDirectInvoicePdf(
  tx: Transaction,
  room?: Room | null,
  officerName = 'Petugas Front Office',
  officerRole = 'Resepsionis'
): void {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const isAula = tx.building === 'Ruang Pertemuan';
    const realToday = getRealTodayDate();
    const checkoutDate = !isAula ? addDaysToDateStr(tx.startDate, tx.duration) : tx.startDate;

    // Palette
    const primaryColor: [number, number, number] = [111, 75, 43]; // Chocolate Brown #6f4b2b
    const goldColor: [number, number, number] = [184, 134, 11]; // Warm Gold #b8860b
    const darkSlate: [number, number, number] = [30, 41, 59];
    const lightSlate: [number, number, number] = [100, 116, 139];
    const bgCard: [number, number, number] = [248, 250, 252];
    const borderCard: [number, number, number] = [226, 232, 240];

    // 1. Top Decorative Bar
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 5, 'F');
    doc.setFillColor(...goldColor);
    doc.rect(0, 5, 210, 1.5, 'F');

    // 2. Official Header (Kop Surat)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...primaryColor);
    doc.text('UPT ASRAMA HAJI JAKARTA', 105, 17, { align: 'center' });

    doc.setFontSize(9);
    doc.setTextColor(...goldColor);
    doc.text('KEMENTERIAN HAJI DAN UMRAH REPUBLIK INDONESIA', 105, 22, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...lightSlate);
    doc.text('Jl. Raya Hankam, Pinang Ranti, Kec. Makasar, Kota Jakarta Timur, DKI Jakarta 13810', 105, 26.5, { align: 'center' });
    doc.text('Telp: (021) 8094444 • Email: asramahaji.jakarta@haji.go.id • Portal: haji.go.id', 105, 30.5, { align: 'center' });

    // Double rule line under header
    doc.setDrawColor(...darkSlate);
    doc.setLineWidth(0.6);
    doc.line(14, 34, 196, 34);
    doc.setLineWidth(0.2);
    doc.line(14, 35.2, 196, 35.2);

    // 3. Document Title & Document Meta
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...darkSlate);
    doc.text('LEMBAR BUKTI RESERVASI & OPERASIONAL HUNIAN', 14, 42);

    doc.setFontSize(8);
    doc.setTextColor(...lightSlate);
    doc.setFont('helvetica', 'normal');
    doc.text('Lampiran Dokumen Resmi Tata Kelola Akomodasi Non-Finansial', 14, 46.5);

    // Right meta (No. Dokumen & Tanggal)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...primaryColor);
    doc.text(`NO: INV-OPR/${tx.id}/${tx.startDate.replace(/-/g, '')}`, 196, 42, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...lightSlate);
    doc.text(`Diterbitkan: ${formatIndonesianDate(realToday)}`, 196, 46.5, { align: 'right' });

    // Status Banner Box
    const statusBg: [number, number, number] = tx.status === 'TERISI' 
      ? [209, 250, 229] 
      : tx.status === 'BOOKED' 
      ? [219, 234, 254] 
      : [241, 245, 249];
    const statusTextCol: [number, number, number] = tx.status === 'TERISI' 
      ? [6, 95, 70] 
      : tx.status === 'BOOKED' 
      ? [30, 64, 175] 
      : [51, 65, 85];
    const statusLabel = tx.status === 'TERISI' 
      ? 'STATUS: CHECK-IN (AKTIF MENGINAP)' 
      : tx.status === 'BOOKED' 
      ? 'STATUS: RESERVASI BOOKING (TERJADWAL)' 
      : tx.status === 'SELESAI' 
      ? 'STATUS: SELESAI (CHECK-OUT)' 
      : 'STATUS: DIBATALKAN';

    doc.setFillColor(...statusBg);
    doc.roundedRect(14, 50, 182, 7.5, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...statusTextCol);
    doc.text(statusLabel, 105, 55, { align: 'center' });

    // 4. Two Structured Content Cards: Data Tamu & Data Kamar/Aula
    // Card 1: Data Tamu
    const cardY = 61;
    const cardH = 65;
    const cardW = 88;

    doc.setFillColor(...bgCard);
    doc.setDrawColor(...borderCard);
    doc.roundedRect(14, cardY, cardW, cardH, 2, 2, 'FD');

    doc.setFillColor(...primaryColor);
    doc.roundedRect(14, cardY, cardW, 7, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('1. DATA TAMU & PENYEWA', 18, cardY + 5);

    const guestRows = [
      ['Nama Tamu', tx.guestName || '-'],
      ['Kategori', tx.category === 'JEMAAH' ? 'Jemaah Haji/Umrah' : isAula ? 'Penyewa Acara' : 'Tamu Umum'],
      ['Kloter / Instansi', tx.kloter || '-'],
      ['Kontak Telepon', tx.phone || '-'],
      ['ID Transaksi', tx.id],
      ['Petugas Pemroses', tx.createdUser || officerName]
    ];

    let rowY = cardY + 13;
    guestRows.forEach(([lbl, val]) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...lightSlate);
      doc.text(lbl, 18, rowY);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...darkSlate);
      doc.text(`: ${val}`, 48, rowY);
      rowY += 9;
    });

    // Card 2: Rincian Fasilitas & Durasi
    doc.setFillColor(...bgCard);
    doc.setDrawColor(...borderCard);
    doc.roundedRect(108, cardY, cardW, cardH, 2, 2, 'FD');

    doc.setFillColor(...primaryColor);
    doc.roundedRect(108, cardY, cardW, 7, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(isAula ? '2. RINCIAN RUANG PERTEMUAN' : '2. RINCIAN KAMAR HUNIAN', 112, cardY + 5);

    const facilityRows = [
      ['Wilayah / Gedung', tx.building],
      [isAula ? 'Nama Ruang / Aula' : 'Nomor Kamar', tx.roomNumber],
      ['Kapasitas', room ? `${room.capacity} ${isAula ? 'Pax' : 'Orang'}` : '-'],
      [isAula ? 'Mulai Pelaksanaan' : 'Tgl Mulai Check-In', formatIndonesianDate(tx.startDate)],
      [isAula ? 'Selesai Pelaksanaan' : 'Perkiraan Check-Out', formatIndonesianDate(checkoutDate)],
      ['Total Durasi Sewa', `${tx.duration} ${tx.durationUnit || (isAula ? 'Jam' : 'Malam')}`]
    ];

    let facY = cardY + 13;
    facilityRows.forEach(([lbl, val]) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...lightSlate);
      doc.text(lbl, 112, facY);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...darkSlate);
      doc.text(`: ${val}`, 148, facY);
      facY += 9;
    });

    // 5. Layanan Tambahan & Fasilitas Terpadu Table
    const tableY = 132;
    doc.setFillColor(...bgCard);
    doc.setDrawColor(...borderCard);
    doc.roundedRect(14, tableY, 182, 45, 2, 2, 'FD');

    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, tableY, 182, 7, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...darkSlate);
    doc.text('3. FASILITAS DAN LAYANAN TAMBAHAN YANG DIAJUKAN', 18, tableY + 5);

    const serviceRows = [
      ['Paket Konsumsi / Sarapan', tx.breakfast ? `Termasuk: ${tx.breakfastMenu || 'Sarapan'} (${tx.breakfastPortions || 1} Porsi x ${tx.breakfastDays || tx.duration || 1} Hari)` : 'Tidak Memesan Paket Konsumsi'],
      ['Fasilitas Tambahan / Extra Bed', tx.extraBed ? `Termasuk: +${tx.extraBedCount || 1} Unit Extra Bed (${tx.extraBedNotes || 'Lengkap sprei & bantal'})` : 'Standar Fasilitas Ruangan'],
      ['Skema Penataan Ruang', tx.rentType || (isAula ? 'Sewa Per Jam / Sesi' : 'Sewa Per Kamar')],
      ['Catatan Khusus Tamu', tx.notes ? tx.notes : 'Tidak ada instruksi khusus.']
    ];

    let sY = tableY + 13;
    serviceRows.forEach(([srvLbl, srvVal]) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...primaryColor);
      doc.text(srvLbl, 18, sY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...darkSlate);
      doc.text(`: ${srvVal}`, 68, sY);
      sY += 8.5;
    });

    // 6. Tata Tertib & Ketentuan Ringkas
    const termsY = 182;
    doc.setFillColor(254, 252, 243);
    doc.setDrawColor(243, 223, 162);
    doc.roundedRect(14, termsY, 182, 22, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...primaryColor);
    doc.text('KETENTUAN OPERASIONAL & TATA TERTIB HUNIAN:', 18, termsY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...darkSlate);
    doc.text('1. Tamu wajib menjaga kebersihan, ketertiban, serta fasilitas yang ada di dalam kamar maupun area asrama.', 18, termsY + 9.5);
    doc.text('2. Waktu standar Check-In pukul 14:00 WIB dan batas waktu Check-Out pukul 12:00 WIB pada tanggal yang tertera.', 18, termsY + 13.5);
    doc.text('3. Kehilangan kunci kamar atau kerusakan sarana kamar akan ditangani sesuai SOP UPT Asrama Haji Jakarta.', 18, termsY + 17.5);

    // 7. Signature Box (Tanda Tangan) - 3 Pihak: Tamu, Tim Akomodasi, Resepsionis
    const signY = 212;

    // 1. Tamu / Penyewa
    const tamuX = 42;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...darkSlate);
    doc.text('Penyewa / Tamu yang Bersangkutan,', tamuX, signY, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(tx.guestName || 'Nama Tamu / Penyewa', tamuX, signY + 28, { align: 'center' });
    doc.setLineWidth(0.3);
    doc.setDrawColor(...darkSlate);
    doc.line(16, signY + 29, 68, signY + 29);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...lightSlate);
    doc.text('Tanda Tangan & Nama Terang', tamuX, signY + 33, { align: 'center' });

    // 2. Tim Akomodasi
    const akoX = 105;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...darkSlate);
    doc.text('Tim Pengelola Akomodasi & Sarana,', akoX, signY, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('Tim Pengelola Akomodasi', akoX, signY + 28, { align: 'center' });
    doc.setLineWidth(0.3);
    doc.setDrawColor(...darkSlate);
    doc.line(79, signY + 29, 131, signY + 29);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...lightSlate);
    doc.text('Sarana & Hunian UPT Asrama Haji', akoX, signY + 33, { align: 'center' });

    // 3. Resepsionis
    const recepX = 168;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...darkSlate);
    doc.text(`Jakarta, ${formatIndonesianDate(realToday)}`, recepX, signY - 4, { align: 'center' });
    doc.text('Petugas Front Office / Resepsionis,', recepX, signY, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(officerName, recepX, signY + 28, { align: 'center' });
    doc.setLineWidth(0.3);
    doc.setDrawColor(...darkSlate);
    doc.line(142, signY + 29, 194, signY + 29);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...lightSlate);
    doc.text(`${officerRole} • UPT Asrama Haji`, recepX, signY + 33, { align: 'center' });

    // 8. Footer Barcode & Legal Notice
    doc.setDrawColor(...borderCard);
    doc.setLineWidth(0.4);
    doc.line(14, 275, 196, 275);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...lightSlate);
    doc.text('Dokumen ini sah secara elektronik dan tercatat di Sistem Informasi Manajemen Operasional UPT Asrama Haji Jakarta.', 14, 280);
    doc.text('Kementerian Haji dan Umrah RI • Halaman 1 dari 1', 196, 280, { align: 'right' });

    // Trigger Save
    const cleanFilename = `Invoice-${tx.id}-${tx.roomNumber}.pdf`;
    doc.save(cleanFilename);
  } catch (error) {
    console.error('Error in downloadDirectInvoicePdf:', error);
    // Fallback to print
    window.print();
  }
}

/**
 * Calculates precision column widths tailored to report type so that no text is truncated.
 */
function calculateReportColumnWidths(headers: string[], reportType?: string, tableWidth = 273): number[] {
  const colCount = headers.length;
  if (reportType === 'KAMAR' && colCount === 13) {
    // 13 cols: No, ID, Kategori, Tipe, Gedung, No.Kamar/Aula, Nama, Kloter, Tgl, Durasi, Satuan, HP, Status
    return [8, 16, 18, 24, 26, 32, 34, 24, 18, 12, 12, 23, 26]; // sum = 273
  }
  if (reportType === 'MAINTENANCE' && colCount === 11) {
    // 11 cols: No, Waktu, Tipe, Gedung, No.Kamar/Aula, Kategori, Urgensi, Teknisi, Pelapor, Deskripsi, Status
    return [8, 20, 22, 24, 30, 24, 18, 24, 22, 57, 24]; // sum = 273
  }
  if (reportType === 'QC') {
    if (colCount === 11) {
      // Readiness: No, Tipe, Gedung, No.Kamar/Aula, Tipe/Kelas, Kapasitas, Status Fisik, Vonis, Tgl, Petugas, Catatan
      return [8, 22, 24, 30, 20, 18, 18, 28, 20, 24, 61]; // sum = 273
    }
    if (colCount === 15) {
      // History: No, ID, Waktu, Tipe, Gedung, No.Kamar/Aula, QC, Kebersihan, Linen, AC, Sanitasi, Amenities, Vonis, Alur, Catatan
      return [7, 14, 18, 20, 20, 22, 22, 14, 16, 15, 15, 16, 23, 17, 34]; // sum = 273
    }
  }
  if (reportType === 'SARAPAN' && colCount === 16) {
    // 16 cols: No, ID, Status, Prioritas, Gedung, No.Kamar, Nama, Kloter, HP, Tgl, Menu, Porsi, Hari, Total, StatusDapur, Catatan
    return [7, 14, 15, 17, 18, 15, 26, 18, 16, 15, 26, 10, 10, 11, 23, 32]; // sum = 273
  }

  // Dynamic weights fallback
  const weights = headers.map(h => {
    const l = h.toLowerCase();
    if (l === 'no' || l === 'no.') return 1.0;
    if (l.includes('durasi') || l.includes('porsi') || l.includes('hari') || l.includes('satuan')) return 1.5;
    if (l.includes('id') || l.includes('tgl') || l.includes('waktu') || l.includes('urgensi')) return 2.2;
    if (l.includes('status') || l.includes('kategori') || l.includes('kloter')) return 2.8;
    if (l.includes('kamar') || l.includes('aula') || l.includes('gedung') || l.includes('wilayah')) return 3.6;
    if (l.includes('nama') || l.includes('teknisi') || l.includes('pemeriksa')) return 3.8;
    if (l.includes('catatan') || l.includes('deskripsi') || l.includes('temuan') || l.includes('evaluasi')) return 6.0;
    return 3.0;
  });
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  return weights.map(w => Number(((w / totalWeight) * tableWidth).toFixed(1)));
}

/**
 * Downloads tabular reports (Kamar, Maintenance, QC, Sarapan, dll) directly as crisp official PDF.
 * Implements precision multi-line wrapping and single manager signature.
 */
export function downloadReportPdfDirect(
  title: string,
  filename: string,
  headers: string[],
  rows: (string | number)[][],
  summaryStats?: { label: string; value: string | number }[],
  officerName = 'Administrator Operasional',
  officerRole = 'Pimpinan Divisi',
  reportType?: string
): void {
  try {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const realToday = getRealTodayDate();
    const primaryColor: [number, number, number] = [111, 75, 43]; // Chocolate Brown
    const goldColor: [number, number, number] = [184, 134, 11];
    const darkSlate: [number, number, number] = [30, 41, 59];
    const lightSlate: [number, number, number] = [100, 116, 139];

    // Top Brand Bar
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 297, 4.5, 'F');
    doc.setFillColor(...goldColor);
    doc.rect(0, 4.5, 297, 1.2, 'F');

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...primaryColor);
    doc.text('UPT ASRAMA HAJI JAKARTA', 148.5, 13, { align: 'center' });

    doc.setFontSize(8.5);
    doc.setTextColor(...goldColor);
    doc.text('KEMENTERIAN HAJI DAN UMRAH REPUBLIK INDONESIA', 148.5, 17.5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...lightSlate);
    doc.text('Sistem Informasi Terpadu Pelayanan, Hunian & Pemeliharaan Sarana Prasarana', 148.5, 21.5, { align: 'center' });

    doc.setDrawColor(...darkSlate);
    doc.setLineWidth(0.4);
    doc.line(12, 24, 285, 24);

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...darkSlate);
    doc.text(title, 12, 30);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...lightSlate);
    doc.text(`Tanggal Cetak: ${formatIndonesianDate(realToday)}  |  UPT Asrama Haji Jakarta • Kementerian Haji dan Umrah RI`, 12, 34);

    // Summary Stats
    let curY = 38;
    if (summaryStats && summaryStats.length > 0) {
      let statX = 12;
      summaryStats.forEach(stat => {
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(statX, curY, 42, 10, 1.5, 1.5, 'FD');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(...lightSlate);
        doc.text(String(stat.label).toUpperCase(), statX + 3, curY + 4);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(...primaryColor);
        doc.text(String(stat.value), statX + 3, curY + 8.5);

        statX += 45;
      });
      curY += 13;
    }

    // Determine Table Column Widths with Exact Proportions
    const tableWidth = 273; // 285 - 12
    const colWidths = calculateReportColumnWidths(headers, reportType, tableWidth);

    // Header row
    const startY = curY;
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.rect(12, startY, tableWidth, 6.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(...darkSlate);

    let hX = 12;
    headers.forEach((h, idx) => {
      const cWidth = colWidths[idx];
      doc.text(h, hX + 1.2, startY + 4.5, { maxWidth: cWidth - 2.4 });
      hX += cWidth;
    });

    let rowY = startY + 6.5;

    // Helper to render table header
    const renderTableHeader = (yPos: number) => {
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.rect(12, yPos, tableWidth, 6.5, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.setTextColor(...darkSlate);

      let headerX = 12;
      headers.forEach((h, idx) => {
        const cWidth = colWidths[idx];
        doc.text(h, headerX + 1.2, yPos + 4.5, { maxWidth: cWidth - 2.4 });
        headerX += cWidth;
      });
    };

    // Render Data Rows with Dynamic Text Wrapping (No Clipping!)
    rows.forEach((r, rIdx) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.2);

      // Split text to lines for each cell in this row
      const cellLines = r.map((cVal, cIdx) => {
        const cWidth = colWidths[cIdx] || 20;
        const strVal = String(cVal ?? '-');
        return doc.splitTextToSize(strVal, cWidth - 2.4);
      });

      const maxLines = Math.max(1, ...cellLines.map(lines => lines.length));
      const lineHeight = 3.0; // mm
      const rowHeight = Math.max(5.5, maxLines * lineHeight + 2.5);

      // Page overflow check (A4 Landscape height = 210mm; limit table to 176mm to leave room for bottom info)
      if (rowY + rowHeight > 176) {
        doc.addPage();
        rowY = 16;
        renderTableHeader(rowY);
        rowY += 6.5;
      }

      const isEven = rIdx % 2 === 0;
      doc.setFillColor(isEven ? 255 : 249, isEven ? 255 : 250, isEven ? 255 : 252);
      doc.setDrawColor(226, 232, 240);
      doc.rect(12, rowY, tableWidth, rowHeight, 'FD');

      doc.setTextColor(...darkSlate);

      let xPos = 12;
      r.forEach((_, cIdx) => {
        const cWidth = colWidths[cIdx] || 20;
        const lines = cellLines[cIdx];
        lines.forEach((lineText: string, lIdx: number) => {
          doc.text(lineText, xPos + 1.2, rowY + 3.5 + (lIdx * lineHeight));
        });
        xPos += cWidth;
      });

      rowY += rowHeight;
    });

    // 1 Signature Only: Manager yang bersangkutan
    let managerName = 'Dra. Hj. Siti Rahmah';
    let managerRole = 'Manager Resepsionis';
    let managerNip = 'NIP. 19780514 200501 2 003';

    if (reportType === 'MAINTENANCE') {
      managerName = 'H. Joko Susilo, ST';
      managerRole = 'Manager Teknisi & Sarpras';
      managerNip = 'NIP. 19800311 200701 1 008';
    } else if (reportType === 'QC') {
      managerName = 'Ir. Hendra Kusuma';
      managerRole = 'Manager Quality Control';
      managerNip = 'NIP. 19790822 200604 1 005';
    } else if (reportType === 'SARAPAN') {
      managerName = 'Hj. Rina Marlina';
      managerRole = 'Manager Koperasi & Konsumsi';
      managerNip = 'NIP. 19820917 200801 2 006';
    } else if (reportType === 'AUDIT' || reportType === 'JAM_KERJA') {
      managerName = 'Ahmad Faisal';
      managerRole = 'Super Admin / Kepala UPT';
      managerNip = 'NIP. 19750101 200003 1 001';
    }

    // Override with active user if user is already the manager
    if (officerRole && officerRole.toLowerCase().includes('manager')) {
      managerName = officerName;
      managerRole = officerRole;
    }

    // Check if signature fits on current page (needs ~30mm)
    if (rowY + 32 > 198) {
      doc.addPage();
      rowY = 20;
    }

    const signY = Math.max(rowY + 6, 168);
    const signX = 245;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...darkSlate);
    doc.text(`Jakarta, ${formatIndonesianDate(realToday)}`, signX, signY, { align: 'center' });
    doc.text('Mengetahui / Menyetujui,', signX, signY + 4, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(managerName, signX, signY + 20, { align: 'center' });
    doc.setLineWidth(0.3);
    doc.line(signX - 26, signY + 21, signX + 26, signY + 21);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...lightSlate);
    doc.text(`${managerRole} • UPT Asrama Haji`, signX, signY + 25, { align: 'center' });
    doc.text(managerNip, signX, signY + 28.5, { align: 'center' });

    const finalFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    doc.save(finalFilename);
  } catch (err) {
    console.error('Error generating report PDF:', err);
    window.print();
  }
}

/**
 * Downloads a DOM element using html2canvas with fallback to direct PDF.
 */
export async function downloadElementAsPdf(
  element: HTMLElement,
  filename: string,
  options?: {
    orientation?: 'portrait' | 'landscape';
    format?: 'a4';
    marginMm?: number;
    title?: string;
  }
): Promise<void> {
  const orientation = options?.orientation || 'portrait';
  const margin = options?.marginMm ?? 8;

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pageWidth = orientation === 'landscape' ? 297 : 210;
    const pageHeight = orientation === 'landscape' ? 210 : 297;
    const printableWidth = pageWidth - margin * 2;
    const printableHeight = pageHeight - margin * 2;

    const imgWidth = printableWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (imgHeight <= printableHeight) {
      pdf.addImage(imgData, 'JPEG', margin, margin, imgWidth, imgHeight);
    } else {
      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight);
      heightLeft -= printableHeight;

      while (heightLeft > 0) {
        pdf.addPage();
        position = margin - (imgHeight - heightLeft);
        pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight);
        heightLeft -= printableHeight;
      }
    }

    const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    pdf.save(cleanFilename);
  } catch (error) {
    console.warn('html2canvas failed, attempting print fallback:', error);
    window.print();
  }
}

/**
 * Renders raw HTML string in a sandboxed offscreen container and exports directly as PDF
 */
export async function downloadHtmlContentAsPdf(
  htmlContent: string,
  filename: string,
  options?: {
    orientation?: 'portrait' | 'landscape';
    format?: 'a4';
    marginMm?: number;
    title?: string;
  }
): Promise<void> {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-99999px';
  container.style.top = '0';
  container.style.width = options?.orientation === 'landscape' ? '1200px' : '900px';
  container.style.backgroundColor = '#ffffff';
  container.style.zIndex = '-9999';
  container.innerHTML = htmlContent;
  document.body.appendChild(container);

  try {
    await new Promise(resolve => setTimeout(resolve, 150));
    await downloadElementAsPdf(container, filename, options);
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}

/**
 * Executes a clean browser print for invoice sheets with proper CSS scoping
 */
export function printInvoiceDocument(): void {
  try {
    document.body.classList.add('printing-invoice');
    window.print();
  } finally {
    setTimeout(() => {
      document.body.classList.remove('printing-invoice');
    }, 1000);
  }
}
