import { useState, useRef, useEffect } from 'react';
import { useAppContext, isSuperAdmin } from '../store';
import { OperationalNotifications, OperationalSummaryRibbon } from './OperationalNotifications';

export function Header() {
  const { currentUser, login, logout, activeTab, setActiveTab, openModal, users, showToast } = useAppContext();
  const [isSwitchOpen, setIsSwitchOpen] = useState(false);
  const switchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (switchRef.current && !switchRef.current.contains(e.target as Node)) {
        setIsSwitchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentUser) return null;

  const ALL_TABS_CONFIG = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: 'fa-chart-pie', 
      roles: ['Super Admin', 'Admin', 'Manager Resepsionis', 'Resepsionis', 'Manager QC', 'Quality Control', 'Manager Teknisi', 'Teknisi', 'Manager Koperasi', 'Petugas Koperasi', 'Koperasi', 'Manager'] 
    },
    { 
      id: 'gedung', 
      label: 'Gedung, Kamar & Ruang Pertemuan', 
      icon: 'fa-building', 
      roles: ['Super Admin', 'Admin', 'Manager Resepsionis', 'Resepsionis', 'Manager QC', 'Quality Control', 'Manager Teknisi', 'Teknisi', 'Manager Koperasi', 'Petugas Koperasi', 'Koperasi', 'Manager'] 
    },
    { 
      id: 'qualityControl', 
      label: 'Quality Control (QC)', 
      icon: 'fa-clipboard-check', 
      roles: ['Super Admin', 'Admin', 'Manager QC', 'Quality Control', 'Manager Resepsionis', 'Manager'] 
    },
    { 
      id: 'pesananSarapan', 
      label: 'Pesanan Sarapan', 
      icon: 'fa-utensils', 
      roles: ['Super Admin', 'Admin', 'Manager Koperasi', 'Petugas Koperasi', 'Manager Resepsionis', 'Resepsionis', 'Manager', 'Koperasi'] 
    },
    { 
      id: 'laporanMaintenance', 
      label: 'Laporan Maintenance', 
      icon: 'fa-screwdriver-wrench', 
      roles: ['Super Admin', 'Admin', 'Manager Teknisi', 'Teknisi', 'Manager QC', 'Quality Control', 'Manager Resepsionis', 'Manager'] 
    },
    { 
      id: 'laporanKamar', 
      label: 'Laporan Kamar & Booking', 
      icon: 'fa-file-invoice', 
      roles: ['Super Admin', 'Admin', 'Manager Resepsionis', 'Resepsionis', 'Manager'] 
    },
    { 
      id: 'auditLog', 
      label: 'Log Aktivitas & Shift', 
      icon: 'fa-clock-rotate-left', 
      roles: ['Super Admin', 'Admin', 'Manager Resepsionis', 'Manager QC', 'Manager Teknisi', 'Manager Koperasi', 'Manager'] 
    }
  ];

  const getDefaultTabForRole = (_role: string): string => {
    return 'dashboard';
  };

  const handleSwitchAccount = (user: typeof users[0]) => {
    login(user);
    setIsSwitchOpen(false);
    setActiveTab('dashboard');
    showToast(`Beralih akun: ${user.fullName} (${user.role}) - Membuka Dashboard`, 'success');
  };

  const tabs = ALL_TABS_CONFIG.filter(tab => tab.roles.includes(currentUser.role));

  // Group users for switcher dropdown
  const divisions = [
    { name: 'Super Admin', color: 'text-purple-600', users: users.filter(u => u.role === 'Super Admin' || u.role === 'Admin') },
    { name: 'Divisi Resepsionis', color: 'text-blue-600', users: users.filter(u => u.role.includes('Resepsionis')) },
    { name: 'Divisi Quality Control', color: 'text-teal-600', users: users.filter(u => u.role.includes('QC') || u.role.includes('Quality')) },
    { name: 'Divisi Teknisi', color: 'text-amber-600', users: users.filter(u => u.role.includes('Teknisi')) },
    { name: 'Divisi Koperasi', color: 'text-orange-600', users: users.filter(u => u.role.includes('Koperasi')) },
  ];

  return (
    <header className="bg-gradient-to-r from-hajj-900 via-hajj-800 to-slate-900 text-white shadow-lg sticky top-0 z-40 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gold-500 flex items-center justify-center text-slate-900 font-bold text-xl shadow-md border border-gold-400">
              <i className="fa-solid fa-kaaba"></i>
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-wide text-white leading-tight">UPT Asrama Haji Jakarta</h1>
              <p className="text-xs text-gold-400 font-medium hidden sm:block">Kementerian Haji dan Umrah RI • Sistem Operasional Terpadu</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Quick Switch Account Dropdown */}
            <div className="relative" ref={switchRef}>
              <button 
                type="button"
                onClick={() => setIsSwitchOpen(prev => !prev)}
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 shadow-xs"
                title="Ganti akun untuk pengujian hak akses"
              >
                <i className="fa-solid fa-users-viewfinder text-gold-400"></i>
                <span className="hidden md:inline">Ganti Akun</span>
                <i className={`fa-solid fa-chevron-down text-[10px] transition-transform ${isSwitchOpen ? 'rotate-180' : ''}`}></i>
              </button>

              {isSwitchOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden text-xs max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-100">
                  <div className="p-3 bg-gradient-to-r from-hajj-900 to-slate-900 text-white flex items-center justify-between">
                    <div>
                      <div className="font-bold flex items-center space-x-1.5 text-gold-400">
                        <i className="fa-solid fa-id-badge"></i>
                        <span>Pilih Akun Pengguna</span>
                      </div>
                      <p className="text-[10px] text-slate-300 mt-0.5">Uji hak akses peran & alur kerja antar-divisi</p>
                    </div>
                    <span className="text-[10px] bg-gold-500/20 text-gold-300 px-2 py-0.5 rounded font-bold border border-gold-400/30">
                      12 Akun Resmi
                    </span>
                  </div>

                  <div className="p-2 overflow-y-auto custom-scrollbar space-y-3 flex-1">
                    {divisions.map((div, divIdx) => (
                      <div key={divIdx} className="space-y-1">
                        <p className={`text-[10px] font-bold uppercase tracking-wider px-2 pt-1 flex items-center ${div.color}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5"></span>
                          {div.name}
                        </p>
                        <div className="space-y-1">
                          {div.users.map(u => {
                            const isCurrent = u.id === currentUser.id;
                            return (
                              <button
                                key={u.id}
                                type="button"
                                onClick={() => handleSwitchAccount(u)}
                                className={`w-full text-left p-2 rounded-lg transition flex items-center justify-between group ${
                                  isCurrent 
                                    ? 'bg-hajj-50 border border-hajj-300 font-bold text-hajj-950' 
                                    : 'hover:bg-slate-100 text-slate-700'
                                }`}
                              >
                                <div className="flex items-center space-x-2.5">
                                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                    isCurrent ? 'bg-hajj-700 text-white' : 'bg-slate-200 text-slate-700 group-hover:bg-slate-300'
                                  }`}>
                                    {u.fullName.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="flex items-center space-x-1.5">
                                      <span className="font-semibold text-slate-900">{u.fullName}</span>
                                      {isCurrent && (
                                        <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-bold">
                                          Aktif
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-slate-500 flex items-center space-x-1">
                                      <span className="font-medium text-slate-700">{u.role}</span>
                                      <span>•</span>
                                      <span className="text-slate-500 font-mono">{u.username}</span>
                                    </div>
                                  </div>
                                </div>
                                <i className={`fa-solid fa-arrow-right-to-bracket text-xs opacity-0 group-hover:opacity-100 transition-opacity ${
                                  isCurrent ? 'text-hajj-700 opacity-100' : 'text-slate-400'
                                }`}></i>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-500 text-center">
                    Setiap peran memiliki menu, hak kelola, dan alur otorisasi yang berbeda.
                  </div>
                </div>
              )}
            </div>

            {/* Active User Badge (Hanya Peran / Jabatan & Nama) */}
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></div>
              <div className="flex flex-col text-left">
                <span className="font-bold text-gold-400 text-xs leading-tight">{currentUser.role}</span>
                <span className="text-slate-200 text-[11px] font-medium leading-tight">{currentUser.fullName}</span>
              </div>
            </div>

            {/* Operational Important Notifications (Booking Hari Ini, Check-out, Sarapan, Maintenance, QC) */}
            <OperationalNotifications />

            {isSuperAdmin(currentUser.role) && (
              <button 
                onClick={() => openModal('modalUserManagement')} 
                className="hidden lg:flex bg-gold-500 hover:bg-gold-600 text-slate-900 text-xs font-bold px-3 py-1.5 rounded-lg transition-all shadow-md items-center space-x-1.5"
                title="Kelola Akun, Hirarki Jabatan & Hak Akses"
              >
                <i className="fa-solid fa-users-gear"></i>
                <span>Kelola User</span>
              </button>
            )}

            <button 
              onClick={logout} 
              className="bg-red-500/20 hover:bg-red-600 text-red-200 hover:text-white border border-red-500/30 text-xs font-medium px-2.5 sm:px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1"
              title="Keluar dari sistem"
            >
              <i className="fa-solid fa-right-from-bracket"></i>
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Operational Highlights Ribbon (Checkin, Checkout, Breakfast, Urgent Maintenance, QC) */}
      <OperationalSummaryRibbon />

      <div className="bg-hajj-900/90 border-t border-white/10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex space-x-1 overflow-x-auto custom-scrollbar py-1">
          {tabs.map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)} 
              className={`px-3 sm:px-4 py-2 rounded-md text-xs transition-all flex items-center space-x-1.5 shrink-0 ${
                activeTab === tab.id 
                  ? 'text-gold-400 bg-white/10 font-semibold' 
                  : 'text-slate-300 hover:text-white hover:bg-white/5 font-medium'
              }`}
            >
              <i className={`fa-solid ${tab.icon}`}></i>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
