import React, { useState } from 'react';
import { useAppContext } from '../store';
import { User } from '../types';

export function Login() {
  const { login, users, showToast } = useAppContext();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRoleGroup, setSelectedRoleGroup] = useState<string>('ALL');
  const [showQuickAccess, setShowQuickAccess] = useState(false);

  const executeLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = username.trim().toLowerCase();
    const foundUser = users.find(u => u.username.toLowerCase() === cleanUser);
    if (foundUser) {
      login(foundUser);
      showToast(`Selamat datang, ${foundUser.fullName}!`, 'success');
    } else {
      showToast("Username atau kata sandi tidak terdaftar di pangkalan data!", "error");
    }
  };

  const handleSelectUser = (user: User) => {
    setUsername(user.username);
    setPassword('••••••••');
    login(user);
    showToast(`Masuk sebagai: ${user.fullName} (${user.role})`, 'success');
  };

  const roleGroups = [
    { id: 'ALL', label: 'Semua Peran', icon: 'fa-users' },
    { id: 'ADMIN', label: 'Pimpinan & Admin', icon: 'fa-user-shield' },
    { id: 'RECEPSIONIS', label: 'Resepsionis', icon: 'fa-bell-concierge' },
    { id: 'QC', label: 'Quality Control (QC)', icon: 'fa-clipboard-check' },
    { id: 'TEKNISI', label: 'Teknisi & Sarpras', icon: 'fa-screwdriver-wrench' },
    { id: 'KOPERASI', label: 'Koperasi & Konsumsi', icon: 'fa-utensils' },
  ];

  const filteredQuickUsers = users.filter(u => {
    if (selectedRoleGroup === 'ALL') return true;
    if (selectedRoleGroup === 'ADMIN') return u.role === 'Super Admin' || u.role === 'Admin';
    if (selectedRoleGroup === 'RECEPSIONIS') return u.role.includes('Resepsionis');
    if (selectedRoleGroup === 'QC') return u.role.includes('QC') || u.role.includes('Quality');
    if (selectedRoleGroup === 'TEKNISI') return u.role.includes('Teknisi');
    if (selectedRoleGroup === 'KOPERASI') return u.role.includes('Koperasi');
    return true;
  });

  return (
    <div className="min-h-screen bg-[#2e1d11] relative flex items-center justify-center p-4 sm:p-6 overflow-x-hidden font-sans">
      {/* Official Geometric Ambient Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#cca241_1px,transparent_1px)] [background-size:28px_28px] opacity-15 pointer-events-none"></div>
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-hajj-700/40 blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-gold-500/25 blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-gold-500/40 relative z-10 my-4 sm:my-8">
        {/* Official Header Banner - Kementerian Haji dan Umrah RI */}
        <div className="bg-gradient-to-b from-hajj-900 via-hajj-800 to-hajj-900 p-6 sm:p-8 text-white text-center relative border-b-4 border-gold-500">
          <div className="flex items-center justify-center space-x-3 mb-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-400 via-gold-500 to-gold-600 flex items-center justify-center text-hajj-950 shadow-md border-2 border-gold-300 text-2xl font-black">
              <i className="fa-solid fa-kaaba"></i>
            </div>
          </div>
          
          <span className="text-[10px] sm:text-[11px] uppercase tracking-widest text-gold-300 font-extrabold bg-gold-400/15 border border-gold-400/40 px-3.5 py-1 rounded-full inline-block mb-2">
            KEMENTERIAN HAJI DAN UMRAH REPUBLIK INDONESIA
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
            UPT ASRAMA HAJI JAKARTA
          </h1>
          <p className="text-xs text-gold-100/90 mt-1 font-medium max-w-md mx-auto">
            Sistem Informasi Operasional & Manajemen Pelayanan Terpadu (SIM-HAJI)
          </p>
        </div>

        {/* Login Form Container */}
        <div className="p-6 sm:p-8 space-y-5 bg-white">
          <form onSubmit={executeLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                Username / NIP Petugas
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <i className="fa-solid fa-id-card-clip text-sm"></i>
                </span>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required 
                  className="w-full pl-10 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-hajj-600 focus:border-hajj-600 focus:bg-white outline-none transition font-medium text-slate-900" 
                  placeholder="Masukkan username atau NIP (contoh: admin)" 
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Kata Sandi
                </label>
                <span className="text-[11px] text-hajj-700 font-semibold hover:underline cursor-pointer">
                  Bantuan Sandi?
                </span>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <i className="fa-solid fa-lock text-sm"></i>
                </span>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-hajj-600 focus:border-hajj-600 focus:bg-white outline-none transition font-medium text-slate-900" 
                  placeholder="••••••••" 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                >
                  <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-xs`}></i>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600 pt-0.5">
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input type="checkbox" defaultChecked className="rounded text-hajj-700 focus:ring-hajj-600 w-4 h-4" />
                <span>Ingat sesi di perangkat ini</span>
              </label>
              <div className="flex items-center space-x-1 text-emerald-700 font-semibold text-[11px]">
                <i className="fa-solid fa-shield-halved"></i>
                <span>SSL Terenkripsi</span>
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full py-3 bg-gradient-to-r from-hajj-800 to-hajj-700 hover:from-hajj-900 hover:to-hajj-800 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer mt-2"
            >
              <span>Masuk Portal SIM-HAJI</span>
              <i className="fa-solid fa-arrow-right-to-bracket text-gold-300"></i>
            </button>
          </form>

          {/* Quick Access / Login Simulasi berdasarkan Peran / Jabatan */}
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-xs font-bold text-slate-800 flex items-center">
                  <i className="fa-solid fa-users-gear mr-1.5 text-hajj-700"></i>
                  Pilihan Akun & Peran / Jabatan
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Klik untuk langsung masuk menggunakan hak akses peran yang dipilih
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickAccess(v => !v)}
                className="text-xs font-bold px-3 py-1.5 rounded-lg border border-gold-500/40 bg-gold-50 text-hajj-900 hover:bg-gold-100 transition flex items-center space-x-1 cursor-pointer shrink-0"
              >
                <span>{showQuickAccess ? 'Tutup Daftar' : 'Pilih Akun'}</span>
                <i className={`fa-solid fa-chevron-${showQuickAccess ? 'up' : 'down'} text-[10px]`}></i>
              </button>
            </div>

            {showQuickAccess && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2.5 animate-in fade-in duration-150">
                {/* Role Group Filter Tabs */}
                <div className="flex items-center space-x-1 overflow-x-auto custom-scrollbar pb-1">
                  {roleGroups.map(div => (
                    <button
                      key={div.id}
                      type="button"
                      onClick={() => setSelectedRoleGroup(div.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition flex items-center space-x-1 cursor-pointer ${
                        selectedRoleGroup === div.id
                          ? 'bg-hajj-800 text-gold-300 shadow-xs'
                          : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      <i className={`fa-solid ${div.icon} text-[10px]`}></i>
                      <span>{div.label}</span>
                    </button>
                  ))}
                </div>

                {/* User Cards Grid (Hanya menampilkan Nama, Peran / Jabatan, dan Username) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                  {filteredQuickUsers.map(u => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleSelectUser(u)}
                      className="p-2.5 bg-white hover:bg-gold-50/70 border border-slate-200 hover:border-gold-400 rounded-xl text-left transition flex items-start justify-between shadow-xs group cursor-pointer"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-bold text-xs text-slate-900 group-hover:text-hajj-800 truncate">
                          {u.fullName}
                        </div>
                        <div className="text-[10px] text-hajj-700 font-semibold truncate flex items-center space-x-1 mt-0.5">
                          <i className="fa-solid fa-id-badge text-[9px] text-gold-600"></i>
                          <span>{u.role}</span>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono font-bold bg-slate-100 group-hover:bg-gold-200 text-slate-700 group-hover:text-hajj-900 px-1.5 py-0.5 rounded shrink-0 border border-slate-200">
                        {u.username}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="text-center pt-2">
            <p className="text-[11px] text-slate-500 font-medium">
              UPT Asrama Haji Embarkasi Jakarta • Jl. Raya Pondok Gede No. 23, Jakarta Timur
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Hak Cipta © {new Date().getFullYear()} Kementerian Haji dan Umrah Republik Indonesia
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
