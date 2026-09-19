import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext, formatHMS, isTeknisiRole, isManagerTeknisi, isManagerQc, isKoperasiRole, isRecepRole, isQcRole } from '../store';
import { formatIndonesianDate, addDaysToDateStr, getRealTodayDate, formatIndonesianDateTime } from '../lib/utils';
import { Transaction, Maintenance, WorkSession } from '../types';

export function ReportsView() {
  const { transactions, openModal } = useAppContext();
  const [activeTab, setActiveTab] = useState<'ALL' | 'KAMAR' | 'AULA'>('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      if (activeTab === 'KAMAR' && tx.building === 'Ruang Pertemuan') return false;
      if (activeTab === 'AULA' && tx.building !== 'Ruang Pertemuan') return false;
      if (statusFilter !== 'ALL' && tx.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const matchName = tx.guestName.toLowerCase().includes(q);
        const matchRoom = tx.roomNumber.toLowerCase().includes(q);
        const matchBuilding = tx.building.toLowerCase().includes(q);
        const matchId = tx.id.toLowerCase().includes(q);
        if (!matchName && !matchRoom && !matchBuilding && !matchId) return false;
      }
      return true;
    });
  }, [transactions, activeTab, statusFilter, search]);

  const kamarTransactions = useMemo(() => {
    return filteredTransactions.filter(tx => tx.building !== 'Ruang Pertemuan');
  }, [filteredTransactions]);

  const aulaTransactions = useMemo(() => {
    return filteredTransactions.filter(tx => tx.building === 'Ruang Pertemuan');
  }, [filteredTransactions]);

  // Overall Stats
  const totalKamarCount = transactions.filter(tx => tx.building !== 'Ruang Pertemuan').length;
  const kamarTerisiCount = transactions.filter(tx => tx.building !== 'Ruang Pertemuan' && tx.status === 'TERISI').length;
  const kamarBookedCount = transactions.filter(tx => tx.building !== 'Ruang Pertemuan' && tx.status === 'BOOKED').length;
  const totalAulaCount = transactions.filter(tx => tx.building === 'Ruang Pertemuan').length;
  const aulaActiveCount = transactions.filter(tx => tx.building === 'Ruang Pertemuan' && (tx.status === 'TERISI' || tx.status === 'BOOKED')).length;

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <p className="text-xs font-semibold text-slate-500 uppercase">Kamar Terisi (Aktif)</p>
          <p className="text-2xl font-bold text-emerald-600">{kamarTerisiCount}</p>
          <span className="text-[10px] text-slate-400">Total riwayat kamar: {totalKamarCount}</span>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <p className="text-xs font-semibold text-slate-500 uppercase">Kamar Terjadwal (Booked)</p>
          <p className="text-2xl font-bold text-blue-600">{kamarBookedCount}</p>
          <span className="text-[10px] text-blue-600 font-medium">Reservasi mendatang</span>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <p className="text-xs font-semibold text-slate-500 uppercase">Penyewaan Aula (Aktif)</p>
          <p className="text-2xl font-bold text-purple-600">{aulaActiveCount}</p>
          <span className="text-[10px] text-slate-400">Total riwayat aula: {totalAulaCount}</span>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <p className="text-xs font-semibold text-slate-500 uppercase">Total Semua Transaksi</p>
          <p className="text-2xl font-bold text-slate-800">{transactions.length}</p>
          <span className="text-[10px] text-emerald-600 font-medium">Gedung & Ruang Pertemuan</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center">
              <i className="fa-solid fa-file-invoice text-emerald-600 mr-2"></i>
              Laporan Hunian Kamar & Booking Ruang Pertemuan
            </h3>
            <p className="text-xs text-slate-500">Pemisahan data terperinci antara Kamar Penginapan (Gedung) dan Ruang Pertemuan (Aula).</p>
          </div>
          <button 
            onClick={() => openModal('modalExport', { defaultType: 'KAMAR' })} 
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow transition flex items-center space-x-1.5 self-start md:self-auto"
            title="Unduh Laporan Transaksi & Reservasi (PDF / Excel .xlsx)"
          >
            <i className="fa-solid fa-file-arrow-down"></i>
            <span>Unduh Laporan Transaksi</span>
          </button>
        </div>

        {/* Filter and Tab Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
          {/* Section Tabs */}
          <div className="inline-flex bg-white p-1 rounded-lg border border-slate-200 shadow-xs text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-md transition ${activeTab === 'ALL' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Semua ({filteredTransactions.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('KAMAR')}
              className={`px-3 py-1.5 rounded-md transition flex items-center space-x-1 ${activeTab === 'KAMAR' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <i className="fa-solid fa-bed"></i>
              <span>Gedung (Kamar)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('AULA')}
              className={`px-3 py-1.5 rounded-md transition flex items-center space-x-1 ${activeTab === 'AULA' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <i className="fa-solid fa-handshake"></i>
              <span>Ruang Pertemuan (Aula)</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Cari nama, kamar, ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none w-44 sm:w-56"
              />
              <i className="fa-solid fa-magnifying-glass absolute left-2.5 top-2.5 text-slate-400 text-xs"></i>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter status transaksi"
              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="ALL">Semua Status</option>
              <option value="TERISI">Terisi / Check-In</option>
              <option value="BOOKED">Booked / Reservasi</option>
              <option value="SELESAI">Selesai (Check-Out)</option>
              <option value="DIBATALKAN">Dibatalkan</option>
            </select>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BAGIAN 1: TABEL GEDUNG (KAMAR PENGINAPAN) */}
        {/* ========================================================================= */}
        {(activeTab === 'ALL' || activeTab === 'KAMAR') && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <h4 className="font-bold text-slate-800 text-sm">
                  Laporan Kamar Penginapan (Gedung A, B, C, D)
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  {kamarTransactions.length} Data
                </span>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 uppercase text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">ID Transaksi</th>
                    <th className="p-3">Gedung & No Kamar</th>
                    <th className="p-3">Kategori Tamu</th>
                    <th className="p-3">Nama Tamu / Jemaah</th>
                    <th className="p-3">Tanggal Check-In</th>
                    <th className="p-3">Tanggal Check-Out</th>
                    <th className="p-3">Durasi</th>
                    <th className="p-3">Extra Bed & Sarapan</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Aksi Dokumen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {kamarTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-6 text-center text-slate-400 italic">
                        Tidak ada transaksi kamar yang sesuai dengan filter.
                      </td>
                    </tr>
                  ) : (
                    kamarTransactions.map(tx => {
                      const checkoutDate = addDaysToDateStr(tx.startDate, tx.duration);
                      return (
                        <tr key={tx.id} className="hover:bg-slate-50 transition">
                          <td className="p-3 font-bold font-mono text-emerald-800">{tx.id}</td>
                          <td className="p-3 font-bold text-slate-800">
                            {tx.roomNumber} 
                            <span className="block text-[10px] font-normal text-slate-400">{tx.building}</span>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium">
                              {tx.category}
                            </span>
                          </td>
                          <td className="p-3 font-semibold text-slate-900">
                            {tx.guestName}
                            {tx.kloter && <span className="block text-[10px] text-blue-600 font-normal">Kloter: {tx.kloter}</span>}
                          </td>
                          <td className="p-3 font-medium">{formatIndonesianDate(tx.startDate)}</td>
                          <td className="p-3 font-medium text-slate-600">{formatIndonesianDate(checkoutDate)}</td>
                          <td className="p-3 font-semibold">{tx.duration} {tx.durationUnit || 'Malam'}</td>
                          <td className="p-3">
                            <div className="space-y-1">
                              {tx.extraBed ? (
                                <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                                  <i className="fa-solid fa-mattress-pillow mr-1"></i>
                                  +{tx.extraBedCount || 1} Extra Bed
                                </div>
                              ) : null}

                              {tx.breakfast ? (
                                <div>
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200" title={tx.breakfastMenu}>
                                    <i className="fa-solid fa-utensils mr-1"></i>
                                    {tx.breakfastMenu || 'Pesan Sarapan'}
                                  </span>
                                  <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                                    {tx.breakfastPortions || 1} Porsi × {tx.breakfastDays || tx.duration || 1} Hari ({(tx.breakfastPortions || 1) * (tx.breakfastDays || tx.duration || 1)} Box)
                                  </div>
                                </div>
                              ) : (
                                !tx.extraBed && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500">
                                    <i className="fa-solid fa-minus mr-1"></i> Standar
                                  </span>
                                )
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              tx.status === 'TERISI' 
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                                : tx.status === 'BOOKED'
                                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                : tx.status === 'SELESAI'
                                ? 'bg-slate-100 text-slate-700 border border-slate-300'
                                : 'bg-red-100 text-red-800 border border-red-300'
                            }`}>
                              {tx.status}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center justify-center space-x-1.5">
                              <button
                                type="button"
                                onClick={() => openModal('modalInvoice', { transaction: tx })}
                                className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-lg text-xs border border-slate-300 shadow-2xs flex items-center space-x-1 transition cursor-pointer"
                                title="Lihat Invoice Rincian Booking / Checkin / Checkout (Tanpa Harga)"
                              >
                                <i className="fa-solid fa-file-invoice text-indigo-600"></i>
                                <span>Invoice</span>
                              </button>
                              {(tx.status === 'TERISI' || tx.status === 'BOOKED') && (
                                <button
                                  type="button"
                                  onClick={() => openModal('modalExtend', { transaction: tx })}
                                  className="px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold rounded-lg text-xs border border-teal-200 flex items-center space-x-1 transition cursor-pointer"
                                  title="Perpanjang durasi menginap"
                                >
                                  <i className="fa-solid fa-clock-rotate-left text-teal-600"></i>
                                  <span>Extend</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* BAGIAN 2: TABEL RUANGAN (RUANG PERTEMUAN / AULA) */}
        {/* ========================================================================= */}
        {(activeTab === 'ALL' || activeTab === 'AULA') && (
          <div className="space-y-2 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                <h4 className="font-bold text-slate-800 text-sm">
                  Laporan Penyewaan Ruang Pertemuan (Aula / Auditorium / Gedung SG)
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold">
                  {aulaTransactions.length} Data
                </span>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 uppercase text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">ID Transaksi</th>
                    <th className="p-3">Nama Ruang Pertemuan / Aula</th>
                    <th className="p-3">Penyewa / Instansi</th>
                    <th className="p-3">Tanggal Pemakaian</th>
                    <th className="p-3">Durasi Sewa</th>
                    <th className="p-3">Keterangan / Acara</th>
                    <th className="p-3">Petugas Input</th>
                    <th className="p-3 text-center">Status Booking</th>
                    <th className="p-3 text-center">Aksi Dokumen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {aulaTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-6 text-center text-slate-400 italic">
                        Tidak ada transaksi ruang pertemuan yang sesuai dengan filter.
                      </td>
                    </tr>
                  ) : (
                    aulaTransactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-bold font-mono text-purple-800">{tx.id}</td>
                        <td className="p-3 font-bold text-slate-900">
                          <i className="fa-solid fa-handshake text-purple-600 mr-1.5"></i>
                          {tx.roomNumber}
                        </td>
                        <td className="p-3 font-semibold text-slate-800">
                          {tx.guestName}
                          {tx.phone && <span className="block text-[10px] text-slate-400 font-normal">Telp: {tx.phone}</span>}
                        </td>
                        <td className="p-3 font-medium text-slate-900">{formatIndonesianDate(tx.startDate)}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${tx.duration >= 12 ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-blue-100 text-blue-800 border border-blue-200'}`}>
                            {tx.duration} Jam {tx.duration >= 12 ? '(Full Day)' : '(Setengah Hari)'}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600 max-w-xs truncate" title={tx.notes || '-'}>
                          {tx.notes || '-'}
                        </td>
                        <td className="p-3 text-slate-500 font-medium">{tx.createdUser || 'Resepsionis'}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            tx.status === 'BOOKED' 
                              ? 'bg-purple-100 text-purple-800 border border-purple-300' 
                              : tx.status === 'TERISI'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : tx.status === 'SELESAI'
                              ? 'bg-slate-100 text-slate-700 border border-slate-300'
                              : 'bg-red-100 text-red-800 border border-red-300'
                          }`}>
                            {tx.status === 'BOOKED' ? 'Booked (Terjadwal)' : tx.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              type="button"
                              onClick={() => openModal('modalInvoice', { transaction: tx })}
                              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-lg text-xs border border-slate-300 shadow-2xs flex items-center space-x-1 transition cursor-pointer"
                              title="Lihat Invoice Rincian Sewa Aula (Tanpa Harga)"
                            >
                              <i className="fa-solid fa-file-invoice text-indigo-600"></i>
                              <span>Invoice</span>
                            </button>
                            {(tx.status === 'BOOKED' || tx.status === 'TERISI') && (
                              <button
                                type="button"
                                onClick={() => openModal('modalExtend', { transaction: tx })}
                                className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold rounded-lg text-xs border border-purple-200 flex items-center space-x-1 transition cursor-pointer"
                                title="Perpanjang sesi sewa aula"
                              >
                                <i className="fa-solid fa-clock-rotate-left text-purple-600"></i>
                                <span>Extend</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function MaintenanceReportsView() {
  const { maintenances, finishMaintenance, markMaintenanceRepaired, openModal, rooms, currentUser } = useAppContext();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [urgencyFilter, setUrgencyFilter] = useState('ALL');
  const [facilityFilter, setFacilityFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const isTeknisi = isTeknisiRole(currentUser?.role) || currentUser?.role?.includes('Admin');
  const isManagerTek = isManagerTeknisi(currentUser?.role) || currentUser?.role?.includes('Admin');
  const isQc = isQcRole(currentUser?.role) || currentUser?.role?.includes('Admin');

  const getUrgBadge = (urg: string) => {
    if (urg === 'Urgent') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200 shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-red-600 mr-1.5 animate-pulse"></span>
          Urgent
        </span>
      );
    }
    if (urg === 'Tinggi') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mr-1.5"></span>
          Tinggi
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5"></span>
        {urg || 'Normal'}
      </span>
    );
  };

  const filteredMaintenances = useMemo(() => {
    return maintenances.filter(m => {
      if (statusFilter !== 'ALL' && m.status !== statusFilter) return false;
      if (urgencyFilter !== 'ALL' && m.urgency !== urgencyFilter) return false;
      if (facilityFilter === 'KAMAR' && m.building === 'Ruang Pertemuan') return false;
      if (facilityFilter === 'AULA' && m.building !== 'Ruang Pertemuan') return false;
      if (search) {
        const q = search.toLowerCase();
        const matchRoom = m.roomNumber.toLowerCase().includes(q);
        const matchDesc = m.description.toLowerCase().includes(q);
        const matchTech = m.technician.toLowerCase().includes(q);
        const matchCat = m.category.toLowerCase().includes(q);
        if (!matchRoom && !matchDesc && !matchTech && !matchCat) return false;
      }
      return true;
    });
  }, [maintenances, statusFilter, urgencyFilter, facilityFilter, search]);

  const totalMaint = maintenances.length;
  const waitingAssignmentCount = maintenances.filter(m => m.status === 'MENUNGGU_PENUGASAN').length;
  const inProcessCount = maintenances.filter(m => m.status === 'PROSES').length;
  const waitingQcCount = maintenances.filter(m => m.status === 'MENUNGGU_QC').length;
  const finishedCount = maintenances.filter(m => m.status === 'SELESAI').length;

  return (
    <div className="space-y-4">
      {/* 4 Step Alur Maintenance Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl shadow-xs border border-amber-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-800">1. Butuh Penugasan</span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-xs">
              <i className="fa-solid fa-user-plus"></i>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-amber-900">{waitingAssignmentCount}</span>
            <p className="text-[10px] text-amber-700 mt-0.5">Menunggu respon Manager</p>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl shadow-xs border border-blue-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-800">2. Sedang Dikerjakan</span>
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs">
              <i className="fa-solid fa-screwdriver-wrench"></i>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-blue-900">{inProcessCount}</span>
            <p className="text-[10px] text-blue-700 mt-0.5">Penanganan teknisi di lokasi</p>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl shadow-xs border border-amber-300 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-hajj-900">3. Menunggu Cek QC</span>
            <div className="w-7 h-7 rounded-lg bg-gold-100 text-hajj-800 flex items-center justify-center text-xs">
              <i className="fa-solid fa-clipboard-check"></i>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-hajj-900">{waitingQcCount}</span>
            <p className="text-[10px] text-hajj-700 mt-0.5">Selesai diperbaiki, siap inspeksi</p>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl shadow-xs border border-emerald-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800">4. Selesai Tuntas</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">
              <i className="fa-solid fa-circle-check"></i>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-emerald-900">{finishedCount}</span>
            <p className="text-[10px] text-emerald-700 mt-0.5">Lolos standar QC UPT</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center">
              <i className="fa-solid fa-screwdriver-wrench text-amber-600 mr-2"></i>
              Laporan Perawatan & Maintenance Fasilitas
            </h3>
            <p className="text-xs text-slate-500">Rekapitulasi kerusakan, alur penugasan teknisi, pelaporan perbaikan fisik, dan pengesahan inspeksi QC.</p>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => openModal('modalMaintenance', { roomId: rooms[0]?.id })} 
              className="px-3 py-2 bg-hajj-700 hover:bg-hajj-800 text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
            >
              <i className="fa-solid fa-plus-circle"></i>
              <span>Lapor Kerusakan Baru</span>
            </button>
            <button 
              onClick={() => openModal('modalExport', { defaultType: 'MAINTENANCE' })} 
              className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
              title="Unduh Laporan Pemeliharaan Gedung (PDF / Excel .xlsx)"
            >
              <i className="fa-solid fa-file-arrow-down"></i>
              <span>Unduh Laporan Maintenance</span>
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="flex flex-wrap items-center gap-2">
            {/* Fasilitas */}
            <select
              value={facilityFilter}
              onChange={(e) => setFacilityFilter(e.target.value)}
              aria-label="Filter fasilitas gedung"
              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-hajj-700 focus:outline-none"
            >
              <option value="ALL">Semua Fasilitas</option>
              <option value="KAMAR">Gedung (Kamar Hunian)</option>
              <option value="AULA">Ruang Pertemuan (Aula / Rapat)</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter status perbaikan"
              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-hajj-700 focus:outline-none"
            >
              <option value="ALL">Semua Status Alur</option>
              <option value="MENUNGGU_PENUGASAN">1. Menunggu Penugasan</option>
              <option value="PROSES">2. Sedang Dikerjakan</option>
              <option value="MENUNGGU_QC">3. Menunggu Cek QC</option>
              <option value="SELESAI">4. Lolos QC & Selesai</option>
            </select>

            {/* Urgensi Filter */}
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              aria-label="Filter tingkat urgensi"
              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-hajj-700 focus:outline-none"
            >
              <option value="ALL">Semua Tingkat Urgensi</option>
              <option value="Urgent">Urgent</option>
              <option value="Tinggi">Tinggi</option>
              <option value="Normal">Normal</option>
            </select>
          </div>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Cari kamar, teknisi, kerusakan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-hajj-700 focus:outline-none w-48 sm:w-60"
            />
            <i className="fa-solid fa-magnifying-glass absolute left-2.5 top-2.5 text-slate-400 text-xs"></i>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 uppercase text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3 text-center whitespace-nowrap w-28">Waktu Lapor</th>
                <th className="p-3 whitespace-nowrap w-36">Fasilitas / Lokasi</th>
                <th className="p-3 text-center whitespace-nowrap w-32">Kategori</th>
                <th className="p-3 text-center whitespace-nowrap w-28">Urgensi</th>
                <th className="p-3 min-w-[220px]">Deskripsi & Catatan</th>
                <th className="p-3 whitespace-nowrap w-36">Teknisi PJ</th>
                <th className="p-3 whitespace-nowrap w-28">Pelapor</th>
                <th className="p-3 text-center whitespace-nowrap w-40">Status Alur</th>
                <th className="p-3 text-center whitespace-nowrap min-w-[150px]">Tindakan Alur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredMaintenances.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 italic">
                    Tidak ada data perbaikan yang cocok dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredMaintenances.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono text-[11px] text-slate-600 text-center whitespace-nowrap">{m.reportTime}</td>
                    <td className="p-3 font-bold text-slate-800 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <i className={`fa-solid ${m.building === 'Ruang Pertemuan' ? 'fa-landmark text-purple-700' : 'fa-bed text-slate-500'} text-xs`}></i>
                        <span>{m.roomNumber}</span>
                      </div>
                      <span className="block text-[10px] font-normal text-slate-400 mt-0.5">{m.building}</span>
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-900 font-semibold text-[10px]">
                        {m.category}
                      </span>
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">{getUrgBadge(m.urgency)}</td>
                    <td className="p-3 text-slate-700 max-w-xs">
                      <p className="font-semibold text-slate-900 leading-snug" title={m.description}>{m.description}</p>
                      {m.managerNotes && (
                        <div className="text-[10px] text-amber-900 font-medium bg-amber-50/90 p-1.5 rounded-md mt-1 border border-amber-200 flex items-start space-x-1">
                          <i className="fa-solid fa-clipboard-user text-amber-600 mt-0.5 shrink-0"></i>
                          <span><strong>Manager:</strong> {m.managerNotes}</span>
                        </div>
                      )}
                      {m.technicianNotes && (
                        <div className="text-[10px] text-blue-900 font-medium bg-blue-50/90 p-1.5 rounded-md mt-1 border border-blue-200 flex items-start space-x-1">
                          <i className="fa-solid fa-wrench text-blue-600 mt-0.5 shrink-0"></i>
                          <span><strong>Teknisi:</strong> {m.technicianNotes}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-3 font-medium text-slate-800 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-600 shrink-0">
                          <i className="fa-solid fa-user-gear"></i>
                        </div>
                        <span className="font-semibold text-slate-800 text-xs">{m.technician}</span>
                      </div>
                      {m.assignedBy && (
                        <span className="block text-[9px] text-slate-400 mt-0.5">Oleh: {m.assignedBy}</span>
                      )}
                    </td>
                    <td className="p-3 text-slate-600 whitespace-nowrap text-xs">{m.reportedUser || 'Petugas'}</td>
                    <td className="p-3 text-center whitespace-nowrap">
                      {m.status === 'MENUNGGU_PENUGASAN' && (
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-300 inline-flex items-center shadow-2xs">
                          <i className="fa-solid fa-clock mr-1.5 text-amber-600"></i> 1. Butuh Penugasan
                        </span>
                      )}
                      {m.status === 'PROSES' && (
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 text-blue-900 border border-blue-300 inline-flex items-center shadow-2xs">
                          <i className="fa-solid fa-screwdriver-wrench mr-1.5 text-blue-600"></i> 2. Sedang Dikerjakan
                        </span>
                      )}
                      {m.status === 'MENUNGGU_QC' && (
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-purple-50 text-purple-900 border border-purple-300 inline-flex items-center shadow-2xs">
                          <i className="fa-solid fa-clipboard-check mr-1.5 text-purple-700"></i> 3. Menunggu Cek QC
                        </span>
                      )}
                      {m.status === 'SELESAI' && (
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-900 border border-emerald-300 inline-flex items-center shadow-2xs">
                          <i className="fa-solid fa-circle-check mr-1.5 text-emerald-600"></i> 4. Selesai (Lolos QC)
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {m.status === 'MENUNGGU_PENUGASAN' && (
                        <div className="flex items-center justify-center gap-1.5">
                          {isManagerTek ? (
                            <button 
                              type="button"
                              onClick={() => openModal('modalAssignTechnician', { maintenance: m })} 
                              className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center space-x-1 cursor-pointer"
                              title="Tugaskan Teknisi Pelaksana"
                            >
                              <i className="fa-solid fa-user-plus text-[10px]"></i>
                              <span>Tugaskan</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-1 rounded border border-amber-200">
                              Tunggu Manager
                            </span>
                          )}
                          <button 
                            type="button"
                            onClick={() => openModal('modalRoomDetail', { roomId: m.roomId })}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs transition cursor-pointer"
                            title="Lihat Rincian Fasilitas"
                          >
                            <i className="fa-solid fa-eye text-[11px]"></i>
                          </button>
                        </div>
                      )}

                      {m.status === 'PROSES' && (
                        <div className="flex items-center justify-center gap-1.5">
                          {isTeknisi ? (
                            <>
                              <button 
                                type="button"
                                onClick={() => openModal('modalUpdateMaintenance', { maintenance: m })} 
                                className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold rounded-lg text-xs border border-blue-200 flex items-center space-x-1 transition cursor-pointer"
                                title="Update Catatan & Suku Cadang"
                              >
                                <i className="fa-solid fa-pen-to-square text-[10px]"></i>
                                <span>Update</span>
                              </button>
                              <button 
                                type="button"
                                onClick={() => markMaintenanceRepaired(m.id, 'Pekerjaan perbaikan fisik fasilitas telah diselesaikan dan diverifikasi. Menunggu inspeksi pengesahan QC.')} 
                                className="px-2.5 py-1.5 bg-hajj-700 hover:bg-hajj-800 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center space-x-1 cursor-pointer"
                                title="Tandai telah selesai diperbaiki & teruskan ke Tim QC"
                              >
                                <i className="fa-solid fa-paper-plane text-[10px]"></i>
                                <span>Kirim QC</span>
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] text-blue-700 font-semibold bg-blue-50 px-2 py-1 rounded border border-blue-200">
                              Dalam Proses
                            </span>
                          )}
                          <button 
                            type="button"
                            onClick={() => openModal('modalRoomDetail', { roomId: m.roomId })}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs transition cursor-pointer"
                            title="Lihat Rincian Fasilitas"
                          >
                            <i className="fa-solid fa-eye text-[11px]"></i>
                          </button>
                        </div>
                      )}

                      {m.status === 'MENUNGGU_QC' && (
                        <div className="flex items-center justify-center gap-1.5">
                          {isQc ? (
                            <button 
                              type="button"
                              onClick={() => openModal('modalQcInspection', { room: rooms.find(r => r.id === m.roomId) })} 
                              className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                              title="Lakukan Inspeksi QC untuk Mengesahkan Kelayakan"
                            >
                              <i className="fa-solid fa-clipboard-check text-[10px]"></i>
                              <span>Inspeksi QC</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-purple-700 font-semibold bg-purple-50 px-2 py-1 rounded border border-purple-200">
                              Menunggu QC
                            </span>
                          )}
                          <button 
                            type="button"
                            onClick={() => openModal('modalRoomDetail', { roomId: m.roomId })}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs transition cursor-pointer"
                            title="Lihat Rincian Fasilitas"
                          >
                            <i className="fa-solid fa-eye text-[11px]"></i>
                          </button>
                        </div>
                      )}

                      {m.status === 'SELESAI' && (
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="px-2 py-1 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded border border-emerald-200 flex items-center space-x-1">
                            <i className="fa-solid fa-check text-emerald-600 text-[10px]"></i>
                            <span>Lolos QC</span>
                          </span>
                          <button 
                            type="button"
                            onClick={() => openModal('modalUpdateMaintenance', { maintenance: m })} 
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs flex items-center space-x-1 transition cursor-pointer"
                            title="Lihat Detail Riwayat Perbaikan"
                          >
                            <i className="fa-solid fa-file-lines text-[10px]"></i>
                            <span>Riwayat</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function BreakfastOrdersView() {
  const { transactions, openModal, currentUser, updateBreakfastStatus } = useAppContext();
  const [filterMode, setFilterMode] = useState<'ALL' | 'PESAN' | 'MENUNGGU' | 'SEDANG_DIBUAT' | 'PENGANTARAN' | 'SELESAI' | 'TIDAK'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'CHECKIN_FIRST' | 'CHECKIN_ONLY' | 'BOOKED_ONLY' | 'ALL'>('CHECKIN_FIRST');
  const [buildingFilter, setBuildingFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  // Only consider active room guests (Gedung A, B, C, D) with TERISI or BOOKED status
  // STRICT LOGIC: Prioritize guests whose room status is already checked-in (TERISI)
  const kamarGuests = useMemo(() => {
    const raw = transactions.filter(tx => 
      tx.building !== 'Ruang Pertemuan' && (tx.status === 'TERISI' || tx.status === 'BOOKED')
    );
    
    // Sort logic: TERISI (sudah check-in) MUST come first!
    return [...raw].sort((a, b) => {
      // 1. Primary rule: TERISI (sudah check-in) > BOOKED (belum check-in)
      if (a.status === 'TERISI' && b.status !== 'TERISI') return -1;
      if (a.status !== 'TERISI' && b.status === 'TERISI') return 1;
      // 2. Secondary rule: Pesan Sarapan > Tidak Pesan Sarapan
      if (a.breakfast && !b.breakfast) return -1;
      if (!a.breakfast && b.breakfast) return 1;
      return 0;
    });
  }, [transactions]);

  // Calculations for metrics
  const pesanGuests = kamarGuests.filter(tx => !!tx.breakfast);
  const totalPortionsPerDay = pesanGuests.reduce((acc, curr) => acc + (curr.breakfastPortions || 1), 0);
  const totalBoxesTotal = pesanGuests.reduce((acc, curr) => acc + ((curr.breakfastPortions || 1) * (curr.breakfastDays || curr.duration || 1)), 0);
  
  // Check-in priority breakdown
  const checkedInOrdersCount = pesanGuests.filter(tx => tx.status === 'TERISI').length;
  const checkedInPortions = pesanGuests.filter(tx => tx.status === 'TERISI').reduce((acc, curr) => acc + (curr.breakfastPortions || 1), 0);
  const bookedOrdersCount = pesanGuests.filter(tx => tx.status === 'BOOKED').length;
  const bookedPortions = pesanGuests.filter(tx => tx.status === 'BOOKED').reduce((acc, curr) => acc + (curr.breakfastPortions || 1), 0);

  const menungguCount = pesanGuests.filter(tx => (tx.breakfastStatus || 'MENUNGGU') === 'MENUNGGU').length;
  const sedangDibuatCount = pesanGuests.filter(tx => tx.breakfastStatus === 'SEDANG_DIBUAT').length;
  const pengantaranCount = pesanGuests.filter(tx => tx.breakfastStatus === 'PENGANTARAN').length;
  const selesaiCount = pesanGuests.filter(tx => tx.breakfastStatus === 'SELESAI').length;
  const tidakPesanCount = kamarGuests.filter(tx => !tx.breakfast).length;

  // Apply filters
  const filteredOrders = useMemo(() => {
    return kamarGuests.filter(tx => {
      const hasBreakfast = !!tx.breakfast;
      const bStatus = tx.breakfastStatus || 'MENUNGGU';

      if (buildingFilter !== 'ALL' && tx.building !== buildingFilter) return false;

      // Priority Filter
      if (priorityFilter === 'CHECKIN_ONLY' && tx.status !== 'TERISI') return false;
      if (priorityFilter === 'BOOKED_ONLY' && tx.status !== 'BOOKED') return false;

      if (filterMode === 'PESAN' && !hasBreakfast) return false;
      if (filterMode === 'TIDAK' && hasBreakfast) return false;
      if (filterMode === 'MENUNGGU' && (!hasBreakfast || bStatus !== 'MENUNGGU')) return false;
      if (filterMode === 'SEDANG_DIBUAT' && (!hasBreakfast || bStatus !== 'SEDANG_DIBUAT')) return false;
      if (filterMode === 'PENGANTARAN' && (!hasBreakfast || bStatus !== 'PENGANTARAN')) return false;
      if (filterMode === 'SELESAI' && (!hasBreakfast || bStatus !== 'SELESAI')) return false;

      if (search) {
        const q = search.toLowerCase();
        const matchName = tx.guestName.toLowerCase().includes(q);
        const matchRoom = tx.roomNumber.toLowerCase().includes(q);
        const matchMenu = (tx.breakfastMenu || '').toLowerCase().includes(q);
        const matchKloter = (tx.kloter || '').toLowerCase().includes(q);
        if (!matchName && !matchRoom && !matchMenu && !matchKloter) return false;
      }
      return true;
    });
  }, [kamarGuests, filterMode, priorityFilter, buildingFilter, search]);

  const canManageStatus = isKoperasiRole(currentUser?.role);

  return (
    <div className="space-y-6">
      {/* Metric Cards with Priority Indicator */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <div className="bg-white p-3.5 rounded-xl shadow-sm border border-slate-200">
          <p className="text-[11px] font-semibold text-slate-500 uppercase">Tamu Kamar</p>
          <p className="text-xl font-bold text-slate-800">{kamarGuests.length}</p>
          <span className="text-[10px] text-slate-400">Terisi + Booked</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl shadow-sm border border-emerald-300 bg-emerald-50/40 ring-2 ring-emerald-500/20">
          <p className="text-[11px] font-extrabold text-emerald-800 uppercase flex items-center">
            <i className="fa-solid fa-star text-amber-500 mr-1 text-[10px]"></i>
            Prioritas: Check-In
          </p>
          <p className="text-xl font-black text-emerald-700">{checkedInOrdersCount} <span className="text-xs font-semibold text-emerald-600">({checkedInPortions} porsi)</span></p>
          <span className="text-[10px] text-emerald-700 font-bold">Wajib diutamakan dapur</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl shadow-sm border border-orange-200 bg-orange-50/30">
          <p className="text-[11px] font-semibold text-orange-700 uppercase">Total Pesan</p>
          <p className="text-xl font-bold text-orange-700">{pesanGuests.length} <span className="text-xs font-normal text-orange-600">({totalPortionsPerDay} porsi)</span></p>
          <span className="text-[10px] text-orange-600 font-medium">{bookedOrdersCount} standby booked</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl shadow-sm border border-amber-200">
          <p className="text-[11px] font-semibold text-amber-700 uppercase">1. Menunggu</p>
          <p className="text-xl font-bold text-amber-700">{menungguCount}</p>
          <span className="text-[10px] text-amber-600">Antrean dapur</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl shadow-sm border border-blue-200">
          <p className="text-[11px] font-semibold text-blue-700 uppercase">2. Dimasak</p>
          <p className="text-xl font-bold text-blue-700">{sedangDibuatCount}</p>
          <span className="text-[10px] text-blue-600">Proses produksi</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl shadow-sm border border-purple-200">
          <p className="text-[11px] font-semibold text-purple-700 uppercase">3. Pengantaran</p>
          <p className="text-xl font-bold text-purple-700">{pengantaranCount}</p>
          <span className="text-[10px] text-purple-600">Menuju kamar</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl shadow-sm border border-emerald-200">
          <p className="text-[11px] font-semibold text-emerald-700 uppercase">4. Selesai</p>
          <p className="text-xl font-bold text-emerald-700">{selesaiCount}</p>
          <span className="text-[10px] text-emerald-600">Sampai di kamar</span>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
        <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-slate-800 flex items-center">
                <i className="fa-solid fa-utensils text-orange-600 mr-2"></i>
                Manajemen Pesanan Sarapan Koperasi & Antrean Dapur
              </h3>
              {currentUser?.role === 'Koperasi' && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-600 text-white uppercase tracking-wider">
                  Akun Koperasi
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              <strong>Aturan Prioritas Dapur:</strong> Tamu dengan status kamar <strong>Sudah Check-In (Terisi)</strong> secara otomatis diposisikan di baris paling atas untuk diutamakan dalam pembuatan menu dan distribusi pengantaran ke kamar.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => openModal('modalExport', { 
                defaultType: 'SARAPAN',
                defaultBuilding: buildingFilter,
                defaultBreakfastPriority: priorityFilter === 'CHECKIN_ONLY' ? 'CHECKIN_ONLY' : priorityFilter === 'BOOKED_ONLY' ? 'BOOKED_ONLY' : 'ALL',
                defaultFormat: 'PDF'
              })} 
              className="px-3 py-2 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-lg shadow transition flex items-center space-x-1.5 cursor-pointer"
              title="Unduh / Cetak Rekap Pesanan Sarapan Format PDF Resmi (Kop Kementerian Haji dan Umrah RI)"
            >
              <i className="fa-solid fa-file-pdf"></i>
              <span>PDF Sarapan</span>
            </button>
            <button 
              onClick={() => openModal('modalExport', { 
                defaultType: 'SARAPAN',
                defaultBuilding: buildingFilter,
                defaultBreakfastPriority: priorityFilter === 'CHECKIN_ONLY' ? 'CHECKIN_ONLY' : priorityFilter === 'BOOKED_ONLY' ? 'BOOKED_ONLY' : 'ALL',
                defaultFormat: 'XLSX'
              })} 
              className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow transition flex items-center space-x-1.5 cursor-pointer"
              title="Unduh Rekap Pesanan Sarapan Format Excel (.xlsx)"
            >
              <i className="fa-solid fa-file-excel"></i>
              <span>Excel (.xlsx)</span>
            </button>
            <button 
              onClick={() => openModal('modalExport', { 
                defaultType: 'SARAPAN',
                defaultBuilding: buildingFilter,
                defaultBreakfastPriority: priorityFilter === 'CHECKIN_ONLY' ? 'CHECKIN_ONLY' : priorityFilter === 'BOOKED_ONLY' ? 'BOOKED_ONLY' : 'ALL'
              })} 
              className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg shadow transition flex items-center space-x-1.5 cursor-pointer"
              title="Kustomisasi Filter Laporan Sarapan"
            >
              <i className="fa-solid fa-sliders"></i>
              <span>Opsi Lengkap</span>
            </button>
          </div>
        </div>

        {/* Priority Quick Selector Bar */}
        <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
              <i className="fa-solid fa-arrow-down-short-wide"></i>
            </span>
            <span className="font-bold text-emerald-950">Filter Prioritas Antrean Kamar:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setPriorityFilter('CHECKIN_FIRST')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${priorityFilter === 'CHECKIN_FIRST' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-100/50'}`}
              title="Urutkan pesanan tamu yang sudah check-in di paling atas"
            >
              <i className="fa-solid fa-star text-amber-400"></i>
              <span>Dahulukan Sudah Check-In ({checkedInOrdersCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setPriorityFilter('CHECKIN_ONLY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${priorityFilter === 'CHECKIN_ONLY' ? 'bg-emerald-700 text-white shadow-xs' : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'}`}
              title="Hanya tampilkan tamu yang kamarnya sudah check-in"
            >
              <i className="fa-solid fa-door-open text-emerald-600"></i>
              <span>Hanya Sudah Check-In</span>
            </button>
            <button
              type="button"
              onClick={() => setPriorityFilter('BOOKED_ONLY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${priorityFilter === 'BOOKED_ONLY' ? 'bg-amber-600 text-white shadow-xs' : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'}`}
              title="Hanya tampilkan pesanan yang masih status reservasi (belum check-in)"
            >
              <i className="fa-regular fa-clock text-amber-600"></i>
              <span>Standby (Booking Saja)</span>
            </button>
            <button
              type="button"
              onClick={() => setPriorityFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${priorityFilter === 'ALL' ? 'bg-slate-800 text-white shadow-xs' : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'}`}
            >
              Semua Tamu
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-xs text-xs font-semibold">
            <button
              type="button"
              onClick={() => setFilterMode('ALL')}
              className={`px-2.5 py-1.5 rounded-md transition ${filterMode === 'ALL' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Semua ({kamarGuests.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('PESAN')}
              className={`px-2.5 py-1.5 rounded-md transition flex items-center space-x-1 ${filterMode === 'PESAN' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <i className="fa-solid fa-bowl-rice text-[10px]"></i>
              <span>Semua Pesan ({pesanGuests.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('MENUNGGU')}
              className={`px-2.5 py-1.5 rounded-md transition flex items-center space-x-1 ${filterMode === 'MENUNGGU' ? 'bg-amber-600 text-white shadow-xs' : 'text-amber-800 hover:bg-amber-50'}`}
            >
              <span>Menunggu ({menungguCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('SEDANG_DIBUAT')}
              className={`px-2.5 py-1.5 rounded-md transition flex items-center space-x-1 ${filterMode === 'SEDANG_DIBUAT' ? 'bg-blue-600 text-white shadow-xs' : 'text-blue-800 hover:bg-blue-50'}`}
            >
              <i className="fa-solid fa-fire text-[10px]"></i>
              <span>Sedang Dibuat ({sedangDibuatCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('PENGANTARAN')}
              className={`px-2.5 py-1.5 rounded-md transition flex items-center space-x-1 ${filterMode === 'PENGANTARAN' ? 'bg-purple-600 text-white shadow-xs' : 'text-purple-800 hover:bg-purple-50'}`}
            >
              <i className="fa-solid fa-truck-ramp-box text-[10px]"></i>
              <span>Pengantaran ({pengantaranCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('SELESAI')}
              className={`px-2.5 py-1.5 rounded-md transition flex items-center space-x-1 ${filterMode === 'SELESAI' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-800 hover:bg-emerald-50'}`}
            >
              <i className="fa-solid fa-circle-check text-[10px]"></i>
              <span>Selesai ({selesaiCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('TIDAK')}
              className={`px-2.5 py-1.5 rounded-md transition flex items-center space-x-1 ${filterMode === 'TIDAK' ? 'bg-slate-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <i className="fa-solid fa-ban text-[10px]"></i>
              <span>Tidak Pesan ({tidakPesanCount})</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Gedung */}
            <select
              value={buildingFilter}
              onChange={e => setBuildingFilter(e.target.value)}
              className="py-1.5 px-3 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-orange-500 focus:outline-none"
            >
              <option value="ALL">Semua Gedung</option>
              <option value="Gedung A (Arafah)">Gedung A (Arafah)</option>
              <option value="Gedung B (Muzdalifah)">Gedung B (Muzdalifah)</option>
              <option value="Gedung C (Mina)">Gedung C (Mina)</option>
              <option value="Gedung D (Madinah)">Gedung D (Madinah)</option>
            </select>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Cari tamu, kamar, kloter..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none w-44 sm:w-56"
              />
              <i className="fa-solid fa-magnifying-glass absolute left-2.5 top-2.5 text-slate-400 text-xs"></i>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 uppercase text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">Gedung & Kamar</th>
                <th className="p-3">Nama Tamu / Jemaah</th>
                <th className="p-3">Tanggal & Durasi</th>
                <th className="p-3">Menu & Porsi Pesanan</th>
                <th className="p-3 text-center">Status Produksi</th>
                <th className="p-3 text-center">Update Status Koperasi</th>
                <th className="p-3 text-center">Prioritas & Status Kamar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                    Tidak ada data pesanan sarapan yang cocok dengan filter saat ini.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const checkoutDate = addDaysToDateStr(order.startDate, order.duration);
                  const portions = order.breakfastPortions || 1;
                  const days = order.breakfastDays || order.duration || 1;
                  const totalBoxes = portions * days;
                  const bStatus = order.breakfastStatus || 'MENUNGGU';
                  const isCheckedIn = order.status === 'TERISI';

                  return (
                    <tr key={order.id} className={`transition ${isCheckedIn ? 'bg-emerald-50/20 hover:bg-emerald-50/40 border-l-4 border-l-emerald-500' : 'hover:bg-slate-50'}`}>
                      <td className="p-3">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-slate-900 text-sm">{order.roomNumber}</span>
                          {isCheckedIn && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" title="Tamu sudah berada di kamar (Checked-In)"></span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 font-semibold">{order.building}</span>
                        <div className="text-[9px] font-mono text-slate-400 mt-0.5">#{order.id}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{order.guestName}</div>
                        {order.kloter && order.kloter !== '-' ? (
                          <div className="text-[11px] text-blue-700 font-semibold mt-0.5">
                            <i className="fa-solid fa-kaaba mr-1 text-slate-400"></i> Kloter: {order.kloter}
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400">Tamu Umum</div>
                        )}
                        {order.phone && <div className="text-[10px] text-slate-400"><i className="fa-solid fa-phone mr-1"></i>{order.phone}</div>}
                      </td>
                      <td className="p-3 font-medium">
                        <div>{formatIndonesianDate(order.startDate)}</div>
                        <div className="text-[10px] text-slate-400">s/d {formatIndonesianDate(checkoutDate)}</div>
                        <span className="inline-block mt-0.5 px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">
                          {order.duration} {order.durationUnit || 'Malam'}
                        </span>
                      </td>
                      <td className="p-3">
                        {order.breakfast ? (
                          <div className="space-y-1">
                            <div className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-orange-100 text-orange-900 border border-orange-200">
                              <i className="fa-solid fa-bowl-rice mr-1.5 text-orange-600"></i>
                              {order.breakfastMenu || 'Nasi Goreng Spesial'}
                            </div>
                            <div className="text-[11px] text-slate-700 font-semibold">
                              <span className="text-orange-700 font-bold">{portions} Porsi / Hari</span> × <span>{days} Hari</span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium">
                              Total Sajian: <strong className="text-slate-900">{totalBoxes} Porsi/Box</strong>
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200 italic">
                            <i className="fa-solid fa-ban mr-1.5 text-slate-400"></i>
                            Tidak Pesan Sarapan
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {order.breakfast ? (
                          bStatus === 'MENUNGGU' ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              <span className="w-2 h-2 rounded-full bg-amber-500 mr-1.5 animate-pulse"></span>
                              Menunggu Antrean
                            </span>
                          ) : bStatus === 'SEDANG_DIBUAT' ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
                              <i className="fa-solid fa-fire mr-1.5 text-blue-600"></i>
                              Sedang Dibuat
                            </span>
                          ) : bStatus === 'PENGANTARAN' ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">
                              <i className="fa-solid fa-truck-ramp-box mr-1.5 text-purple-600"></i>
                              Pengantaran
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <i className="fa-solid fa-circle-check mr-1.5 text-emerald-600"></i>
                              Selesai Diantar
                            </span>
                          )
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {order.breakfast ? (
                          canManageStatus ? (
                            <div className="flex flex-col items-center space-y-1.5">
                              {/* Direct Button System (No Dropdown) */}
                              <div className="grid grid-cols-2 gap-1 w-36">
                                <button
                                  type="button"
                                  onClick={() => updateBreakfastStatus(order.id, 'MENUNGGU')}
                                  className={`py-1 px-1.5 rounded-md text-[10px] font-bold transition flex items-center justify-center space-x-1 cursor-pointer ${
                                    bStatus === 'MENUNGGU'
                                      ? 'bg-amber-500 text-white shadow-xs'
                                      : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-900 border border-slate-200'
                                  }`}
                                  title="Set status: Menunggu Antrean"
                                >
                                  <i className="fa-solid fa-clock text-[9px]"></i>
                                  <span>Menunggu</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateBreakfastStatus(order.id, 'SEDANG_DIBUAT')}
                                  className={`py-1 px-1.5 rounded-md text-[10px] font-bold transition flex items-center justify-center space-x-1 cursor-pointer ${
                                    bStatus === 'SEDANG_DIBUAT'
                                      ? 'bg-blue-600 text-white shadow-xs'
                                      : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-900 border border-slate-200'
                                  }`}
                                  title="Set status: Sedang Dimasak / Dibuat di Dapur"
                                >
                                  <i className="fa-solid fa-fire text-[9px]"></i>
                                  <span>Dibuat</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateBreakfastStatus(order.id, 'PENGANTARAN')}
                                  className={`py-1 px-1.5 rounded-md text-[10px] font-bold transition flex items-center justify-center space-x-1 cursor-pointer ${
                                    bStatus === 'PENGANTARAN'
                                      ? 'bg-hajj-700 text-white shadow-xs'
                                      : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-hajj-900 border border-slate-200'
                                  }`}
                                  title="Set status: Sedang Diantar ke Kamar"
                                >
                                  <i className="fa-solid fa-truck-ramp-box text-[9px]"></i>
                                  <span>Diantar</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateBreakfastStatus(order.id, 'SELESAI')}
                                  className={`py-1 px-1.5 rounded-md text-[10px] font-bold transition flex items-center justify-center space-x-1 cursor-pointer ${
                                    bStatus === 'SELESAI'
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-900 border border-slate-200'
                                  }`}
                                  title="Set status: Selesai Diantar & Diterima"
                                >
                                  <i className="fa-solid fa-circle-check text-[9px]"></i>
                                  <span>Selesai</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Hanya Koperasi</span>
                          )
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {order.status === 'TERISI' ? (
                          <div className="flex flex-col items-center space-y-1">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white shadow-xs inline-flex items-center space-x-1">
                              <i className="fa-solid fa-star text-amber-300 text-[9px]"></i>
                              <span>PRIORITAS #1</span>
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <i className="fa-solid fa-door-open mr-1"></i> Sudah Check-In
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center space-y-1">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200 inline-flex items-center">
                              Standby
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              <i className="fa-regular fa-clock mr-1 text-blue-500"></i> Booked
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function AuditLogView() {
  const { auditLogs = [], workSessions = [], currentUser, showToast, openModal } = useAppContext();
  const safeWorkSessions = workSessions || [];

  // State for live ticker
  const [ticker, setTicker] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setTicker(t => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter States
  const [selectedUser, setSelectedUser] = useState<string>('SEMUA');
  const [selectedRole, setSelectedRole] = useState<string>('SEMUA');
  const [sessionStatus, setSessionStatus] = useState<string>('SEMUA');
  const [datePreset, setDatePreset] = useState<'SEMUA' | 'HARI_INI' | 'KEMARIN' | '3_HARI' | '7_HARI' | 'KUSTOM'>('SEMUA');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Tab within this view: 'WORK_SESSIONS' | 'AUDIT_TRAIL'
  const [activeSubView, setActiveSubView] = useState<'WORK_SESSIONS' | 'AUDIT_TRAIL'>('WORK_SESSIONS');
  
  // Audit Trail Filters
  const [auditActionFilter, setAuditActionFilter] = useState<string>('SEMUA');
  const [auditSearch, setAuditSearch] = useState<string>('');

  const realToday = getRealTodayDate();
  const realYesterday = addDaysToDateStr(realToday, -1);
  const dateMinus3 = addDaysToDateStr(realToday, -3);
  const dateMinus7 = addDaysToDateStr(realToday, -7);

  // Unique users and roles for filter dropdowns
  const uniqueUsers = useMemo(() => {
    const names = new Set<string>();
    safeWorkSessions.forEach(s => names.add(s.userName));
    return Array.from(names);
  }, [safeWorkSessions]);

  const uniqueRoles = useMemo(() => {
    const roles = new Set<string>();
    safeWorkSessions.forEach(s => roles.add(s.userRole));
    return Array.from(roles);
  }, [safeWorkSessions]);

  // Compute live duration for active sessions
  const sessionsWithLiveDuration = useMemo(() => {
    return safeWorkSessions.map(session => {
      if (session.status === 'AKTIF') {
        const loginDate = new Date(session.loginTime.replace(' ', 'T'));
        const now = new Date();
        const diffSeconds = Math.max(0, Math.floor((now.getTime() - loginDate.getTime()) / 1000));
        return {
          ...session,
          durationSeconds: diffSeconds,
          durationFormatted: `${formatHMS(diffSeconds)} (Sedang Berjalan)`
        };
      }
      return session;
    });
  }, [safeWorkSessions, ticker]);

  // Filtered Sessions
  const filteredSessions = useMemo(() => {
    return sessionsWithLiveDuration.filter(session => {
      // User filter
      if (selectedUser !== 'SEMUA' && session.userName !== selectedUser) {
        return false;
      }

      // Role filter
      if (selectedRole !== 'SEMUA' && session.userRole !== selectedRole) {
        return false;
      }

      // Status filter
      if (sessionStatus !== 'SEMUA' && session.status !== sessionStatus) {
        return false;
      }

      // Date Presets
      const sessionDate = session.loginTime.split(' ')[0];
      if (datePreset === 'HARI_INI' && sessionDate !== realToday) {
        return false;
      }
      if (datePreset === 'KEMARIN' && sessionDate !== realYesterday) {
        return false;
      }
      if (datePreset === '3_HARI' && sessionDate < dateMinus3) {
        return false;
      }
      if (datePreset === '7_HARI' && sessionDate < dateMinus7) {
        return false;
      }
      if (datePreset === 'KUSTOM') {
        if (customStartDate && sessionDate < customStartDate) return false;
        if (customEndDate && sessionDate > customEndDate) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = session.id.toLowerCase().includes(q);
        const matchName = session.userName.toLowerCase().includes(q);
        const matchRole = session.userRole.toLowerCase().includes(q);
        const matchNotes = (session.notes || '').toLowerCase().includes(q);
        if (!matchId && !matchName && !matchRole && !matchNotes) {
          return false;
        }
      }

      return true;
    });
  }, [sessionsWithLiveDuration, selectedUser, selectedRole, sessionStatus, datePreset, customStartDate, customEndDate, searchQuery, realToday, realYesterday, dateMinus3, dateMinus7]);

  // Aggregate statistics for filtered sessions
  const totalFilteredSeconds = useMemo(() => {
    return filteredSessions.reduce((acc, s) => acc + s.durationSeconds, 0);
  }, [filteredSessions]);

  const activeOfficersCount = useMemo(() => {
    return safeWorkSessions.filter(s => s.status === 'AKTIF').length;
  }, [safeWorkSessions]);

  const averageDurationSeconds = useMemo(() => {
    if (filteredSessions.length === 0) return 0;
    return Math.floor(totalFilteredSeconds / filteredSessions.length);
  }, [totalFilteredSeconds, filteredSessions.length]);

  // View mode for work records: 'REKAP_HARIAN' (Akumulasi harian) or 'RINCIAN_SESI' (Per sesi individual)
  const [recordViewMode, setRecordViewMode] = useState<'REKAP_HARIAN' | 'RINCIAN_SESI'>('REKAP_HARIAN');
  const [expandedDateRows, setExpandedDateRows] = useState<Record<string, boolean>>({});

  const toggleExpandDateRow = (key: string) => {
    setExpandedDateRows(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Group sessions by officer and date:
  // JIKA PETUGAS YANG SAMA TERDAPAT CHECK-IN DI TANGGAL YANG SAMA,
  // MAKA DURASI AKAN OTOMATIS TERAKUMULASI DI TANGGAL TERSEBUT
  // DAN JIKA DIA CHECK-IN LAGI DI TANGGAL YANG SAMA, MAKA REKAP AKAN MENYESUAIKAN!
  const dailyWorkRecords = useMemo(() => {
    const map = new Map<string, {
      key: string;
      date: string;
      userId: string;
      userName: string;
      userRole: string;
      sessionCount: number;
      totalDurationSeconds: number;
      firstLoginTime: string;
      lastLogoutTime: string | null;
      status: 'AKTIF' | 'SELESAI';
      hasActiveSession: boolean;
      sessions: (WorkSession & { durationSeconds: number; durationFormatted: string })[];
      hasMultipleSessions: boolean;
      notesList: string[];
    }>();

    // Sort chronologically ascending for clean timeline
    const sorted = [...filteredSessions].sort((a, b) => a.loginTime.localeCompare(b.loginTime));

    sorted.forEach(s => {
      const loginDate = s.loginTime.split(' ')[0];
      const key = `${s.userName}___${loginDate}`;
      const existing = map.get(key);

      if (!existing) {
        map.set(key, {
          key,
          date: loginDate,
          userId: s.userId,
          userName: s.userName,
          userRole: s.userRole,
          sessionCount: 1,
          totalDurationSeconds: s.durationSeconds,
          firstLoginTime: s.loginTime,
          lastLogoutTime: s.logoutTime,
          status: s.status,
          hasActiveSession: s.status === 'AKTIF',
          sessions: [s],
          hasMultipleSessions: false,
          notesList: s.notes ? [s.notes] : []
        });
      } else {
        existing.sessionCount += 1;
        existing.totalDurationSeconds += s.durationSeconds;
        existing.sessions.push(s);
        existing.hasMultipleSessions = true;
        if (s.notes && !existing.notesList.includes(s.notes)) {
          existing.notesList.push(s.notes);
        }
        // If any session on this date is still AKTIF, daily status is AKTIF
        if (s.status === 'AKTIF') {
          existing.status = 'AKTIF';
          existing.hasActiveSession = true;
          existing.lastLogoutTime = null;
        } else if (!existing.hasActiveSession) {
          // Both are finished, update lastLogoutTime if s.logoutTime is later
          if (s.logoutTime && (!existing.lastLogoutTime || s.logoutTime > existing.lastLogoutTime)) {
            existing.lastLogoutTime = s.logoutTime;
          }
        }
      }
    });

    // Sort by date descending (newest first), then userName
    return Array.from(map.values()).sort((a, b) => {
      const cmpDate = b.date.localeCompare(a.date);
      if (cmpDate !== 0) return cmpDate;
      return a.userName.localeCompare(b.userName);
    });
  }, [filteredSessions]);

  // Lookup map to get daily accumulated info for any individual session
  const sessionDailyMap = useMemo(() => {
    const map = new Map<string, { totalDurationSeconds: number; sessionCount: number; date: string }>();
    dailyWorkRecords.forEach(rec => {
      rec.sessions.forEach(s => {
        map.set(s.id, {
          totalDurationSeconds: rec.totalDurationSeconds,
          sessionCount: rec.sessionCount,
          date: rec.date
        });
      });
    });
    return map;
  }, [dailyWorkRecords]);

  // Summary by individual officer
  const userSummaries = useMemo(() => {
    const map = new Map<string, {
      userId: string;
      userName: string;
      userRole: string;
      totalSeconds: number;
      sessionCount: number;
      uniqueDates: Set<string>;
      hasMultiCheckinDates: boolean;
      lastSession: WorkSession | null;
      isOnline: boolean;
    }>();

    sessionsWithLiveDuration.forEach(s => {
      const loginDate = s.loginTime.split(' ')[0];
      const existing = map.get(s.userName);
      if (!existing) {
        const dateSet = new Set<string>();
        dateSet.add(loginDate);
        map.set(s.userName, {
          userId: s.userId,
          userName: s.userName,
          userRole: s.userRole,
          totalSeconds: s.durationSeconds,
          sessionCount: 1,
          uniqueDates: dateSet,
          hasMultiCheckinDates: false,
          lastSession: s,
          isOnline: s.status === 'AKTIF'
        });
      } else {
        existing.totalSeconds += s.durationSeconds;
        existing.sessionCount += 1;
        if (existing.uniqueDates.has(loginDate)) {
          existing.hasMultiCheckinDates = true;
        } else {
          existing.uniqueDates.add(loginDate);
        }
        if (s.status === 'AKTIF') existing.isOnline = true;
      }
    });

    return Array.from(map.values()).map(item => ({
      ...item,
      uniqueDaysCount: item.uniqueDates.size
    })).sort((a, b) => b.totalSeconds - a.totalSeconds);
  }, [sessionsWithLiveDuration]);

  // Export CSV (Supports both Rekap Harian and Rincian Sesi)
  const handleExportCSV = () => {
    if (recordViewMode === 'REKAP_HARIAN') {
      if (dailyWorkRecords.length === 0) {
        showToast('Tidak ada data rekap harian untuk diekspor.', 'warning');
        return;
      }

      const headers = [
        'Tanggal Shift', 
        'Nama Petugas', 
        'Role/Jabatan', 
        'Jumlah Check-In', 
        'Jam Masuk Pertama', 
        'Jam Keluar Terakhir', 
        'Total Detik Akumulasi', 
        'Total Rekap Durasi Kerja', 
        'Status Sesi',
        'Rincian Tiap Sesi'
      ];

      const rows = dailyWorkRecords.map(rec => {
        const firstLoginTimeOnly = rec.firstLoginTime.split(' ')[1] || '';
        const lastLogoutTimeOnly = rec.lastLogoutTime ? (rec.lastLogoutTime.split(' ')[1] || '') : (rec.hasActiveSession ? 'Masih Aktif Bertugas' : '-');
        const sessionDetails = rec.sessions.map((s, idx) => {
          const inTime = s.loginTime.split(' ')[1] || '';
          const outTime = s.logoutTime ? (s.logoutTime.split(' ')[1] || '') : 'Aktif';
          return `Sesi ${idx + 1} (${s.id}): ${inTime}-${outTime} (${formatHMS(s.durationSeconds)})`;
        }).join('; ');

        return [
          `"${rec.date}"`,
          `"${rec.userName}"`,
          `"${rec.userRole}"`,
          rec.sessionCount,
          `"${firstLoginTimeOnly}"`,
          `"${lastLogoutTimeOnly}"`,
          rec.totalDurationSeconds,
          `"${formatHMS(rec.totalDurationSeconds)}"`,
          `"${rec.status}"`,
          `"${sessionDetails.replace(/"/g, '""')}"`
        ];
      });

      const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Rekap_Harian_Akumulasi_Jam_Kerja_${realToday}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Laporan Rekap Harian Terakumulasi berhasil diunduh (CSV).', 'success');
    } else {
      if (filteredSessions.length === 0) {
        showToast('Tidak ada data sesi untuk diekspor.', 'warning');
        return;
      }

      const headers = ['ID Sesi', 'Nama Petugas', 'Role/Jabatan', 'Tgl Masuk', 'Jam Masuk', 'Tgl Keluar', 'Jam Keluar', 'Durasi Sesi Ini', 'Total Akumulasi Tgl Ini', 'Status', 'Catatan'];
      const rows = filteredSessions.map(s => {
        const [loginDate, loginTimeOnly] = s.loginTime.split(' ');
        let logoutDate = '-';
        let logoutTimeOnly = '-';
        if (s.logoutTime) {
          const parts = s.logoutTime.split(' ');
          logoutDate = parts[0];
          logoutTimeOnly = parts[1] || '';
        }
        const dailyInfo = sessionDailyMap.get(s.id);
        const accumulatedStr = dailyInfo ? formatHMS(dailyInfo.totalDurationSeconds) : s.durationFormatted;

        return [
          `"${s.id}"`,
          `"${s.userName}"`,
          `"${s.userRole}"`,
          `"${loginDate}"`,
          `"${loginTimeOnly || ''}"`,
          `"${logoutDate}"`,
          `"${logoutTimeOnly}"`,
          `"${formatHMS(s.durationSeconds)}"`,
          `"${accumulatedStr}"`,
          `"${s.status}"`,
          `"${(s.notes || '').replace(/"/g, '""')}"`
        ];
      });

      const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Rincian_Sesi_Jam_Kerja_${realToday}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Laporan Rincian Sesi berhasil diunduh (CSV).', 'success');
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSelectedUser('SEMUA');
    setSelectedRole('SEMUA');
    setSessionStatus('SEMUA');
    setDatePreset('SEMUA');
    setCustomStartDate('');
    setCustomEndDate('');
    setSearchQuery('');
    showToast('Filter telah direset.', 'info');
  };

  const isFilterActive = selectedUser !== 'SEMUA' || selectedRole !== 'SEMUA' || sessionStatus !== 'SEMUA' || datePreset !== 'SEMUA' || customStartDate || customEndDate || searchQuery.trim() !== '';

  // Filtered Audit Logs
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter(log => {
      if (auditActionFilter !== 'SEMUA') {
        if (auditActionFilter === 'AUTH' && !log.action.toLowerCase().includes('log')) return false;
        if (auditActionFilter === 'CHECKIN' && !log.action.toLowerCase().includes('check-in')) return false;
        if (auditActionFilter === 'CHECKOUT' && !log.action.toLowerCase().includes('check-out')) return false;
        if (auditActionFilter === 'SARAPAN' && !log.action.toLowerCase().includes('sarapan')) return false;
        if (auditActionFilter === 'MAINTENANCE' && !log.action.toLowerCase().includes('maintenance') && !log.action.toLowerCase().includes('perbaikan')) return false;
      }
      if (auditSearch.trim()) {
        const q = auditSearch.toLowerCase();
        const matchUser = log.user.toLowerCase().includes(q);
        const matchAction = log.action.toLowerCase().includes(q);
        const matchDetails = log.details.toLowerCase().includes(q);
        if (!matchUser && !matchAction && !matchDetails) return false;
      }
      return true;
    });
  }, [auditLogs, auditActionFilter, auditSearch]);

  return (
    <div className="space-y-4">
      {/* Simplified Top Action & Sub-Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveSubView('WORK_SESSIONS')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-2 ${
              activeSubView === 'WORK_SESSIONS' 
                ? 'bg-white text-blue-800 shadow-xs font-black' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <i className="fa-solid fa-business-time"></i>
            <span>Rekap Sesi & Jam Kerja</span>
          </button>
          <button
            onClick={() => setActiveSubView('AUDIT_TRAIL')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-2 ${
              activeSubView === 'AUDIT_TRAIL' 
                ? 'bg-white text-purple-800 shadow-xs font-black' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <i className="fa-solid fa-list-check"></i>
            <span>Log Aktivitas Sistem</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeSubView === 'AUDIT_TRAIL' ? 'bg-purple-100 text-purple-800' : 'bg-slate-200 text-slate-600'
            }`}>
              {auditLogs.length}
            </span>
          </button>
        </div>

        <button
          onClick={() => openModal('modalExport', { defaultType: activeSubView === 'WORK_SESSIONS' ? 'JAM_KERJA' : 'AUDIT' })}
          className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center space-x-2 transition self-start sm:self-auto"
          title="Unduh Laporan Resmi (PDF & Excel .xlsx)"
        >
          <i className="fa-solid fa-file-arrow-down"></i>
          <span>Unduh Laporan ({activeSubView === 'WORK_SESSIONS' ? 'Jam Kerja' : 'Audit'})</span>
        </button>
      </div>

      {activeSubView === 'WORK_SESSIONS' ? (
        <div className="space-y-4">
          {/* Streamlined KPI Summary Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center text-base shrink-0">
                <i className="fa-solid fa-hourglass-half"></i>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Total Durasi Kerja</p>
                <p className="text-base font-black text-blue-700 truncate" title={formatHMS(totalFilteredSeconds)}>
                  {formatHMS(totalFilteredSeconds)}
                </p>
                <p className="text-[10px] text-slate-400">{filteredSessions.length} sesi tugas</p>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center text-base shrink-0">
                <i className="fa-solid fa-calendar-check"></i>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Total Sesi Shift</p>
                <p className="text-base font-black text-slate-800">{filteredSessions.length} Sesi</p>
                <p className="text-[10px] text-slate-400">
                  {filteredSessions.filter(s => s.status === 'SELESAI').length} Selesai • {filteredSessions.filter(s => s.status === 'AKTIF').length} Aktif
                </p>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center text-base shrink-0">
                <i className="fa-solid fa-user-clock"></i>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Petugas Aktif</p>
                <p className="text-base font-black text-emerald-700 flex items-center space-x-1.5">
                  <span>{activeOfficersCount} Petugas</span>
                  {activeOfficersCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                  )}
                </p>
                <p className="text-[10px] text-emerald-600 font-semibold">Sedang bertugas</p>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center text-base shrink-0">
                <i className="fa-solid fa-chart-line"></i>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Rata-rata / Shift</p>
                <p className="text-base font-black text-amber-700 truncate" title={formatHMS(averageDurationSeconds)}>
                  {formatHMS(averageDurationSeconds)}
                </p>
                <p className="text-[10px] text-slate-400">Durasi rata-rata sesi</p>
              </div>
            </div>
          </div>

          {/* Compact Single-Bar Filter & View Controls */}
          <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
              {/* Quick Search */}
              <div className="relative flex-1 max-w-sm">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Cari ID sesi, nama petugas, catatan..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
                <i className="fa-solid fa-magnifying-glass absolute left-2.5 top-2.5 text-slate-400 text-xs"></i>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200 self-start md:self-auto">
                <button
                  type="button"
                  onClick={() => setRecordViewMode('REKAP_HARIAN')}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition flex items-center space-x-1 ${
                    recordViewMode === 'REKAP_HARIAN' 
                      ? 'bg-white text-blue-700 shadow-xs font-black' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <i className="fa-solid fa-calendar-day text-[10px]"></i>
                  <span>Rekap Harian ({dailyWorkRecords.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRecordViewMode('RINCIAN_SESI')}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition flex items-center space-x-1 ${
                    recordViewMode === 'RINCIAN_SESI' 
                      ? 'bg-white text-blue-700 shadow-xs font-black' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <i className="fa-solid fa-list-check text-[10px]"></i>
                  <span>Rincian Sesi ({filteredSessions.length})</span>
                </button>
              </div>
            </div>

            {/* Filter Dropdowns Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Petugas</label>
                <select
                  value={selectedUser}
                  onChange={e => setSelectedUser(e.target.value)}
                  className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
                >
                  <option value="SEMUA">Semua Petugas ({uniqueUsers.length})</option>
                  {uniqueUsers.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Jabatan / Role</label>
                <select
                  value={selectedRole}
                  onChange={e => setSelectedRole(e.target.value)}
                  className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
                >
                  <option value="SEMUA">Semua Jabatan</option>
                  {uniqueRoles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Status Sesi</label>
                <select
                  value={sessionStatus}
                  onChange={e => setSessionStatus(e.target.value)}
                  className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
                >
                  <option value="SEMUA">Semua Status</option>
                  <option value="AKTIF">🟢 Sedang Aktif</option>
                  <option value="SELESAI">⚪ Selesai (Check-Out)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Periode Tanggal</label>
                <select
                  value={datePreset}
                  onChange={e => setDatePreset(e.target.value as any)}
                  className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
                >
                  <option value="SEMUA">Semua Waktu</option>
                  <option value="HARI_INI">Hari Ini ({formatIndonesianDate(realToday)})</option>
                  <option value="KEMARIN">Kemarin ({formatIndonesianDate(realYesterday)})</option>
                  <option value="3_HARI">3 Hari Terakhir</option>
                  <option value="7_HARI">7 Hari Terakhir</option>
                  <option value="KUSTOM">Rentang Kustom</option>
                </select>
              </div>
            </div>

            {/* Custom Date Pickers if Selected */}
            {datePreset === 'KUSTOM' && (
              <div className="pt-2 flex flex-wrap items-center gap-3 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <div className="flex items-center space-x-1.5">
                  <span className="text-slate-600 font-medium">Dari:</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={e => setCustomStartDate(e.target.value)}
                    className="p-1 border border-slate-300 rounded-md bg-white text-xs"
                  />
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-slate-600 font-medium">Sampai:</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={e => setCustomEndDate(e.target.value)}
                    className="p-1 border border-slate-300 rounded-md bg-white text-xs"
                  />
                </div>
              </div>
            )}

            {/* Active Filter Indicator & Reset */}
            {isFilterActive && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-500 text-[11px]">
                  Menampilkan <strong>{recordViewMode === 'REKAP_HARIAN' ? dailyWorkRecords.length : filteredSessions.length}</strong> data terfilter
                </span>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs text-red-600 hover:text-red-700 font-bold flex items-center space-x-1"
                >
                  <i className="fa-solid fa-rotate-left text-[10px]"></i>
                  <span>Reset Filter</span>
                </button>
              </div>
            )}
          </div>

          {/* Work Sessions Table */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">

            {/* TAB 1: REKAPITULASI HARIAN TERAKUMULASI */}
            {recordViewMode === 'REKAP_HARIAN' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-100 uppercase text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">Tanggal Shift</th>
                      <th className="p-3.5">Petugas & Role</th>
                      <th className="p-3.5 text-center">Frekuensi Masuk</th>
                      <th className="p-3.5">
                        <span className="flex items-center space-x-1">
                          <i className="fa-solid fa-clock text-blue-600"></i>
                          <span>Rentang Jam (Pertama s/d Terakhir)</span>
                        </span>
                      </th>
                      <th className="p-3.5">
                        <span className="flex items-center space-x-1">
                          <i className="fa-solid fa-stopwatch text-emerald-600"></i>
                          <span>Total Akumulasi Durasi Kerja</span>
                        </span>
                      </th>
                      <th className="p-3.5 text-center">Rincian Sesi</th>
                      <th className="p-3.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dailyWorkRecords.length > 0 ? (
                      dailyWorkRecords.map(rec => {
                        const isExpanded = !!expandedDateRows[rec.key];
                        const isToday = rec.date === realToday;
                        const firstLoginTimeOnly = rec.firstLoginTime.split(' ')[1] || '';
                        const lastLogoutTimeOnly = rec.lastLogoutTime ? (rec.lastLogoutTime.split(' ')[1] || '') : null;

                        return (
                          <React.Fragment key={rec.key}>
                            <tr className={`transition ${rec.hasMultipleSessions ? 'bg-blue-50/20 hover:bg-blue-50/40 border-l-4 border-l-blue-500' : 'hover:bg-slate-50'}`}>
                              {/* Tanggal Shift */}
                              <td className="p-3.5">
                                <div className="space-y-0.5">
                                  <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                                    <i className="fa-regular fa-calendar text-blue-600"></i>
                                    <span>{formatIndonesianDate(rec.date)}</span>
                                  </div>
                                  <div className="flex items-center space-x-1.5">
                                    {isToday && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-600 text-white uppercase">
                                        Hari Ini
                                      </span>
                                    )}
                                    <span className="text-[10px] text-slate-400 font-mono">{rec.date}</span>
                                  </div>
                                </div>
                              </td>

                              {/* Petugas & Role */}
                              <td className="p-3.5">
                                <div className="flex items-center space-x-2.5">
                                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                                    {rec.userName.substring(0, 2).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-900 text-sm">{rec.userName}</p>
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                      {rec.userRole}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* Frekuensi Masuk (Check-In) */}
                              <td className="p-3.5 text-center">
                                {rec.hasMultipleSessions ? (
                                  <div className="inline-flex flex-col items-center">
                                    <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-blue-600 text-white shadow-xs inline-flex items-center space-x-1">
                                      <i className="fa-solid fa-repeat text-amber-300 text-[10px]"></i>
                                      <span>{rec.sessionCount}x Check-In</span>
                                    </span>
                                    <span className="text-[10px] text-blue-700 font-bold mt-0.5">
                                      Terakumulasi Otomatis
                                    </span>
                                  </div>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                    1x Sesi
                                  </span>
                                )}
                              </td>

                              {/* Rentang Jam Kerja */}
                              <td className="p-3.5">
                                <div className="space-y-1">
                                  <div className="flex items-center space-x-2 text-[11px]">
                                    <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded font-mono font-bold">
                                      Masuk: {firstLoginTimeOnly} WIB
                                    </span>
                                    <span>→</span>
                                    {rec.hasActiveSession ? (
                                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded font-bold animate-pulse">
                                        Sedang Bertugas
                                      </span>
                                    ) : (
                                      <span className="px-1.5 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded font-mono font-bold">
                                        Keluar: {lastLogoutTimeOnly || '-'} WIB
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    {rec.hasMultipleSessions ? `Mencakup rentang ${rec.sessionCount} kali kedatangan tugas` : 'Satu sesi berkelanjutan'}
                                  </div>
                                </div>
                              </td>

                              {/* Total Akumulasi Durasi Kerja */}
                              <td className="p-3.5">
                                <div className="space-y-0.5">
                                  <div className="font-black text-blue-700 text-sm sm:text-base flex items-center space-x-1.5">
                                    <i className="fa-solid fa-stopwatch text-blue-600"></i>
                                    <span>{formatHMS(rec.totalDurationSeconds)}</span>
                                  </div>
                                  {rec.hasActiveSession ? (
                                    <div className="text-[10px] text-emerald-600 font-bold flex items-center space-x-1 animate-pulse">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                      <span>Menyesuaikan Real-Time...</span>
                                    </div>
                                  ) : (
                                    <div className="text-[10px] text-slate-400 font-mono">
                                      Total akumulasi {rec.totalDurationSeconds.toLocaleString('id-ID')} detik
                                    </div>
                                  )}
                                </div>
                              </td>

                              {/* Rincian Sesi Toggle */}
                              <td className="p-3.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => toggleExpandDateRow(rec.key)}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition inline-flex items-center space-x-1 ${isExpanded ? 'bg-slate-800 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'}`}
                                >
                                  <span>{isExpanded ? 'Tutup Rincian' : `Lihat ${rec.sessionCount} Sesi`}</span>
                                  <i className={`fa-solid fa-chevron-${isExpanded ? 'up' : 'down'} text-[10px]`}></i>
                                </button>
                              </td>

                              {/* Status */}
                              <td className="p-3.5 text-center">
                                {rec.hasActiveSession ? (
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center space-x-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping mr-1"></span>
                                    <span>AKTIF</span>
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-300">
                                    SELESAI
                                  </span>
                                )}
                              </td>
                            </tr>

                            {/* Sub-Rows: Individual Sessions Breakdown for this Date */}
                            {isExpanded && (
                              <tr className="bg-slate-50/80">
                                <td colSpan={7} className="p-4 pl-8 border-y border-slate-200">
                                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-2.5">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                      <p className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                                        <i className="fa-solid fa-list-ol text-blue-600"></i>
                                        <span>Rincian Tiap Sesi Check-In {rec.userName} pada {formatIndonesianDate(rec.date)}:</span>
                                      </p>
                                      <span className="text-[11px] text-blue-700 font-extrabold">
                                        Akumulasi Total: {formatHMS(rec.totalDurationSeconds)}
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {rec.sessions.map((s, sIdx) => {
                                        const inTime = s.loginTime.split(' ')[1] || '';
                                        const outTime = s.logoutTime ? (s.logoutTime.split(' ')[1] || '') : 'Masih Berjalan';
                                        return (
                                          <div key={s.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                                            <div>
                                              <div className="font-bold text-slate-800 flex items-center space-x-1.5">
                                                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-black text-[10px] flex items-center justify-center">
                                                  {sIdx + 1}
                                                </span>
                                                <span className="font-mono text-[11px] text-slate-500">#{s.id}</span>
                                              </div>
                                              <div className="text-[11px] text-slate-600 mt-1 font-mono">
                                                {inTime} WIB ➔ {outTime} WIB
                                              </div>
                                              {s.notes && (
                                                <p className="text-[10px] text-slate-400 mt-0.5 italic">{s.notes}</p>
                                              )}
                                            </div>
                                            <div className="text-right">
                                              <span className="font-extrabold text-blue-700 block text-xs">
                                                {formatHMS(s.durationSeconds)}
                                              </span>
                                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${s.status === 'AKTIF' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                                                {s.status}
                                              </span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                          Tidak ada catatan sesi jam kerja yang sesuai dengan filter yang dipilih.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              /* TAB 2: RINCIAN TIAP SESI INDIVIDUAL */
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-100 uppercase text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">ID Sesi</th>
                      <th className="p-3.5">Petugas & Role</th>
                      <th className="p-3.5">
                        <span className="flex items-center space-x-1">
                          <i className="fa-solid fa-right-to-bracket text-blue-600"></i>
                          <span>Tanggal & Jam Masuk</span>
                        </span>
                      </th>
                      <th className="p-3.5">
                        <span className="flex items-center space-x-1">
                          <i className="fa-solid fa-right-from-bracket text-red-600"></i>
                          <span>Tanggal & Jam Keluar</span>
                        </span>
                      </th>
                      <th className="p-3.5">
                        <span className="flex items-center space-x-1">
                          <i className="fa-solid fa-stopwatch text-emerald-600"></i>
                          <span>Durasi Sesi Ini</span>
                        </span>
                      </th>
                      <th className="p-3.5">Akumulasi Tgl Tersebut</th>
                      <th className="p-3.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSessions.length > 0 ? (
                      filteredSessions.map((session, idx) => {
                        const [loginDate, loginTimeOnly] = session.loginTime.split(' ');
                        let logoutDate = '-';
                        let logoutTimeOnly = '-';
                        let isCrossDay = false;

                        if (session.logoutTime) {
                          const parts = session.logoutTime.split(' ');
                          logoutDate = parts[0];
                          logoutTimeOnly = parts[1] || '';
                          if (logoutDate !== loginDate) {
                            isCrossDay = true;
                          }
                        }

                        const dailyInfo = sessionDailyMap.get(session.id);
                        const hasMultipleOnDate = dailyInfo && dailyInfo.sessionCount > 1;

                        return (
                          <tr key={session.id || idx} className={`transition ${hasMultipleOnDate ? 'bg-blue-50/20 hover:bg-blue-50/40' : 'hover:bg-slate-50'}`}>
                            {/* ID Sesi */}
                            <td className="p-3.5 font-mono font-bold text-slate-500">
                              {session.id}
                            </td>

                            {/* Petugas & Role */}
                            <td className="p-3.5">
                              <div className="flex items-center space-x-2.5">
                                <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs">
                                  {session.userName.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-800">{session.userName}</p>
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                    {session.userRole}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Tanggal & Jam Masuk */}
                            <td className="p-3.5">
                              <div className="space-y-0.5">
                                <div className="font-bold text-slate-800 flex items-center space-x-1">
                                  <i className="fa-regular fa-calendar text-blue-500"></i>
                                  <span>{formatIndonesianDate(loginDate)}</span>
                                </div>
                                <div className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded font-mono font-bold text-[11px]">
                                  {loginTimeOnly} WIB
                                </div>
                              </div>
                            </td>

                            {/* Tanggal & Jam Keluar */}
                            <td className="p-3.5">
                              {session.status === 'AKTIF' ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-ping"></span>
                                  Sedang Bertugas (Belum Keluar)
                                </span>
                              ) : (
                                <div className="space-y-0.5">
                                  <div className="font-bold text-slate-800 flex items-center space-x-1">
                                    <i className="fa-regular fa-calendar-check text-red-500"></i>
                                    <span>{formatIndonesianDate(logoutDate)}</span>
                                  </div>
                                  <div className="inline-block px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded font-mono font-bold text-[11px]">
                                    {logoutTimeOnly} WIB
                                  </div>
                                </div>
                              )}
                            </td>

                            {/* Durasi Sesi Ini */}
                            <td className="p-3.5">
                              <div className="space-y-1">
                                <div className="font-extrabold text-slate-800 text-xs flex items-center space-x-1.5">
                                  <span>{formatHMS(session.durationSeconds)}</span>
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  ({session.durationSeconds.toLocaleString('id-ID')} detik)
                                </div>
                              </div>
                            </td>

                            {/* Akumulasi Tgl Tersebut */}
                            <td className="p-3.5">
                              {dailyInfo ? (
                                <div>
                                  <span className="font-extrabold text-blue-700 text-xs block">
                                    {formatHMS(dailyInfo.totalDurationSeconds)}
                                  </span>
                                  {hasMultipleOnDate ? (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold mt-0.5">
                                      <i className="fa-solid fa-repeat mr-1 text-[9px]"></i>
                                      Total {dailyInfo.sessionCount}x check-in tgl {dailyInfo.date}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-400">1x sesi pada tanggal ini</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400 text-xs">-</span>
                              )}
                            </td>

                            {/* Status Badge */}
                            <td className="p-3.5 text-center">
                              {session.status === 'AKTIF' ? (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  AKTIF
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-300">
                                  SELESAI
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                          Tidak ada catatan sesi jam kerja yang sesuai dengan filter yang dipilih.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Audit Trail Tab */
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center">
                <i className="fa-solid fa-clock-rotate-left text-purple-600 mr-2"></i>
                Log Aktivitas Sistem (Audit Trail)
              </h3>
              <p className="text-xs text-slate-500">
                Catatan komprehensif riwayat aktivitas operasional seluruh petugas di dalam aplikasi.
              </p>
            </div>

            {/* Audit Trail Search and Filter */}
            <div className="flex items-center flex-wrap gap-2">
              <select
                value={auditActionFilter}
                onChange={e => setAuditActionFilter(e.target.value)}
                className="p-1.5 border border-slate-300 rounded-lg text-xs outline-none font-semibold"
              >
                <option value="SEMUA">Semua Tindakan</option>
                <option value="AUTH">Login & Logout</option>
                <option value="CHECKIN">Check-In Tamu</option>
                <option value="CHECKOUT">Check-Out Tamu</option>
                <option value="SARAPAN">Pesanan Sarapan</option>
                <option value="MAINTENANCE">Maintenance Kamar</option>
              </select>

              <input
                type="text"
                value={auditSearch}
                onChange={e => setAuditSearch(e.target.value)}
                placeholder="Cari log..."
                className="p-1.5 border border-slate-300 rounded-lg text-xs outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 uppercase text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Waktu & Tanggal</th>
                  <th className="p-3">Pengguna (Petugas)</th>
                  <th className="p-3">Peran / Role</th>
                  <th className="p-3">Tindakan / Aktivitas</th>
                  <th className="p-3">Rincian Objek</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAuditLogs.length > 0 ? (
                  filteredAuditLogs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-mono text-[11px] text-slate-500">{log.timestamp}</td>
                      <td className="p-3 font-bold text-slate-800">{log.user}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                          {log.role}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-slate-700">{log.action}</td>
                      <td className="p-3 text-slate-600">{log.details}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400 italic">
                      Tidak ada data log aktivitas yang cocok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

