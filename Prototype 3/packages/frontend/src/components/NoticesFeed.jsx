import React, { useState, useEffect } from 'react';

export default function NoticesFeed({ currentUser, onUpdate }) {
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
        ? '/api/notices' 
        : `/api/notices?priority=${filterPriority}`;
      
      const res = await fetch(url);
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
      const res = await fetch('/api/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Title: title,
          Content: content,
          PriorityLevel: priority,
          PostedBy: postedBy,
        }),
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
      const res = await fetch(`/api/notices/${id}`, {
        method: 'DELETE',
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

  // Find the latest high priority notice for the top marquee ticker
  const latestHighPriority = notices.find(n => n.PriorityLevel === 'High');

  return (
    <div className="notices-module">
      {/* Ticker / Scrolling Marquee for High Priority Announcements */}
      {latestHighPriority && (
        <div className="ticker-container">
          <div className="ticker-badge">CRITICAL</div>
          <div className="ticker-wrap">
            <div className="ticker-text">
              💥 {latestHighPriority.Title}: {latestHighPriority.Content} (Posted by {latestHighPriority.PostedBy}) &nbsp;&nbsp;&nbsp;&nbsp; ★ &nbsp;&nbsp;&nbsp;&nbsp;
              💥 {latestHighPriority.Title}: {latestHighPriority.Content} (Posted by {latestHighPriority.PostedBy})
            </div>
          </div>
        </div>
      )}

      {/* Module Header and Controls */}
      <div className="module-header">
        <div className="header-info">
          <h2>📢 Announcements Board</h2>
          <p>Important dates, events, and warnings from campus administrators</p>
        </div>
        
        {/* Only Super Admin can post announcements */}
        {isSuperAdmin && (
          <button 
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            <span>＋</span> Post Notice
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <span className="filter-label">Filter by Priority:</span>
        <div className="filter-buttons">
          {['All', 'High', 'Medium', 'Low'].map((p) => (
            <button
              key={p}
              className={`filter-btn ${filterPriority === p ? 'active' : ''} priority-${p.toLowerCase()}`}
              onClick={() => setFilterPriority(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Content Feed */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Syncing notice feed...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <p>⚠️ {error}</p>
          <button className="btn btn-secondary" onClick={fetchNotices}>Retry</button>
        </div>
      ) : notices.length === 0 ? (
        <div className="empty-state">
          <p>📭 No announcements found for this filter level.</p>
        </div>
      ) : (
        <div className="feed-container">
          {notices.map((notice) => (
            <div 
              key={notice.id || notice._id} 
              className={`notice-card priority-${notice.PriorityLevel.toLowerCase()}`}
            >
              <div className="notice-card-header">
                <span className={`priority-tag tag-${notice.PriorityLevel.toLowerCase()}`}>
                  {notice.PriorityLevel}
                </span>
                <span className="notice-date">{formatDate(notice.Date || notice.createdAt)}</span>
              </div>
              <h3 className="notice-title">{notice.Title}</h3>
              <p className="notice-content">{notice.Content}</p>
              <div className="notice-card-footer">
                <span className="notice-author">👤 {notice.PostedBy}</span>
                
                {/* Only Super Admin can delete announcements */}
                {isSuperAdmin && (
                  <button 
                    className="btn-delete"
                    onClick={() => handleDelete(notice.id || notice._id)}
                    title="Remove Announcement"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Creation Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Campus Announcement</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label htmlFor="notice-title">Notice Title</label>
                <input
                  id="notice-title"
                  type="text"
                  placeholder="e.g., Spring Hackathon 2026 Registration"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="notice-postedby">Posted By</label>
                <input
                  id="notice-postedby"
                  type="text"
                  placeholder="e.g., Dean, Administrator"
                  value={postedBy}
                  onChange={(e) => setPostedBy(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="notice-priority">Priority Level</label>
                <select
                  id="notice-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  required
                >
                  <option value="Low">🟢 Low - Casual announcements</option>
                  <option value="Medium">🟡 Medium - Regular academic/club events</option>
                  <option value="High">🔴 High - Urgent/Critical warnings</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="notice-content">Notice Content</label>
                <textarea
                  id="notice-content"
                  rows="4"
                  placeholder="Write clear, descriptive announcement details..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Posting...' : 'Publish Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
