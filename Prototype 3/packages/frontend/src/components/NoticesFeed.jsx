import React, { useState, useEffect } from 'react';

const API_BASE = "https://campos-fmjh.onrender.com";

export default function NoticesFeed({ currentUser, onUpdate, setActiveTab }) {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterPriority, setFilterPriority] = useState('All');
  const [showModal, setShowModal] = useState(false);

  // New notice form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [postedBy, setPostedBy] = useState(currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : '');
  const [submitting, setSubmitting] = useState(false);

  const isSuperAdmin = currentUser?.role === 'admin';

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const url = filterPriority === 'All' 
        ? `${API_BASE}/api/notices` 
        : `${API_BASE}/api/notices?priority=${filterPriority}`;
      
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load notices');
      const data = await res.json();
      setNotices(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, [filterPriority]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !content || !postedBy) return;

    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE}/api/notices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Title: title,
          Content: content,
          PriorityLevel: priority,
          PostedBy: postedBy,
        }),
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to post announcement');
      }
      
      // Reset form
      setTitle('');
      setContent('');
      setPriority('Medium');
      setShowModal(false);
      
      // Refresh list
      fetchNotices();
      if (onUpdate) onUpdate();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;

    try {
      const res = await fetch(`${API_BASE}/api/notices/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to delete notice');
      }
      
      // Refresh list
      fetchNotices();
      if (onUpdate) onUpdate();
    } catch (err) {
      alert(err.message);
    }
  };

  const formatDate = (dateString) => {
    const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Find the latest high priority notice for the top warning ticker
  const latestHighPriority = notices.find(n => n.PriorityLevel === 'High');

  return (
    <div className="notices-module text-white font-sans min-h-screen pb-24 relative select-none">
      {/* Module Header and Controls */}
      <header className="flex items-center w-full mt-6 border-b border-white/10 pb-3 shrink-0 justify-between gap-4 mb-5">
        <div className="flex items-center">
          <button
            onClick={() => setActiveTab('home')}
            className="w-11 h-11 bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white rounded-full transition-all duration-300 active:scale-95 flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-md cursor-pointer shrink-0"
            type="button"
          >
            <span className="text-xl font-bold">&larr;</span>
          </button>
          <h2 className="flex items-center pl-3.5 text-left translate-y-[2px] text-[22px] italic font-normal text-white leading-none tracking-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Campus Notices
          </h2>
        </div>
        
        {/* Only Super Admin can post announcements */}
        {isSuperAdmin && (
          <button 
            className="bg-white hover:bg-slate-50 text-[#141a27] font-extrabold text-[11px] uppercase tracking-wider rounded-xl px-4 py-2.5 transition-all duration-300 active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer"
            onClick={() => setShowModal(true)}
            type="button"
          >
            Post Notice
          </button>
        )}
      </header>

      {/* Ticker / Pulse Bar for High Priority Announcements */}
      {latestHighPriority && (
        <div className="w-full flex items-center bg-rose-500/[0.06] border border-rose-500/25 rounded-2xl p-2.5 mb-5 shadow-lg overflow-hidden select-none animate-fadeIn backdrop-blur-md">
          <div className="bg-rose-500 text-[#141a27] text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md shrink-0 shadow-sm leading-none mr-3">CRITICAL</div>
          <div className="flex-1 overflow-hidden relative flex items-center">
            <div className="animate-pulse text-[11px] font-bold text-rose-300 text-left truncate">
              💥 {latestHighPriority.Title}: {latestHighPriority.Content}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center justify-between w-full py-2 mb-6">
        <span className="text-[10px] font-sans font-black uppercase tracking-widest text-slate-400 pl-1 select-none">Filter:</span>
        <div className="flex bg-white/[0.04] p-1 rounded-full border border-white/10 shadow-inner select-none backdrop-blur-md">
          {['All', 'High', 'Medium', 'Low'].map((p) => (
            <button
              key={p}
              className={`py-1.5 px-4 text-[9px] font-black uppercase tracking-widest rounded-full transition-all duration-300 cursor-pointer ${
                filterPriority === p
                  ? 'bg-white text-[#141a27] shadow-md font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              onClick={() => setFilterPriority(p)}
              type="button"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Content Feed */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="w-8 h-8 rounded-full border border-transparent border-t-white border-r-white animate-spin" />
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest animate-pulse">Syncing notice feed...</p>
        </div>
      ) : error ? (
        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-8 flex flex-col items-center justify-center gap-4 text-center">
          <p className="text-sm font-semibold text-red-300">⚠️ {error}</p>
          <button className="bg-white text-[#141a27] font-black text-xs uppercase tracking-wider rounded-xl px-6 py-3 cursor-pointer transition-all active:scale-95 shadow-md" onClick={fetchNotices}>Retry</button>
        </div>
      ) : notices.length === 0 ? (
        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-12 flex items-center justify-center text-center">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">📭 No announcements found.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {notices.map((notice) => {
            const priority = notice.PriorityLevel.toLowerCase();
            
            const colorStyle = 
              priority === 'high' 
                ? 'border-rose-500/40 bg-rose-500/[0.02] shadow-[0_0_25px_rgba(244,63,94,0.05)]' 
                : priority === 'medium'
                ? 'border-amber-500/40 bg-amber-500/[0.02] shadow-[0_0_25px_rgba(245,158,11,0.05)]'
                : 'border-emerald-500/40 bg-emerald-500/[0.02] shadow-[0_0_25px_rgba(16,185,129,0.05)]';
            
            const badgeStyle = 
              priority === 'high' 
                ? 'bg-rose-500/10 text-rose-300 border-rose-500/20' 
                : priority === 'medium'
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';

            return (
              <div 
                key={notice.id || notice._id} 
                className={`rounded-[28px] p-6 transition-all duration-300 relative border-2 ${colorStyle} backdrop-blur-3xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col gap-4 text-left hover:scale-[1.01]`}
              >
                <div className="flex justify-between items-center w-full">
                  <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${badgeStyle}`}>
                    {notice.PriorityLevel}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-slate-400">
                    {formatDate(notice.Date || notice.createdAt)}
                  </span>
                </div>
                
                <h3 className="text-lg font-black text-white leading-snug mt-1 select-text">
                  {notice.Title}
                </h3>
                <p className="text-xs font-semibold leading-relaxed text-slate-300 select-text">
                  {notice.Content}
                </p>
                
                <div className="flex justify-between items-center w-full mt-2 pt-3 border-t border-white/5">
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 select-none">
                    👤 {notice.PostedBy}
                  </span>
                  
                  {/* Only Super Admin can delete announcements */}
                  {isSuperAdmin && (
                    <button 
                      className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/10 hover:bg-red-500/15 hover:border-red-500/35 hover:text-red-400 flex items-center justify-center text-xs font-black transition-all active:scale-90 select-none cursor-pointer"
                      onClick={() => handleDelete(notice.id || notice._id)}
                      title="Remove Announcement"
                      type="button"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Creation Modal */}
      {showModal && (
        <div className="absolute inset-0 bg-[#0f131a]/80 backdrop-blur-xl z-[99999] flex items-center justify-center p-6 animate-fadeIn" onClick={() => setShowModal(false)}>
          <div className="bg-slate-900/90 border border-white/10 rounded-[32px] p-6 shadow-2xl w-full max-w-sm flex flex-col gap-5" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-base font-black text-white uppercase tracking-wider">Create Notice</h3>
              <button className="text-slate-400 hover:text-white font-extrabold cursor-pointer" onClick={() => setShowModal(false)}>✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 pl-1" htmlFor="notice-title">Notice Title</label>
                <input
                  id="notice-title"
                  type="text"
                  placeholder="e.g., Spring Hackathon 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full bg-white/[0.05] border border-white/15 focus:border-white/35 focus:ring-2 focus:ring-white/5 rounded-xl px-4 py-3 text-sm font-semibold text-white tracking-wide transition-all outline-none"
                />
              </div>

              <div className="form-group flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 pl-1" htmlFor="notice-postedby">Posted By</label>
                <input
                  id="notice-postedby"
                  type="text"
                  placeholder="e.g., Dean, Administrator"
                  value={postedBy}
                  onChange={(e) => setPostedBy(e.target.value)}
                  required
                  className="w-full bg-white/[0.05] border border-white/15 focus:border-white/35 focus:ring-2 focus:ring-white/5 rounded-xl px-4 py-3 text-sm font-semibold text-white tracking-wide transition-all outline-none"
                />
              </div>

              <div className="form-group flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 pl-1" htmlFor="notice-priority">Priority Level</label>
                <select
                  id="notice-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  required
                  className="w-full bg-[#1e2533] border border-white/15 focus:border-white/35 focus:ring-2 focus:ring-white/5 rounded-xl px-4 py-3 text-sm font-semibold text-white tracking-wide transition-all outline-none cursor-pointer"
                >
                  <option value="Low">🟢 Low - Casual</option>
                  <option value="Medium">🟡 Medium - Academic</option>
                  <option value="High">🔴 High - Critical</option>
                </select>
              </div>

              <div className="form-group flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 pl-1" htmlFor="notice-content">Notice Content</label>
                <textarea
                  id="notice-content"
                  rows="4"
                  placeholder="Announcement details..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  className="w-full bg-white/[0.05] border border-white/15 focus:border-white/35 focus:ring-2 focus:ring-white/5 rounded-xl px-4 py-3 text-sm font-semibold text-white tracking-wide transition-all outline-none resize-none"
                />
              </div>

              <div className="flex justify-between items-center gap-3 pt-3">
                <button 
                  type="button" 
                  className="flex-1 bg-white/[0.05] border border-white/10 hover:bg-white/[0.1] text-white font-extrabold text-xs uppercase tracking-wider py-3.5 rounded-xl cursor-pointer transition-all duration-300" 
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-white text-[#141a27] hover:bg-slate-50 font-extrabold text-xs uppercase tracking-wider py-3.5 rounded-xl cursor-pointer transition-all duration-300 disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? 'Posting...' : 'Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
