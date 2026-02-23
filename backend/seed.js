const mongoose = require('mongoose');
require('dotenv').config();
const Category = require('./models/Category');
const Product = require('./models/Product');
const connectDB = require('./config/db');

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await Category.deleteMany({});
    await Product.deleteMany({});

    // Create Categories
    const categories = await Category.insertMany([
      {
        name: 'Men',
        description: 'Mens Clothing & Apparel',
        slug: 'men',
      },
      {
        name: 'Women',
        description: 'Womens Clothing & Apparel',
        slug: 'women',
      },
      {
        name: 'Kids',
        description: 'Kids Clothing & Apparel',
        slug: 'kids',
      },
      {
        name: 'Accessories',
        description: 'Fashion Accessories',
        slug: 'accessories',
      },
    ]);

    // Create Products
    const products = [
      // Men's Category
      {
        name: 'Classic Blue T-Shirt',
        description: 'Comfortable and stylish classic blue t-shirt perfect for everyday wear',
        price: 29.99,
        originalPrice: 39.99,
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80',
        category: categories[0]._id,
        sizes: [
          { size: 'XS', stock: 10 },
          { size: 'S', stock: 15 },
          { size: 'M', stock: 20 },
          { size: 'L', stock: 18 },
          { size: 'XL', stock: 12 },
        ],
        colors: ['Blue', 'White', 'Black'],
        totalStock: 75,
        rating: 4.5,
      },
      {
        name: 'Premium Denim Jeans',
        description: 'High-quality denim jeans with perfect fit and durability',
        price: 59.99,
        originalPrice: 79.99,
        image: 'https://images.unsplash.com/photo-1542272604-787c62d465d1?w=500&q=80',
        category: categories[0]._id,
        sizes: [
          { size: '28', stock: 8 },
          { size: '30', stock: 12 },
          { size: '32', stock: 15 },
          { size: '34', stock: 10 },
        ],
        colors: ['Dark Blue', 'Light Blue', 'Black'],
        totalStock: 45,
        rating: 4.8,
      },
      {
        name: 'Mens Casual Polo Shirt',
        description: 'Smart casual polo shirt perfect for office or weekend outings',
        price: 39.99,
        originalPrice: 54.99,
        image: 'https://images.unsplash.com/photo-1618886996028-d351b90eed35?w=500&q=80',
        category: categories[0]._id,
        sizes: [
          { size: 'S', stock: 12 },
          { size: 'M', stock: 15 },
          { size: 'L', stock: 12 },
          { size: 'XL', stock: 10 },
        ],
        colors: ['Navy', 'Red', 'White', 'Black'],
        totalStock: 49,
        rating: 4.5,
      },
      {
        name: 'Slim Fit Chinos',
        description: 'Versatile slim fit chinos for a polished look',
        price: 44.99,
        originalPrice: 59.99,
        image: 'https://images.unsplash.com/photo-1547637602-e256612d31f1?w=500&q=80',
        category: categories[0]._id,
        sizes: [
          { size: '30', stock: 10 },
          { size: '32', stock: 12 },
          { size: '34', stock: 14 },
        ],
        colors: ['Khaki', 'Navy', 'Charcoal'],
        totalStock: 36,
        rating: 4.3,
      },
      {
        name: 'Athletic Polo Shirt',
        description: 'Breathable athletic polo perfect for sports and casual wear',
        price: 34.99,
        originalPrice: 49.99,
        image: 'https://images.unsplash.com/photo-1596621030375-88c23ddb1629?w=500&q=80',
        category: categories[0]._id,
        sizes: [
          { size: 'S', stock: 15 },
          { size: 'M', stock: 18 },
          { size: 'L', stock: 14 },
          { size: 'XL', stock: 10 },
        ],
        colors: ['Gray', 'Blue', 'Green'],
        totalStock: 57,
        rating: 4.6,
      },

      // Women's Category
      {
        name: 'Elegant Summer Dress',
        description: 'Breathable and elegant summer dress perfect for any occasion',
        price: 49.99,
        originalPrice: 69.99,
        image: 'https://images.unsplash.com/photo-1595777712802-4d3d9a8f2bf9?w=500&q=80',
        category: categories[1]._id,
        sizes: [
          { size: 'XS', stock: 5 },
          { size: 'S', stock: 10 },
          { size: 'M', stock: 12 },
          { size: 'L', stock: 8 },
        ],
        colors: ['White', 'Floral', 'Navy'],
        totalStock: 35,
        rating: 4.6,
      },
      {
        name: 'Womens Athletic Leggings',
        description: 'High-waist athletic leggings with moisture-wicking fabric',
        price: 54.99,
        originalPrice: 74.99,
        image: 'https://images.unsplash.com/photo-1594735691573-08d3fb993613?w=500&q=80',
        category: categories[1]._id,
        sizes: [
          { size: 'XS', stock: 10 },
          { size: 'S', stock: 14 },
          { size: 'M', stock: 18 },
          { size: 'L', stock: 12 },
        ],
        colors: ['Black', 'Navy', 'Grey'],
        totalStock: 54,
        rating: 4.9,
      },
      {
        name: 'Casual Blouse',
        description: 'Stylish casual blouse perfect for work or weekend',
        price: 39.99,
        originalPrice: 54.99,
        image: 'https://images.unsplash.com/photo-1596377689673-d4dc01281fb0?w=500&q=80',
        category: categories[1]._id,
        sizes: [
          { size: 'XS', stock: 8 },
          { size: 'S', stock: 12 },
          { size: 'M', stock: 15 },
          { size: 'L', stock: 10 },
        ],
        colors: ['White', 'Pink', 'Blue'],
        totalStock: 45,
        rating: 4.4,
      },
      {
        name: 'Denim Shorts',
        description: 'Comfortable and trendy denim shorts for summer',
        price: 34.99,
        originalPrice: 49.99,
        image: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=500&q=80',
        category: categories[1]._id,
        sizes: [
          { size: 'XS', stock: 6 },
          { size: 'S', stock: 10 },
          { size: 'M', stock: 12 },
          { size: 'L', stock: 8 },
        ],
        colors: ['Dark Blue', 'Light Blue', 'Black'],
        totalStock: 36,
        rating: 4.5,
      },
      {
        name: 'Evening Gown',
        description: 'Elegant evening gown for special occasions',
        price: 89.99,
        originalPrice: 129.99,
        image: 'https://images.unsplash.com/photo-1595777712802-4d3d9a8f2bf9?w=500&q=80',
        category: categories[1]._id,
        sizes: [
          { size: 'XS', stock: 3 },
          { size: 'S', stock: 5 },
          { size: 'M', stock: 6 },
          { size: 'L', stock: 4 },
        ],
        colors: ['Black', 'Red', 'Navy'],
        totalStock: 18,
        rating: 4.8,
      },

      // Kids Category
      {
        name: 'Kids Colorful Hoodie',
        description: 'Warm and colorful hoodie for kids with fun designs',
        price: 34.99,
        originalPrice: 44.99,
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80',
        category: categories[2]._id,
        sizes: [
          { size: '2Y', stock: 8 },
          { size: '4Y', stock: 10 },
          { size: '6Y', stock: 12 },
          { size: '8Y', stock: 10 },
        ],
        colors: ['Red', 'Blue', 'Green'],
        totalStock: 40,
        rating: 4.4,
      },
      {
        name: 'Kids T-Shirt Set',
        description: 'Comfortable cotton t-shirt set for kids (pack of 3)',
        price: 29.99,
        originalPrice: 39.99,
        image: 'https://images.unsplash.com/photo-1586793676295-14a1fb23ba5b?w=500&q=80',
        category: categories[2]._id,
        sizes: [
          { size: '2Y', stock: 12 },
          { size: '4Y', stock: 14 },
          { size: '6Y', stock: 16 },
          { size: '8Y', stock: 12 },
        ],
        colors: ['Multi-color'],
        totalStock: 54,
        rating: 4.7,
      },
      {
        name: 'Kids Jeans',
        description: 'Durable kids jeans perfect for active play',
        price: 24.99,
        originalPrice: 34.99,
        image: 'https://images.unsplash.com/photo-1517994712202-14abd9cc3712?w=500&q=80',
        category: categories[2]._id,
        sizes: [
          { size: '2Y', stock: 6 },
          { size: '4Y', stock: 8 },
          { size: '6Y', stock: 10 },
          { size: '8Y', stock: 8 },
        ],
        colors: ['Blue', 'Black'],
        totalStock: 32,
        rating: 4.3,
      },
      {
        name: 'Kids Snow Jacket',
        description: 'Warm and waterproof snow jacket for winter',
        price: 49.99,
        originalPrice: 69.99,
        image: 'https://images.unsplash.com/photo-1551886287-f40a50c3a4b7?w=500&q=80',
        category: categories[2]._id,
        sizes: [
          { size: '2Y', stock: 5 },
          { size: '4Y', stock: 7 },
          { size: '6Y', stock: 8 },
          { size: '8Y', stock: 6 },
        ],
        colors: ['Red', 'Blue', 'Yellow'],
        totalStock: 26,
        rating: 4.6,
      },
      {
        name: 'Kids Sports Shorts',
        description: 'Lightweight sports shorts for kids activities',
        price: 19.99,
        originalPrice: 29.99,
        image: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=500&q=80',
        category: categories[2]._id,
        sizes: [
          { size: '2Y', stock: 10 },
          { size: '4Y', stock: 12 },
          { size: '6Y', stock: 14 },
          { size: '8Y', stock: 12 },
        ],
        colors: ['Black', 'Navy', 'Grey'],
        totalStock: 48,
        rating: 4.5,
      },

      // Accessories Category
      {
        name: 'Leather Crossbody Bag',
        description: 'Stylish and practical leather crossbody bag for everyday use',
        price: 79.99,
        originalPrice: 99.99,
        image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&q=80',
        category: categories[3]._id,
        sizes: [{ size: 'One Size', stock: 25 }],
        colors: ['Black', 'Brown', 'Cognac'],
        totalStock: 25,
        rating: 4.7,
      },
      {
        name: 'Modern Sunglasses',
        description: 'UV-protected modern sunglasses with trendy style',
        price: 109.99,
        originalPrice: 149.99,
        image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&q=80',
        category: categories[3]._id,
        sizes: [{ size: 'One Size', stock: 30 }],
        colors: ['Black', 'Brown', 'Gold'],
        totalStock: 30,
        rating: 4.3,
      },
      {
        name: 'Casual Backpack',
        description: 'Spacious casual backpack perfect for work or travel',
        price: 59.99,
        originalPrice: 79.99,
        image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80',
        category: categories[3]._id,
        sizes: [{ size: 'One Size', stock: 20 }],
        colors: ['Black', 'Navy', 'Gray'],
        totalStock: 20,
        rating: 4.6,
      },
      {
        name: 'Winter Beanie',
        description: 'Cozy wool winter beanie in various colors',
        price: 19.99,
        originalPrice: 29.99,
        image: 'https://images.unsplash.com/photo-1578432537452-c9ab31d0b0d7?w=500&q=80',
        category: categories[3]._id,
        sizes: [{ size: 'One Size', stock: 40 }],
        colors: ['Black', 'Gray', 'Navy', 'Red'],
        totalStock: 40,
        rating: 4.4,
      },
      {
        name: 'Leather Belt',
        description: 'Classic leather belt for dress or casual wear',
        price: 39.99,
        originalPrice: 54.99,
        image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80',
        category: categories[3]._id,
        sizes: [
          { size: 'Small', stock: 15 },
          { size: 'Medium', stock: 18 },
          { size: 'Large', stock: 14 },
        ],
        colors: ['Black', 'Brown', 'Tan'],
        totalStock: 47,
        rating: 4.5,
      },
      {
        name: 'Casual Sneakers',
        description: 'Comfortable casual sneakers for everyday wear',
        price: 69.99,
        originalPrice: 99.99,
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80',
        category: categories[3]._id,
        sizes: [
          { size: '6', stock: 8 },
          { size: '7', stock: 10 },
          { size: '8', stock: 12 },
          { size: '9', stock: 10 },
          { size: '10', stock: 8 },
        ],
        colors: ['White', 'Black', 'Gray'],
        totalStock: 48,
        rating: 4.7,
      },
      {
        name: 'Wool Scarf',
        description: 'Warm and soft wool scarf perfect for winter',
        price: 29.99,
        originalPrice: 44.99,
        image: 'https://images.unsplash.com/photo-1602141515304-4e1f52265031?w=500&q=80',
        category: categories[3]._id,
        sizes: [{ size: 'One Size', stock: 30 }],
        colors: ['Charcoal', 'Burgundy', 'Navy', 'Cream'],
        totalStock: 30,
        rating: 4.6,
      },
    ];

    await Product.insertMany(products);

    console.log('✅ Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run seed
seedData();
