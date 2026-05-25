import React, { useState, useEffect } from 'react';
import { 
  UserPlus, Send, MessageCircle, X, Search, 
  Trash2, Flag, CheckCircle2 
} from 'lucide-react';

const API_BASE = import.meta.env.DEV ? "" : "https://campos-fmjh.onrender.com";

export default function SkillSwapGrid({ currentUser, onUpdate, setActiveTab, onStartChat }) {
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewTab, setViewTab] = useState('listings');
  
  // Started chats tracker to dynamically flag matches & move them to ongoing
  const [startedChats, setStartedChats] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cp_started_chats') || '[]');
    } catch (e) {
      return [];
    }
  });

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

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this skill swap listing?')) return;

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
  };

  const handleMarkAsDone = async (id) => {
    if (!window.confirm('Mark this skill swap match as successfully completed/done?')) return;

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
  };

  const handleReport = async (id) => {
    const reason = window.prompt('Please enter the reason for reporting this listing:');
    if (reason === null) return;
    if (!reason.trim()) {
      alert('Report reason is required.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/skillgigs/${id}/report`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ReportReason: reason.trim() }),
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
  };

  // Helper to color circles dynamically
  const getAvatarBg = (name) => {
    const letter = name.charAt(0).toUpperCase();
    if (letter === 'V' || letter === 'S') return 'bg-pink-500';
    if (letter === 'K' || letter === 'R') return 'bg-violet-500';
    if (letter === 'D' || letter === 'A') return 'bg-sky-500';
    return 'bg-emerald-500';
  };

  const ongoingGigs = gigs.filter(gig => gig.StudentName.toLowerCase() === 'kunal' || startedChats.includes(gig.StudentName));
  const listingsGigs = gigs.filter(gig => gig.StudentName.toLowerCase() !== 'kunal' && !startedChats.includes(gig.StudentName));
  const displayedGigs = viewTab === 'listings' ? listingsGigs : ongoingGigs;

  return (
    <div className="skillgigs-module flex flex-col gap-4 text-white font-sans min-h-screen pb-24 relative select-none">
      {/* Header title */}
      <header className="flex items-center w-full mt-6 border-b border-white/10 pb-3 shrink-0 justify-between animate-fadeIn">
        <div className="flex items-center">
          <button
            onClick={() => setActiveTab && setActiveTab('home')}
            className="w-11 h-11 bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white rounded-full transition-all duration-300 active:scale-95 flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-md cursor-pointer shrink-0"
            type="button"
          >
            <span className="text-xl font-bold">&larr;</span>
          </button>
          <h2 className="flex items-center pl-3.5 text-left translate-y-[2px] text-[22px] italic font-normal text-white leading-none tracking-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Skill Swap
          </h2>
        </div>
        
        {/* Search toggle or active count */}
        <span className="bg-white/[0.05] border border-white/10 text-slate-300 font-bold font-mono text-[9px] px-3.5 py-1.5 rounded-full uppercase tracking-widest shrink-0">
          {viewTab === 'listings' ? `${listingsGigs.length} Listings` : `${ongoingGigs.length} Matches`}
        </span>
      </header>

      {/* Segmented Tab Switcher */}
      <div className="flex justify-center w-full py-1 shrink-0 select-none animate-fadeIn">
        <div className="flex bg-white/[0.04] p-1.5 rounded-full border border-white/10 shadow-inner">
          <button
            onClick={() => setViewTab('listings')}
            className={`py-2 px-6 text-[10px] font-black uppercase tracking-widest rounded-full transition-all duration-300 cursor-pointer ${
              viewTab === 'listings'
                ? 'bg-white text-[#141a27] shadow-md font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            type="button"
          >
            Listings ({listingsGigs.length})
          </button>
          <button
            onClick={() => setViewTab('ongoing')}
            className={`py-2 px-6 text-[10px] font-black uppercase tracking-widest rounded-full transition-all duration-300 cursor-pointer ${
              viewTab === 'ongoing'
                ? 'bg-white text-[#141a27] shadow-md font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            type="button"
          >
            Ongoing ({ongoingGigs.length})
          </button>
        </div>
      </div>

      {/* ─── Top Dark Card: Offer a Skill ─── */}
      {viewTab === 'listings' && isStudent && (
        <div className="bg-purple-500/[0.03] backdrop-blur-3xl border-2 border-purple-500/35 text-white rounded-[32px] p-6 flex flex-col gap-4 shadow-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] shadow-[0_0_35px_rgba(168,85,247,0.08)] relative overflow-hidden group">
          
          <div className="flex items-center gap-2 border-b border-white/5 pb-3 z-10">
            <UserPlus size={18} className="text-purple-400" />
            <h3 className="font-extrabold text-base tracking-wide font-sans">Offer a Skill</h3>
          </div>

          <form onSubmit={handleCreateGig} className="flex flex-col gap-3 z-10">
            {/* Input 1: What can you teach */}
            <input
              type="text"
              placeholder="What can you teach? (e.g. Guitar)"
              value={skillOffered}
              onChange={(e) => setSkillOffered(e.target.value)}
              required
              className="w-full bg-white/[0.04] text-white placeholder-slate-500 border border-white/10 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 rounded-2xl p-4 text-sm font-semibold transition-all placeholder:text-xs placeholder:font-normal"
            />

            {/* Row combining Input 2 and Purple paper plane send button */}
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="What do you want to learn?"
                value={skillWanted}
                onChange={(e) => setSkillWanted(e.target.value)}
                required
                className="flex-1 bg-white/[0.04] text-white placeholder-slate-500 border border-white/10 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 rounded-2xl p-4 text-sm font-semibold transition-all placeholder:text-xs placeholder:font-normal"
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-12 h-12 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 transform shrink-0 disabled:opacity-50 cursor-pointer"
              >
                <Send size={16} className="text-white" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search Input Filter */}
      {viewTab === 'listings' && (
        <div className="search-filter-container w-full mt-0 mb-[-6px]">
          <div className="relative flex items-center">
            <Search size={16} className="absolute left-4 text-slate-400" />
            <input
              type="text"
              className="w-full bg-white/[0.04] border border-white/10 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-slate-400 pl-11 pr-10 py-3.5 rounded-2xl text-xs font-semibold backdrop-blur-md"
              placeholder="Search for skills, listings, or students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                className="absolute right-4 text-slate-400 hover:text-slate-200 cursor-pointer"
                onClick={() => setSearchQuery('')}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* Content Listings Feed */}
      {loading ? (
        <div className="loading-state py-8 text-center">
          <div className="spinner mx-auto border-t-purple-500"></div>
          <p className="text-xs font-mono text-slate-400 mt-4">Loading board...</p>
        </div>
      ) : error ? (
        <div className="error-state text-center py-6">
          <p className="text-sm font-medium text-slate-400">⚠️ {error}</p>
          <button className="bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white rounded-xl px-4 py-2 text-xs font-semibold mt-2 cursor-pointer" onClick={() => fetchGigs(searchQuery)}>Retry</button>
        </div>
      ) : displayedGigs.length === 0 ? (
        <div className="empty-state text-center py-12 bg-white/[0.02] rounded-[32px] border border-white/5 animate-fadeIn">
          <p className="text-sm font-bold text-slate-400">
            {viewTab === 'listings' ? 'No active listings found.' : 'No ongoing matches found.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 animate-fadeIn">
          {displayedGigs.map((gig) => {
            const isOwnListing = gig.StudentName === currentUser?.firstName;
            
            // Dynamic check if listing is accepted (either Kunal or actively started chat)
            const isAccepted = gig.StudentName.toLowerCase() === 'kunal' || startedChats.includes(gig.StudentName);

            const cardBorder = isOwnListing 
              ? 'border-purple-500/40 bg-purple-500/[0.02] shadow-[0_0_25px_rgba(168,85,247,0.06)]'
              : 'border-white/10 bg-white/[0.03] shadow-[0_0_20px_rgba(255,255,255,0.01)]';

            return (
              <div 
                key={gig.id || gig._id} 
                className={`rounded-[28px] p-5 flex flex-col gap-4 border-2 ${cardBorder} backdrop-blur-3xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] transition-all duration-300 hover:scale-[1.01]`}
              >
                {/* Header Row */}
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center gap-3">
                    {/* Pink/purple circular avatar containing student initial */}
                    <div className={`w-12 h-12 ${getAvatarBg(gig.StudentName)} rounded-full flex items-center justify-center shadow-inner border border-white/10 shrink-0 min-w-[48px] min-h-[48px]`}>
                      <span className="text-white font-extrabold text-base tracking-tighter">
                        {gig.StudentName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="text-left">
                      <h4 className="text-base font-extrabold text-white leading-tight font-sans">
                        {gig.SkillOffered}
                      </h4>
                      <span className="text-[10px] font-bold text-slate-400 font-mono tracking-widest uppercase block mt-1">
                        BY {gig.StudentName}
                      </span>
                    </div>
                  </div>

                  {/* Flag report button for peer listings */}
                  {!isOwnListing && !isSuperAdmin && (
                    <button
                      onClick={() => handleReport(gig.id || gig._id)}
                      className="text-slate-400 hover:text-red-400 p-1.5 transition-colors cursor-pointer"
                      title="Report Listing"
                    >
                      <Flag size={14} />
                    </button>
                  )}
                </div>

                {/* Looking for Wanted Skill Pill */}
                <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl w-full flex items-center shadow-inner">
                  <p className="text-xs font-semibold text-slate-300 font-sans text-left">
                    Looking for: <span className="text-purple-400 font-black ml-1">{gig.SkillWanted}</span>
                  </p>
                </div>

                {/* Footer Buttons Section */}
                <div className="w-full mt-1">
                  {isSuperAdmin ? (
                    <button
                      onClick={() => handleDelete(gig.id || gig._id)}
                      className="w-full py-3 bg-red-500/15 border border-red-500/30 hover:bg-red-500/25 active:scale-95 text-red-400 font-bold rounded-2xl text-xs uppercase tracking-wide transition-all shadow-md cursor-pointer"
                    >
                      Moderate (Delete Listing)
                    </button>
                  ) : isOwnListing ? (
                    /* Delete Post full-width glassy button */
                    <button
                      onClick={() => handleDelete(gig.id || gig._id)}
                      className="w-full py-3.5 bg-white/[0.05] border border-white/15 text-slate-200 hover:bg-white/[0.1] active:scale-95 font-bold rounded-2xl text-xs tracking-wider transition-all text-center backdrop-blur-md shadow-md cursor-pointer"
                    >
                      Delete Post
                    </button>
                  ) : isAccepted ? (
                    /* accepted green box wrapper + green button */
                    <div className="bg-emerald-500/[0.05] border border-emerald-500/20 rounded-2xl p-4 flex flex-col items-center gap-3 w-full shadow-inner animate-fadeIn">
                      <span className="text-emerald-400 font-black text-[10px] uppercase tracking-widest block text-center font-mono">
                        {gig.Status === 'Completed' ? '✓ SWAP COMPLETED' : 'REQUEST ACCEPTED!'}
                      </span>
                      
                      {gig.Status === 'Completed' ? (
                        <div className="w-full py-3.5 bg-emerald-500/10 border border-emerald-500/35 text-emerald-400 font-black rounded-2xl text-xs flex items-center justify-center gap-2 select-none shadow-md">
                          <CheckCircle2 size={15} className="text-emerald-400" /> Swap Completed!
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2.5 w-full">
                          <button
                            onClick={() => handleStartChat(gig.StudentName)}
                            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                          >
                            <MessageCircle size={15} /> Open Chat with {gig.StudentName}
                          </button>
                          <button
                            onClick={() => handleMarkAsDone(gig.id || gig._id)}
                            className="w-full py-2.5 bg-white/[0.05] border border-white/10 hover:bg-white/[0.1] active:scale-95 text-slate-300 hover:text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer backdrop-blur-md shadow-sm"
                          >
                            Mark as Done ✓
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* standard peer listings chat button */
                    <button
                      onClick={() => handleStartChat(gig.StudentName)}
                      className="w-full py-3.5 bg-purple-500/[0.08] hover:bg-purple-500/[0.15] border border-purple-500/35 active:scale-95 text-purple-300 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all backdrop-blur-md shadow-md cursor-pointer"
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
  );
}
