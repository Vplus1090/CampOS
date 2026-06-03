import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Megaphone, User, Trash2, AlertTriangle, ChevronDown } from 'lucide-react';
import { API_BASE } from '../config/api';
import M3ScreenHeader from './M3ScreenHeader';

export default function NoticesFeed({ currentUser, onUpdate, setActiveTab }) {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterPriority, setFilterPriority] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // New notice form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [postedBy, setPostedBy] = useState(currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : '');
  const [submitting, setSubmitting] = useState(false);

  const isSuperAdmin = currentUser?.role === 'admin';

  const handleScroll = (e) => {
    const currentScrollTop = e.target.scrollTop;
    setIsScrolled(currentScrollTop > 10);
  };

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

  return (
    <div className="m3-screen notices-dashboard">
      <M3ScreenHeader
        title="Campus Notices"
        subtitle="Announcements & Alerts"
        isScrolled={isScrolled}
        onBack={() => setActiveTab('home')}
      />

      <div onScroll={handleScroll} className="m3-screen__scroll space-y-5" style={{ paddingBottom: 96 }}>

        {/* Filters */}
        <div className="flex items-center justify-center w-full pt-5 pb-0 !-mb-2.5 shrink-0 px-1">
          <div className="m3-segmented-chips">
            {['All', 'High', 'Medium', 'Low'].map((p) => (
              <button
                key={p}
                className={`m3-segmented-chip ${filterPriority === p ? 'm3-segmented-chip--selected' : ''}`}
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
            <p className="text-xs font-semibold m3-text-variant uppercase tracking-widest">Syncing notice feed...</p>
          </div>
        ) : error ? (
          <div className="m3-surface-card p-8 flex flex-col items-center justify-center gap-4 text-center">
            <p className="m3-body-medium m3-text-variant">⚠️ {error}</p>
            <button className="m3-filled-button max-w-[160px] min-h-[40px] text-xs py-2" onClick={fetchNotices}>Retry</button>
          </div>
        ) : notices.length === 0 ? (
          <div className="m3-surface-card p-12 flex items-center justify-center text-center">
            <p className="text-xs font-semibold m3-text-variant uppercase tracking-widest">📭 No announcements found.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {notices.map((notice) => {
              const priority = notice.PriorityLevel.toLowerCase();
              
              const badgeStyle = 
                priority === 'high' 
                  ? 'bg-[#ba1a1a]/15 text-[#ffb4ab] border-[#ffb4ab]/20' 
                  : priority === 'medium'
                  ? 'bg-[#4f378b]/20 text-[#d0bcff] border-[#4f378b]/40'
                  : 'bg-white/[0.04] text-slate-400 border-white/10';

              return (
                <article 
                  key={notice.id || notice._id} 
                  id={`notice-${notice.id || notice._id}`}
                  className="m3-surface-card flex flex-col gap-4 text-left"
                >
                  <div 
                    className="flex justify-between items-center w-full pb-3.5"
                    style={{ borderBottom: '1px solid color-mix(in srgb, var(--m3-outline-variant) 35%, transparent)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="m3-icon-badge">
                        <Megaphone size={18} />
                      </div>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${badgeStyle}`}>
                        {notice.PriorityLevel}
                      </span>
                    </div>
                    <span className="text-[11px] font-medium m3-text-variant">
                      {formatDate(notice.Date || notice.createdAt)}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="m3-title-medium select-text">
                      {notice.Title}
                    </h3>
                    <p className="m3-body-medium m3-text-variant leading-relaxed select-text">
                      {notice.Content}
                    </p>
                  </div>
                  
                  <div 
                    className="flex justify-between items-center w-full pt-3.5"
                    style={{ borderTop: '1px solid color-mix(in srgb, var(--m3-outline-variant) 20%, transparent)' }}
                  >
                    <span className="text-[11px] font-medium m3-text-variant flex items-center gap-1.5">
                      <User size={12} className="text-m3-primary" /> {notice.PostedBy}
                    </span>
                    
                    {/* Only Super Admin can delete announcements */}
                    {isSuperAdmin && (
                      <button 
                        className="w-8 h-8 rounded-full hover:bg-[#ba1a1a]/15 text-[#ffb4ab] flex items-center justify-center transition-colors duration-200 active:scale-90"
                        onClick={() => handleDelete(notice.id || notice._id)}
                        title="Remove Announcement"
                        type="button"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Super Admin Extended FAB */}
      {isSuperAdmin && (
        <button
          onClick={() => setShowModal(true)}
          className="absolute bottom-6 right-6 z-30 bg-m3-primary text-m3-on-primary rounded-[16px] px-5 h-14 flex items-center gap-2.5 font-bold shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
          type="button"
        >
          <Plus size={20} strokeWidth={2.5} />
          <span className="text-sm tracking-wide">Post Notice</span>
        </button>
      )}

      {/* Creation Modal Bottom Sheet */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 z-[99999] flex items-end justify-center"
            onClick={() => setShowModal(false)}
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="bg-[#211a30]/75 backdrop-blur-xl rounded-t-[32px] rounded-b-none p-6 w-full shadow-2xl flex flex-col gap-6 text-left border-t border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-[#e6e1e5] flex items-center gap-2">
                  <Megaphone size={20} className="text-m3-primary" /> Post Campus Notice
                </h3>
                <button 
                  onClick={() => setShowModal(false)} 
                  className="p-2 -mr-2 text-slate-400 hover:text-white rounded-full hover:bg-white/5 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
                <div className="flex flex-col gap-1.5">
                  <label className="m3-title-small m3-text-variant pl-1" htmlFor="notice-title">Notice Title</label>
                  <input
                    id="notice-title"
                    type="text"
                    placeholder="e.g., Spring Hackathon 2026"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="m3-filled-field"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="m3-title-small m3-text-variant pl-1" htmlFor="notice-postedby">Posted By</label>
                  <input
                    id="notice-postedby"
                    type="text"
                    placeholder="e.g., Dean, Administrator"
                    value={postedBy}
                    onChange={(e) => setPostedBy(e.target.value)}
                    required
                    className="m3-filled-field"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="m3-title-small m3-text-variant pl-1" htmlFor="notice-priority">Priority Level</label>
                  <div className="m3-select-wrap">
                    <select
                      id="notice-priority"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="m3-select"
                    >
                      <option value="Low" className="bg-[#211a30] text-[#e6e1e5]">Low - Casual</option>
                      <option value="Medium" className="bg-[#211a30] text-[#e6e1e5]">Medium - Academic</option>
                      <option value="High" className="bg-[#211a30] text-[#e6e1e5]">High - Critical</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#d0bcff]">
                      <ChevronDown size={14} />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="m3-title-small m3-text-variant pl-1" htmlFor="notice-content">Notice Content</label>
                  <textarea
                    id="notice-content"
                    rows="4"
                    placeholder="Announcement details..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                    className="m3-filled-field h-auto py-3 resize-none"
                  />
                </div>

                <div className="flex justify-between items-center gap-3 pt-3">
                  <button 
                    type="button" 
                    className="flex-1 min-h-[52px] border border-white/10 text-white rounded-full font-bold flex items-center justify-center hover:bg-white/5 active:scale-98 transition-all cursor-pointer" 
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 m3-filled-button min-h-[52px] cursor-pointer"
                    disabled={submitting}
                  >
                    {submitting ? 'Posting...' : 'Publish'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
