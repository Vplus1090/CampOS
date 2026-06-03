import React, { useState, useEffect } from 'react';
import { 
  UserPlus, Send, MessageCircle, X, Search, 
  Trash2, Flag, CheckCircle2, RefreshCw 
} from 'lucide-react';
import { API_BASE } from '../config/api';
import M3ScreenHeader from './M3ScreenHeader';

export default function SkillSwapGrid({ currentUser, onUpdate, setActiveTab, onStartChat }) {
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewTab, setViewTab] = useState('listings');
  const [isScrolled, setIsScrolled] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null); // { message, onConfirm }
  const [promptDialog, setPromptDialog] = useState(null); // { title, message, value, onConfirm }
  
  // Started chats tracker to dynamically flag matches & move them to ongoing
  const [startedChats, setStartedChats] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cp_started_chats') || '[]');
    } catch (e) {
      return [];
    }
  });

  const handleScroll = (e) => {
    setIsScrolled(e.target.scrollTop > 12);
  };

  const handleStartChat = (studentName) => {
    if (!startedChats.includes(studentName)) {
      const updated = [...startedChats, studentName];
      setStartedChats(updated);
      localStorage.setItem('cp_started_chats', JSON.stringify(updated));
      if (onUpdate) onUpdate();
    }
    if (onStartChat) {
      onStartChat(studentName);
    }
  };

  // New Gig Form State (Offer a Skill inline panel!)
  const [skillOffered, setSkillOffered] = useState('');
  const [skillWanted, setSkillWanted] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isSuperAdmin = currentUser?.role === 'admin';
  const isStudent = currentUser?.role === 'student';

  const fetchGigs = async (searchVal = '') => {
    try {
      setLoading(true);
      const url = searchVal 
        ? `${API_BASE}/api/skillgigs?search=${encodeURIComponent(searchVal)}` 
        : `${API_BASE}/api/skillgigs`;
      
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load skill gigs');
      const data = await res.json();
      setGigs(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchGigs(searchQuery);
    }, 250);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleCreateGig = async (e) => {
    e.preventDefault();
    if (!skillOffered || !skillWanted || !currentUser) return;

    try {
      setSubmitting(true);
      const studentName = currentUser.firstName;
      
      const res = await fetch(`${API_BASE}/api/skillgigs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          StudentName: studentName,
          SkillOffered: skillOffered,
          SkillWanted: skillWanted,
          Status: 'Active',
          ContactInfo: 'chat_only_private',
        }),
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed to post skill swap profile');
      
      setSkillOffered('');
      setSkillWanted('');
      
      fetchGigs(searchQuery);
      if (onUpdate) onUpdate();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    setConfirmDialog({
      message: 'Are you sure you want to permanently delete this skill swap listing?',
      onConfirm: async () => {
        try {
          const res = await fetch(`${API_BASE}/api/skillgigs/${id}`, {
            method: 'DELETE',
            credentials: 'include',
          });
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Failed to remove skill swap');
          }
          
          fetchGigs(searchQuery);
          if (onUpdate) onUpdate();
        } catch (err) {
          alert(err.message);
        }
      }
    });
  };

  const handleMarkAsDone = (id) => {
    setConfirmDialog({
      message: 'Mark this skill swap match as successfully completed/done?',
      onConfirm: async () => {
        try {
          const res = await fetch(`${API_BASE}/api/skillgigs/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ Status: 'Completed' }),
            credentials: 'include',
          });
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Failed to complete swap');
          }
          
          fetchGigs(searchQuery);
          if (onUpdate) onUpdate();
        } catch (err) {
          alert(err.message);
        }
      }
    });
  };

  const handleReport = (id) => {
    setPromptDialog({
      title: 'Report Listing',
      message: 'Please enter the reason for reporting this listing:',
      value: '',
      onConfirm: async (reason) => {
        try {
          const res = await fetch(`${API_BASE}/api/skillgigs/${id}/report`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ReportReason: reason }),
            credentials: 'include',
          });

          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Failed to report listing');
          }

          alert('Thank you. The listing has been reported.');
          fetchGigs(searchQuery);
          if (onUpdate) onUpdate();
        } catch (err) {
          alert(err.message);
        }
      }
    });
  };

  // Helper to color circles dynamically using Material 3 containers
  const getAvatarBg = (name) => {
    const letter = name.charAt(0).toUpperCase();
    if (letter === 'V' || letter === 'S') return 'bg-m3-primaryContainer/40 text-m3-onPrimaryContainer';
    if (letter === 'K' || letter === 'R') return 'bg-m3-surfaceContainerHighest text-m3-primary';
    if (letter === 'D' || letter === 'A') return 'bg-m3-tertiaryContainer/40 text-m3-onTertiaryContainer';
    return 'bg-m3-secondaryContainer text-m3-onSecondaryContainer';
  };

  const ongoingGigs = gigs.filter(gig => gig.StudentName.toLowerCase() === 'kunal' || startedChats.includes(gig.StudentName));
  const listingsGigs = gigs.filter(gig => gig.StudentName.toLowerCase() !== 'kunal' && !startedChats.includes(gig.StudentName));
  const displayedGigs = viewTab === 'listings' ? listingsGigs : ongoingGigs;

  return (
    <div className="m3-screen skillgigs-module">
      {/* M3 Header */}
      <M3ScreenHeader
        title="Skill Swap"
        subtitle="Learn & teach with peers"
        isScrolled={isScrolled}
        onBack={() => setActiveTab && setActiveTab('home')}
      />

      {/* Main Scroll Area */}
      <div onScroll={handleScroll} className="m3-screen__scroll">
        
        {/* Segmented Chips Switcher */}
        <div className="flex justify-center w-full py-1 shrink-0 select-none">
          <div className="m3-segmented-chips">
            <button
              onClick={() => setViewTab('listings')}
              className={`m3-segmented-chip ${viewTab === 'listings' ? 'm3-segmented-chip--selected' : ''}`}
              type="button"
            >
              Listings
            </button>
            <button
              onClick={() => setViewTab('ongoing')}
              className={`m3-segmented-chip ${viewTab === 'ongoing' ? 'm3-segmented-chip--selected' : ''}`}
              type="button"
            >
              Chats
            </button>
          </div>
        </div>

        {/* Offer a Skill Form Panel */}
        {viewTab === 'listings' && isStudent && (
          <div className="m3-surface-card p-5 flex flex-col gap-4 text-left shadow-sm">
            <div className="flex items-center gap-2 border-b border-[#cac4d0]/10 pb-3">
              <UserPlus size={18} className="text-[#cac4d0]" />
              <h3 className="m3-title-small text-[#e6e1e5]">Offer a Skill</h3>
            </div>

            <form onSubmit={handleCreateGig} className="flex flex-col gap-3">
              {/* Input 1: What can you teach */}
              <input
                type="text"
                placeholder="What can you teach? (e.g. Guitar)"
                value={skillOffered}
                onChange={(e) => setSkillOffered(e.target.value)}
                required
                className="m3-filled-field !h-[48px] text-sm"
              />

              {/* Row combining Input 2 and Purple send button */}
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="What do you want to learn?"
                  value={skillWanted}
                  onChange={(e) => setSkillWanted(e.target.value)}
                  required
                  className="m3-filled-field flex-1 !h-[48px] text-sm"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-12 h-12 bg-m3-primary text-m3-onPrimary hover:brightness-110 active:scale-95 rounded-2xl flex items-center justify-center shadow-md transition-all duration-300 transform shrink-0 disabled:opacity-50 cursor-pointer"
                >
                  <Send size={16} />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search Input Filter */}
        {viewTab === 'listings' && (
          <div className="relative w-full shrink-0">
            <span className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-[#948baf] z-10">
              <Search size={16} />
            </span>
            <input
              type="text"
              className="m3-filled-field !pl-12 !pr-10 !rounded-full !h-[48px] text-sm"
              placeholder="Search for skills, listings, or students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#cac4d0] hover:text-[#e6e1e5] cursor-pointer"
                onClick={() => setSearchQuery('')}
                type="button"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Content Listings Feed */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3.5 select-none py-16 text-center">
            <RefreshCw className="animate-spin text-[#d0bcff]" size={28} />
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Loading board...</span>
          </div>
        ) : error ? (
          <div className="m3-surface-card p-6 flex flex-col items-center gap-3 text-center">
            <p className="text-sm font-semibold text-[#e6e1e5]">⚠️ {error}</p>
            <button 
              className="m3-filled-button" 
              style={{ maxWidth: 160 }} 
              onClick={() => fetchGigs(searchQuery)}
              type="button"
            >
              Retry
            </button>
          </div>
        ) : displayedGigs.length === 0 ? (
          <div className="m3-surface-card p-8 flex flex-col items-center justify-center gap-3 text-center select-none">
            <div className="w-12 h-12 rounded-2xl bg-m3-primaryContainer/30 flex items-center justify-center text-m3-primary shadow-md">
              <UserPlus size={22} />
            </div>
            <p className="text-sm font-semibold text-[#e6e1e5]">
              {viewTab === 'listings' ? 'No active listings found.' : 'No ongoing chats found.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {displayedGigs.map((gig) => {
              const isOwnListing = gig.StudentName === currentUser?.firstName;
              const isAccepted = gig.StudentName.toLowerCase() === 'kunal' || startedChats.includes(gig.StudentName);

              return (
                <div 
                  key={gig.id || gig._id} 
                  className="m3-surface-card p-5 flex flex-col gap-4 text-left shadow-sm relative overflow-hidden transition-all duration-300 hover:scale-[1.01]"
                >
                  {/* Header Row */}
                  <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-3">
                      {/* Avatar containing student initial */}
                      <div className={`w-12 h-12 ${getAvatarBg(gig.StudentName)} rounded-full flex items-center justify-center shadow-inner border border-[#cac4d0]/10 shrink-0 min-w-[48px] min-h-[48px]`}>
                        <span className="font-extrabold text-base tracking-tighter">
                          {gig.StudentName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h4 className="m3-title-medium text-white leading-tight">
                          {gig.SkillOffered}
                        </h4>
                        <span className="text-[10px] font-bold text-[#cac4d0] font-mono tracking-widest uppercase block mt-1">
                          BY {gig.StudentName}
                        </span>
                      </div>
                    </div>

                    {/* Flag report button for peer listings */}
                    {!isOwnListing && !isSuperAdmin && (
                      <button
                        onClick={() => handleReport(gig.id || gig._id)}
                        className="text-[#cac4d0] hover:text-[#efb8c8] p-1.5 transition-colors cursor-pointer animate-none"
                        title="Report Listing"
                        type="button"
                      >
                        <Flag size={14} />
                      </button>
                    )}
                  </div>

                  {/* Looking for Wanted Skill Pill */}
                  <div className="bg-m3-surfaceContainerLow/60 border border-m3-outlineVariant/30 p-3.5 rounded-2xl w-full text-left">
                    <p className="m3-body-small text-[#cac4d0]">
                      Looking for: <span className="text-[#eaddff] font-bold ml-1">{gig.SkillWanted}</span>
                    </p>
                  </div>

                  {/* Footer Actions */}
                  <div className="w-full mt-1">
                    {isSuperAdmin ? (
                      <button
                        onClick={() => handleDelete(gig.id || gig._id)}
                        className="m3-filled-button bg-[#8c1d18] text-[#f9dedc] hover:brightness-110 !min-h-[44px]"
                        type="button"
                      >
                        <Trash2 size={16} /> Moderate (Delete Listing)
                      </button>
                    ) : isOwnListing ? (
                      <button
                        onClick={() => handleDelete(gig.id || gig._id)}
                        className="m3-filled-button bg-[#483c5e] text-[#e6e1e5] hover:brightness-110 !min-h-[44px]"
                        type="button"
                      >
                        <Trash2 size={16} /> Delete Post
                      </button>
                    ) : isAccepted ? (
                      <div className="bg-m3-surfaceContainer border border-m3-outlineVariant/30 rounded-2xl p-4 flex flex-col items-center gap-3 w-full">
                        <span className="text-[#cac4d0] font-bold text-[10px] uppercase tracking-widest block text-center font-mono">
                          {gig.Status === 'Completed' ? '✓ SWAP COMPLETED' : 'REQUEST ACCEPTED!'}
                        </span>
                        
                        {gig.Status === 'Completed' ? (
                          <div className="w-full py-3 bg-m3-secondaryContainer text-m3-onSecondaryContainer rounded-2xl text-xs font-bold flex items-center justify-center gap-2 select-none shadow-sm">
                            <CheckCircle2 size={15} /> Swap Completed!
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2.5 w-full">
                            <button
                              onClick={() => handleStartChat(gig.StudentName)}
                              className="m3-filled-button bg-m3-primary text-m3-onPrimary hover:brightness-110 !min-h-[44px] flex items-center justify-center gap-2 font-bold text-xs"
                              type="button"
                            >
                              <MessageCircle size={15} /> Open Chat with {gig.StudentName}
                            </button>
                            <button
                              onClick={() => handleMarkAsDone(gig.id || gig._id)}
                              className="m3-filled-button bg-m3-surfaceVariant text-m3-onSurfaceVariant hover:brightness-110 !min-h-[40px] flex items-center justify-center gap-1.5 font-bold text-xs"
                              type="button"
                            >
                              Mark as Done ✓
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleStartChat(gig.StudentName)}
                        className="m3-filled-button bg-m3-secondaryContainer text-m3-onSecondaryContainer hover:brightness-110 !min-h-[44px] flex items-center justify-center gap-2 font-bold text-xs"
                        type="button"
                      >
                        <MessageCircle size={15} /> Chat with {gig.StudentName}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Custom Confirm Dialog */}
      {confirmDialog && (
        <div className="absolute inset-0 z-[1000] bg-black/60 flex items-center justify-center p-4">
          <div className="m3-surface-card p-6 flex flex-col gap-4 text-left max-w-[280px] w-full shadow-2xl animate-fade-in">
            <h3 className="m3-title-medium text-white">Confirm Action</h3>
            <p className="m3-body-small text-[#cac4d0]">{confirmDialog.message}</p>
            <div className="flex justify-end gap-2.5 mt-2">
              <button
                onClick={() => setConfirmDialog(null)}
                className="m3-filled-button bg-m3-surfaceVariant text-m3-onSurfaceVariant !min-h-[36px] text-xs !py-1 px-3 w-auto"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
                className="m3-filled-button bg-m3-primary text-m3-onPrimary !min-h-[36px] text-xs !py-1 px-3 w-auto"
                type="button"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Prompt Dialog */}
      {promptDialog && (
        <div className="absolute inset-0 z-[1000] bg-black/60 flex items-center justify-center p-4">
          <div className="m3-surface-card backdrop-blur-md p-6 flex flex-col gap-4 text-left max-w-[280px] w-full shadow-2xl animate-fade-in">
            <h3 className="m3-title-medium text-white">{promptDialog.title}</h3>
            <p className="m3-body-small text-[#cac4d0]">{promptDialog.message}</p>
            <input
              type="text"
              value={promptDialog.value}
              onChange={(e) => setPromptDialog(prev => ({ ...prev, value: e.target.value }))}
              placeholder="Reason..."
              className="m3-filled-field !h-[40px] text-xs"
              autoFocus
            />
            <div className="flex justify-end gap-2.5 mt-2">
              <button
                onClick={() => setPromptDialog(null)}
                className="m3-filled-button bg-m3-surfaceVariant text-m3-onSurfaceVariant !min-h-[36px] text-xs !py-1 px-3 w-auto"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (promptDialog.value.trim()) {
                    promptDialog.onConfirm(promptDialog.value.trim());
                    setPromptDialog(null);
                  } else {
                    alert('Reason is required.');
                  }
                }}
                className="m3-filled-button bg-m3-primary text-m3-onPrimary !min-h-[36px] text-xs !py-1 px-3 w-auto"
                type="button"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
