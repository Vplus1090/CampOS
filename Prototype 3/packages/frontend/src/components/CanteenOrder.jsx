import React, { useState, useEffect } from 'react';

export default function CanteenOrder({ currentUser, onUpdate, setActiveTab, triggerPayment }) {
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Checkout state
  const [studentId, setStudentId] = useState(currentUser ? currentUser.firstName : '');
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);

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
        fetch('/api/canteen/menu'),
        fetch('/api/canteen/orders'),
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
      const res = await fetch(`/api/canteen/menu/${itemId}/toggle`, {
        method: 'PATCH',
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
      const res = await fetch('/api/canteen/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Name: newName,
          Price: Number(newPrice),
          Category: newCategory,
          IsAvailable: newAvailable,
        }),
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
      const res = await fetch(`/api/canteen/menu/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Price: Number(editPrice) }),
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
      const res = await fetch(`/api/canteen/menu/${itemId}`, {
        method: 'DELETE',
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

  return (
    <div className="canteen-module">
      <div className="module-header">
        <div className="header-info">
          <h2>🍔 Canteen Control Board</h2>
          <p>
            {isCanteenAdmin
              ? 'Catalog Operations Management: Add, edit prices, delete items, and toggle availability.'
              : 'Order fresh meals, snacks, and refreshing beverages directly to your hostel block.'}
          </p>
        </div>
        
        {/* Canteen Admin exclusive item creation button */}
        {isCanteenAdmin && (
          <button 
            className="btn btn-accent"
            onClick={() => setShowAddModal(true)}
          >
            <span>＋</span> Add Menu Item
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading canteen menu...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <p>⚠️ {error}</p>
          <button className="btn btn-secondary" onClick={fetchMenuAndOrders}>Retry</button>
        </div>
      ) : (
        <div className="canteen-workspace">
          {/* Menu Catalog Section */}
          <div className="canteen-catalog" style={{ flex: isStudent ? 2 : 1 }}>
            {categories.map((category) => (
              <div key={category} className="menu-category-section">
                <h3 className="category-title">{category}</h3>
                <div className="menu-grid">
                  {menu
                    .filter((item) => item.Category === category)
                    .map((item) => {
                      const isSoldOut = !item.IsAvailable;
                      return (
                        <div
                          key={item._id}
                          className={`menu-card ${isSoldOut ? 'menu-card-soldout' : ''}`}
                        >
                          <div className="menu-card-top">
                            <span className="menu-category">{item.Category}</span>
                            <span className={`availability-badge ${isSoldOut ? 'badge-unavailable' : 'badge-available'}`}>
                              {isSoldOut ? 'Sold Out' : 'Available'}
                            </span>
                          </div>
                          
                          <h4 className="menu-item-name">{item.Name}</h4>
                          
                          {/* Price updates in-card dialog (Canteen Admin only) */}
                          {isCanteenAdmin && editingItemId === item._id ? (
                            <div className="price-edit-row">
                              <input
                                type="number"
                                className="price-edit-input"
                                placeholder="New Price"
                                value={editPrice}
                                onChange={(e) => setEditPrice(e.target.value)}
                              />
                              <button 
                                className="btn-save-price font-mono"
                                onClick={() => handleUpdatePrice(item._id)}
                                disabled={savingPrice}
                              >
                                ✓
                              </button>
                              <button 
                                className="btn-cancel-price font-mono"
                                onClick={() => { setEditingItemId(null); setEditPrice(''); }}
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div className="item-price-display">
                              <span className="price-label">Price:</span>
                              <span className="item-price font-mono">₹{item.Price}</span>
                              {isCanteenAdmin && (
                                <button
                                  className="btn-edit-price-pencil"
                                  onClick={() => { setEditingItemId(item._id); setEditPrice(item.Price); }}
                                  title="Edit Price"
                                >
                                  ✏️
                                </button>
                              )}
                            </div>
                          )}

                          <div className="menu-card-footer mt-4">
                            {/* Stock toggle switches & deletes (Canteen Admin only) */}
                            {isCanteenAdmin ? (
                              <div className="admin-controls-card-footer">
                                <div className="admin-toggle-control" title="Toggle item availability status">
                                  <label className="switch">
                                    <input
                                      type="checkbox"
                                      checked={item.IsAvailable}
                                      onChange={() => toggleAvailability(item._id)}
                                    />
                                    <span className="slider round"></span>
                                  </label>
                                  <span className="switch-label font-mono">In Stock</span>
                                </div>
                                
                                <button
                                  className="btn-card-delete-trash"
                                  onClick={() => handleDeleteItem(item._id)}
                                  title="Delete Item"
                                >
                                  🗑️ Delete
                                </button>
                              </div>
                            ) : (
                              // Add to cart buttons (Students only)
                              <button
                                className={`btn-add-to-cart ${isSoldOut ? 'btn-soldout' : ''}`}
                                disabled={isSoldOut}
                                onClick={() => addToCart(item)}
                                style={{ width: '100%' }}
                              >
                                {isSoldOut ? 'Sold Out' : '＋ Add to Cart'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>

          {/* Stateful Shopping Cart Sidebar - Strictly restricted ONLY to students! */}
          {isStudent && (
            <div className="canteen-cart-sidebar">
              <div className="cart-card">
                <div className="cart-header">
                  <h3>🛒 Selected Items</h3>
                  {cart.length > 0 && (
                    <span className="cart-count-badge font-mono">{cart.length}</span>
                  )}
                </div>

                {cart.length === 0 ? (
                  <div className="empty-cart-state">
                    <span className="cart-empty-icon">🥗</span>
                    <p>Your shopping cart is empty.</p>
                    <p className="hint">Choose your favorite meals from the menu to build your order.</p>
                  </div>
                ) : (
                  <div className="cart-content-wrapper">
                    <div className="cart-items-list">
                      {cart.map((cartItem) => {
                        const currentMenuItem = menu.find((m) => m._id === cartItem._id);
                        const isCurrentlyUnavailable = currentMenuItem && !currentMenuItem.IsAvailable;

                        return (
                          <div
                            key={cartItem._id}
                            className={`cart-item-row ${isCurrentlyUnavailable ? 'cart-item-row-soldout' : ''}`}
                          >
                            <div className="cart-item-info">
                              <span className="name">{cartItem.Name}</span>
                              <span className="price">₹{cartItem.Price} each</span>
                              {isCurrentlyUnavailable && (
                                <span className="cart-sold-out-warning">
                                  🛑 SOLD OUT! Remove to checkout.
                                </span>
                              )}
                            </div>
                            <div className="cart-qty-controls">
                              <button
                                className="qty-btn"
                                disabled={isCurrentlyUnavailable}
                                onClick={() => updateQuantity(cartItem._id, -1)}
                              >
                                －
                              </button>
                              <span className="qty-val font-mono">{cartItem.quantity}</span>
                              <button
                                className="qty-btn"
                                disabled={isCurrentlyUnavailable}
                                onClick={() => updateQuantity(cartItem._id, 1)}
                              >
                                ＋
                              </button>
                              <button
                                className="cart-remove"
                                onClick={() => removeFromCart(cartItem._id)}
                                title="Delete Item"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="cart-totals-section">
                      <div className="total-row">
                        <span>Total Amount:</span>
                        <span className="total-val font-mono">₹{totalAmount}</span>
                      </div>

                      <form onSubmit={handleCheckout} className="cart-checkout-form">
                        <div className="form-group">
                          <label htmlFor="student-id-input">Student Registration ID</label>
                          <input
                            id="student-id-input"
                            type="text"
                            placeholder="e.g., student_104"
                            value={studentId}
                            onChange={(e) => setStudentId(e.target.value)}
                            required
                          />
                        </div>
                        <button
                          type="submit"
                          className="btn btn-accent btn-checkout-submit"
                          disabled={submittingOrder || cart.some(ci => {
                            const m = menu.find(mi => mi._id === ci._id);
                            return m && !m.IsAvailable;
                          })}
                        >
                          {submittingOrder ? 'Processing Order...' : '🚀 Place Canteen Order'}
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>

              {/* Recent Orders log */}
              {orders.length > 0 && (
                <div className="recent-orders-card">
                  <h3 className="card-title">🧾 Canteen Orders Log</h3>
                  <div className="orders-list">
                    {orders.map((order) => {
                      return (
                        <div key={order._id || order.id} className="order-log-row">
                          <div className="order-log-top">
                            <span className="order-id font-mono">#{String(order._id).substring(18)}</span>
                            <span className={`order-status status-${order.OrderStatus.toLowerCase()}`}>
                              {order.OrderStatus}
                            </span>
                          </div>
                          <div className="order-log-details">
                            <div className="items-summary text-truncate">
                              {order.ItemsArray.map(i => `${i.Name} x${i.Quantity}`).join(', ')}
                            </div>
                            <div className="log-footer">
                              <span className="id">Reg: {order.StudentId}</span>
                              <span className="total font-mono">₹{order.TotalAmount}</span>
                            </div>
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
      )}

      {/* Canteen Admin: Add Item Modal */}
      {showAddModal && isCanteenAdmin && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Menu Item</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddItem} className="modal-form">
              <div className="form-group">
                <label htmlFor="new-item-name">Item Name</label>
                <input
                  id="new-item-name"
                  type="text"
                  placeholder="e.g., Paneer Patty, Mango Shake"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="new-item-price">Price (₹)</label>
                <input
                  id="new-item-price"
                  type="number"
                  placeholder="e.g., 65"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="new-item-category">Category</label>
                <select
                  id="new-item-category"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  required
                >
                  <option value="Pizza">Pizza</option>
                  <option value="Pasta">Pasta</option>
                  <option value="Starters">Starters</option>
                  <option value="Beverages">Beverages</option>
                  <option value="Snacks">Snacks</option>
                  <option value="Desserts">Desserts</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="new-item-availability">Availability Status</label>
                <select
                  id="new-item-availability"
                  value={newAvailable ? 'yes' : 'no'}
                  onChange={(e) => setNewAvailable(e.target.value === 'yes')}
                  required
                >
                  <option value="yes">🟢 In Stock (Available)</option>
                  <option value="no">🔴 Out of Stock (Unavailable)</option>
                </select>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-accent"
                  disabled={addingItem}
                >
                  {addingItem ? 'Adding...' : 'Add Item to Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Checkout Success Modal Dialog */}
      {orderSuccess && (
        <div className="modal-overlay" onClick={() => setOrderSuccess(null)}>
          <div className="modal-content text-center" onClick={(e) => e.stopPropagation()}>
            <div className="success-icon">🎉</div>
            <h3 className="success-title">Order Placed Successfully!</h3>
            <p>Your order has been received by the kitchen team and is now being processed.</p>
            
            <div className="order-receipt-card">
              <div className="receipt-row">
                <span>Order Reference:</span>
                <span className="font-mono">#{orderSuccess._id}</span>
              </div>
              <div className="receipt-row">
                <span>Student ID:</span>
                <span>{orderSuccess.StudentId}</span>
              </div>
              <div className="receipt-row">
                <span>Total Amount:</span>
                <span className="font-mono">₹{orderSuccess.TotalAmount}</span>
              </div>
            </div>

            <button
              className="btn btn-accent btn-close-success"
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
