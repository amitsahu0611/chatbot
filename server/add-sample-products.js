const { sequelize } = require('./src/config/database');
const { Product } = require('./src/models');

const sampleProducts = [
  {
    product_name: 'Nike Air Max 270',
    description: 'Comfortable running shoes with air cushioning technology',
    price: 129.99,
    brand: 'Nike',
    category: 'Shoes',
    gender: 'Unisex',
    stock_quantity: 50,
    image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=300&fit=crop'
  },
  {
    product_name: 'Adidas Ultraboost 22',
    description: 'Premium running shoes with boost technology',
    price: 189.99,
    brand: 'Adidas',
    category: 'Shoes',
    gender: 'Unisex',
    stock_quantity: 30,
    image_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&h=300&fit=crop'
  },
  {
    product_name: 'Levi\'s 501 Original Jeans',
    description: 'Classic straight-fit jeans made from premium denim',
    price: 89.99,
    brand: 'Levi\'s',
    category: 'Clothing',
    gender: 'Unisex',
    stock_quantity: 75,
    image_url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=300&h=300&fit=crop'
  },
  {
    product_name: 'Apple iPhone 15 Pro',
    description: 'Latest iPhone with advanced camera system and A17 Pro chip',
    price: 999.99,
    brand: 'Apple',
    category: 'Electronics',
    gender: 'Unisex',
    stock_quantity: 25,
    image_url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=300&h=300&fit=crop'
  },
  {
    product_name: 'Samsung Galaxy S24 Ultra',
    description: 'Premium Android smartphone with S Pen and advanced AI features',
    price: 1199.99,
    brand: 'Samsung',
    category: 'Electronics',
    gender: 'Unisex',
    stock_quantity: 20,
    image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&h=300&fit=crop'
  },
  {
    product_name: 'Nike Dri-FIT T-Shirt',
    description: 'Moisture-wicking athletic t-shirt for training and sports',
    price: 29.99,
    brand: 'Nike',
    category: 'Clothing',
    gender: 'Male',
    stock_quantity: 100,
    image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop'
  },
  {
    product_name: 'Adidas Sports Bra',
    description: 'High-support sports bra for intense workouts',
    price: 39.99,
    brand: 'Adidas',
    category: 'Clothing',
    gender: 'Female',
    stock_quantity: 60,
    image_url: 'https://images.unsplash.com/photo-1506629905607-d3b94e8d4b8f?w=300&h=300&fit=crop'
  },
  {
    product_name: 'Sony WH-1000XM5 Headphones',
    description: 'Industry-leading noise canceling wireless headphones',
    price: 399.99,
    brand: 'Sony',
    category: 'Electronics',
    gender: 'Unisex',
    stock_quantity: 40,
    image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop'
  },
  {
    product_name: 'Puma RS-X Sneakers',
    description: 'Retro-inspired running shoes with modern comfort',
    price: 109.99,
    brand: 'Puma',
    category: 'Shoes',
    gender: 'Unisex',
    stock_quantity: 45,
    image_url: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=300&h=300&fit=crop'
  },
  {
    product_name: 'Under Armour HeatGear Shorts',
    description: 'Lightweight training shorts with moisture-wicking technology',
    price: 34.99,
    brand: 'Under Armour',
    category: 'Clothing',
    gender: 'Male',
    stock_quantity: 80,
    image_url: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=300&h=300&fit=crop'
  },
  {
    product_name: 'Men\'s Cotton Polo Shirt',
    description: 'Classic cotton polo shirt for men, perfect for casual wear',
    price: 45.99,
    brand: 'Ralph Lauren',
    category: 'Clothing',
    gender: 'Male',
    stock_quantity: 65,
    image_url: 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=300&h=300&fit=crop'
  },
  {
    product_name: 'Men\'s Denim Jacket',
    description: 'Stylish denim jacket for men, great for layering',
    price: 79.99,
    brand: 'Levi\'s',
    category: 'Clothing',
    gender: 'Male',
    stock_quantity: 40,
    image_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&h=300&fit=crop'
  },
  {
    product_name: 'Men\'s Casual Chinos',
    description: 'Comfortable chino pants for men, perfect for everyday wear',
    price: 59.99,
    brand: 'Dockers',
    category: 'Clothing',
    gender: 'Male',
    stock_quantity: 55,
    image_url: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=300&h=300&fit=crop'
  },
  {
    product_name: 'Men\'s Hoodie Sweatshirt',
    description: 'Cozy hoodie sweatshirt for men, perfect for cool weather',
    price: 49.99,
    brand: 'Champion',
    category: 'Clothing',
    gender: 'Male',
    stock_quantity: 70,
    image_url: 'https://images.unsplash.com/photo-1556821840-3a9fbc86339e?w=300&h=300&fit=crop'
  },
  {
    product_name: 'Men\'s Dress Shirt',
    description: 'Formal dress shirt for men, ideal for business and formal occasions',
    price: 69.99,
    brand: 'Calvin Klein',
    category: 'Clothing',
    gender: 'Male',
    stock_quantity: 45,
    image_url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=300&h=300&fit=crop'
  },
  {
    product_name: 'Men\'s Winter Jacket',
    description: 'Warm winter jacket for men, waterproof and windproof',
    price: 129.99,
    brand: 'North Face',
    category: 'Clothing',
    gender: 'Male',
    stock_quantity: 35,
    image_url: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=300&h=300&fit=crop'
  },
  {
    product_name: 'Men\'s Athletic Tank Top',
    description: 'Breathable tank top for men, perfect for workouts and sports',
    price: 24.99,
    brand: 'Nike',
    category: 'Clothing',
    gender: 'Male',
    stock_quantity: 85,
    image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop'
  }
];

async function addSampleProducts() {
  try {
    console.log('Adding sample products...');
    
    for (const productData of sampleProducts) {
      await Product.create(productData);
      console.log(`Added product: ${productData.product_name}`);
    }
    
    console.log('All sample products added successfully!');
  } catch (error) {
    console.error('Error adding sample products:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  addSampleProducts()
    .then(() => {
      console.log('Sample products script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Sample products script failed:', error);
      process.exit(1);
    });
}

module.exports = addSampleProducts;
