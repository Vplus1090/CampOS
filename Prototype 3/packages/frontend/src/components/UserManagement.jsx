import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, UserMinus, UserCheck, RefreshCw, ShieldAlert, Award } from 'lucide-react';
import M3ScreenHeader from './M3ScreenHeader';
import { API_BASE } from '../config/api';

export default function UserManagement({ currentUser, setActiveTab }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);

  // Add User Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('student');
  const [submittingUser, setSubmittingUser] = useState(false);

  // Change Role Inline State
  const [editingUserId, setEditingUserId] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [updatingRole, setUpdatingRole] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/users?search=${encodeURIComponent(searchQuery)}`, {
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to fetch users list');
      }

      const responseData = await res.json();
      setUsers(responseData.data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchQuery]);

  const handleScroll = (e) => {
    setIsScrolled(e.target.scrollTop > 12);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !password || !role) return;

    try {
      setSubmittingUser(true);
      const res = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
          phone,
          role,
        }),
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to create user account');
      }

      // Reset fields & close modal
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setPhone('');
      setRole('student');
      setShowAddModal(false);

      // Refresh list
      fetchUsers();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingUser(false);
    }
  };

  const handleToggleSuspend = async (userId, currentlySuspended) => {
    try {
      const res = await fetch(`${API_BASE}/api/users/${userId}/suspend`, {
        method: 'PATCH',
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to toggle suspension status');
      }

      // Update state
      setUsers((prev) =>
        prev.map((u) => {
          if (u._id === userId) {
            return { ...u, isSuspended: !currentlySuspended };
          }
          return u;
        })
      );
    } catch (err) {
      alert(err.message);
    }
  };

  const handleChangeRole = async (userId) => {
    if (!selectedRole) return;
    try {
      setUpdatingRole(true);
      const res = await fetch(`${API_BASE}/api/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole }),
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to change user role');
      }

      // Update state
      setUsers((prev) =>
        prev.map((u) => {
          if (u._id === userId) {
            return { ...u, role: selectedRole };
          }
          return u;
        })
      );
      setEditingUserId(null);
      setSelectedRole('');
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (userId === currentUser?._id) {
      alert('You cannot delete your own logged-in account.');
      return;
    }
    if (!window.confirm(`Are you sure you want to permanently delete the user account for "${userEmail}"?`)) return;

    try {
      const res = await fetch(`${API_BASE}/api/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to delete user');
      }

      // Remove from state
      setUsers((prev) => prev.filter((u) => u._id !== userId));
    } catch (err) {
      alert(err.message);
    }
  };

  const getRoleBadgeStyle = (roleName) => {
    switch (roleName) {
      case 'super_admin':
        return {
          background: 'color-mix(in srgb, var(--m3-primary) 18%, transparent)',
          color: 'var(--m3-primary)',
        };
      case 'admin':
        return {
          background: 'color-mix(in srgb, var(--m3-tertiary) 18%, transparent)',
          color: 'var(--m3-tertiary)',
        };
      case 'canteen_admin':
        return {
          background: 'color-mix(in srgb, #ffb77c 18%, transparent)',
          color: '#ffb77c',
        };
      case 'educator':
        return {
          background: 'color-mix(in srgb, #a8c7ff 18%, transparent)',
          color: '#a8c7ff',
        };
      default:
        return {
          background: 'var(--m3-surface-container-highest)',
          color: 'var(--m3-on-surface-variant)',
        };
    }
  };

  const formatRoleName = (roleName) => {
    if (!roleName) return '';
    return roleName.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="m3-screen user-management-dashboard">
      <M3ScreenHeader
        title="User Accounts"
        subtitle={`${users.length} registered accounts`}
        isScrolled={isScrolled}
        onBack={() => setActiveTab('home')}
      />

      <div onScroll={handleScroll} className="m3-screen__scroll">
        {/* Add User Floating Action Bar Button */}
        <div className="flex justify-end items-center w-full px-1 mb-2 shrink-0">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 flex items-center gap-1.5 shadow-sm cursor-pointer bg-m3-primary text-m3-onPrimary hover:brightness-110 active:scale-95"
            type="button"
          >
            <Plus size={14} />
            <span>Add User</span>
          </button>
        </div>

        {/* Search Field */}
        <div className="relative w-full shrink-0 mb-3">
          <span className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-m3-outline z-10">
            <Search size={16} />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users by name or email..."
            className="m3-filled-field !pl-12 !pr-4 !rounded-full !h-[48px] text-sm"
          />
        </div>

        {/* Loading State */}
        {loading && users.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3.5 select-none py-16 text-center">
            <RefreshCw className="animate-spin text-m3-primary" size={28} />
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Loading user directory...</span>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="m3-surface-card p-6 flex flex-col items-center gap-3 text-center">
            <p className="text-sm font-semibold text-m3-onSurface">⚠️ {error}</p>
            <button className="m3-filled-button" style={{ maxWidth: 160 }} onClick={fetchUsers}>Retry</button>
          </div>
        )}

        {/* Users List Grid */}
        {!loading && !error && (
          <div className="w-full flex flex-col gap-4">
            {users.length === 0 ? (
              <div className="m3-surface-card p-8 flex flex-col items-center justify-center gap-3 text-center select-none">
                <div className="w-12 h-12 rounded-2xl bg-m3-primaryContainer/30 flex items-center justify-center text-m3-primary shadow-md">
                  <Search size={22} />
                </div>
                <h4 className="text-sm text-m3-onSurface font-extrabold uppercase tracking-widest">No users found</h4>
                <span className="text-xs text-slate-400 font-medium leading-relaxed max-w-[240px]">
                  No accounts matched your search keyword.
                </span>
              </div>
            ) : (
              users.map((user) => {
                const isSelf = user._id === currentUser?._id;
                const roleBadge = getRoleBadgeStyle(user.role);

                return (
                  <div
                    key={user._id}
                    className={`m3-surface-card p-5 flex flex-col gap-3.5 text-left transition-all ${
                      user.isSuspended ? 'opacity-60 border border-transparent' : ''
                    }`}
                    style={user.isSuspended ? { borderColor: 'color-mix(in srgb, var(--m3-error) 20%, transparent)' } : {}}
                  >
                    {/* Header info */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex flex-col">
                        <h4 className="text-base font-extrabold text-m3-onSurface tracking-wide leading-snug">
                          {user.firstName} {user.lastName} {isSelf && <span className="text-xs text-m3-outline">(You)</span>}
                        </h4>
                        <span className="text-xs text-m3-onSurfaceVariant mt-0.5">{user.email}</span>
                      </div>
                      
                      {/* Role Badge */}
                      <span
                        className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase"
                        style={roleBadge}
                      >
                        {formatRoleName(user.role)}
                      </span>
                    </div>

                    {/* Meta info & details */}
                    <div className="flex flex-col gap-1.5 text-xs text-m3-onSurfaceVariant pb-3 border-b" style={{ borderBottomColor: 'color-mix(in srgb, var(--m3-outline-variant) 50%, transparent)' }}>
                      {user.phone && (
                        <div className="flex justify-between">
                          <span>Phone:</span>
                          <span className="font-bold text-m3-onSurface">{user.phone}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Account Status:</span>
                        <span className={`font-bold uppercase tracking-wider text-[10px] ${user.isSuspended ? 'text-m3-error' : 'text-m3-primary'}`}>
                          {user.isSuspended ? 'Suspended' : 'Active'}
                        </span>
                      </div>
                    </div>

                    {/* Inline Role Editing UI */}
                    {editingUserId === user._id ? (
                      <div className="flex items-center gap-2 w-full pt-1.5">
                        <div className="m3-select-wrap flex-1">
                          <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="m3-select !h-9 !py-1 !text-xs !rounded-xl"
                          >
                            <option value="student">Student</option>
                            <option value="educator">Educator</option>
                            <option value="admin">Admin</option>
                            <option value="canteen_admin">Canteen Admin</option>
                            <option value="super_admin">Super Admin</option>
                          </select>
                          <div className="absolute -translate-y-1/2 pointer-events-none text-m3-onSurfaceVariant right-3 top-1/2">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                          </div>
                        </div>
                        <button
                          className="px-3 h-9 rounded-xl bg-m3-primaryContainer hover:brightness-110 text-m3-onPrimaryContainer flex items-center justify-center text-xs font-bold transition active:scale-90 cursor-pointer"
                          onClick={() => handleChangeRole(user._id)}
                          disabled={updatingRole}
                        >
                          Save
                        </button>
                        <button
                          className="px-3 h-9 rounded-xl bg-m3-surfaceContainer hover:bg-m3-surfaceContainerHighest text-m3-onSurfaceVariant flex items-center justify-center text-xs font-bold transition active:scale-90 cursor-pointer"
                          onClick={() => { setEditingUserId(null); setSelectedRole(''); }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      /* Action Buttons */
                      <div className="flex justify-between items-center pt-1.5">
                        <div className="flex items-center gap-2">
                          <button
                            className="flex items-center gap-1 text-[10px] font-bold text-m3-primary hover:brightness-110 transition cursor-pointer uppercase tracking-wider bg-m3-primaryContainer/30 px-3 py-1.5 rounded-full"
                            onClick={() => { setEditingUserId(user._id); setSelectedRole(user.role); }}
                          >
                            <Award size={11} /> Change Role
                          </button>
                          
                          {!isSelf && (
                            <button
                              className={`flex items-center gap-1 text-[10px] font-bold transition cursor-pointer uppercase tracking-wider px-3 py-1.5 rounded-full ${
                                user.isSuspended
                                  ? 'text-m3-primary bg-m3-primaryContainer/20'
                                  : 'text-m3-error bg-m3-errorContainer/10 hover:bg-m3-errorContainer/25'
                              }`}
                              onClick={() => handleToggleSuspend(user._id, user.isSuspended)}
                            >
                              {user.isSuspended ? <UserCheck size={11} /> : <UserMinus size={11} />}
                              {user.isSuspended ? 'Reactivate' : 'Suspend'}
                            </button>
                          )}
                        </div>

                        {!isSelf && (
                          <button
                            className="w-7 h-7 rounded-full hover:bg-m3-surfaceContainerHighest text-m3-onSurfaceVariant hover:text-m3-error flex items-center justify-center transition cursor-pointer"
                            onClick={() => handleDeleteUser(user._id, user.email)}
                            title="Delete Account"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-[99999] flex items-center justify-center p-6" onClick={() => setShowAddModal(false)}>
          <div
            className="w-full max-w-sm rounded-[var(--m3-shape-2xl)] bg-m3-surfaceContainer border border-transparent p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderBottomColor: 'color-mix(in srgb, var(--m3-outline-variant) 55%, transparent)' }}>
              <h3 className="m3-title-medium flex items-center gap-2">
                <ShieldAlert size={18} className="text-m3-primary" /> Create Account
              </h3>
              <button className="w-8 h-8 rounded-full hover:bg-m3-surfaceContainerHighest text-m3-onSurfaceVariant flex items-center justify-center transition cursor-pointer font-bold" onClick={() => setShowAddModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateUser} className="flex flex-col gap-4 text-left">
              <div className="flex gap-3">
                <div className="flex-1 flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-m3-onSurfaceVariant uppercase tracking-widest pl-1">First Name</span>
                  <input
                    type="text"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="m3-filled-field !h-11"
                  />
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-m3-onSurfaceVariant uppercase tracking-widest pl-1">Last Name</span>
                  <input
                    type="text"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="m3-filled-field !h-11"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold text-m3-onSurfaceVariant uppercase tracking-widest pl-1">Email Address</span>
                <input
                  type="email"
                  placeholder="john.doe@campos.local"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="m3-filled-field !h-11"
                />
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold text-m3-onSurfaceVariant uppercase tracking-widest pl-1">Password</span>
                <input
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="m3-filled-field !h-11"
                />
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold text-m3-onSurfaceVariant uppercase tracking-widest pl-1">Phone Number</span>
                <input
                  type="text"
                  placeholder="Optional"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="m3-filled-field !h-11"
                />
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold text-m3-onSurfaceVariant uppercase tracking-widest pl-1">User Role</span>
                <div className="m3-select-wrap">
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                    className="m3-select !h-11"
                  >
                    <option value="student">Student</option>
                    <option value="educator">Educator</option>
                    <option value="admin">Admin</option>
                    <option value="canteen_admin">Canteen Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                  <div className="absolute -translate-y-1/2 pointer-events-none text-m3-onSurfaceVariant right-4 top-1/2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2 select-none">
                <button
                  type="button"
                  className="flex-1 h-[48px] rounded-full border-none bg-m3-surfaceContainer hover:bg-m3-surfaceContainerHighest text-m3-onSurfaceVariant font-bold text-xs uppercase tracking-wider cursor-pointer transition-all"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="m3-filled-button flex-1"
                  style={{ minHeight: 48 }}
                  disabled={submittingUser}
                >
                  {submittingUser ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
