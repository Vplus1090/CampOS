import React, { useState, useEffect } from 'react';
import { Coffee, Ticket, ArrowRight, Trash2, Search } from 'lucide-react';

const API_BASE = import.meta.env.DEV ? "" : "https://campos-fmjh.onrender.com";

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

  // Calculate dynamic totals
  const totalAmount = cart.reduce((total, cartItem) => {
    const latestMenuInfo = menu.find((m) => m._id === cartItem._id);
    const itemPrice = latestMenuInfo ? latestMenuInfo.Price : cartItem.Price;
    return total + itemPrice * cartItem.quantity;
  }, 0);

  const categories = [...new Set(menu.map((item) => item.Category))];

  if (isCartCheckout) {
    return (
      <div className="canteen-module text-white font-sans min-h-screen pb-24 relative select-none">
        {/* Header summary */}
        <header className="flex items-center w-full mt-6 border-b border-white/10 pb-3 shrink-0">
          <button
            onClick={() => setActiveTab && setActiveTab('canteen')}
            className="w-11 h-11 bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white rounded-full transition-all duration-300 active:scale-95 flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-md cursor-pointer shrink-0"
            type="button"
          >
            <span className="text-xl font-bold">&larr;</span>
          </button>
          <h2 className="flex items-center pl-3.5 text-left translate-y-[2px] text-[22px] italic font-normal text-white leading-none tracking-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Order Checkout
          </h2>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-8 h-8 rounded-full border border-transparent border-t-white border-r-white animate-spin" />
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest animate-pulse">Loading checkout...</p>
          </div>
        ) : error ? (
          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-8 flex flex-col items-center justify-center gap-4 text-center">
            <p className="text-sm font-semibold text-red-300">⚠️ {error}</p>
            <button className="bg-white text-[#141a27] font-black text-xs uppercase tracking-wider rounded-xl px-6 py-3 cursor-pointer transition-all active:scale-95 shadow-md" onClick={fetchMenuAndOrders}>Retry</button>
          </div>
        ) : (
          <div className="flex flex-col gap-6 w-full mt-2 text-left animate-fadeIn">
            {/* Selected Items Card */}
            <div className="rounded-[32px] p-6 border-2 border-white/10 bg-white/[0.03] backdrop-blur-3xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] shadow-xl flex flex-col gap-4 text-left">
              <div className="flex justify-between items-center w-full border-b border-white/5 pb-3">
                <h3 className="text-base font-black uppercase tracking-wider text-white">🛒 Selected Items</h3>
                {cart.length > 0 && (
                  <span className="bg-orange-500 text-[#141a27] text-[10px] font-black font-mono w-5 h-5 rounded-full flex items-center justify-center select-none shadow-md">{cart.reduce((sum, ci) => sum + ci.quantity, 0)}</span>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2 text-center select-none">
                  <span className="text-3xl">🥗</span>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Your cart is empty.</p>
                  <button
                    onClick={() => setActiveTab('canteen')}
                    className="bg-white text-[#141a27] font-black text-xs uppercase tracking-wider rounded-xl px-6 py-2.5 mt-2 cursor-pointer active:scale-95 transition"
                  >
                    Add Items
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-3">
                    {cart.map((cartItem) => {
                      const currentMenuItem = menu.find((m) => m._id === cartItem._id);
                      const isCurrentlyUnavailable = currentMenuItem && !currentMenuItem.IsAvailable;

                      return (
                        <div
                          key={cartItem._id}
                          className={`flex flex-col gap-2 p-5 bg-white/[0.03] border ${
                            isCurrentlyUnavailable ? 'border-red-500/25 bg-red-500/[0.01]' : 'border-white/10'
                          } rounded-2xl relative`}
                        >
                          <div className="flex justify-between items-start w-full">
                            <div className="flex flex-col text-left">
                              <span className="text-xs font-extrabold text-white leading-tight">{cartItem.Name}</span>
                              <span className="text-[10px] font-semibold text-slate-400 mt-1">₹{cartItem.Price} each</span>
                            </div>
                            <button
                              className="text-slate-400 hover:text-red-400 transition cursor-pointer select-none"
                              onClick={() => removeFromCart(cartItem._id)}
                              title="Remove Item"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          
                          {isCurrentlyUnavailable && (
                            <span className="text-[9px] font-black uppercase tracking-wider text-red-300">
                              🛑 SOLD OUT! Remove to checkout.
                            </span>
                          )}

                          <div className="flex justify-end items-center gap-3 mt-1 w-full border-t border-white/5 pt-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mr-auto">Quantity</span>
                            
                            <button
                              className="w-6 h-6 rounded-md bg-white/[0.06] hover:bg-white/[0.12] text-white flex items-center justify-center text-xs font-bold transition cursor-pointer"
                              disabled={isCurrentlyUnavailable}
                              onClick={() => updateQuantity(cartItem._id, -1)}
                            >
                              －
                            </button>
                            <span className="text-xs font-mono font-bold text-white px-1">{cartItem.quantity}</span>
                            <button
                              className="w-6 h-6 rounded-md bg-white/[0.06] hover:bg-white/[0.12] text-white flex items-center justify-center text-xs font-bold transition cursor-pointer"
                              disabled={isCurrentlyUnavailable}
                              onClick={() => updateQuantity(cartItem._id, 1)}
                            >
                              ＋
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t border-white/5 pt-4 flex flex-col gap-2.5 mt-1">
                    <span className="text-slate-400 uppercase tracking-widest text-[9px] font-black">Bill Details</span>
                    <div className="flex justify-between items-center text-xs text-slate-300 font-semibold">
                      <span>Item Total</span>
                      <span className="font-mono">₹{totalAmount}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-400 font-medium">
                      <span>Taxes & GST (0%)</span>
                      <span className="font-mono">₹0</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-400 font-medium">
                      <span>Delivery & Handling (0%)</span>
                      <span className="font-mono">₹0</span>
                    </div>

                    <div className="border-t border-white/5 pt-3.5 flex justify-between items-center w-full font-sans text-sm font-black mt-1">
                      <span className="text-slate-200 uppercase tracking-widest text-[10px]">Grand Total</span>
                      <span className="text-white font-mono font-black text-base">₹{totalAmount}</span>
                    </div>

                    <form onSubmit={handleCheckout} className="flex flex-col gap-4 mt-2">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 pl-1" htmlFor="student-id-input">Student Registration ID</label>
                        <input
                          id="student-id-input"
                          type="text"
                          placeholder="e.g., Vardaan"
                          value={studentId}
                          onChange={(e) => setStudentId(e.target.value)}
                          required
                          className="w-full bg-white/[0.05] border border-white/15 focus:border-white/35 focus:ring-2 focus:ring-white/5 rounded-xl px-4 py-3 text-sm font-semibold text-white tracking-wide transition-all outline-none"
                        />
                      </div>
                      
                      <button
                        type="submit"
                        className="w-full bg-white text-[#141a27] hover:bg-slate-50 font-black rounded-xl py-3.5 shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95 text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50"
                        disabled={submittingOrder || cart.length === 0 || cart.some(ci => {
                          const m = menu.find(mi => mi._id === ci._id);
                          return m && !m.IsAvailable;
                        })}
                      >
                        🚀 Place Canteen Order &bull; ₹{totalAmount}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>

            {/* Recent Orders log at Checkout */}
            {orders.length > 0 && (
              <div className="rounded-[32px] p-6 border-2 border-white/10 bg-white/[0.03] backdrop-blur-3xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] shadow-xl flex flex-col gap-4 text-left">
                <h3 className="text-base font-black uppercase tracking-wider text-white border-b border-white/5 pb-3">🧾 Orders Log</h3>
                
                <div className="flex flex-col gap-3">
                  {orders.map((order) => {
                    return (
                      <div key={order._id || order.id} className="p-5 bg-white/[0.02] border border-white/10 rounded-2xl flex flex-col gap-2 transition-all duration-300 hover:scale-[1.01]">
                        <div className="flex justify-between items-center w-full">
                          <span className="text-[10px] font-mono font-bold text-slate-400">#{String(order._id).substring(18)}</span>
                          <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                            order.OrderStatus.toLowerCase() === 'placed'
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                          }`}>
                            {order.OrderStatus}
                          </span>
                        </div>
                        
                        <div className="text-xs font-semibold text-white leading-tight">
                          {order.ItemsArray.map(i => `${i.Name} x${i.Quantity}`).join(', ')}
                        </div>
                        
                        <div className="flex justify-between items-center w-full border-t border-white/5 pt-2 mt-1 text-[10px] font-bold text-slate-400 font-sans">
                          <span>Reg: {order.StudentId}</span>
                          <span className="text-white font-mono font-black">₹{order.TotalAmount}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="canteen-module text-white font-sans min-h-screen pb-24 relative select-none">
      
      {/* Module Header and Controls */}
      <header className="flex items-center w-full mt-6 border-b border-white/10 pb-3 shrink-0 justify-between gap-4 mb-3">
        <div className="flex items-center">
          <button
            onClick={() => setActiveTab('home')}
            className="w-11 h-11 bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white rounded-full transition-all duration-300 active:scale-95 flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-md cursor-pointer shrink-0"
            type="button"
          >
            <span className="text-xl font-bold">&larr;</span>
          </button>
          <h2 className="flex items-center pl-3.5 text-left translate-y-[2px] text-[22px] italic font-normal text-white leading-none tracking-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Campus Canteen
          </h2>
        </div>
        
        {/* Canteen Admin exclusive item creation button */}
        {isCanteenAdmin && (
          <button 
            className="bg-white hover:bg-slate-50 text-[#141a27] font-extrabold text-[11px] uppercase tracking-wider rounded-xl px-4 py-2.5 transition-all duration-300 active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer"
            onClick={() => setShowAddModal(true)}
            type="button"
          >
            Add Menu Item
          </button>
        )}
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="w-8 h-8 rounded-full border border-transparent border-t-white border-r-white animate-spin" />
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest animate-pulse">Loading canteen menu...</p>
        </div>
      ) : error ? (
        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-8 flex flex-col items-center justify-center gap-4 text-center">
          <p className="text-sm font-semibold text-red-300">⚠️ {error}</p>
          <button className="bg-white text-[#141a27] font-black text-xs uppercase tracking-wider rounded-xl px-6 py-3 cursor-pointer transition-all active:scale-95 shadow-md" onClick={fetchMenuAndOrders}>Retry</button>
        </div>
      ) : (
        <div className="flex flex-col gap-6 text-left">
          
          {/* Glassmorphic Search Bar */}
          <div className="relative w-full">
            <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search canteen menu..."
              className="w-full bg-white/[0.04] border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-400 outline-none focus:border-orange-500/50 transition-all duration-300 shadow-inner"
            />
          </div>

          {/* Menu Catalog Section */}
          <div className="flex flex-col gap-6 w-full">
            <div className="grid grid-cols-1 gap-4">
              {menu
                .filter((item) => item.Name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((item) => {
                  const isSoldOut = !item.IsAvailable;
                  return (
                    <div
                      key={item._id}
                      className={`rounded-[28px] p-6 transition-all duration-300 relative border-2 ${
                        isSoldOut 
                          ? 'border-white/10 bg-white/[0.01] opacity-60' 
                          : 'border-orange-500/25 bg-orange-500/[0.02] shadow-[0_0_25px_rgba(249,115,22,0.04)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]'
                      } backdrop-blur-3xl flex flex-col gap-3.5 text-left`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="text-[9px] font-sans font-black uppercase tracking-wider text-slate-400">{item.Category}</span>
                        <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                          isSoldOut 
                            ? 'bg-red-500/10 text-red-300 border-red-500/20' 
                            : 'bg-orange-500/10 text-orange-300 border-orange-500/20'
                        }`}>
                          {isSoldOut ? 'Sold Out' : 'Available'}
                        </span>
                      </div>
                      
                      <h4 className="text-base font-extrabold text-white leading-none mt-1 select-text font-sans">{item.Name}</h4>
                      
                      {/* Price Display / Admin Edit */}
                      {isCanteenAdmin && editingItemId === item._id ? (
                        <div className="flex items-center gap-2 mt-1 w-full max-w-[200px]">
                          <input
                            type="number"
                            className="w-full bg-white/[0.05] border border-white/15 focus:border-white/35 focus:ring-2 focus:ring-white/5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white outline-none"
                            placeholder="New Price"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                          />
                          <button 
                            className="w-7 h-7 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg flex items-center justify-center text-xs font-mono font-bold transition active:scale-90"
                            onClick={() => handleUpdatePrice(item._id)}
                            disabled={savingPrice}
                          >
                            ✓
                          </button>
                          <button 
                            className="w-7 h-7 bg-white/[0.06] border border-white/10 hover:bg-white/[0.12] text-white rounded-lg flex items-center justify-center text-xs font-mono font-bold transition active:scale-90"
                            onClick={() => { setEditingItemId(null); setEditPrice(''); }}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 font-sans">
                          <span>Price:</span>
                          <span className="text-white font-mono font-black">₹{item.Price}</span>
                          {isCanteenAdmin && (
                            <button
                              className="w-6 h-6 hover:bg-white/[0.06] border border-transparent hover:border-white/10 text-slate-400 hover:text-white rounded-lg flex items-center justify-center transition"
                              onClick={() => { setEditingItemId(item._id); setEditPrice(item.Price); }}
                              title="Edit Price"
                            >
                              ✏️
                            </button>
                          )}
                        </div>
                      )}

                      <div className="w-full mt-1.5">
                        {/* Stock toggle switches & deletes (Canteen Admin only) */}
                        {isCanteenAdmin ? (
                          <div className="flex justify-between items-center border-t border-white/5 pt-3.5">
                            <button
                              className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-rose-400 hover:text-rose-300 transition"
                              onClick={() => handleDeleteItem(item._id)}
                              title="Delete Item"
                            >
                              🗑️ Delete
                            </button>

                            <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggleAvailability(item._id)}>
                              <div className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-300 ${item.IsAvailable ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                                <div className={`w-3 h-3 rounded-full bg-white transition-transform duration-300 ${item.IsAvailable ? 'translate-x-4' : 'translate-x-0'}`} />
                              </div>
                              <span className="text-[9px] font-sans font-black uppercase tracking-wider text-slate-400">In Stock</span>
                            </div>
                          </div>
                        ) : (
                          // Add to cart buttons (Students only)
                          <button
                            className={`w-full py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300 cursor-pointer backdrop-blur-md ${
                              isSoldOut 
                                ? 'bg-white/[0.02] border border-white/5 text-slate-500 cursor-not-allowed' 
                                : addedItemIds[item._id]
                                  ? 'bg-emerald-500/[0.08] border border-emerald-500/35 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.08)]'
                                  : 'bg-orange-500/[0.08] hover:bg-orange-500/[0.15] border border-orange-500/35 text-orange-300 shadow-md active:scale-[0.98]'
                            }`}
                            disabled={isSoldOut}
                            onClick={() => handleAddToCartClick(item)}
                          >
                            {isSoldOut ? 'Sold Out' : addedItemIds[item._id] ? '✓ Added!' : '＋ Add to Cart'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
            {menu.filter((item) => item.Name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
              <p className="text-center text-xs font-semibold text-slate-400 uppercase tracking-widest py-12">
                No items match your search
              </p>
            )}
          </div>
        </div>
      )}

      {/* Canteen Admin: Add Item Modal */}
      {showAddModal && isCanteenAdmin && (
        <div className="absolute inset-0 bg-[#0f131a]/80 backdrop-blur-xl z-[99999] flex items-center justify-center p-6 animate-fadeIn" onClick={() => setShowAddModal(false)}>
          <div className="bg-slate-900/90 border border-white/10 rounded-[32px] p-6 shadow-2xl w-full max-w-sm flex flex-col gap-5" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-base font-black text-white uppercase tracking-wider">Add Menu Item</h3>
              <button className="text-slate-400 hover:text-white font-extrabold cursor-pointer" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            
            <form onSubmit={handleAddItem} className="flex flex-col gap-4 text-left">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 pl-1" htmlFor="new-item-name">Item Name</label>
                <input
                  id="new-item-name"
                  type="text"
                  placeholder="Paneer Patty, Mango Shake"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  className="w-full bg-white/[0.05] border border-white/15 focus:border-white/35 focus:ring-2 focus:ring-white/5 rounded-xl px-4 py-3 text-sm font-semibold text-white tracking-wide transition-all outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 pl-1" htmlFor="new-item-price">Price (₹)</label>
                <input
                  id="new-item-price"
                  type="number"
                  placeholder="Price"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  required
                  className="w-full bg-white/[0.05] border border-white/15 focus:border-white/35 focus:ring-2 focus:ring-white/5 rounded-xl px-4 py-3 text-sm font-semibold text-white tracking-wide transition-all outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 pl-1" htmlFor="new-item-category">Category</label>
                <select
                  id="new-item-category"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  required
                  className="w-full bg-[#1e2533] border border-white/15 focus:border-white/35 focus:ring-2 focus:ring-white/5 rounded-xl px-4 py-3 text-sm font-semibold text-white tracking-wide transition-all outline-none cursor-pointer"
                >
                  <option value="Pizza">Pizza</option>
                  <option value="Pasta">Pasta</option>
                  <option value="Starters">Starters</option>
                  <option value="Beverages">Beverages</option>
                  <option value="Snacks">Snacks</option>
                  <option value="Desserts">Desserts</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 pl-1" htmlFor="new-item-availability">Availability Status</label>
                <select
                  id="new-item-availability"
                  value={newAvailable ? 'yes' : 'no'}
                  onChange={(e) => setNewAvailable(e.target.value === 'yes')}
                  required
                  className="w-full bg-[#1e2533] border border-white/15 focus:border-white/35 focus:ring-2 focus:ring-white/5 rounded-xl px-4 py-3 text-sm font-semibold text-white tracking-wide transition-all outline-none cursor-pointer"
                >
                  <option value="yes">🟢 In Stock (Available)</option>
                  <option value="no">🔴 Out of Stock (Unavailable)</option>
                </select>
              </div>

              <div className="flex justify-between items-center gap-3 pt-3">
                <button 
                  type="button" 
                  className="flex-1 bg-white/[0.05] border border-white/10 hover:bg-white/[0.1] text-white font-extrabold text-xs uppercase tracking-wider py-3.5 rounded-xl cursor-pointer transition-all duration-300" 
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-white text-[#141a27] hover:bg-slate-50 font-extrabold text-xs uppercase tracking-wider py-3.5 rounded-xl cursor-pointer transition-all duration-300 disabled:opacity-50"
                  disabled={addingItem}
                >
                  {addingItem ? 'Adding...' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Checkout Success Modal Dialog */}
      {orderSuccess && (
        <div className="absolute inset-0 bg-[#0f131a]/85 backdrop-blur-xl z-[99999] flex items-center justify-center p-6 animate-fadeIn" onClick={() => setOrderSuccess(null)}>
          <div className="bg-slate-900/90 border border-white/10 rounded-[32px] p-6 shadow-2xl w-full max-w-sm flex flex-col gap-5 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="text-4xl">🎉</div>
            <h3 className="text-base font-black uppercase tracking-wider text-white">Order Placed!</h3>
            <p className="text-xs leading-relaxed text-slate-300">Your order has been received by the kitchen team and is now being processed.</p>
            
            <div className="p-4 bg-white/[0.02] border border-white/10 rounded-2xl flex flex-col gap-2.5 text-left text-xs font-semibold text-slate-300 select-text">
              <div className="flex justify-between items-center w-full">
                <span>Order Reference:</span>
                <span className="font-mono text-white">#{orderSuccess._id}</span>
              </div>
              <div className="flex justify-between items-center w-full">
                <span>Student ID:</span>
                <span className="text-white">{orderSuccess.StudentId}</span>
              </div>
              <div className="flex justify-between items-center w-full">
                <span>Total Amount:</span>
                <span className="font-mono text-white">₹{orderSuccess.TotalAmount}</span>
              </div>
            </div>

            <button
              className="w-full bg-white text-[#141a27] hover:bg-slate-50 font-black rounded-xl py-3.5 shadow-md flex items-center justify-center transition active:scale-95 text-xs uppercase tracking-wider cursor-pointer"
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
