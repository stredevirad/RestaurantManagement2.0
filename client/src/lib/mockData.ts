
export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  unit: string;
  threshold: number;
  pricePerUnit: number; // Cost to buy
  category: 'produce' | 'meat' | 'dairy' | 'pantry' | 'beverage';
  lastRestocked: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number; // Selling price
  prepTime: string;
  category: 'main' | 'appetizer' | 'dessert' | 'drink';
  ingredients: {
    inventoryId: string;
    quantity: number;
  }[];
  rating: number; // Current average rating
  ratingCount: number;
  chef?: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'sale' | 'restock' | 'waste' | 'system' | 'email';
  message: string;
  amount?: number; // Financial impact (positive for sale, negative for restock/waste)
}

export const initialInventory: InventoryItem[] = [
  { id: 'inv-1', sku: 'BEEF-001', name: 'Premium Ground Beef', quantity: 50, unit: 'kg', threshold: 10, pricePerUnit: 12.50, category: 'meat', lastRestocked: '2025-01-01' },
  { id: 'inv-2', sku: 'BUN-002', name: 'Brioche Buns', quantity: 100, unit: 'pcs', threshold: 20, pricePerUnit: 0.50, category: 'pantry', lastRestocked: '2025-01-02' },
  { id: 'inv-3', sku: 'CHS-003', name: 'Cheddar Cheese', quantity: 40, unit: 'slices', threshold: 15, pricePerUnit: 0.30, category: 'dairy', lastRestocked: '2025-01-01' },
  { id: 'inv-4', sku: 'TOM-004', name: 'Fresh Tomatoes', quantity: 20, unit: 'kg', threshold: 5, pricePerUnit: 2.00, category: 'produce', lastRestocked: '2025-01-02' },
  { id: 'inv-5', sku: 'LET-005', name: 'Iceberg Lettuce', quantity: 15, unit: 'heads', threshold: 5, pricePerUnit: 1.50, category: 'produce', lastRestocked: '2025-01-01' },
  { id: 'inv-6', sku: 'POT-006', name: 'Russet Potatoes', quantity: 80, unit: 'kg', threshold: 25, pricePerUnit: 0.80, category: 'produce', lastRestocked: '2024-12-30' },
  // New ingredients
  { id: 'inv-8', sku: 'MUSH-008', name: 'Wild Mushrooms', quantity: 15, unit: 'kg', threshold: 5, pricePerUnit: 8.00, category: 'produce', lastRestocked: '2025-01-02' },
  { id: 'inv-9', sku: 'TRUF-009', name: 'Truffle Oil', quantity: 5, unit: 'L', threshold: 1, pricePerUnit: 25.00, category: 'pantry', lastRestocked: '2024-12-25' },
  { id: 'inv-10', sku: 'CHK-010', name: 'Chicken Breast', quantity: 30, unit: 'kg', threshold: 10, pricePerUnit: 7.50, category: 'meat', lastRestocked: '2025-01-02' },
  { id: 'inv-11', sku: 'PICK-011', name: 'Pickles', quantity: 20, unit: 'jars', threshold: 5, pricePerUnit: 3.50, category: 'pantry', lastRestocked: '2025-01-01' },
  { id: 'inv-12', sku: 'SLAW-012', name: 'Coleslaw Mix', quantity: 10, unit: 'kg', threshold: 3, pricePerUnit: 2.00, category: 'produce', lastRestocked: '2025-01-02' },
  { id: 'inv-13', sku: 'ONION-013', name: 'Onions', quantity: 40, unit: 'kg', threshold: 10, pricePerUnit: 0.60, category: 'produce', lastRestocked: '2024-12-30' },
  { id: 'inv-14', sku: 'RANCH-014', name: 'Ranch Sauce', quantity: 10, unit: 'L', threshold: 2, pricePerUnit: 4.00, category: 'pantry', lastRestocked: '2025-01-01' },
  { id: 'inv-15', sku: 'MILK-015', name: 'Whole Milk', quantity: 30, unit: 'L', threshold: 10, pricePerUnit: 1.20, category: 'dairy', lastRestocked: '2025-01-02' },
  { id: 'inv-16', sku: 'VAN-016', name: 'Vanilla Bean Ice Cream', quantity: 20, unit: 'tubs', threshold: 5, pricePerUnit: 6.00, category: 'dairy', lastRestocked: '2025-01-01' },
  { id: 'inv-17', sku: 'CHOC-017', name: 'Dark Chocolate', quantity: 15, unit: 'kg', threshold: 5, pricePerUnit: 9.00, category: 'pantry', lastRestocked: '2024-12-20' },
  { id: 'inv-18', sku: 'FLOUR-018', name: 'Cake Flour', quantity: 50, unit: 'kg', threshold: 10, pricePerUnit: 1.00, category: 'pantry', lastRestocked: '2024-12-15' },
  { id: 'inv-19', sku: 'PARM-019', name: 'Parmesan Cheese', quantity: 10, unit: 'kg', threshold: 2, pricePerUnit: 14.00, category: 'dairy', lastRestocked: '2025-01-01' },
  { id: 'inv-20', sku: 'CROUT-020', name: 'Croutons', quantity: 15, unit: 'bags', threshold: 5, pricePerUnit: 2.50, category: 'pantry', lastRestocked: '2025-01-01' },
  { id: 'inv-21', sku: 'DRESS-021', name: 'Caesar Dressing', quantity: 10, unit: 'L', threshold: 2, pricePerUnit: 5.00, category: 'pantry', lastRestocked: '2025-01-01' },
  { id: 'inv-22', sku: 'BBQ-022', name: 'BBQ Sauce', quantity: 15, unit: 'L', threshold: 5, pricePerUnit: 3.50, category: 'pantry', lastRestocked: '2025-01-01' },
  { id: 'inv-23', sku: 'BAC-023', name: 'Smoked Bacon', quantity: 25, unit: 'kg', threshold: 5, pricePerUnit: 9.50, category: 'meat', lastRestocked: '2025-01-02' },
];

