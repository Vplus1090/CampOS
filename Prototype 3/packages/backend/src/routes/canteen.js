import { Router } from 'express';
import MenuItem from '../models/MenuItem.js';
import Order from '../models/Order.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

/**
 * @route   GET /api/canteen/menu
 * @desc    Fetch all menu items (both available and sold out)
 * @access  Public
 */
router.get('/menu', async (req, res, next) => {
  try {
    const menu = await MenuItem.find({}).sort({ Category: 1, Name: 1 });
    res.json(menu);
  } catch (err) {
    next(err);
  }
});

/**
 * @route   POST /api/canteen/menu
 * @desc    Create a new menu item
 * @access  Authenticated (Requires canteen_admin role)
 */
router.post('/menu', authenticate, requireRole('canteen_admin', 'super_admin'), async (req, res, next) => {
  try {
    const { Name, Price, Category, IsAvailable } = req.body;

    const newItem = await MenuItem.create({
      Name,
      Price,
      Category,
      IsAvailable: IsAvailable !== undefined ? IsAvailable : true,
    });

    res.status(201).json(newItem);
  } catch (err) {
    next(err);
  }
});

/**
 * @route   PUT /api/canteen/menu/:id
 * @desc    Update menu item price, name, or category
 * @access  Authenticated (Requires canteen_admin role)
 */
router.put('/menu/:id', authenticate, requireRole('canteen_admin', 'super_admin'), async (req, res, next) => {
  try {
    const { Name, Price, Category, IsAvailable } = req.body;

    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      const error = new Error('Menu item not found');
      error.statusCode = 404;
      return next(error);
    }

    if (Name !== undefined) item.Name = Name;
    if (Price !== undefined) item.Price = Price;
    if (Category !== undefined) item.Category = Category;
    if (IsAvailable !== undefined) item.IsAvailable = IsAvailable;

    await item.save();
    res.json(item);
  } catch (err) {
    next(err);
  }
});

/**
 * @route   DELETE /api/canteen/menu/:id
 * @desc    Delete a menu item from the catalog
 * @access  Authenticated (Requires canteen_admin role)
 */
router.delete('/menu/:id', authenticate, requireRole('canteen_admin', 'super_admin'), async (req, res, next) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) {
      const error = new Error('Menu item not found');
      error.statusCode = 404;
      return next(error);
    }

    res.json({ message: 'Menu item deleted successfully', id: req.params.id });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   PATCH /api/canteen/menu/:id/toggle
 * @desc    Admin endpoint to toggle a menu item's IsAvailable availability status
 * @access  Authenticated (Requires canteen_admin role)
 */
router.patch('/menu/:id/toggle', authenticate, requireRole('canteen_admin', 'super_admin'), async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id);

    if (!item) {
      const error = new Error('Menu item not found');
      error.statusCode = 404;
      return next(error);
    }

    // Toggle availability status
    item.IsAvailable = !item.IsAvailable;
    await item.save();

    res.json({
      message: `Successfully toggled ${item.Name} availability to ${item.IsAvailable}`,
      item,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   POST /api/canteen/orders
 * @desc    Submit a new canteen order
 * @access  Public
 */
router.post('/orders', async (req, res, next) => {
  try {
    const { StudentId, StudentName, ItemsArray } = req.body;

    if (!StudentId && !StudentName) {
      const error = new Error('Student identifier is required');
      error.statusCode = 400;
      return next(error);
    }

    if (!ItemsArray || !Array.isArray(ItemsArray) || ItemsArray.length === 0) {
      const error = new Error('Order must contain at least one item');
      error.statusCode = 400;
      return next(error);
    }

    const processedItems = [];
    let computedTotal = 0;

    // Validate and compute totals securely on the server
    for (const item of ItemsArray) {
      const { MenuItemId, Quantity } = item;

      if (!MenuItemId || !Quantity || Quantity < 1) {
        const error = new Error('Invalid item specifications. Check ID and quantity.');
        error.statusCode = 400;
        return next(error);
      }

      const menuItem = await MenuItem.findById(MenuItemId);
      if (!menuItem) {
        const error = new Error(`Menu item with ID ${MenuItemId} not found`);
        error.statusCode = 404;
        return next(error);
      }

      // 🛑 Prevent orders containing sold out items!
      if (!menuItem.IsAvailable) {
        const error = new Error(`Sorry, "${menuItem.Name}" is currently sold out! Please remove it from your cart.`);
        error.statusCode = 400;
        return next(error);
      }

      const itemTotal = menuItem.Price * Quantity;
      computedTotal += itemTotal;

      processedItems.push({
        MenuItemId: menuItem._id,
        Name: menuItem.Name,
        Price: menuItem.Price,
        Quantity,
      });
    }

    // Generate random 4-digit PickupPIN
    const PickupPIN = Math.floor(1000 + Math.random() * 9000);

    // Create the order in the database
    const newOrder = await Order.create({
      StudentId: StudentId || StudentName,
      StudentName: StudentName || StudentId,
      ItemsArray: processedItems,
      TotalAmount: computedTotal,
      OrderStatus: 'Pending',
      PickupPIN,
      Timestamp: new Date(),
    });

    res.status(201).json(newOrder);
  } catch (err) {
    next(err);
  }
});

/**
 * @route   GET /api/canteen/orders
 * @desc    Fetch recent canteen orders
 * @access  Public
 */
router.get('/orders', async (req, res, next) => {
  try {
    const orders = await Order.find({}).sort({ Timestamp: -1 }).limit(10);
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

/**
 * @route   PATCH /api/canteen/orders/:id/complete
 * @desc    Mark a canteen order as completed
 * @access  Authenticated (Requires canteen_admin role)
 */
router.patch('/orders/:id/complete', authenticate, requireRole('canteen_admin', 'super_admin'), async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      const error = new Error('Order not found');
      error.statusCode = 404;
      return next(error);
    }

    order.OrderStatus = 'Completed';
    await order.save();

    res.json({
      message: `Successfully completed order ${order._id}`,
      order,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
