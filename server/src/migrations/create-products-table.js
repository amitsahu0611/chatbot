const { sequelize } = require('../config/database');

async function createProductsTable() {
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_name VARCHAR(200) NOT NULL,
        description TEXT,
        price DECIMAL(10,2),
        brand VARCHAR(100),
        category VARCHAR(100),
        gender VARCHAR(20),
        stock_quantity INT DEFAULT 0,
        image_url VARCHAR(255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
    
    console.log('Products table created successfully');
  } catch (error) {
    console.error('Error creating products table:', error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  createProductsTable()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = createProductsTable;
