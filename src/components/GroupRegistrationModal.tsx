import React, { useState, useEffect } from 'react';
import { useAppContext } from '../store';
import { GroupType, Transaction, Room } from '../types';
import { getRealTodayDate, formatIndonesianDate, addDaysToDateStr } from '../lib/utils';

interface GroupRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultGroupType?: GroupType;
}

export function GroupRegistrationModal({ isOpen, onClose, defaultGroupType = 'INSTANSI' }: GroupRegistrationModalProps) {
  const { rooms, currentUser, addGroupBooking, showToast } = useAppContext();

  const [groupType, setGroupType] = useState<GroupType>(defaultGroupType);
  const [groupName, setGroupName] = useState('');
  const [picName, setPicName] = useState('');
  const [picPhone, setPicPhone] = useState('');
  const [agencyOrDocument, setAgencyOrDocument] = useState('');
  const [estimatedMembers, setEstimatedMembers] = useState<number>(20);
  const [startDate, setStartDate] = useState(getRealTodayDate());
  const [duration, setDuration] = useState<number>(2);
  const [statusMode, setStatusMode] = useState<'TERISI' | 'BOOKED'>('TERISI');

  useEffect(() => {
    if (isOpen) {
      setGroupType(defaultGroupType);
      if (defaultGroupType === 'JEMAAH_HAJI') {
        if (!agencyOrDocument) setAgencyOrDocument('JKG-');
      }
    }
  }, [isOpen, defaultGroupType]);

  // Facilities allocation
  const [selectedBuildingFilter, setSelectedBuildingFilter] = useState<string>('ALL');
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [selectedMeetingRoomId, setSelectedMeetingRoomId] = useState<string>('');

  // Additional services
  const [includeBreakfast, setIncludeBreakfast] = useState(true);
  const [breakfastMenu, setBreakfastMenu] = useState('Nasi Goreng Spesial & Telur Ceplok');
  const [breakfastPortions, setBreakfastPortions] = useState<number>(20);
  const [includeExtraBed, setIncludeExtraBed] = useState(false);
  const [extraBedCount, setExtraBedCount] = useState<number>(4);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  // Filter available rooms (only empty or currently unbooked)
  const emptyRooms = rooms.filter(r => r.building !== 'Ruang Pertemuan' && r.status === 'KOSONG');
  const emptyMeetingRooms = rooms.filter(r => r.building === 'Ruang Pertemuan' && r.status === 'KOSONG');

  const filteredAvailableRooms = emptyRooms.filter(r => {
    if (selectedBuildingFilter === 'ALL') return true;
    return r.building.includes(selectedBuildingFilter);
  });

  const buildings = [
    { id: 'ALL', label: 'Semua Gedung' },
    { id: 'Gedung A', label: 'Gedung A (Arafah)' },
    { id: 'Gedung B', label: 'Gedung B (Mina)' },
    { id: 'Gedung C', label: 'Gedung C (Muzdalifah)' },
    { id: 'Gedung D', label: 'Gedung D (Madinah)' },
  ];

  const toggleRoomSelection = (roomId: string) => {
    setSelectedRoomIds(prev => 
      prev.includes(roomId) ? prev.filter(id => id !== roomId) : [...prev, roomId]
    );
  };

  const handleSelectAllInBuilding = () => {
    const idsInFilter = filteredAvailableRooms.map(r => r.id);
    const allSelected = idsInFilter.every(id => selectedRoomIds.includes(id));
    if (allSelected) {
      setSelectedRoomIds(prev => prev.filter(id => !idsInFilter.includes(id)));
    } else {
      setSelectedRoomIds(prev => Array.from(new Set([...prev, ...idsInFilter])));
    }
  };

  const handleQuickAutoSelect = (count: number) => {
    const toPick = filteredAvailableRooms.slice(0, count).map(r => r.id);
    setSelectedRoomIds(toPick);
    setBreakfastPortions(toPick.length * 4);
    setEstimatedMembers(toPick.length * 4);
  };

  const calculateTotalBeds = () => {
    const selected = rooms.filter(r => selectedRoomIds.includes(r.id));
    return selected.reduce((sum, r) => {
      const cap = parseInt(r.capacity) || 4;
      return sum + cap;
    }, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!groupName.trim()) {
      showToast('Mohon isi nama rombongan atau instansi!', 'warning');
      return;
    }

    if (!picName.trim()) {
      showToast('Mohon isi nama PIC / Koordinator rombongan!', 'warning');
      return;
    }

    if (selectedRoomIds.length === 0 && !selectedMeetingRoomId) {
      showToast('Mohon pilih minimal 1 kamar atau 1 ruang pertemuan untuk rombongan!', 'warning');
      return;
    }

    const groupId = `GRP-${Date.now().toString().slice(-5)}`;
    const newTransactions: Transaction[] = [];

    // Create transactions for each room
    selectedRoomIds.forEach((rId, idx) => {
      const roomObj = rooms.find(r => r.id === rId);
      if (!roomObj) return;

      const txId = `TRX-${Date.now().toString().slice(-4)}${idx + 1}`;
      newTransactions.push({
        id: txId,
        roomId: roomObj.id,
        building: roomObj.building,
        roomNumber: roomObj.roomNumber,
        category: groupType === 'JEMAAH_HAJI' ? 'JEMAAH' : 'UMUM',
        guestName: groupName,
        kloter: groupType === 'JEMAAH_HAJI' ? (agencyOrDocument || 'Haji') : (agencyOrDocument || '-'),
        startDate,
        duration,
        durationUnit: 'Malam',
        phone: picPhone,
        notes: `[Rombongan: ${groupName}] PIC: ${picName} (${picPhone}). ${notes ? 'Catatan: ' + notes : ''}`,
        status: statusMode,
        createdUser: currentUser?.username || 'admin',
        groupType,
        groupName,
        groupPic: picName,
        groupId,
        breakfast: includeBreakfast,
        breakfastMenu: includeBreakfast ? breakfastMenu : undefined,
        breakfastPortions: includeBreakfast ? Math.max(1, Math.round(breakfastPortions / Math.max(1, selectedRoomIds.length))) : undefined,
        breakfastDays: includeBreakfast ? duration : undefined,
        breakfastStatus: includeBreakfast ? 'MENUNGGU' : undefined,
        extraBed: includeExtraBed,
        extraBedCount: includeExtraBed ? Math.ceil(extraBedCount / Math.max(1, selectedRoomIds.length)) : undefined,
      });
    });

    // If meeting room is selected as well
    if (selectedMeetingRoomId) {
      const meetingObj = rooms.find(r => r.id === selectedMeetingRoomId);
      if (meetingObj) {
        const meetingTxId = `TRX-AULA-${Date.now().toString().slice(-4)}`;
        newTransactions.push({
          id: meetingTxId,
          roomId: meetingObj.id,
          building: meetingObj.building,
          roomNumber: meetingObj.roomNumber,
          category: 'UMUM',
          guestName: `${groupName} (Kegiatan Aula/Rapat)`,
          kloter: agencyOrDocument || '-',
          startDate,
          duration: 12,
          durationUnit: 'Jam',
          phone: picPhone,
          notes: `[Sewa Aula Rombongan: ${groupName}] PIC: ${picName}. ${notes}`,
          status: statusMode,
          createdUser: currentUser?.username || 'admin',
          groupType,
          groupName,
          groupPic: picName,
          groupId,
        });
      }
    }

    addGroupBooking(newTransactions, groupName);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[94vh] my-auto animate-in fade-in zoom-in duration-150">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-hajj-900 via-hajj-800 to-slate-900 px-6 py-4 text-white flex items-center justify-between shrink-0 border-b border-gold-500/30">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gold-500 text-slate-950 flex items-center justify-center text-lg font-black shadow-md border border-gold-400">
              <i className="fa-solid fa-users-rectangle"></i>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base tracking-wide text-white">
                  Pendaftaran Data Rombongan Baru
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gold-400 text-slate-950">
                  Kolektif
                </span>
              </div>
              <p className="text-xs text-gold-200">
                Registrasi pemesanan untuk Jemaah Haji, Instansi/Kementerian, atau Tamu Umum Rombongan
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-white/70 hover:text-white text-lg p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 text-xs overflow-y-auto flex-1 custom-scrollbar bg-slate-50/50">
          
          {/* 1. Pilih Tipe Rombongan */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              1. Pilih Kategori Rombongan <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option: Jemaah Haji / Umrah */}
              <div
                onClick={() => {
                  setGroupType('JEMAAH_HAJI');
                  if (!agencyOrDocument) setAgencyOrDocument('JKG-');
                }}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                  groupType === 'JEMAAH_HAJI'
                    ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2.5 mb-1.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                    groupType === 'JEMAAH_HAJI' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <i className="fa-solid fa-kaaba"></i>
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">Jemaah Haji / Umrah</h4>
                    <span className="text-[10px] text-slate-500">Kloter, KBIHU, Biro Travel</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-600 line-clamp-2">
                  Alokasi rombongan transit embarkasi, kepulangan jemaah haji, atau pembinaan manasik.
                </p>
              </div>

              {/* Option: Instansi / Kementerian / Lembaga */}
              <div
                onClick={() => setGroupType('INSTANSI')}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                  groupType === 'INSTANSI'
                    ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-500/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2.5 mb-1.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                    groupType === 'INSTANSI' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <i className="fa-solid fa-building-columns"></i>
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">Instansi / Lembaga</h4>
                    <span className="text-[10px] text-slate-500">Kementerian, BUMN, Pemda</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-600 line-clamp-2">
                  Kegiatan kedinasan, diklat kementerian, rapat kerja lembaga, atau seminar instansi.
                </p>
              </div>

              {/* Option: Tamu Umum Rombongan */}
              <div
                onClick={() => setGroupType('UMUM')}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                  groupType === 'UMUM'
                    ? 'border-amber-600 bg-amber-50/80 ring-2 ring-amber-500/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2.5 mb-1.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                    groupType === 'UMUM' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <i className="fa-solid fa-people-group"></i>
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">Tamu Umum Rombongan</h4>
                    <span className="text-[10px] text-slate-500">Keluarga, Majelis, Komunitas</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-600 line-clamp-2">
                  Pemesanan rombongan keluarga besar, wisata religi, reuni alumni, atau ziarah.
                </p>
              </div>
            </div>
          </div>

          {/* 2. Informasi Utama Rombongan */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-100 pb-2">
              <i className="fa-solid fa-id-card text-hajj-700"></i>
              <span>2. Informasi Identitas & Penanggung Jawab Rombongan</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Rombongan / Nama Instansi <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder={
                    groupType === 'JEMAAH_HAJI' 
                      ? 'Contoh: KBIHU Al-Mabruur Kloter JKG-04' 
                      : groupType === 'INSTANSI'
                      ? 'Contoh: Pusdiklat Balai Litbang Kemenag RI'
                      : 'Contoh: Rombongan Keluarga Besar H. Abdullah'
                  }
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-hajj-600 focus:bg-white outline-none font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama PIC / Ketua Rombongan / Kontak <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={picName}
                  onChange={(e) => setPicName(e.target.value)}
                  placeholder="Contoh: Drs. H. Ahmad Fauzi, M.Pd"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-hajj-600 focus:bg-white outline-none font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nomor HP / WhatsApp PIC <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="tel" 
                  value={picPhone}
                  onChange={(e) => setPicPhone(e.target.value)}
                  placeholder="Contoh: 0812-3456-7890"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-hajj-600 focus:bg-white outline-none font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {groupType === 'JEMAAH_HAJI' ? 'No. Kloter / Kode Rombongan' : 'No. Surat Tugas / Dokumen Resmi (Opsional)'}
                </label>
                <input 
                  type="text" 
                  value={agencyOrDocument}
                  onChange={(e) => setAgencyOrDocument(e.target.value)}
                  placeholder={groupType === 'JEMAAH_HAJI' ? 'Contoh: JKG-04' : 'Contoh: B-1044/DJ.I/HM.01/05/2026'}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-hajj-600 focus:bg-white outline-none font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Estimasi Jumlah Peserta / Jemaah (Orang)
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    min={1}
                    value={estimatedMembers}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setEstimatedMembers(val);
                      if (includeBreakfast) setBreakfastPortions(val);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-hajj-600 focus:bg-white outline-none font-medium"
                  />
                  <span className="absolute right-3 top-2 text-slate-400 text-xs">Orang</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Status Penerimaan Rombongan <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStatusMode('TERISI')}
                    className={`py-2 px-3 rounded-lg font-bold border text-center cursor-pointer transition ${
                      statusMode === 'TERISI' 
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs' 
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <i className="fa-solid fa-door-open mr-1.5"></i>
                    Langsung Check-In
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusMode('BOOKED')}
                    className={`py-2 px-3 rounded-lg font-bold border text-center cursor-pointer transition ${
                      statusMode === 'BOOKED' 
                        ? 'bg-blue-600 text-white border-blue-700 shadow-xs' 
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <i className="fa-solid fa-calendar-plus mr-1.5"></i>
                    Reservasi / Booking
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tanggal Masuk (Check-In) <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-hajj-600 focus:bg-white outline-none font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Durasi Menginap (Malam) <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center space-x-2">
                  <input 
                    type="number" 
                    min={1} 
                    max={60}
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                    required
                    className="w-24 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-hajj-600 focus:bg-white outline-none font-medium text-center"
                  />
                  <span className="text-slate-500 font-medium">Malam (Check-Out: {formatIndonesianDate(addDaysToDateStr(startDate, duration))})</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Alokasi Kamar Rombongan */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <div>
                <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <i className="fa-solid fa-bed text-emerald-700"></i>
                  <span>3. Alokasi Kamar Rombongan</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Pilih kamar kosong untuk ditempati rombongan ({emptyRooms.length} kamar kosong tersedia)
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg border border-emerald-200">
                  {selectedRoomIds.length} Kamar Terpilih ({calculateTotalBeds()} Tempat Tidur)
                </span>
                <button
                  type="button"
                  onClick={handleSelectAllInBuilding}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg border border-slate-300 cursor-pointer transition"
                >
                  Pilih Semua di Gedung Ini
                </button>
              </div>
            </div>

            {/* Quick Auto-Select Helper */}
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex flex-wrap items-center gap-2 text-[11px]">
              <span className="font-bold text-slate-700">Pilih Cepat Berdasarkan Kebutuhan:</span>
              {[2, 4, 6, 8, 10].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleQuickAutoSelect(n)}
                  className="px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-700 font-medium rounded border border-slate-300 shadow-2xs cursor-pointer"
                >
                  + {n} Kamar
                </button>
              ))}
              {selectedRoomIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedRoomIds([])}
                  className="px-2 py-0.5 text-rose-600 hover:underline font-bold ml-auto"
                >
                  Reset Pilihan
                </button>
              )}
            </div>

            {/* Building Filter Pills */}
            <div className="flex flex-wrap gap-1.5">
              {buildings.map(b => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSelectedBuildingFilter(b.id)}
                  className={`px-3 py-1 rounded-full font-bold transition cursor-pointer text-[11px] ${
                    selectedBuildingFilter === b.id
                      ? 'bg-hajj-800 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>

            {/* Room Selection Grid */}
            {filteredAvailableRooms.length === 0 ? (
              <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Tidak ada kamar kosong yang tersedia pada filter gedung ini.
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1 custom-scrollbar">
                {filteredAvailableRooms.map(r => {
                  const isSelected = selectedRoomIds.includes(r.id);
                  return (
                    <div
                      key={r.id}
                      onClick={() => toggleRoomSelection(r.id)}
                      className={`p-2 rounded-xl border text-center cursor-pointer transition flex flex-col items-center justify-center space-y-0.5 ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-500 text-white font-black shadow-xs ring-2 ring-emerald-300'
                          : 'border-slate-200 bg-white hover:border-slate-400 text-slate-800'
                      }`}
                    >
                      <div className="text-[10px] opacity-80">{r.building.split(' ')[1] || r.building}</div>
                      <div className="text-xs font-bold">{r.roomNumber}</div>
                      <div className="text-[9px] opacity-75">{r.capacity} Bed</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. Sewa Ruang Pertemuan (Aula) Tambahan - Opsional */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <i className="fa-solid fa-landmark text-purple-700"></i>
                  <span>4. Alokasi Ruang Pertemuan / Aula (Opsional)</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Khusus rombongan/instansi yang membutuhkan aula koordinasi, rapat kerja, atau manasik
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Pilih Ruang Pertemuan / Aula
                </label>
                <select
                  value={selectedMeetingRoomId}
                  onChange={(e) => setSelectedMeetingRoomId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-purple-600 focus:bg-white outline-none font-medium"
                >
                  <option value="">-- Tidak Memerlukan Sewa Aula --</option>
                  {emptyMeetingRooms.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.roomNumber} (Kapasitas: {m.capacity})
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-[11px] text-slate-500 flex items-center p-2.5 bg-purple-50 rounded-lg border border-purple-100">
                <i className="fa-solid fa-circle-info text-purple-600 text-sm mr-2 shrink-0"></i>
                <span>Ruang pertemuan yang dipilih akan otomatis didaftarkan dalam 1 kesatuan berkas rombongan.</span>
              </div>
            </div>
          </div>

          {/* 5. Layanan Konsumsi Sarapan & Tambahan */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-100 pb-2">
              <i className="fa-solid fa-utensils text-orange-600"></i>
              <span>5. Paket Konsumsi Koperasi & Layanan Tambahan</span>
            </h4>

            <div className="space-y-3">
              <label className="flex items-center space-x-2 cursor-pointer font-bold text-slate-800">
                <input 
                  type="checkbox"
                  checked={includeBreakfast}
                  onChange={(e) => setIncludeBreakfast(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <span>Termasuk Paket Sarapan Koperasi untuk Rombongan</span>
              </label>

              {includeBreakfast && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-6 pt-1">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Pilihan Menu Sarapan Pagi
                    </label>
                    <select
                      value={breakfastMenu}
                      onChange={(e) => setBreakfastMenu(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none font-medium"
                    >
                      <option value="Nasi Goreng Spesial & Telur Ceplok">Nasi Goreng Spesial & Telur Ceplok</option>
                      <option value="Lontong Sayur Betawi & Telur Balado">Lontong Sayur Betawi & Telur Balado</option>
                      <option value="Bubur Ayam Komplit Asrama Haji">Bubur Ayam Komplit Asrama Haji</option>
                      <option value="Nasi Uduk Gurih & Semur Tahu">Nasi Uduk Gurih & Semur Tahu</option>
                      <option value="Nasi Kuning Nusantara & Orek Tempe">Nasi Kuning Nusantara & Orek Tempe</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Total Porsi Sarapan per Hari
                    </label>
                    <div className="relative">
                      <input 
                        type="number"
                        min={1}
                        value={breakfastPortions}
                        onChange={(e) => setBreakfastPortions(parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none font-medium"
                      />
                      <span className="absolute right-3 top-2 text-slate-400 text-xs">Porsi</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <label className="flex items-center space-x-2 cursor-pointer font-bold text-slate-800">
                  <input 
                    type="checkbox"
                    checked={includeExtraBed}
                    onChange={(e) => setIncludeExtraBed(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span>Kebutuhan Kasur Lipat Tambahan (Extra Bed)</span>
                </label>

                {includeExtraBed && (
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-600 font-medium">Jumlah:</span>
                    <input 
                      type="number"
                      min={1}
                      max={50}
                      value={extraBedCount}
                      onChange={(e) => setExtraBedCount(parseInt(e.target.value) || 1)}
                      className="w-20 px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-center font-bold text-slate-900"
                    />
                    <span className="text-slate-500">Unit</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Catatan Khusus Kebutuhan Rombongan
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Rombongan tiba dengan 2 bus pariwisata jam 14:00. Mohon bantuan pengangkutan koper dan briefing singkat di lobi."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-hajj-600 focus:bg-white outline-none font-medium"
                ></textarea>
              </div>
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="text-slate-500 text-xs">
              Total Fasilitas: <strong className="text-slate-800">{selectedRoomIds.length} Kamar {selectedMeetingRoomId ? '+ 1 Ruang Pertemuan' : ''}</strong>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold rounded-xl shadow-md transition flex items-center space-x-2 cursor-pointer"
              >
                <i className="fa-solid fa-check"></i>
                <span>Simpan & Daftarkan Rombongan</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
