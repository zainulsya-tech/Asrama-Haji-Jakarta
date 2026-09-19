import React, { useState, useRef, useEffect } from 'react';
import { useAppContext, isManagerRole, isSuperAdmin } from '../store';
import { User } from '../types';

export function FloatingChatPanel() {
  const {
    currentUser,
    users,
    chatChannels,
    chatMessages,
    isChatOpen,
    activeChatChannelId,
    chatSoundEnabled,
    chatNotificationToast,
    unreadTotalCount,
    openChat,
    closeChat,
    setActiveChatChannelId,
    toggleChatSound,
    sendChatMessage,
    dismissChatNotification,
    simulateIncomingChatMessage,
    showToast
  } = useAppContext();

  // 2 simplified modes: MGR_TO_MGR or WITH_SUBORDINATES
  const [channelMode, setChannelMode] = useState<'MGR' | 'SUB'>('MGR');
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [isOfficialInstruction, setIsOfficialInstruction] = useState(false);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!currentUser) return null;

  const isCurrentUserManager = isManagerRole(currentUser.role);

  // Channels accessible to currentUser
  const accessibleChannels = chatChannels.filter(c => {
    if (isSuperAdmin(currentUser.role)) return true;
    return c.participantIds.includes(currentUser.id);
  });

  // Helper: unread count for a channel
  const getChannelUnread = (channelId: string): number => {
    return chatMessages.filter(
      m => m.channelId === channelId && m.senderId !== currentUser.id && !m.readBy.includes(currentUser.id)
    ).length;
  };

  // Filter channels based on selected mode & search
  const filteredChannels = accessibleChannels.filter(c => {
    // Mode filter
    const isMgrChannel = c.scope === 'MANAGER_TO_MANAGER' || c.scope === 'ALL_MANAGERS_GROUP';
    if (channelMode === 'MGR' && !isMgrChannel) return false;
    if (channelMode === 'SUB' && isMgrChannel) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.name.toLowerCase().includes(q);
      const matchDept = c.department?.toLowerCase().includes(q) || false;
      const matchMsg = c.lastMessage?.toLowerCase().includes(q) || false;
      return matchName || matchDept || matchMsg;
    }

    return true;
  });

  // Count unread per mode
  const unreadMgr = accessibleChannels
    .filter(c => c.scope === 'MANAGER_TO_MANAGER' || c.scope === 'ALL_MANAGERS_GROUP')
    .reduce((sum, c) => sum + getChannelUnread(c.id), 0);

  const unreadSub = accessibleChannels
    .filter(c => c.scope !== 'MANAGER_TO_MANAGER' && c.scope !== 'ALL_MANAGERS_GROUP')
    .reduce((sum, c) => sum + getChannelUnread(c.id), 0);

  // Active channel & messages
  const activeChannel = chatChannels.find(c => c.id === activeChatChannelId);
  const channelMessages = chatMessages.filter(m => m.channelId === activeChatChannelId);

  // Auto scroll to bottom
  useEffect(() => {
    if (isChatOpen && activeChatChannelId) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [channelMessages.length, activeChatChannelId, isChatOpen]);

  // Focus input on active chat
  useEffect(() => {
    if (isChatOpen && activeChatChannelId) {
      inputRef.current?.focus();
    }
  }, [activeChatChannelId, isChatOpen]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageInput.trim() || !activeChatChannelId) return;

    sendChatMessage(
      activeChatChannelId,
      messageInput.trim(),
      isUrgent ? 'URGENT' : 'NORMAL',
      isCurrentUserManager ? isOfficialInstruction : false
    );

    setMessageInput('');
    setIsUrgent(false);
    setIsOfficialInstruction(false);
  };

  const handleQuickSend = (text: string, urgent = false, inst = false) => {
    if (!activeChatChannelId) return;
    sendChatMessage(
      activeChatChannelId,
      text,
      urgent ? 'URGENT' : 'NORMAL',
      isCurrentUserManager ? inst : false
    );
  };

  const quickReplies = isCurrentUserManager ? [
    { label: 'Siap Huni (Lolos QC)', text: 'Kamar telah diverifikasi dan siap dialokasikan untuk jemaah kloter baru.', urgent: false, inst: true },
    { label: 'Tindak Lanjuti Segera', text: 'Mohon segera tindak lanjuti kendala di lokasi dalam waktu 30 menit.', urgent: true, inst: true },
    { label: 'Konfirmasi Sarapan', text: 'Sarapan jemaah untuk besok pagi telah disinkronkan dengan pihak Koperasi.', urgent: false, inst: false }
  ] : [
    { label: 'Siap Laksanakan', text: 'Siap laksanakan arahan pimpinan, segera kami proses di lapangan.', urgent: false, inst: false },
    { label: 'Perbaikan Selesai', text: 'Lapor: Perbaikan fasilitas fisik telah selesai dan siap diuji kelayakannya.', urgent: false, inst: false },
    { label: 'Kamar Siap Diinspeksi', text: 'Kamar telah dirapikan dan siap untuk diinspeksi oleh tim QC.', urgent: false, inst: false }
  ];

  const handleStartDirectChat = (targetUser: User) => {
    setIsNewChatModalOpen(false);
    const existing = chatChannels.find(
      c => c.type === 'DIRECT' && c.participantIds.includes(currentUser.id) && c.participantIds.includes(targetUser.id)
    );

    if (existing) {
      openChat(existing.id);
    } else {
      const newId = `dm-${currentUser.id}-${targetUser.id}`;
      openChat(newId);
      showToast(`Membuka ruang komunikasi dengan ${targetUser.fullName}`, 'info');
    }
  };

  return (
    <>
      {/* 1. FLOATING NOTIFICATION BANNER (TOAST) */}
      {chatNotificationToast && (
        <div 
          id="floating-chat-toast"
          className="fixed bottom-20 right-4 sm:right-6 z-50 max-w-sm w-[90vw] sm:w-[360px] bg-slate-900 text-white p-3.5 rounded-2xl shadow-2xl border border-gold-400/40 animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-7 h-7 rounded-lg bg-gold-500 text-slate-950 flex items-center justify-center font-bold text-xs">
                <i className="fa-solid fa-comment-dots"></i>
              </span>
              <div>
                <span className="text-[10px] font-bold text-gold-400 uppercase tracking-wider block">
                  {chatNotificationToast.message.isInstruction ? '★ Arahan Pimpinan' : 'Pesan Baru'}
                </span>
                <p className="text-xs font-bold text-white truncate max-w-[180px]">
                  {chatNotificationToast.channelName}
                </p>
              </div>
            </div>
            <button
              onClick={dismissChatNotification}
              className="text-slate-400 hover:text-white p-1 text-xs"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          <p className="text-xs text-slate-200 mt-2 bg-white/10 p-2 rounded-lg line-clamp-2">
            <strong className="text-gold-300">{chatNotificationToast.message.senderName}: </strong>
            {chatNotificationToast.message.message}
          </p>

          <div className="mt-2.5 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={dismissChatNotification}
              className="px-2.5 py-1 text-slate-400 hover:text-slate-200 text-xs font-medium"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={() => {
                openChat(chatNotificationToast.channelId);
                dismissChatNotification();
              }}
              className="px-3 py-1 bg-gold-500 hover:bg-gold-600 text-slate-950 rounded-lg text-xs font-bold shadow transition flex items-center space-x-1"
            >
              <span>Balas Pesan</span>
              <i className="fa-solid fa-arrow-right text-[10px]"></i>
            </button>
          </div>
        </div>
      )}

      {/* 2. COMPACT FLOATING LAUNCHER (FAB) */}
      {!isChatOpen && (
        <div id="floating-chat-launcher" className="fixed bottom-5 right-4 sm:right-6 z-40 flex items-center space-x-2">
          {/* Quick Sound Chime Toggle */}
          <button
            type="button"
            onClick={toggleChatSound}
            className={`w-9 h-9 rounded-full shadow-md border flex items-center justify-center text-xs transition-all hover:scale-105 active:scale-95 ${
              chatSoundEnabled 
                ? 'bg-white text-emerald-700 border-emerald-300' 
                : 'bg-slate-200 text-slate-500 border-slate-300'
            }`}
            title={chatSoundEnabled ? 'Suara Notifikasi: AKTIF' : 'Suara Notifikasi: SENYAP'}
          >
            <i className={`fa-solid ${chatSoundEnabled ? 'fa-volume-high' : 'fa-volume-xmark'}`}></i>
          </button>

          {/* Main Floating Pill Button */}
          <button
            type="button"
            onClick={() => openChat()}
            className="bg-gradient-to-r from-hajj-900 to-hajj-800 hover:from-hajj-800 hover:to-hajj-700 text-white shadow-xl shadow-hajj-950/30 border border-gold-400/40 px-4 py-2.5 rounded-full flex items-center space-x-2.5 transition-all hover:scale-105 active:scale-95 group"
            title="Buka Chat Koordinasi & Arahan Tim"
          >
            <div className="relative">
              <i className="fa-solid fa-comments text-gold-300 text-sm"></i>
              {unreadTotalCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              )}
            </div>

            <span className="text-xs font-bold tracking-wide">
              Chat Koordinasi
            </span>

            {unreadTotalCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full ring-1 ring-white">
                {unreadTotalCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* 3. STREAMLINED FLOATING CHAT PANEL */}
      {isChatOpen && (
        <div 
          id="floating-chat-modal"
          className="fixed bottom-4 right-3 sm:bottom-5 sm:right-6 z-50 w-[94vw] sm:w-[420px] h-[580px] max-h-[86vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-hajj-950 via-hajj-900 to-slate-900 text-white px-3.5 py-3 flex items-center justify-between border-b border-gold-500/20 shrink-0">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-gold-500 text-slate-950 flex items-center justify-center font-bold text-xs shadow-xs">
                <i className="fa-solid fa-headset"></i>
              </div>
              <div>
                <h3 className="font-bold text-xs text-white leading-tight">
                  {activeChannel ? activeChannel.name : 'Koordinasi & Arahan Tim'}
                </h3>
                <p className="text-[10px] text-gold-300 font-medium truncate max-w-[200px]">
                  {activeChannel 
                    ? activeChannel.description || `${activeChannel.participantIds.length} Rekan Tim`
                    : `${currentUser.fullName} (${currentUser.role})`}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              {/* Quick simulation button */}
              <button
                type="button"
                onClick={() => simulateIncomingChatMessage(activeChatChannelId || undefined)}
                className="text-gold-300 hover:text-white p-1 rounded hover:bg-white/10 text-xs transition"
                title="Simulasi Pesan Masuk"
              >
                <i className="fa-solid fa-bolt"></i>
              </button>

              {/* Mute/Sound button */}
              <button
                type="button"
                onClick={toggleChatSound}
                className={`p-1 rounded text-xs transition ${
                  chatSoundEnabled ? 'text-emerald-300 hover:bg-white/10' : 'text-slate-400 hover:bg-white/10'
                }`}
                title={chatSoundEnabled ? 'Audio Aktif' : 'Audio Senyap'}
              >
                <i className={`fa-solid ${chatSoundEnabled ? 'fa-volume-high' : 'fa-volume-xmark'}`}></i>
              </button>

              {/* Close Panel */}
              <button
                type="button"
                onClick={closeChat}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/10 text-xs transition ml-1"
                title="Tutup Chat"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>
          </div>

          {/* VIEW 1: CHANNEL LIST */}
          {!activeChatChannelId ? (
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
              {/* Simple 2-Option Segmented Selector */}
              <div className="p-2.5 bg-white border-b border-slate-200">
                <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setChannelMode('MGR')}
                    className={`flex-1 py-1.5 rounded-lg text-center transition flex items-center justify-center space-x-1.5 ${
                      channelMode === 'MGR'
                        ? 'bg-white text-hajj-900 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <i className="fa-solid fa-users-gear text-gold-600 text-[10px]"></i>
                    <span>Antar Manager</span>
                    {unreadMgr > 0 && (
                      <span className="bg-red-500 text-white rounded-full text-[10px] px-1.5 py-0.1 font-bold">
                        {unreadMgr}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setChannelMode('SUB')}
                    className={`flex-1 py-1.5 rounded-lg text-center transition flex items-center justify-center space-x-1.5 ${
                      channelMode === 'SUB'
                        ? 'bg-white text-hajj-900 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <i className="fa-solid fa-user-group text-blue-600 text-[10px]"></i>
                    <span>{isCurrentUserManager ? 'Dengan Bawahan' : 'Instruksi Pimpinan'}</span>
                    {unreadSub > 0 && (
                      <span className="bg-red-500 text-white rounded-full text-[10px] px-1.5 py-0.1 font-bold">
                        {unreadSub}
                      </span>
                    )}
                  </button>
                </div>

                {/* Quick Search and New Chat button */}
                <div className="mt-2 flex items-center space-x-1.5">
                  <div className="relative flex-1">
                    <i className="fa-solid fa-magnifying-glass absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                    <input
                      type="text"
                      placeholder="Cari obrolan / rekan..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-7 pr-6 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-hajj-600"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsNewChatModalOpen(true)}
                    className="px-2.5 py-1 bg-hajj-800 hover:bg-hajj-900 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1 shrink-0"
                    title="Mulai obrolan baru"
                  >
                    <i className="fa-solid fa-plus text-[10px]"></i>
                    <span>Baru</span>
                  </button>
                </div>
              </div>

              {/* Channels List */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1.5">
                {filteredChannels.length === 0 ? (
                  <div className="text-center py-10 px-4 space-y-2 text-slate-500">
                    <i className="fa-solid fa-comments text-2xl text-slate-300"></i>
                    <p className="text-xs">Belum ada obrolan di kategori ini.</p>
                    <button
                      type="button"
                      onClick={() => setIsNewChatModalOpen(true)}
                      className="px-3 py-1 bg-hajj-800 text-white rounded-lg text-xs font-bold"
                    >
                      Pilih Rekan Kerja
                    </button>
                  </div>
                ) : (
                  filteredChannels.map(channel => {
                    const unread = getChannelUnread(channel.id);
                    const isMgr = channel.scope === 'MANAGER_TO_MANAGER' || channel.scope === 'ALL_MANAGERS_GROUP';

                    return (
                      <button
                        key={channel.id}
                        type="button"
                        onClick={() => openChat(channel.id)}
                        className={`w-full text-left p-2.5 rounded-xl transition-all border flex items-start space-x-2.5 group ${
                          unread > 0 
                            ? 'bg-emerald-50/70 border-emerald-300 shadow-xs' 
                            : 'bg-white hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                          isMgr ? 'bg-gold-100 text-gold-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          <i className={`fa-solid ${channel.icon || 'fa-comments'}`}></i>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-xs text-slate-900 truncate group-hover:text-hajj-800">
                              {channel.name}
                            </h4>
                            <span className="text-[10px] text-slate-400 shrink-0 ml-1">
                              {channel.lastMessageTime || ''}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {channel.lastSenderName && <strong>{channel.lastSenderName}: </strong>}
                            {channel.lastMessage || channel.description}
                          </p>
                        </div>

                        {unread > 0 && (
                          <span className="shrink-0 px-1.5 py-0.2 bg-red-600 text-white rounded-full text-[10px] font-black animate-pulse self-center">
                            {unread}
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            /* VIEW 2: ACTIVE CONVERSATION */
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
              {/* Back Bar */}
              <div className="bg-white border-b border-slate-200 px-3 py-1.5 flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveChatChannelId(null)}
                  className="text-slate-600 hover:text-slate-900 text-xs font-bold flex items-center space-x-1 transition"
                >
                  <i className="fa-solid fa-chevron-left text-[10px]"></i>
                  <span>Daftar Obrolan</span>
                </button>

                <div className="flex items-center space-x-1 text-[11px]">
                  {activeChannel?.scope === 'MANAGER_TO_MANAGER' && (
                    <span className="px-1.5 py-0.2 bg-gold-100 text-gold-800 rounded font-bold text-[9px]">
                      Antar Manager
                    </span>
                  )}
                  {activeChannel?.scope === 'MANAGER_TO_SUBORDINATE' && (
                    <span className="px-1.5 py-0.2 bg-teal-100 text-teal-800 rounded font-bold text-[9px]">
                      Instruksi Pimpinan
                    </span>
                  )}
                </div>
              </div>

              {/* Messages Flow */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2.5 bg-[#fbfdfb]">
                {channelMessages.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-400">
                    Belum ada pesan di ruang ini. Tulis pesan di bawah.
                  </div>
                ) : (
                  channelMessages.map(msg => {
                    const isMe = msg.senderId === currentUser.id;
                    const isUrgentMsg = msg.priority === 'URGENT';
                    const isInst = Boolean(msg.isInstruction);

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[88%] ${isMe ? 'ml-auto' : 'mr-auto'}`}
                      >
                        {!isMe && (
                          <span className="text-[10px] font-bold text-slate-600 mb-0.5 ml-1">
                            {msg.senderName} <span className="text-slate-400 font-normal">({msg.senderRole})</span>
                          </span>
                        )}

                        <div
                          className={`rounded-2xl p-2.5 text-xs shadow-xs relative ${
                            isMe
                              ? 'bg-hajj-800 text-white rounded-br-xs'
                              : isInst
                              ? 'bg-amber-50 text-slate-900 border border-gold-400 rounded-bl-xs'
                              : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                          }`}
                        >
                          {/* Banner for Manager Instruction */}
                          {isInst && (
                            <div className={`text-[9px] font-bold uppercase tracking-wider mb-1 flex items-center space-x-1 ${
                              isMe ? 'text-gold-200' : 'text-gold-800'
                            }`}>
                              <i className="fa-solid fa-crown text-[8px]"></i>
                              <span>Arahan Resmi Manager</span>
                            </div>
                          )}

                          {isUrgentMsg && (
                            <div className="mb-1">
                              <span className="px-1.5 py-0.2 bg-red-600 text-white rounded text-[9px] font-black inline-flex items-center space-x-1">
                                <i className="fa-solid fa-triangle-exclamation text-[8px]"></i>
                                <span>MENDESAK</span>
                              </span>
                            </div>
                          )}

                          <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>

                          <div className={`mt-1 text-[9px] text-right ${isMe ? 'text-hajj-200' : 'text-slate-400'}`}>
                            {msg.timeFormatted} WIB
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Simplified Quick Responses */}
              <div className="bg-slate-100 border-t border-slate-200 px-2 py-1 flex items-center space-x-1 overflow-x-auto custom-scrollbar shrink-0">
                {quickReplies.map((qr, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickSend(qr.text, qr.urgent, qr.inst)}
                    className="px-2 py-0.8 bg-white hover:bg-slate-200 border border-slate-300 rounded-lg text-[10px] text-slate-700 whitespace-nowrap shrink-0 transition"
                  >
                    {qr.label}
                  </button>
                ))}
              </div>

              {/* Streamlined Input Bar */}
              <form onSubmit={handleSend} className="p-2.5 bg-white border-t border-slate-200 shrink-0 space-y-1.5">
                {/* Manager Option Toggles */}
                <div className="flex items-center space-x-2 text-[11px]">
                  {isCurrentUserManager && (
                    <button
                      type="button"
                      onClick={() => setIsOfficialInstruction(prev => !prev)}
                      className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold flex items-center space-x-1 transition ${
                        isOfficialInstruction 
                          ? 'bg-gold-500 text-slate-950 border-gold-600' 
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <i className="fa-solid fa-crown text-[9px]"></i>
                      <span>Arahan Resmi</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsUrgent(prev => !prev)}
                    className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold flex items-center space-x-1 transition ${
                      isUrgent 
                        ? 'bg-red-600 text-white border-red-700' 
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <i className="fa-solid fa-bolt text-[9px]"></i>
                    <span>Mendesak</span>
                  </button>
                </div>

                <div className="flex items-center space-x-1.5">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Ketik pesan..."
                    value={messageInput}
                    onChange={e => setMessageInput(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-hajj-600"
                  />
                  <button
                    type="submit"
                    disabled={!messageInput.trim()}
                    className="px-3.5 py-1.5 bg-hajj-800 hover:bg-hajj-900 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow transition flex items-center space-x-1 shrink-0"
                  >
                    <span>Kirim</span>
                    <i className="fa-solid fa-paper-plane text-[10px]"></i>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* 4. NEW CHAT SELECTOR MODAL */}
      {isNewChatModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200">
            <div className="p-3 bg-hajj-900 text-white flex items-center justify-between">
              <h4 className="font-bold text-xs text-gold-400">Pilih Rekan Kerja</h4>
              <button onClick={() => setIsNewChatModalOpen(false)} className="text-slate-400 hover:text-white text-xs">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="p-3 max-h-[50vh] overflow-y-auto custom-scrollbar space-y-1.5">
              {users
                .filter(u => u.id !== currentUser.id)
                .map(u => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleStartDirectChat(u)}
                    className="w-full text-left p-2 rounded-xl border border-slate-200 hover:bg-hajj-50 transition flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">{u.fullName}</span>
                      <span className="text-[10px] text-slate-500">{u.role} • {u.department || 'Operasional'}</span>
                    </div>
                    <i className="fa-solid fa-chevron-right text-slate-400 text-xs"></i>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
