import React, { useState } from 'react';
import { useAppContext, isTeknisiRole, isManagerTeknisi, isQcRole, isRecepRole, isKoperasiRole } from '../store';
import { OFFICIAL_TARIFFS } from '../data';
import { Room } from '../types';
import { getRealTodayDate, getRealDateWithOffset, formatIndonesianDate, addDaysToDateStr } from '../lib/utils';

const BUILDING_ORDER = [
  'Gedung A (Arafah)',
  'Gedung B (Muzdalifah)',
  'Gedung C (Mina)',
  'Gedung D (Madinah)',
  'Ruang Pertemuan',
];

export function RoomsView() {
  const { rooms, transactions, maintenances, openModal, finishMaintenance, currentUser, setActiveTab } = useAppContext();
  const [bFilter, setBFilter] = useState('ALL');
  const [sFilter, setSFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [myZoneOnly, setMyZoneOnly] = useState(false);
  const [globalDisplay, setGlobalDisplay] = useState<'COLLAPSE' | 'EXPAND'>('COLLAPSE');
  const [buildingOverrides, setBuildingOverrides] = useState<Record<string, boolean>>({});

  const isRecep = isRecepRole(currentUser?.role);
  const isTeknisi = isTeknisiRole(currentUser?.role);
  const isManagerTek = isManagerTeknisi(currentUser?.role);
  const isQc = isQcRole(currentUser?.role);
  const isKoperasi = isKoperasiRole(currentUser?.role);

  // Determine user's zone
  const hasAssignedZone = currentUser?.assignedBuilding && 
    !currentUser.assignedBuilding.includes('Pusat Komando') && 
    !currentUser.assignedBuilding.includes('Kawasan') && 
    !currentUser.assignedBuilding.includes('Semua') &&
    currentUser.assignedBuilding !== '-';

  const isRoomInUserZone = (roomBuilding: string): boolean => {
    if (!hasAssignedZone || !myZoneOnly || !currentUser?.assignedBuilding) return true;
    const zone = currentUser.assignedBuilding;
    if (zone.includes('A & B') || (zone.includes('Gedung A') && zone.includes('Gedung B'))) {
      return roomBuilding === 'Gedung A (Arafah)' || roomBuilding === 'Gedung B (Muzdalifah)';
    }
    if (zone.includes('C, D') || zone.includes('C & D')) {
      return roomBuilding === 'Gedung C (Mina)' || roomBuilding === 'Gedung D (Madinah)' || roomBuilding === 'Ruang Pertemuan';
    }
    return true;
  };

  const filteredRooms = rooms.filter(r => {
    if (myZoneOnly && !isRoomInUserZone(r.building)) return false;
    if (bFilter !== 'ALL' && r.building !== bFilter) return false;
    if (sFilter !== 'ALL' && r.status !== sFilter) return false;
    if (search && !r.roomNumber.toLowerCase().includes(search.toLowerCase()) && !r.building.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const grouped: Record<string, Room[]> = {};
  filteredRooms.forEach(r => {
    if (!grouped[r.building]) grouped[r.building] = [];
    grouped[r.building].push(r);
  });

  const buildingNames = Object.keys(grouped).sort((a, b) => {
    const idxA = BUILDING_ORDER.indexOf(a);
    const idxB = BUILDING_ORDER.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    return a.localeCompare(b);
  });

  const isBuildingCollapsed = (bName: string): boolean => {
    if (buildingOverrides[bName] !== undefined) {
      return buildingOverrides[bName];
    }
    return globalDisplay === 'COLLAPSE';
  };

  const toggleBuilding = (bName: string) => {
    const current = isBuildingCollapsed(bName);
    setBuildingOverrides(prev => ({
      ...prev,
      [bName]: !current,
    }));
  };

  const handleGlobalDisplayChange = (mode: 'COLLAPSE' | 'EXPAND') => {
    setGlobalDisplay(mode);
    setBuildingOverrides({});
  };

  const realTodayStr = getRealTodayDate();
  const realTomorrowStr = getRealDateWithOffset(1);

  const getRoomCard = (room: Room) => {
    let statusBadge = null;
    let borderClass = '';
    let btnAction = null;
    const isAula = room.building === "Ruang Pertemuan";

    // Active transactions for this room
    const activeRoomTxs = transactions.filter(t => 
      t.roomId === room.id && 
      t.status !== 'DIBATALKAN' && 
      t.status !== 'SELESAI'
    );

    const activeTx = transactions.find(t => t.id === room.activeTxId);
    const evalDate = activeTx?.startDate || activeRoomTxs[0]?.startDate || realTodayStr;

    // =========================================================================
    // 1. LOGIC RUANG PERTEMUAN (AULA)
    // =========================================================================
    if (isAula) {
      if (room.status === 'MAINTENANCE') {
        const aulaMaint = maintenances.find(m => m.id === room.activeMaintId || (m.roomId === room.id && m.status !== 'SELESAI'));
        const isWaitingQc = room.qcStatus === 'MENUNGGU_QC' || aulaMaint?.status === 'MENUNGGU_QC';

        if (isWaitingQc) {
          borderClass = 'border-purple-300 bg-purple-50/70';
          statusBadge = <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-700 text-white animate-pulse">Menunggu QC</span>;
          btnAction = (
            <div className="space-y-1">
              {isQc ? (
                <button 
                  onClick={() => openModal('modalQcInspection', { room })} 
                  className="w-full py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-lg text-xs shadow flex items-center justify-center space-x-1.5 transition"
                  title="Lakukan inspeksi kelayakan aula untuk lolos QC"
                >
                  <i className="fa-solid fa-clipboard-check"></i>
                  <span>Inspeksi QC Aula</span>
                </button>
              ) : isTeknisi ? (
                <button 
                  onClick={() => { if (aulaMaint) openModal('modalUpdateMaintenance', { maintenance: aulaMaint }); }} 
                  className="w-full py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs shadow flex items-center justify-center space-x-1.5 transition"
                  title="Lihat status verifikasi QC"
                >
                  <i className="fa-solid fa-clock-rotate-left"></i>
                  <span>Telah Diperbaiki (Menunggu QC)</span>
                </button>
              ) : (
                <div className="w-full py-1 px-1.5 bg-purple-100 text-purple-900 rounded text-[10px] font-bold border border-purple-200 text-center">
                  Menunggu Inspeksi QC
                </div>
              )}
            </div>
          );
        } else {
          borderClass = 'border-amber-300 bg-amber-50/60';
          statusBadge = <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-600 text-white">Maintenance</span>;
          btnAction = (
            <div className="space-y-1">
              {isManagerTek && aulaMaint?.status === 'MENUNGGU_PENUGASAN' ? (
                <button 
                  onClick={() => openModal('modalAssignTechnician', { maintenance: aulaMaint })} 
                  className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs shadow flex items-center justify-center space-x-1.5 transition"
                >
                  <i className="fa-solid fa-user-plus"></i>
                  <span>Tugaskan Teknisi</span>
                </button>
              ) : isTeknisi ? (
                <button 
                  onClick={() => {
                    if (aulaMaint) {
                      openModal('modalUpdateMaintenance', { maintenance: aulaMaint });
                    } else {
                      finishMaintenance(room.id);
                    }
                  }} 
                  className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs shadow flex items-center justify-center space-x-1.5 transition"
                >
                  <i className="fa-solid fa-wrench"></i>
                  <span>Update / Selesai Perbaikan</span>
                </button>
              ) : (
                <div className="w-full py-1 px-1.5 bg-amber-100/90 text-amber-900 rounded text-[10px] font-bold border border-amber-200 text-center">
                  Perbaikan Sedang Berjalan
                </div>
              )}
            </div>
          );
        }
      } else if (activeRoomTxs.length === 0) {
        // AWAL / KOSONG
        borderClass = 'border-slate-200 bg-white hover:border-hajj-500';
        statusBadge = <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">Kosong</span>;
        btnAction = isRecep ? (
          <button 
            onClick={() => openModal('modalCheckin', { roomId: room.id, actionType: 'BOOKING', initialDate: realTodayStr })} 
            className="w-full py-2 bg-hajj-700 hover:bg-hajj-800 text-white font-bold rounded-lg text-xs shadow flex items-center justify-center space-x-1.5 transition"
          >
            <i className="fa-solid fa-calendar-check text-gold-300"></i>
            <span>Booking Aula</span>
          </button>
        ) : isQc ? (
          <button 
            onClick={() => openModal('modalQcInspection', { room })} 
            className="w-full py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-xs shadow flex items-center justify-center space-x-1.5 transition"
          >
            <i className="fa-solid fa-clipboard-check"></i>
            <span>Inspeksi QC Aula</span>
          </button>
        ) : isTeknisi ? (
          <button 
            onClick={() => openModal('modalMaintenance', { roomId: room.id })} 
            className="w-full py-1.5 bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 font-semibold rounded-lg text-xs flex items-center justify-center space-x-1.5 transition"
          >
            <i className="fa-solid fa-wrench text-amber-600"></i>
            <span>Lapor Perbaikan</span>
          </button>
        ) : (
          <div className="w-full text-center text-[10px] text-slate-400 py-1 font-medium">Aula Siap Disewa</div>
        );
      } else {
        // ADA PENYEWA YANG BOOKING AULA
        const sameDateTxs = activeRoomTxs.filter(t => t.startDate === evalDate);
        const has12Jam = sameDateTxs.some(t => t.duration === 12);
        const count8Jam = sameDateTxs.filter(t => t.duration === 8).length;
        const isAulaFull = has12Jam || count8Jam >= 2;
        const isOne8Jam = !has12Jam && count8Jam === 1;

        if (isAulaFull) {
          borderClass = 'border-purple-300 bg-purple-50/70';
          statusBadge = (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-700 text-white">
              {has12Jam ? 'Penuh (12 Jam)' : 'Penuh (2x 8 Jam)'}
            </span>
          );
          btnAction = isRecep ? (
            <div className="space-y-1.5">
              <div className="text-[10px] text-purple-900 bg-purple-100/90 p-1.5 rounded-lg font-semibold border border-purple-200">
                <div className="font-bold flex items-center space-x-1 text-purple-950">
                  <i className="fa-solid fa-circle-exclamation text-purple-700"></i>
                  <span>Kuota Tanggal Penuh</span>
                </div>
                <div className="text-[9px] text-purple-800 truncate mt-0.5" title={sameDateTxs.map(t => `${t.guestName} (${t.duration} Jam)`).join(', ')}>
                  {has12Jam 
                    ? `1 Penyewa 12 Jam (${sameDateTxs[0]?.guestName})` 
                    : `2 Penyewa 8 Jam (${sameDateTxs.map(t => t.guestName).join(' & ')})`}
                </div>
              </div>
              <button 
                onClick={() => openModal('modalCheckin', { roomId: room.id, actionType: 'BOOKING', initialDate: addDaysToDateStr(evalDate, 1) })} 
                className="w-full py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg text-xs shadow flex items-center justify-center space-x-1.5 transition"
                title={`Tanggal ini sudah penuh. Klik untuk booking tanggal berikutnya (${addDaysToDateStr(evalDate, 1)})`}
              >
                <i className="fa-solid fa-calendar-plus text-gold-300"></i>
                <span>Booking Tgl Lain (+1 Hari)</span>
              </button>
              <button 
                onClick={() => openModal('modalCheckoutSelection', { roomId: room.id, type: 'CANCEL' })} 
                className="w-full py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-lg text-xs border border-red-200 flex items-center justify-center space-x-1.5 transition"
              >
                <i className="fa-solid fa-xmark"></i>
                <span>Batalkan Booking</span>
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="text-[10px] text-purple-900 bg-purple-100 p-1.5 rounded font-medium border border-purple-200">
                <span className="font-bold">Terpakai Penuh:</span> {sameDateTxs[0]?.guestName}
              </div>
              {isQc && (
                <button 
                  onClick={() => openModal('modalQcInspection', { room })} 
                  className="w-full py-1 bg-teal-50 text-teal-800 hover:bg-teal-100 font-semibold rounded text-[11px] border border-teal-200 transition"
                >
                  <i className="fa-solid fa-clipboard-check mr-1"></i> Inspeksi QC Aula
                </button>
              )}
            </div>
          );
        } else if (isOne8Jam) {
          borderClass = 'border-amber-300 bg-amber-50/70';
          statusBadge = (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-600 text-white">
              1 Penyewa (8 Jam)
            </span>
          );
          btnAction = isRecep ? (
            <div className="space-y-1.5">
              <div className="text-[10px] text-amber-900 bg-amber-100/90 p-1.5 rounded-lg font-semibold border border-amber-200">
                <div className="font-bold flex items-center space-x-1 text-amber-950">
                  <i className="fa-solid fa-clock text-amber-700"></i>
                  <span>Sisa 1 Sesi (8 Jam)</span>
                </div>
                <div className="text-[9px] text-amber-800 truncate mt-0.5">
                  {sameDateTxs[0]?.guestName} (8 Jam)
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button 
                  type="button"
                  onClick={() => openModal('modalRoomDetail', { roomId: room.id })}
                  className="py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs border border-slate-200 flex items-center justify-center space-x-1 transition cursor-pointer"
                  title="Buka rincian sewa & tambah sesi"
                >
                  <i className="fa-solid fa-file-lines text-slate-500 text-[10px]"></i>
                  <span>Rincian Ruangan</span>
                </button>
                <button 
                  type="button"
                  onClick={() => openModal('modalCheckoutSelection', { roomId: room.id, type: 'CANCEL' })} 
                  className="py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-lg text-xs border border-red-200 flex items-center justify-center space-x-1 transition cursor-pointer"
                  title="Batalkan reservasi"
                >
                  <i className="fa-solid fa-xmark text-[10px]"></i>
                  <span>Batal</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-[10px] text-amber-800 bg-amber-50 p-1.5 rounded font-medium border border-amber-200">
              1 Sesi Terisi: {sameDateTxs[0]?.guestName} (8 Jam)
            </div>
          );
        } else {
          borderClass = 'border-blue-300 bg-blue-50/60';
          statusBadge = <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white">Booked</span>;
          btnAction = isRecep ? (
            <div className="space-y-1.5">
              <button 
                onClick={() => openModal('modalCheckin', { roomId: room.id, actionType: 'BOOKING', initialDate: addDaysToDateStr(evalDate, 1) })} 
                className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow flex items-center justify-center space-x-1.5 transition"
              >
                <i className="fa-solid fa-calendar-plus"></i>
                <span>Booking Tgl Lain (+1 Hari)</span>
              </button>
              <button 
                onClick={() => openModal('modalCheckoutSelection', { roomId: room.id, type: 'CANCEL' })} 
                className="w-full py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-lg text-xs border border-red-200 flex items-center justify-center space-x-1.5 transition"
              >
                <i className="fa-solid fa-xmark"></i>
                <span>Batalkan Booking</span>
              </button>
            </div>
          ) : (
            <div className="text-[10px] text-blue-800 bg-blue-50 p-1.5 rounded font-medium border border-blue-200">
              Reservasi: {activeRoomTxs[0]?.guestName}
            </div>
          );
        }
      }
    } else {
      // =========================================================================
      // 2. LOGIC GEDUNG (KAMAR PENGINAPAN: GEDUNG A, B, C, D)
      // =========================================================================
      switch(room.status) {
        case 'KOSONG': {
          const bookedTxs = transactions.filter(t => t.roomId === room.id && t.status === 'BOOKED');
          borderClass = 'border-slate-200 bg-white hover:border-hajj-500';
          statusBadge = <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">Kosong</span>;
          
          if (isRecep) {
            btnAction = (
              <div className="space-y-1.5">
                <button 
                  onClick={() => openModal('modalCheckin', { roomId: room.id, actionType: 'CHECKIN', initialDate: realTodayStr })} 
                  className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-xs flex items-center justify-center space-x-1.5 transition cursor-pointer"
                  title={bookedTxs.length > 0 ? "Pilih tamu reservasi atau check-in tamu baru" : "Tamu langsung Cek In hari ini"}
                >
                  <i className="fa-solid fa-door-open"></i>
                  <span>{bookedTxs.length > 0 ? `Cek In (${bookedTxs.length} Booking)` : 'Cek In'}</span>
                </button>
                <button 
                  onClick={() => openModal('modalCheckin', { roomId: room.id, actionType: 'BOOKING', initialDate: realTomorrowStr })} 
                  className="w-full py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold rounded-lg text-xs border border-blue-200 flex items-center justify-center space-x-1.5 transition cursor-pointer"
                  title="Booking untuk tanggal besok / mendatang"
                >
                  <i className="fa-solid fa-calendar-plus text-blue-600"></i>
                  <span>Booking Tgl Lain</span>
                </button>
              </div>
            );
          } else if (isQc) {
            btnAction = (
              <div className="space-y-1">
                <button 
                  onClick={() => openModal('modalQcInspection', { room })} 
                  className="w-full py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-xs shadow flex items-center justify-center space-x-1.5 transition"
                >
                  <i className="fa-solid fa-clipboard-check"></i>
                  <span>Inspeksi QC Kamar</span>
                </button>
                <div className="text-[9px] text-slate-500 text-center font-medium">
                  {room.qcStatus === 'LOLOS_QC' ? '✅ Lolos Standar QC' : '⚠️ Perlu Verifikasi QC'}
                </div>
              </div>
            );
          } else if (isTeknisi) {
            btnAction = (
              <div className="space-y-1">
                <button 
                  onClick={() => openModal('modalMaintenance', { roomId: room.id })} 
                  className="w-full py-1.5 bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 font-semibold rounded-lg text-xs flex items-center justify-center space-x-1.5 transition"
                >
                  <i className="fa-solid fa-wrench text-amber-600"></i>
                  <span>Lapor Kerusakan</span>
                </button>
                <div className="text-[9px] text-slate-400 text-center font-medium">Fasilitas Standar OK</div>
              </div>
            );
          } else if (isKoperasi) {
            btnAction = (
              <div className="w-full py-2 bg-slate-50 border border-slate-200 rounded-lg text-center text-[10px] text-slate-500 font-medium">
                <i className="fa-solid fa-bed text-slate-400 mr-1"></i> Kamar Kosong (Tanpa Tamu)
              </div>
            );
          } else {
            btnAction = (
              <div className="w-full text-center text-[10px] text-slate-400 py-1 font-medium">Kamar Kosong</div>
            );
          }
          break;
        }

        case 'BOOKED': {
          const bookedTxs = transactions.filter(t => t.roomId === room.id && t.status === 'BOOKED');
          borderClass = 'border-blue-300 bg-blue-50/60';
          statusBadge = (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white flex items-center space-x-1">
              <span>Booked</span>
              {bookedTxs.length > 1 && <span className="bg-white text-blue-800 rounded-full px-1 text-[9px] font-extrabold">{bookedTxs.length}</span>}
            </span>
          );
          
          if (isRecep) {
            btnAction = (
              <div className="space-y-1.5">
                <div className="text-[10px] text-slate-700 truncate font-bold mb-0.5">
                  <i className="fa-solid fa-calendar-check text-blue-600 mr-1"></i> {activeTx ? activeTx.guestName : (bookedTxs[0]?.guestName || 'Reservasi')}
                </div>
                <button 
                  type="button"
                  onClick={() => openModal('modalCheckin', { roomId: room.id, actionType: 'CHECKIN', initialDate: realTodayStr })} 
                  className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow flex items-center justify-center space-x-1.5 transition cursor-pointer"
                  title="Pilih data tamu booking untuk proses check-in masuk kamar"
                >
                  <i className="fa-solid fa-door-open"></i>
                  <span>Check-In ({bookedTxs.length} Tamu Booking)</span>
                </button>
                <div className="grid grid-cols-2 gap-1.5">
                  <button 
                    type="button"
                    onClick={() => openModal('modalRoomDetail', { roomId: room.id })} 
                    className="py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs border border-slate-200 flex items-center justify-center space-x-1 transition cursor-pointer"
                    title="Buka rincian reservasi dan cetak invoice"
                  >
                    <i className="fa-solid fa-file-invoice text-indigo-600 text-[10px]"></i>
                    <span>Rincian</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => openModal('modalCheckoutSelection', { roomId: room.id, type: 'CANCEL' })} 
                    className="py-1 bg-red-50 text-red-700 hover:bg-red-100 font-semibold rounded-lg text-xs border border-red-200 flex items-center justify-center space-x-1 transition cursor-pointer"
                    title="Batalkan reservasi ini"
                  >
                    <i className="fa-solid fa-xmark text-[10px]"></i>
                    <span>Batal</span>
                  </button>
                </div>
              </div>
            );
          } else {
            btnAction = (
              <div className="space-y-1">
                <div className="text-[10px] text-blue-900 bg-blue-100/90 p-1.5 rounded-lg font-medium border border-blue-200">
                  <span className="font-bold">Booking:</span> {activeTx ? activeTx.guestName : (bookedTxs[0]?.guestName || 'Tamu Reservasi')}
                </div>
                {isQc && (
                  <button 
                    onClick={() => openModal('modalQcInspection', { room })} 
                    className="w-full py-1 bg-teal-50 text-teal-800 hover:bg-teal-100 font-semibold rounded text-[11px] border border-teal-200 transition"
                  >
                    <i className="fa-solid fa-clipboard-check mr-1"></i> Cek Kesiapan Kamar
                  </button>
                )}
              </div>
            );
          }
          break;
        }

        case 'TERISI': {
          const bookedTxs = transactions.filter(t => t.roomId === room.id && t.status === 'BOOKED');
          const terisiTxs = transactions.filter(t => t.roomId === room.id && t.status === 'TERISI');
          borderClass = 'border-emerald-300 bg-emerald-50/60';
          statusBadge = (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white flex items-center space-x-1">
              <span>Terisi</span>
              {terisiTxs.length > 1 && (
                <span className="bg-white text-emerald-800 rounded-full px-1.5 py-0 text-[9px] font-extrabold ml-1">
                  {terisiTxs.length} Tamu
                </span>
              )}
            </span>
          );

          if (isRecep) {
            btnAction = (
              <div className="space-y-1.5">
                <div className="text-[10px] text-slate-700 truncate font-bold mb-0.5 flex items-center justify-between">
                  <span className="truncate">
                    <i className="fa-solid fa-user text-emerald-600 mr-1"></i> 
                    {terisiTxs.length > 1 
                      ? `${terisiTxs[0].guestName} (+${terisiTxs.length - 1})` 
                      : (activeTx ? activeTx.guestName : 'Jemaah')}
                  </span>
                  {activeTx?.extraBed && (
                    <span className="text-[9px] px-1 py-0.2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded font-bold shrink-0 ml-1" title={`${activeTx.extraBedCount || 1} Extra Bed`}>
                      +{activeTx.extraBedCount || 1} Bed
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button 
                    type="button"
                    onClick={() => openModal('modalCheckoutSelection', { roomId: room.id, type: 'CHECKOUT' })} 
                    className="py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs shadow-xs flex items-center justify-center space-x-1 transition cursor-pointer"
                    title="Check-Out tamu dari kamar"
                  >
                    <i className="fa-solid fa-right-from-bracket text-[10px]"></i>
                    <span>Check-Out</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      const nextDate = activeTx ? addDaysToDateStr(activeTx.startDate, activeTx.duration) : addDaysToDateStr(evalDate, 1);
                      openModal('modalCheckin', { roomId: room.id, actionType: 'BOOKING', initialDate: nextDate });
                    }} 
                    className="py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold rounded-lg text-xs border border-blue-200 flex items-center justify-center space-x-1 transition cursor-pointer"
                    title="Booking untuk tanggal setelah tamu checkout"
                  >
                    <i className="fa-solid fa-calendar-plus text-blue-600 text-[10px]"></i>
                    <span>Booking Tgl Lain</span>
                  </button>
                </div>
                {bookedTxs.length > 0 ? (
                  <button 
                    type="button"
                    onClick={() => openModal('modalCheckoutSelection', { roomId: room.id, type: 'CANCEL' })} 
                    className="w-full py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold rounded-lg text-[11px] border border-amber-200 flex items-center justify-center space-x-1 transition cursor-pointer"
                    title="Batalkan reservasi booking tamu yang belum tiba"
                  >
                    <i className="fa-solid fa-ban text-amber-600"></i>
                    <span>Batalkan Booking ({bookedTxs.length})</span>
                  </button>
                ) : (
                  <button 
                    type="button"
                    onClick={() => openModal('modalRoomDetail', { roomId: room.id })}
                    className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs border border-slate-200 flex items-center justify-center space-x-1.5 transition cursor-pointer"
                    title="Buka rincian lengkap & administrasi kamar"
                  >
                    <i className="fa-solid fa-file-lines text-slate-500 text-[10px]"></i>
                    <span>Rincian Kamar</span>
                  </button>
                )}
              </div>
            );
          } else if (isKoperasi) {
            const hasBreakfast = activeTx?.breakfast;
            btnAction = (
              <div className="space-y-1.5">
                <div className="text-[10px] text-slate-800 bg-orange-50 border border-orange-200 p-1.5 rounded-lg font-medium">
                  <div className="font-bold text-orange-950 truncate">{activeTx?.guestName || 'Tamu Menginap'}</div>
                  <div className="text-[9px] text-orange-800 mt-0.5">
                    {hasBreakfast ? `🍱 ${activeTx?.breakfastMenu} (${activeTx?.breakfastPortions || 1} Porsi)` : '❌ Tidak Pesan Sarapan'}
                  </div>
                </div>
                <button 
                  onClick={() => setActiveTab('pesananSarapan')} 
                  className="w-full py-1 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded text-xs transition"
                >
                  <i className="fa-solid fa-utensils mr-1"></i> Buka Pesanan Dapur
                </button>
              </div>
            );
          } else {
            btnAction = (
              <div className="space-y-1">
                <div className="text-[10px] text-emerald-900 bg-emerald-50 border border-emerald-200 p-1.5 rounded font-medium">
                  <span className="font-bold">Tamu Menginap:</span> {activeTx?.guestName || 'Jemaah'}
                </div>
                <button 
                  onClick={() => openModal('modalMaintenance', { roomId: room.id })} 
                  className="w-full py-1 bg-amber-50 text-amber-800 hover:bg-amber-100 font-semibold rounded text-[11px] border border-amber-200 transition"
                >
                  <i className="fa-solid fa-wrench mr-1 text-amber-600"></i> Lapor Kendala Kamar
                </button>
              </div>
            );
          }
          break;
        }

        case 'MAINTENANCE': {
          const roomMaint = maintenances.find(m => m.id === room.activeMaintId || (m.roomId === room.id && m.status !== 'SELESAI'));
          const isWaitingQc = room.qcStatus === 'MENUNGGU_QC' || roomMaint?.status === 'MENUNGGU_QC';

          if (isWaitingQc) {
            borderClass = 'border-purple-300 bg-purple-50/70';
            statusBadge = <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-700 text-white animate-pulse">Menunggu QC</span>;
            btnAction = (
              <div className="space-y-1.5">
                {isQc ? (
                  <button 
                    onClick={() => openModal('modalQcInspection', { room })} 
                    className="w-full py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-lg text-xs shadow flex items-center justify-center space-x-1.5 transition"
                    title="Lakukan inspeksi kelayakan kamar untuk lolos QC"
                  >
                    <i className="fa-solid fa-clipboard-check"></i>
                    <span>Inspeksi QC Kamar</span>
                  </button>
                ) : isTeknisi ? (
                  <button 
                    onClick={() => { if (roomMaint) openModal('modalUpdateMaintenance', { maintenance: roomMaint }); }} 
                    className="w-full py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs shadow flex items-center justify-center space-x-1.5 transition"
                    title="Lihat status verifikasi QC"
                  >
                    <i className="fa-solid fa-clock-rotate-left"></i>
                    <span>Telah Diperbaiki (Menunggu QC)</span>
                  </button>
                ) : (
                  <div className="w-full py-1 px-1.5 bg-purple-100 text-purple-900 rounded text-[10px] font-bold border border-purple-200 text-center">
                    Menunggu Verifikasi QC
                  </div>
                )}
                {isRecep && (
                  <button 
                    onClick={() => openModal('modalCheckin', { roomId: room.id, actionType: 'BOOKING', initialDate: addDaysToDateStr(evalDate, 1) })} 
                    className="w-full py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold rounded-lg text-xs border border-blue-200 flex items-center justify-center space-x-1.5 transition"
                    title="Booking untuk jadwal tanggal berikutnya"
                  >
                    <i className="fa-solid fa-calendar-plus text-blue-600"></i>
                    <span>Booking Tgl Lain (+1 Hari)</span>
                  </button>
                )}
              </div>
            );
          } else {
            borderClass = 'border-amber-300 bg-amber-50/70';
            statusBadge = <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-600 text-white">Maintenance</span>;
            btnAction = (
              <div className="space-y-1.5">
                {isManagerTek && roomMaint?.status === 'MENUNGGU_PENUGASAN' ? (
                  <button 
                    onClick={() => openModal('modalAssignTechnician', { maintenance: roomMaint })} 
                    className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs shadow flex items-center justify-center space-x-1.5 transition"
                  >
                    <i className="fa-solid fa-user-plus"></i>
                    <span>Tugaskan Teknisi</span>
                  </button>
                ) : isTeknisi ? (
                  <button 
                    onClick={() => {
                      if (roomMaint) {
                        openModal('modalUpdateMaintenance', { maintenance: roomMaint });
                      } else {
                        finishMaintenance(room.id);
                      }
                    }} 
                    className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs shadow flex items-center justify-center space-x-1.5 transition"
                    title="Update status perbaikan atau laporkan selesai"
                  >
                    <i className="fa-solid fa-wrench"></i>
                    <span>Update / Selesai Perbaikan</span>
                  </button>
                ) : (
                  <div className="w-full py-1 px-1.5 bg-amber-100/90 text-amber-900 rounded text-[10px] font-bold border border-amber-200 text-center flex items-center justify-center space-x-1">
                    <i className="fa-solid fa-wrench text-amber-700 text-[10px]"></i>
                    <span>Sedang Dikerjakan Teknisi</span>
                  </div>
                )}
                {isRecep && (
                  <button 
                    onClick={() => openModal('modalCheckin', { roomId: room.id, actionType: 'BOOKING', initialDate: addDaysToDateStr(evalDate, 1) })} 
                    className="w-full py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold rounded-lg text-xs border border-blue-200 flex items-center justify-center space-x-1.5 transition"
                    title="Booking untuk jadwal tanggal berikutnya"
                  >
                    <i className="fa-solid fa-calendar-plus text-blue-600"></i>
                    <span>Booking Tgl Lain (+1 Hari)</span>
                  </button>
                )}
              </div>
            );
          }
          break;
        }
      }
    }

    const hasOccupant = !!activeTx;

    return (
      <div 
        key={room.id} 
        className={`p-3 rounded-xl border ${borderClass} shadow-xs flex flex-col justify-between space-y-2.5 relative group hover:shadow-md transition bg-white`}
      >
        <div>
          <div className="flex items-start justify-between gap-1.5">
            <button 
              type="button"
              onClick={() => openModal('modalRoomDetail', { roomId: room.id })}
              className="font-bold text-xs text-slate-800 hover:text-hajj-800 flex items-start gap-2 text-left cursor-pointer min-w-0 flex-1 group/btn"
              title="Klik untuk melihat rincian & kelola kamar ini"
            >
              <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg ${
                isAula ? 'bg-purple-100 text-purple-900 border border-purple-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
              } shrink-0 shadow-2xs`}>
                <i className={`fa-solid ${isAula ? 'fa-landmark text-xs text-purple-700' : 'fa-bed text-xs text-slate-600'}`}></i>
              </span>
              <div className="min-w-0 flex-1 flex flex-col justify-center">
                <span className="font-bold text-xs text-slate-900 leading-tight break-words block group-hover/btn:text-hajj-700">
                  {isAula ? room.roomNumber : `Kamar ${room.roomNumber}`}
                </span>
                <span className="text-[10px] text-slate-500 font-medium leading-tight block truncate mt-0.5">
                  {isAula ? 'Ruang Pertemuan (Aula / Rapat)' : `${room.building} • Hunian`}
                </span>
              </div>
            </button>
            <div className="shrink-0 pt-0.5">
              {statusBadge}
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-1.5 border-t border-slate-100">
            <span className="inline-flex items-center space-x-1 font-medium">
              <i className={`fa-solid ${isAula ? 'fa-users-line text-hajj-700' : 'fa-users text-slate-400'} text-[10px]`}></i>
              <span>{room.capacity} {isAula ? 'Pax' : 'Orang'}</span>
            </span>
            {isAula ? (
              <span className="text-[9px] font-semibold text-hajj-900 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                Aula / Rapat
              </span>
            ) : (
              <span className="text-[9px] text-slate-500 font-medium bg-slate-100 px-1.5 py-0.5 rounded">
                {room.type || 'Standar'}
              </span>
            )}
          </div>
        </div>

        <div className="pt-1 border-t border-slate-100 space-y-1">
          {btnAction}
          <button 
            type="button"
            onClick={() => openModal('modalMaintenance', { roomId: room.id })} 
            title="Set Maintenance" 
            className="w-full text-center text-[10px] text-slate-400 hover:text-amber-700 py-0.5 mt-0.5 block cursor-pointer transition"
          >
            <i className="fa-solid fa-wrench mr-1"></i>
            <span>Sub-Perawatan</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Filter & Display Controls Bar */}
      <div className="bg-white p-3 rounded-xl shadow-xs border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <select value={bFilter} onChange={e => setBFilter(e.target.value)} className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-hajj-600 outline-none">
            <option value="ALL">Semua Gedung, Kamar & Ruang Pertemuan</option>
            <option value="Gedung A (Arafah)">Gedung A (Arafah) - 50 Kamar</option>
            <option value="Gedung B (Muzdalifah)">Gedung B (Muzdalifah) - 50 Kamar</option>
            <option value="Gedung C (Mina)">Gedung C (Mina) - 50 Kamar</option>
            <option value="Gedung D (Madinah)">Gedung D (Madinah) - 50 Kamar</option>
            <option value="Ruang Pertemuan">Gedung dan Ruang Pertemuan (13 Aula / Rapat)</option>
          </select>
          <select value={sFilter} onChange={e => setSFilter(e.target.value)} className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-hajj-600 outline-none">
            <option value="ALL">Semua Status</option>
            <option value="KOSONG">Kosong (Tersedia)</option>
            <option value="TERISI">Terisi (Check-In)</option>
            <option value="BOOKED">Booked (Reservasi)</option>
            <option value="MAINTENANCE">Maintenance</option>
          </select>

          {/* Dropdown for hiding rooms */}
          <select 
            value={globalDisplay}
            onChange={e => handleGlobalDisplayChange(e.target.value as 'COLLAPSE' | 'EXPAND')} 
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-hajj-600 outline-none font-semibold text-slate-800"
          >
            <option value="COLLAPSE">Sembunyikan Kamar (Nama Gedung Saja)</option>
            <option value="EXPAND">Semua Kamar Terbuka</option>
          </select>
        </div>

        <div className="relative">
          <input 
            type="text" 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari No Kamar / Aula..." 
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 pl-8 focus:ring-2 focus:ring-hajj-600 outline-none w-48 sm:w-60" 
          />
          <i className="fa-solid fa-magnifying-glass absolute left-2.5 top-2.5 text-slate-400 text-xs"></i>
        </div>
      </div>

      <div className="space-y-6">
        {buildingNames.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-400">
            <i className="fa-solid fa-building-circle-xmark text-4xl mb-2"></i>
            <p className="text-xs font-semibold">Tidak ada kamar atau gedung yang sesuai dengan filter pencarian.</p>
          </div>
        ) : (
          buildingNames.map(bName => {
            const bRooms = grouped[bName];
            const isCollapsed = isBuildingCollapsed(bName);
            return (
              <div key={bName} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm space-y-3 transition">
                {/* Building Header / Accordion Dropdown */}
                <div 
                  onClick={() => toggleBuilding(bName)}
                  className="bg-slate-100 px-5 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer hover:bg-slate-200/75 transition select-none"
                  title="Klik untuk menyembunyikan / menampilkan kamar"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-9 h-9 rounded-xl ${
                      bName === 'Ruang Pertemuan' 
                        ? 'bg-purple-700 text-white border border-purple-800 shadow-xs' 
                        : bName.includes('Arafah')
                        ? 'bg-emerald-800 text-emerald-100 border border-emerald-700 shadow-xs'
                        : bName.includes('Muzdalifah')
                        ? 'bg-blue-800 text-blue-100 border border-blue-700 shadow-xs'
                        : bName.includes('Mina')
                        ? 'bg-teal-800 text-teal-100 border border-teal-700 shadow-xs'
                        : 'bg-amber-800 text-amber-100 border border-amber-700 shadow-xs'
                    } flex items-center justify-center font-bold text-sm shrink-0`}>
                      <i className={`fa-solid ${
                        bName === 'Ruang Pertemuan' ? 'fa-landmark' :
                        bName.includes('Arafah') ? 'fa-kaaba' :
                        bName.includes('Muzdalifah') ? 'fa-mosque' :
                        bName.includes('Mina') ? 'fa-tents' :
                        bName.includes('Madinah') ? 'fa-archway' : 'fa-building'
                      }`}></i>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-sm text-slate-900">
                          {bName === 'Ruang Pertemuan' ? 'Gedung dan Ruang Pertemuan (Aula / Rapat)' : `${bName} (Kamar Hunian)`}
                        </h3>
                        {isCollapsed && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] rounded font-semibold border border-amber-200">
                            {bName === 'Ruang Pertemuan' ? 'Ruang Disembunyikan' : 'Kamar Disembunyikan'}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {bRooms.length} {bName === 'Ruang Pertemuan' ? 'Ruang Pertemuan' : 'Kamar Hunian'} | {OFFICIAL_TARIFFS[bName]?.desc || 'Tarif Resmi UPT'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded font-semibold">{bRooms.filter(r => r.status === 'KOSONG').length} Tersedia</span>
                      {bName !== 'Ruang Pertemuan' && (
                        <span className="px-2 py-1 bg-emerald-600 text-white rounded font-semibold">{bRooms.filter(r => r.status === 'TERISI').length} Terisi</span>
                      )}
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded font-semibold">{bRooms.filter(r => r.status === 'BOOKED').length} Booked</span>
                      <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded font-semibold">{bRooms.filter(r => r.status === 'MAINTENANCE').length} Maint</span>
                    </div>

                    <button
                      type="button"
                      className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-300/60 transition"
                      aria-label={isCollapsed ? 'Tampilkan Kamar' : 'Sembunyikan Kamar'}
                    >
                      <i className={`fa-solid fa-chevron-${isCollapsed ? 'down' : 'up'}`}></i>
                    </button>
                  </div>
                </div>

                {/* Rooms Grid */}
                {!isCollapsed && (
                  <div className={`p-4 grid gap-3.5 ${
                    bName === 'Ruang Pertemuan'
                      ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                      : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
                  }`}>
                    {bRooms.map(r => getRoomCard(r))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