export const initialMenu: MenuItem[] = [
  {
    id: 'menu-1',
    name: 'Classic Cheeseburger',
    description: 'Juicy 200g beef patty with melted cheddar, fresh lettuce, and tomatoes on a toasted brioche bun.',
    price: 14.99,
    prepTime: '12 min',
    category: 'main',
    ingredients: [
      { inventoryId: 'inv-1', quantity: 0.2 },
      { inventoryId: 'inv-2', quantity: 1 },
      { inventoryId: 'inv-3', quantity: 2 },
      { inventoryId: 'inv-4', quantity: 0.1 },
      { inventoryId: 'inv-5', quantity: 0.1 },
    ],
    rating: 4.5,
    ratingCount: 120,
    chef: 'Chef Marco',
  },
  {
    id: 'menu-2',
    name: 'Double Smash Burger',
    description: 'Two smashed patties for maximum crust, triple cheese, and secret sauce.',
    price: 18.99,
    prepTime: '15 min',
    category: 'main',
    ingredients: [
      { inventoryId: 'inv-1', quantity: 0.3 },
      { inventoryId: 'inv-2', quantity: 1 },
      { inventoryId: 'inv-3', quantity: 3 },
    ],
    rating: 4.8,
    ratingCount: 85,
    chef: 'Chef Sarah',
  },
  {
    id: 'menu-3',
    name: 'Crispy Fries',
    description: 'Hand-cut russet potatoes, double fried for ultimate crunch.',
    price: 5.99,
    prepTime: '8 min',
    category: 'appetizer',
    ingredients: [
      { inventoryId: 'inv-6', quantity: 0.3 },
      { inventoryId: 'inv-7', quantity: 0.1 },
    ],
    rating: 4.2,
    ratingCount: 200,
    chef: 'Chef Leo',
  },
  {
    id: 'menu-4',
    name: 'Truffle Mushroom Swiss',
    description: 'Sautéed wild mushrooms, truffle aioli, and melted Swiss cheese on a brioche bun.',
    price: 16.50,
    prepTime: '14 min',
    category: 'main',
    ingredients: [
      { inventoryId: 'inv-8', quantity: 0.1 },
      { inventoryId: 'inv-9', quantity: 0.01 },
      { inventoryId: 'inv-3', quantity: 1 }, // Swiss cheese placeholder
      { inventoryId: 'inv-2', quantity: 1 },
    ],
    rating: 4.7,
    ratingCount: 45,
    chef: 'Chef Marco',
  },
  {
    id: 'menu-5',
    name: 'Spicy Chicken Sandwich',
    description: 'Crispy fried chicken breast dipped in Nashville hot oil, with pickles and slaw.',
    price: 13.99,
    prepTime: '10 min',
    category: 'main',
    ingredients: [
      { inventoryId: 'inv-10', quantity: 0.2 },
      { inventoryId: 'inv-2', quantity: 1 },
      { inventoryId: 'inv-11', quantity: 0.1 },
      { inventoryId: 'inv-12', quantity: 0.1 },
      { inventoryId: 'inv-7', quantity: 0.2 },
    ],
    rating: 4.4,
    ratingCount: 92,
    chef: 'Chef Sarah',
  },
  {
    id: 'menu-6',
    name: 'Onion Rings',
    description: 'Beer-battered onion rings served with zesty ranch dipping sauce.',
    price: 6.99,
    prepTime: '7 min',
    category: 'appetizer',
    ingredients: [
      { inventoryId: 'inv-13', quantity: 0.2 },
      { inventoryId: 'inv-7', quantity: 0.1 },
      { inventoryId: 'inv-14', quantity: 0.05 },
    ],
    rating: 4.1,
    ratingCount: 65,
    chef: 'Chef Leo',
  },
  {
    id: 'menu-7',
    name: 'Vanilla Bean Shake',
    description: 'Hand-spun milkshake made with real vanilla bean ice cream.',
    price: 5.50,
    prepTime: '4 min',
    category: 'drink',
    ingredients: [
      { inventoryId: 'inv-15', quantity: 0.2 },
      { inventoryId: 'inv-16', quantity: 0.3 },
    ],
    rating: 4.6,
    ratingCount: 150,
    chef: 'Barista Mike',
  },
  {
    id: 'menu-8',
    name: 'Chocolate Fudge Cake',
    description: 'Decadent three-layer chocolate cake with fudge frosting.',
    price: 8.99,
    prepTime: '2 min',
    category: 'dessert',
    ingredients: [
      { inventoryId: 'inv-17', quantity: 0.1 },
      { inventoryId: 'inv-18', quantity: 0.1 },
      { inventoryId: 'inv-15', quantity: 0.05 },
    ],
    rating: 4.9,
    ratingCount: 210,
    chef: 'Baker Anna',
  },
  {
    id: 'menu-9',
    name: 'Caesar Salad',
    description: 'Crisp romaine lettuce, parmesan cheese, croutons, and house-made Caesar dressing.',
    price: 10.99,
    prepTime: '6 min',
    category: 'appetizer',
    ingredients: [
      { inventoryId: 'inv-5', quantity: 1 },
      { inventoryId: 'inv-19', quantity: 0.05 },
      { inventoryId: 'inv-20', quantity: 0.1 },
      { inventoryId: 'inv-21', quantity: 0.05 },
    ],
    rating: 4.3,
    ratingCount: 55,
    chef: 'Chef Marco',
  },
  {
    id: 'menu-10',
    name: 'BBQ Bacon Burger',
    description: 'Smoky BBQ sauce, crispy onion straws, cheddar cheese, and bacon.',
    price: 15.99,
    prepTime: '13 min',
    category: 'main',
    ingredients: [
      { inventoryId: 'inv-1', quantity: 0.2 },
      { inventoryId: 'inv-2', quantity: 1 },
      { inventoryId: 'inv-3', quantity: 1 },
      { inventoryId: 'inv-23', quantity: 0.1 },
      { inventoryId: 'inv-22', quantity: 0.05 },
      { inventoryId: 'inv-13', quantity: 0.05 },
    ],
    rating: 4.7,
    ratingCount: 78,
    chef: 'Chef Sarah',
  }
];
