import MenuItem from '../models/MenuItem.js';

/**
 * Seed canteen MenuItems on startup.
 * Only runs if the MenuItem collection is empty.
 */
const seedCanteen = async () => {
  try {
    const itemCount = await MenuItem.countDocuments();
    
    if (itemCount === 0) {
      console.log('🌱 Canteen Menu is empty. Seeding initial items...');

      const defaultMenu = [
        {
          Name: 'Double Cheese Margherita Pizza',
          Price: 299,
          Category: 'Pizza',
          IsAvailable: true,
        },
        {
          Name: 'Creamy Alfredo Penne Pasta',
          Price: 249,
          Category: 'Pasta',
          IsAvailable: true,
        },
        {
          Name: 'Tandoori Paneer Tikka',
          Price: 199,
          Category: 'Starters',
          IsAvailable: true,
        },
        {
          Name: 'Frothy Irish Cold Coffee',
          Price: 120,
          Category: 'Beverages',
          IsAvailable: true,
        },
        {
          Name: 'Crispy Veggie Burger',
          Price: 99,
          Category: 'Snacks',
          IsAvailable: true,
        },
        {
          Name: 'Salted French Fries (Large)',
          Price: 110,
          Category: 'Snacks',
          IsAvailable: true,
        },
        {
          Name: 'Chocolate Lava Cake',
          Price: 85,
          Category: 'Desserts',
          IsAvailable: false, // Seeded as out of stock/unavailable by default to test cart exclusions!
        },
      ];

      await MenuItem.insertMany(defaultMenu);
      console.log('✅ Successfully seeded 7 default Canteen Menu items.');
    } else {
      console.log('🍔 Canteen database contains menu items. Skipping seed.');
    }
  } catch (err) {
    console.error('❌ Failed to seed Canteen Menu:', err.message);
  }
};

export default seedCanteen;
