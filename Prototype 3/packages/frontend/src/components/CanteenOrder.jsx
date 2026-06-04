import React, { useState, useEffect } from 'react';
import { Trash2, Search, Plus, RefreshCw } from 'lucide-react';
import M3ScreenHeader from './M3ScreenHeader';
import { API_BASE } from '../config/api';

export default function CanteenOrder({ currentUser, onUpdate, setActiveTab, triggerPayment, cart = [], setCart, isCartCheckout = false }) {
  const [menu, setMenu] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search query state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Checkout state
  const [studentId, setStudentId] = useState(currentUser ? currentUser.firstName : '');
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [addedItemIds, setAddedItemIds] = useState({});

  // M3 screen state
  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const handleAddToCartClick = (item) => {
    addToCart(item);
    setAddedItemIds((prev) => ({ ...prev, [item._id]: true }));
    setTimeout(() => {
      setAddedItemIds((prev) => ({ ...prev, [item._id]: false }));
    }, 1200);
  };

  // Administrative Role checks
  const isCanteenAdmin = currentUser?.role === 'canteen_admin';
  const isStudent = currentUser?.role === 'student';

  // Add Item Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCategory, setNewCategory] = useState('Snacks');
  const [newAvailable, setNewAvailable] = useState(true);
  const [addingItem, setAddingItem] = useState(false);

  // Edit Price Inline State
  const [editingItemId, setEditingItemId] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [savingPrice, setSavingPrice] = useState(false);

  const fetchMenuAndOrders = async () => {
    try {
      setLoading(true);
      const [menuRes, ordersRes] = await Promise.all([
        fetch(`${API_BASE}/api/canteen/menu`, { credentials: 'include' }),
        fetch(`${API_BASE}/api/canteen/orders`, { credentials: 'include' }),
      ]);

      if (!menuRes.ok || !ordersRes.ok) {
        throw new Error('Failed to load canteen information');
      }

      const menuData = await menuRes.json();
      const ordersData = await ordersRes.json();

      setMenu(menuData);
      setOrders(ordersData);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuAndOrders();
  }, []);

  // Shopping Cart Actions (Only for Students!)
  const addToCart = (item) => {
    if (!item.IsAvailable || !isStudent) return;

    setCart((prevCart) => {
      const existing = prevCart.find((cartItem) => cartItem._id === item._id);
      if (existing) {
        return prevCart.map((cartItem) =>
          cartItem._id === item._id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prevCart, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId, amount) => {
    if (!isStudent) return;
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item._id === itemId) {
            const nextQty = item.quantity + amount;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (itemId) => {
    if (!isStudent) return;
    setCart((prevCart) => prevCart.filter((item) => item._id !== itemId));
  };

  // Canteen Admin CRUD: Toggle availability
  const toggleAvailability = async (itemId) => {
    if (!isCanteenAdmin) return;
    try {
      const res = await fetch(`${API_BASE}/api/canteen/menu/${itemId}/toggle`, {
        method: 'PATCH',
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to toggle availability');
      }
      const data = await res.json();

      // Update menu state
      setMenu((prevMenu) =>
        prevMenu.map((item) => (item._id === itemId ? data.item : item))
      );
      if (onUpdate) onUpdate();
    } catch (err) {
      alert(err.message);
    }
  };

  // Canteen Admin CRUD: Create item
  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newName || !newPrice || !isCanteenAdmin) return;

    try {
      setAddingItem(true);
      const res = await fetch(`${API_BASE}/api/canteen/menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Name: newName,
          Price: Number(newPrice),
          Category: newCategory,
          IsAvailable: newAvailable,
        }),
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to create item');
      }

      setNewName('');
      setNewPrice('');
      setNewCategory('Snacks');
      setNewAvailable(true);
      setShowAddModal(false);

      // Refresh menu
      fetchMenuAndOrders();
      if (onUpdate) onUpdate();
    } catch (err) {
      alert(err.message);
    } finally {
      setAddingItem(false);
    }
  };

  // Canteen Admin CRUD: Update price
  const handleUpdatePrice = async (itemId) => {
    if (!editPrice || !isCanteenAdmin) return;

    try {
      setSavingPrice(true);
      const res = await fetch(`${API_BASE}/api/canteen/menu/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Price: Number(editPrice) }),
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to save item price');
      }

      const updatedItem = await res.json();

      setMenu((prevMenu) =>
        prevMenu.map((item) => (item._id === itemId ? updatedItem : item))
      );
      setEditingItemId(null);
      setEditPrice('');
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingPrice(false);
    }
  };

  // Canteen Admin CRUD: Delete item
  const handleDeleteItem = async (itemId) => {
    if (!isCanteenAdmin || !window.confirm('Are you sure you want to permanently delete this item from the canteen menu?')) return;

    try {
      const res = await fetch(`${API_BASE}/api/canteen/menu/${itemId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to delete item');
      }

      setMenu((prevMenu) => prevMenu.filter((item) => item._id !== itemId));
      if (onUpdate) onUpdate();
    } catch (err) {
      alert(err.message);
    }
  };

  // Student checkout order placements
  const handleCheckout = (e) => {
    e.preventDefault();
    if (!studentId || cart.length === 0 || !isStudent) return;

    // Check sold-out status
    const hasSoldOutItem = cart.some((cartItem) => {
      const menuItem = menu.find((m) => m._id === cartItem._id);
      return menuItem && !menuItem.IsAvailable;
    });

    if (hasSoldOutItem) {
      alert('Your cart contains sold out items! Please remove them before checking out.');
      return;
    }

    if (triggerPayment) {
      triggerPayment(totalAmount, 'CANTEEN', { studentId, cart });
    }
  };

  // Scroll handler for collapsing header
  const handleScroll = (e) => {
    setIsScrolled(e.target.scrollTop > 12);
  };

  // Calculate dynamic totals
  const totalAmount = cart.reduce((total, cartItem) => {
    const latestMenuInfo = menu.find((m) => m._id === cartItem._id);
    const itemPrice = latestMenuInfo ? latestMenuInfo.Price : cartItem.Price;
    return total + itemPrice * cartItem.quantity;
  }, 0);

  const categories = ['All', ...new Set(menu.map((item) => item.Category))];

  const filteredMenu = menu
    .filter((item) => selectedCategory === 'All' || item.Category === selectedCategory)
    .filter((item) => item.Name.toLowerCase().includes(searchQuery.toLowerCase()));

  /* ───────────────────── Checkout View ───────────────────── */
  if (isCartCheckout) {
    return (
      <div className="m3-screen canteen-dashboard">
        <M3ScreenHeader
          title="Checkout"
          subtitle="Review your order"
          isScrolled={isScrolled}
          onBack={() => setActiveTab && setActiveTab('canteen')}
        />

        <div onScroll={handleScroll} className="m3-screen__scroll">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3.5 select-none py-16 text-center">
              <RefreshCw className="animate-spin text-m3-primary" size={28} />
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Loading checkout...</span>
            </div>
          ) : error ? (
            <div className="m3-surface-card p-6 flex flex-col items-center gap-3 text-center">
              <p className="text-sm font-semibold text-m3-onSurface">⚠️ {error}</p>
              <button className="m3-filled-button" style={{ maxWidth: 160 }} onClick={fetchMenuAndOrders}>Retry</button>
            </div>
          ) : (
            <div className="w-full flex flex-col gap-5">
              {/* Selected Items */}
              <div className="m3-surface-card p-5 flex flex-col gap-4 text-left">
                <div className="flex justify-between items-center border-b pb-3" style={{ borderBottomColor: 'color-mix(in srgb, var(--m3-outline-variant) 15%, transparent)' }}>
                  <h3 className="m3-title-medium">Selected Items</h3>
                  {cart.length > 0 && (
                    <span className="m3-badge">{cart.reduce((sum, ci) => sum + ci.quantity, 0)}</span>
                  )}
                </div>

                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-3 text-center select-none">
                    <div className="w-12 h-12 rounded-2xl bg-m3-primaryContainer/30 flex items-center justify-center text-m3-primary shadow-md">
                      <Search size={22} />
                    </div>
                    <h4 className="text-sm text-m3-onSurface font-extrabold uppercase tracking-widest">Cart empty</h4>
                    <span className="text-xs text-slate-400 font-medium">Go back and add some items!</span>
                    <button
                      className="m3-filled-button mt-2"
                      style={{ maxWidth: 180, minHeight: 44 }}
                      onClick={() => setActiveTab('canteen')}
                    >
                      Browse Menu
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {cart.map((cartItem) => {
                      const currentMenuItem = menu.find((m) => m._id === cartItem._id);
                      const isCurrentlyUnavailable = currentMenuItem && !currentMenuItem.IsAvailable;

                      return (
                        <div
                          key={cartItem._id}
                          className={`rounded-[var(--m3-shape-xl)] p-4 flex flex-col gap-2.5 border transition-all ${
                            isCurrentlyUnavailable
                              ? 'bg-m3-error/8 opacity-70'
                              : 'bg-m3-surfaceContainerHigh'
                          }`}
                          style={{ borderColor: isCurrentlyUnavailable ? 'color-mix(in srgb, var(--m3-error) 25%, transparent)' : 'transparent' }}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-sm font-bold text-m3-onSurface leading-tight">{cartItem.Name}</h4>
                              <span className="m3-body-small mt-0.5 block">₹{cartItem.Price} each</span>
                            </div>
                            <button
                              className="w-8 h-8 rounded-full bg-m3-surfaceContainer hover:bg-m3-surfaceContainerHighest text-m3-onSurfaceVariant hover:text-m3-error flex items-center justify-center transition-all cursor-pointer"
                              onClick={() => removeFromCart(cartItem._id)}
                              title="Remove Item"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          
                          {isCurrentlyUnavailable && (
                            <span className="text-[10px] font-bold text-m3-error uppercase tracking-wider">
                              Sold out — remove to checkout
                            </span>
                          )}

                          <div className="flex justify-between items-center border-t pt-2.5" style={{ borderTopColor: 'color-mix(in srgb, var(--m3-outline-variant) 12%, transparent)' }}>
                            <span className="text-[10px] font-bold text-m3-onSurfaceVariant uppercase tracking-wider">Quantity</span>
                            <div className="flex items-center gap-2.5">
                              <button
                                className="w-7 h-7 rounded-full bg-m3-surfaceContainer hover:bg-m3-surfaceContainerHighest text-m3-primary flex items-center justify-center text-sm font-bold transition cursor-pointer"
                                disabled={isCurrentlyUnavailable}
                                onClick={() => updateQuantity(cartItem._id, -1)}
                              >
                                −
                              </button>
                              <span className="text-sm font-bold text-m3-onSurface w-5 text-center">{cartItem.quantity}</span>
                              <button
                                className="w-7 h-7 rounded-full bg-m3-surfaceContainer hover:bg-m3-surfaceContainerHighest text-m3-primary flex items-center justify-center text-sm font-bold transition cursor-pointer"
                                disabled={isCurrentlyUnavailable}
                                onClick={() => updateQuantity(cartItem._id, 1)}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Bill Summary */}
              {cart.length > 0 && (
                <div className="m3-surface-card p-5 flex flex-col gap-3 text-left">
                  <h3 className="m3-title-small text-m3-onSurfaceVariant uppercase tracking-widest text-[10px] border-b pb-2" style={{ borderBottomColor: 'color-mix(in srgb, var(--m3-outline-variant) 15%, transparent)' }}>Bill Details</h3>
                  <div className="flex justify-between items-center text-xs text-m3-onSurfaceVariant font-medium">
                    <span>Item Total</span>
                    <span className="font-bold text-m3-onSurface">₹{totalAmount}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-m3-outline font-medium">
                    <span>Taxes & GST</span>
                    <span>₹0</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-m3-outline font-medium">
                    <span>Delivery & Handling</span>
                    <span>₹0</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between items-center" style={{ borderTopColor: 'color-mix(in srgb, var(--m3-outline-variant) 15%, transparent)' }}>
                    <span className="text-[10px] font-bold text-m3-onSurface uppercase tracking-widest">Grand Total</span>
                    <span className="text-base font-extrabold text-m3-primary">₹{totalAmount}</span>
                  </div>
                </div>
              )}

              {/* Place Order */}
              {cart.length > 0 && (
                <form onSubmit={handleCheckout} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <span className="text-[9px] font-bold text-m3-onSurfaceVariant uppercase tracking-widest pl-1">Student Registration ID</span>
                    <input
                      type="text"
                      placeholder="e.g., Vardaan"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      required
                      className="m3-filled-field"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className="m3-filled-button"
                    disabled={submittingOrder || cart.length === 0 || cart.some(ci => {
                      const m = menu.find(mi => mi._id === ci._id);
                      return m && !m.IsAvailable;
                    })}
                  >
                    Place Order · ₹{totalAmount}
                  </button>
                </form>
              )}

              {/* Recent Orders log */}
              {orders.length > 0 && (
                <div className="m3-surface-card p-5 flex flex-col gap-4 text-left">
                  <h3 className="m3-title-small text-m3-onSurfaceVariant uppercase tracking-widest text-[10px] border-b pb-2" style={{ borderBottomColor: 'color-mix(in srgb, var(--m3-outline-variant) 15%, transparent)' }}>Orders Log</h3>
                  <div className="flex flex-col gap-3">
                    {orders.map((order) => (
                      <div key={order._id || order.id} className="rounded-[var(--m3-shape-xl)] bg-m3-surfaceContainerHigh p-4 flex flex-col gap-2.5 text-left">
                        <div className="flex items-center justify-between">
                          <span className="m3-body-small font-bold">#{String(order._id).substring(18)}</span>
                          <span className="m3-assist-chip text-[10px]">{order.OrderStatus}</span>
                        </div>
                        <span className="text-xs font-semibold text-m3-onSurface leading-snug">
                          {order.ItemsArray.map(i => `${i.Name} ×${i.Quantity}`).join(', ')}
                        </span>
                        <div className="flex justify-between items-center border-t pt-2 text-[10px]" style={{ borderTopColor: 'color-mix(in srgb, var(--m3-outline-variant) 12%, transparent)' }}>
                          <span className="font-medium text-m3-onSurfaceVariant">Reg: {order.StudentId}</span>
                          <span className="font-extrabold text-m3-primary">₹{order.TotalAmount}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ───────────────────── Main Menu View ───────────────────── */
  return (
    <div className="m3-screen canteen-dashboard">
      <M3ScreenHeader
        title="Canteen"
        subtitle={`${menu.filter(m => m.IsAvailable).length} items available`}
        isScrolled={isScrolled}
        onBack={() => setActiveTab('home')}
      />

      <div onScroll={handleScroll} className="m3-screen__scroll">
        {/* Admin "Add Item" button */}
        {isCanteenAdmin && (
          <div className="flex justify-end items-center w-full px-1 mb-2 shrink-0">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 flex items-center gap-1.5 shadow-sm cursor-pointer bg-m3-primary text-m3-onPrimary hover:brightness-110 active:scale-95"
              type="button"
            >
              <Plus size={14} />
              <span>Add Item</span>
            </button>
          </div>
        )}

        {/* Category Chips */}
        {!loading && !error && categories.length > 1 && (
          <div className="flex flex-col gap-2 shrink-0 mb-2">
            <div className="m3-segmented-chips flex-wrap gap-y-2">
              {categories.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`m3-segmented-chip m3-segmented-chip--sm ${
                      isActive ? 'm3-segmented-chip--selected' : ''
                    }`}
                    type="button"
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Search Field */}
        {!loading && !error && (
          <div className="relative w-full shrink-0 mb-1">
            <span className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-m3-outline z-10">
              <Search size={16} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search canteen menu..."
              className="m3-filled-field !pl-12 !pr-4 !rounded-full !h-[48px] text-sm"
            />
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3.5 select-none py-16 text-center">
            <RefreshCw className="animate-spin text-m3-primary" size={28} />
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Loading canteen menu...</span>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="m3-surface-card p-6 flex flex-col items-center gap-3 text-center">
            <p className="text-sm font-semibold text-m3-onSurface">⚠️ {error}</p>
            <button className="m3-filled-button" style={{ maxWidth: 160 }} onClick={fetchMenuAndOrders}>Retry</button>
          </div>
        )}

        {/* Menu Items */}
        {!loading && !error && (
          <div className="w-full flex flex-col gap-4">
            {filteredMenu.length === 0 ? (
              <div className="m3-surface-card p-8 flex flex-col items-center justify-center gap-3 text-center select-none">
                <div className="w-12 h-12 rounded-2xl bg-m3-primaryContainer/30 flex items-center justify-center text-m3-primary shadow-md">
                  <Search size={22} />
                </div>
                <h4 className="text-sm text-m3-onSurface font-extrabold uppercase tracking-widest">No items found</h4>
                <span className="text-xs text-slate-400 font-medium leading-relaxed max-w-[240px]">
                  Try a different search term or category filter.
                </span>
              </div>
            ) : (
              filteredMenu.map((item) => {
                const isSoldOut = !item.IsAvailable;
                return (
                  <div
                    key={item._id}
                    className={`m3-surface-card p-5 flex flex-col gap-3.5 text-left shadow-sm transition-all ${
                      isSoldOut ? 'opacity-55' : ''
                    }`}
                  >
                    {/* Card Header: category + status */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="m3-assist-chip">{item.Category}</span>
                      <span className={`text-[10px] font-black uppercase tracking-wider ${
                        isSoldOut ? 'text-m3-error' : 'text-m3-primary'
                      }`}>
                        {isSoldOut ? 'Sold Out' : 'Available'}
                      </span>
                    </div>

                    {/* Item Name */}
                    <h4 className="text-base font-extrabold text-m3-onSurface tracking-wide leading-snug">
                      {item.Name}
                    </h4>

                    {/* Price Display / Admin Edit */}
                    {isCanteenAdmin && editingItemId === item._id ? (
                      <div className="flex items-center gap-2 w-full max-w-[220px]">
                        <input
                          type="number"
                          className="m3-filled-field !h-9 !text-xs !rounded-xl !px-3"
                          placeholder="New Price"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                        />
                        <button 
                          className="w-9 h-9 shrink-0 rounded-xl bg-m3-primaryContainer hover:brightness-110 text-m3-onPrimaryContainer flex items-center justify-center text-xs font-bold transition active:scale-90 cursor-pointer"
                          onClick={() => handleUpdatePrice(item._id)}
                          disabled={savingPrice}
                        >
                          ✓
                        </button>
                        <button 
                          className="w-9 h-9 shrink-0 rounded-xl bg-m3-surfaceContainer hover:bg-m3-surfaceContainerHighest text-m3-onSurfaceVariant flex items-center justify-center text-xs font-bold transition active:scale-90 cursor-pointer"
                          onClick={() => { setEditingItemId(null); setEditPrice(''); }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="m3-badge text-[11px] font-bold">₹{item.Price}</span>
                        {isCanteenAdmin && (
                          <button
                            className="w-7 h-7 rounded-full hover:bg-m3-surfaceContainerHighest text-m3-onSurfaceVariant hover:text-m3-primary flex items-center justify-center transition cursor-pointer text-xs"
                            onClick={() => { setEditingItemId(item._id); setEditPrice(item.Price); }}
                            title="Edit Price"
                          >
                            ✏️
                          </button>
                        )}
                      </div>
                    )}

                    {/* Actions Row */}
                    <div className="w-full mt-0.5">
                      {isCanteenAdmin ? (
                        <div className="flex justify-between items-center border-t pt-3" style={{ borderTopColor: 'color-mix(in srgb, var(--m3-outline-variant) 15%, transparent)' }}>
                          <button
                            className="flex items-center gap-1.5 text-[10px] font-bold text-m3-error/60 hover:text-m3-error transition cursor-pointer uppercase tracking-wider"
                            onClick={() => handleDeleteItem(item._id)}
                            title="Delete Item"
                          >
                            <Trash2 size={12} /> Delete
                          </button>

                          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => toggleAvailability(item._id)}>
                            <div className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-300 ${item.IsAvailable ? 'bg-m3-primary' : 'bg-m3-surfaceContainer'}`}>
                              <div className={`w-4 h-4 rounded-full bg-m3-onPrimary transition-transform duration-300 shadow-sm ${item.IsAvailable ? 'translate-x-4' : 'translate-x-0'}`} />
                            </div>
                            <span className="text-[10px] font-bold text-m3-onSurfaceVariant uppercase tracking-wider">In Stock</span>
                          </div>
                        </div>
                      ) : (
                        <button
                          className={`w-full py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                            isSoldOut 
                              ? 'bg-m3-surfaceContainerHigh/50 text-m3-outline/50 cursor-not-allowed border-none' 
                              : 'hover:brightness-110 active:scale-[0.98] shadow-md'
                          }`}
                          style={
                            isSoldOut 
                              ? {} 
                              : addedItemIds[item._id]
                                ? { background: 'var(--m3-primary-container)', color: 'var(--m3-on-primary-container)', border: 'none' }
                                : { background: 'linear-gradient(135deg, var(--m3-primary) 0%, var(--m3-tertiary) 100%)', color: 'var(--m3-on-primary)', border: 'none' }
                          }
                          disabled={isSoldOut}
                          onClick={() => handleAddToCartClick(item)}
                        >
                          {isSoldOut ? 'Sold Out' : addedItemIds[item._id] ? '✓ Added!' : '+ Add to Cart'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Canteen Admin: Add Item Modal */}
      {showAddModal && isCanteenAdmin && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-[99999] flex items-center justify-center p-6" onClick={() => setShowAddModal(false)}>
          <div
            className="w-full max-w-sm rounded-[var(--m3-shape-2xl)] bg-m3-surfaceContainer border border-transparent p-6 shadow-2xl flex flex-col gap-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderBottomColor: 'color-mix(in srgb, var(--m3-outline-variant) 15%, transparent)' }}>
              <h3 className="m3-title-medium">Add Menu Item</h3>
              <button className="w-8 h-8 rounded-full hover:bg-m3-surfaceContainerHighest text-m3-onSurfaceVariant flex items-center justify-center transition cursor-pointer font-bold" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            
            <form onSubmit={handleAddItem} className="flex flex-col gap-4 text-left">
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-bold text-m3-onSurfaceVariant uppercase tracking-widest pl-1">Item Name</span>
                <input
                  type="text"
                  placeholder="Paneer Patty, Mango Shake"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  className="m3-filled-field"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-bold text-m3-onSurfaceVariant uppercase tracking-widest pl-1">Price (₹)</span>
                <input
                  type="number"
                  placeholder="Price"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  required
                  className="m3-filled-field"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-bold text-m3-onSurfaceVariant uppercase tracking-widest pl-1">Category</span>
                <div className="m3-select-wrap">
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    required
                    className="m3-select"
                  >
                    <option value="Pizza">Pizza</option>
                    <option value="Pasta">Pasta</option>
                    <option value="Starters">Starters</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Desserts">Desserts</option>
                  </select>
                  <div className="absolute -translate-y-1/2 pointer-events-none text-m3-onSurfaceVariant right-4 top-1/2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-bold text-m3-onSurfaceVariant uppercase tracking-widest pl-1">Availability</span>
                <div className="m3-select-wrap">
                  <select
                    value={newAvailable ? 'yes' : 'no'}
                    onChange={(e) => setNewAvailable(e.target.value === 'yes')}
                    required
                    className="m3-select"
                  >
                    <option value="yes">In Stock (Available)</option>
                    <option value="no">Out of Stock (Unavailable)</option>
                  </select>
                  <div className="absolute -translate-y-1/2 pointer-events-none text-m3-onSurfaceVariant right-4 top-1/2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
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
                  disabled={addingItem}
                >
                  {addingItem ? 'Adding...' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Checkout Success Modal */}
      {orderSuccess && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-[99999] flex items-center justify-center p-6" onClick={() => setOrderSuccess(null)}>
          <div
            className="w-full max-w-sm rounded-[var(--m3-shape-2xl)] bg-m3-surfaceContainer border border-transparent p-6 shadow-2xl flex flex-col gap-5 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-full bg-m3-primaryContainer/40 flex items-center justify-center text-m3-primary mx-auto shadow-lg text-2xl">
              🎉
            </div>
            <h3 className="m3-title-medium">Order Placed!</h3>
            <p className="text-xs leading-relaxed text-m3-onSurfaceVariant">Your order has been received by the kitchen team and is now being processed.</p>
            
            <div className="rounded-[var(--m3-shape-xl)] bg-m3-surfaceContainerHigh p-4 flex flex-col gap-2.5 text-left text-xs">
              <div className="flex justify-between items-center">
                <span className="text-m3-onSurfaceVariant">Order Reference</span>
                <span className="font-bold text-m3-onSurface">#{orderSuccess._id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-m3-onSurfaceVariant">Student ID</span>
                <span className="font-bold text-m3-onSurface">{orderSuccess.StudentId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-m3-onSurfaceVariant">Total Amount</span>
                <span className="font-extrabold text-m3-primary">₹{orderSuccess.TotalAmount}</span>
              </div>
            </div>

            <button
              className="m3-filled-button"
              onClick={() => setOrderSuccess(null)}
            >
              Back to Menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
