import React, { useState } from 'react';
import { Transaction, Room } from '../types';
import { formatIndonesianDate, addDaysToDateStr, getRealTodayDate } from '../lib/utils';
import { useAppContext } from '../store';
import { downloadDirectInvoicePdf, printInvoiceDocument } from '../lib/pdfDownloader';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  tx: Transaction | null;
  room?: Room | null;
  returnToRoomId?: string | null;
  onReturn?: () => void;
  onExtend?: (tx: Transaction) => void;
  onEdit?: (tx: Transaction) => void;
}

export function InvoiceModal({ isOpen, onClose, tx, room, returnToRoomId, onReturn }: InvoiceModalProps) {
  const { currentUser, rooms, openModal, showToast } = useAppContext();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (!isOpen || !tx) return null;

  const isAula = tx.building === 'Ruang Pertemuan';
  const currentRoom = room || rooms.find(r => r.id === tx.roomId);
  const checkoutDate = !isAula ? addDaysToDateStr(tx.startDate, tx.duration) : tx.startDate;

  const handleGoBack = () => {
    onClose();
    if (onReturn) {
      onReturn();
    } else if (returnToRoomId) {
      openModal('modalRoomDetail', { roomId: returnToRoomId });
    }
  };

  const handlePrint = () => {
    printInvoiceDocument();
  };

  const handleDownloadPdf = () => {
    try {
      setIsGeneratingPdf(true);
      downloadDirectInvoicePdf(
        tx,
        currentRoom,
        currentUser?.fullName || 'Petugas Administrasi',
        currentUser?.role || 'Resepsionis'
      );
      showToast(`Berkas PDF Invoice ${tx.id} berhasil diunduh.`, 'SUCCESS');
    } catch (err) {
      console.error('Download PDF error:', err);
      printInvoiceDocument();
    } finally {
      setTimeout(() => {
        setIsGeneratingPdf(false);
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[94vh] my-auto animate-in fade-in zoom-in duration-150 print:max-h-none print:shadow-none print:border-none print:w-full">
        {/* Modal Header Toolbar */}
        <div className="bg-gradient-to-r from-hajj-800 to-hajj-900 px-6 py-3.5 text-white flex items-center justify-between shrink-0 print:hidden border-b border-gold-500/20">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-gold-500/20 border border-gold-400/40 text-gold-300 flex items-center justify-center font-bold text-sm">
              <i className="fa-solid fa-file-invoice"></i>
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Lembar Invoice & Dokumen Reservasi Resmi</h3>
              <p className="text-[11px] text-gold-300 font-mono">No. Dokumen: INV-OPR/{tx.id}/{tx.startDate.replace(/-/g, '')}</p>
            </div>
          </div>
          
          <button 
            type="button" 
            onClick={onClose} 
            className="text-white/70 hover:text-white text-lg p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
            title="Tutup lembar invoice"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Modal Content / Printable Invoice Body */}
        <div id="invoice-printable-sheet" className="p-6 sm:p-8 space-y-5 overflow-y-auto custom-scrollbar flex-1 bg-white text-slate-800 print:p-4 print:overflow-visible">
          {/* 1. KOP SURAT RESMI KEMENTERIAN HAJI & UMRAH RI */}
          <div className="border-b-2 border-hajj-900 pb-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center space-x-3.5">
              <div className="w-14 h-14 rounded-2xl bg-hajj-800 text-gold-400 flex items-center justify-center font-black text-2xl shadow-sm border-2 border-gold-400 shrink-0">
                <i className="fa-solid fa-kaaba"></i>
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black tracking-tight text-hajj-900 leading-tight">
                  UPT ASRAMA HAJI JAKARTA
                </h2>
                <p className="text-[10px] uppercase tracking-widest font-black text-gold-600">KEMENTERIAN HAJI DAN UMRAH REPUBLIK INDONESIA</p>
                <p className="text-[11px] text-slate-600 font-medium">
                  Sistem Informasi & Manajemen Administrasi Operasional Hunian Terpadu
                </p>
              </div>
            </div>
            <div className="text-right sm:border-l sm:border-slate-200 sm:pl-4 text-[11px] text-slate-500">
              <p className="font-bold text-slate-700">Lampiran Administrasi Hunian</p>
              <p>Jl. Raya Pondok Gede No. 23, Jakarta Timur</p>
              <p>Email: asramahaji.jakarta@haji.go.id</p>
            </div>
          </div>

          {/* 2. JUDUL DOKUMEN & METADATA */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-hajj-50/80 p-3 rounded-xl border border-hajj-200">
            <div>
              <span className="text-[10px] font-bold text-hajj-700 uppercase tracking-wider block">Dokumen Resmi Akomodasi Non-Finansial</span>
              <h1 className="text-sm sm:text-base font-bold text-slate-900">
                {isAula ? 'BUKTI RESERVASI SEWA RUANG PERTEMUAN' : 'BUKTI CHECK-IN & RESERVASI HUNIAN KAMAR'}
              </h1>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-[10px] text-slate-500 block">Status Transaksi:</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                tx.status === 'TERISI' 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                  : tx.status === 'BOOKED'
                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                  : tx.status === 'SELESAI'
                  ? 'bg-slate-100 text-slate-700 border border-slate-300'
                  : 'bg-red-100 text-red-700 border border-red-300'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                  tx.status === 'TERISI' ? 'bg-emerald-600' : tx.status === 'BOOKED' ? 'bg-blue-600' : 'bg-slate-500'
                }`}></span>
                {tx.status === 'TERISI' ? 'Check-In (Aktif)' : tx.status === 'BOOKED' ? 'Reservasi Terjadwal' : tx.status}
              </span>
            </div>
          </div>

          {/* 3. RINCIAN DATA TAMU & FASILITAS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Box Tamu */}
            <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-2.5">
              <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-1.5 flex items-center justify-between text-xs">
                <span className="flex items-center space-x-1.5">
                  <i className="fa-solid fa-user-tie text-hajj-700"></i>
                  <span>Data Tamu / Penyewa</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-hajj-100 text-hajj-800 font-semibold">
                  {tx.category === 'JEMAAH' ? 'Jemaah Haji/Umrah' : 'Tamu Umum/Dinas'}
                </span>
              </h4>
              <div className="space-y-1.5 text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nama Tamu:</span>
                  <span className="font-bold text-slate-900 text-right">{tx.guestName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kloter / Instansi:</span>
                  <span className="font-semibold text-slate-800 text-right">{tx.kloter || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">No. Kontak:</span>
                  <span className="font-mono text-slate-800">{tx.phone || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ID Registrasi:</span>
                  <span className="font-mono text-slate-600">{tx.id}</span>
                </div>
              </div>
            </div>

            {/* Box Fasilitas */}
            <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-2.5">
              <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-1.5 flex items-center justify-between text-xs">
                <span className="flex items-center space-x-1.5">
                  <i className={`fa-solid ${isAula ? 'fa-landmark text-hajj-700' : 'fa-bed text-hajj-700'}`}></i>
                  <span>{isAula ? 'Fasilitas Ruang Pertemuan' : 'Fasilitas Kamar Hunian'}</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-semibold">
                  {tx.building}
                </span>
              </h4>
              <div className="space-y-1.5 text-slate-700">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-slate-500 shrink-0">{isAula ? 'Gedung & Ruang:' : 'Nomor Kamar:'}</span>
                  <span className="font-bold text-slate-900 text-right break-words">{tx.roomNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kapasitas Maksimal:</span>
                  <span className="font-semibold text-slate-800">{currentRoom ? `${currentRoom.capacity} ${isAula ? 'Pax' : 'Orang'}` : '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isAula ? 'Tgl Pelaksanaan:' : 'Tgl Check-In:'}</span>
                  <span className="font-bold text-slate-900">{formatIndonesianDate(tx.startDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isAula ? 'Estimasi Selesai:' : 'Perkiraan Check-Out:'}</span>
                  <span className="font-bold text-slate-900">{formatIndonesianDate(checkoutDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Durasi Sewa:</span>
                  <span className="font-bold text-hajj-800">
                    {tx.duration} {tx.durationUnit || (isAula ? 'Jam' : 'Malam')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. FASILITAS TAMBAHAN & DETAIL LAYANAN */}
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <div className="bg-slate-100/90 px-4 py-2 font-bold text-slate-800 border-b border-slate-200 flex items-center justify-between">
              <span>Fasilitas & Layanan Tambahan yang Disepakati</span>
              <span className="text-[10px] text-slate-500 font-normal">Operasional Terpadu UPT</span>
            </div>
            <div className="p-4 space-y-3 bg-white">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50">
                  <span className="text-slate-400 block text-[10px]">Paket Sarapan / Konsumsi:</span>
                  <div className="font-semibold text-slate-800 mt-0.5">
                    {tx.breakfast ? (
                      <span className="text-emerald-700 flex items-center gap-1 font-bold">
                        <i className="fa-solid fa-circle-check text-emerald-600"></i>
                        <span>{tx.breakfastMenu || 'Sarapan'} ({tx.breakfastPortions || 1} Porsi)</span>
                      </span>
                    ) : (
                      <span className="text-slate-500">Tidak Termasuk</span>
                    )}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50">
                  <span className="text-slate-400 block text-[10px]">Extra Bed / Kasur Tambahan:</span>
                  <div className="font-semibold text-slate-800 mt-0.5">
                    {tx.extraBed ? (
                      <span className="text-indigo-700 flex items-center gap-1 font-bold">
                        <i className="fa-solid fa-circle-check text-indigo-600"></i>
                        <span>+{tx.extraBedCount || 1} Unit Bed</span>
                      </span>
                    ) : (
                      <span className="text-slate-500">Standar Fasilitas</span>
                    )}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50">
                  <span className="text-slate-400 block text-[10px]">Skema Penempatan:</span>
                  <div className="font-semibold text-slate-800 mt-0.5">
                    {tx.rentType || (isAula ? 'Sewa Per Sesi / Jam' : 'Sewa Per Kamar')}
                  </div>
                </div>
              </div>

              {tx.notes && (
                <div className="p-2.5 rounded-lg bg-amber-50/80 border border-amber-200 text-amber-900 text-xs">
                  <span className="font-bold block text-[10px] text-amber-800">Catatan Khusus Tamu:</span>
                  <p className="mt-0.5">{tx.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* 5. TATA TERTIB & KETENTUAN */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 space-y-1">
            <span className="font-bold text-slate-800 block text-xs">Ketentuan & Tata Tertib Hunian:</span>
            <ul className="list-disc list-inside space-y-0.5 text-[10px] text-slate-500">
              <li>Waktu standar Check-In pukul 14:00 WIB dan batas waktu Check-Out pukul 12:00 WIB.</li>
              <li>Tamu wajib menjaga kebersihan, ketertiban, dan keutuhan fasilitas di dalam kamar serta lingkungan asrama.</li>
              <li>Segala bentuk kehilangan kunci atau kerusakan inventaris akan diselesaikan sesuai SOP pengelola UPT Asrama Haji Jakarta.</li>
            </ul>
          </div>

          {/* 6. KOLOM TANDA TANGAN (3 PIHAK: PENYEWA/TAMU, TIM AKOMODASI, RESEPSIONIS) */}
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-xs text-slate-700">
            <div>
              <p className="text-slate-500 font-medium">Penyewa / Tamu yang Bersangkutan,</p>
              <div className="h-16 flex items-end justify-center">
                <div className="w-40 border-b border-slate-400 font-bold text-slate-900 pb-1 truncate">
                  {tx.guestName}
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Tanda Tangan & Nama Terang</p>
            </div>

            <div>
              <p className="text-slate-500 font-medium">Tim Pengelola Akomodasi,</p>
              <div className="h-16 flex items-end justify-center">
                <div className="w-40 border-b border-slate-400 font-bold text-slate-900 pb-1">
                  Tim Pengelola Akomodasi
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Sarana & Hunian UPT Asrama Haji</p>
            </div>

            <div>
              <p className="text-slate-500 font-medium">
                Jakarta, {formatIndonesianDate(getRealTodayDate())}
              </p>
              <p className="text-slate-500 font-medium">Petugas Front Office / Resepsionis,</p>
              <div className="h-11 flex items-end justify-center">
                <div className="w-40 border-b border-slate-400 font-bold text-slate-900 pb-1 truncate">
                  {currentUser?.fullName || 'Petugas Resepsionis'}
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">{currentUser?.role || 'Resepsionis'} • UPT Asrama Haji</p>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0 print:hidden">
          {targetRoomId ? (
            <button
              type="button"
              onClick={handleGoBack}
              className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-lg text-xs transition flex items-center space-x-1.5 cursor-pointer border border-slate-300"
              title="Kembali ke rincian kamar sebelumnya"
            >
              <i className="fa-solid fa-arrow-left text-slate-500 text-[11px]"></i>
              <span>Kembali ke Rincian</span>
            </button>
          ) : (
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Dokumen Administrasi Resmi UPT Asrama Haji</span>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 bg-slate-700 hover:bg-slate-800 text-white font-bold rounded-lg text-xs shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
              title="Cetak langsung dokumen"
            >
              <i className="fa-solid fa-print"></i>
              <span>Cetak Dokumen</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-4 py-2 bg-hajj-700 hover:bg-hajj-800 disabled:bg-slate-400 text-white font-bold rounded-lg text-xs shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
              title="Unduh berkas PDF resmi ke perangkat"
            >
              {isGeneratingPdf ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin text-gold-300"></i>
                  <span>Menyiapkan PDF...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-file-pdf text-gold-300"></i>
                  <span>Unduh File PDF</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg text-xs transition cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
