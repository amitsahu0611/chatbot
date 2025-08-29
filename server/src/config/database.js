const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: false, // Disable logging to reduce noise
    pool: {
      max: 5,
      min: 0,
      acquire: 60000,
      idle: 30000
    },
    dialectOptions: {
      connectTimeout: 60000,
      charset: 'utf8mb4',
      multipleStatements: true
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  }
);

const connectDB = async () => {
  const maxRetries = 3;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      await sequelize.authenticate();
      logger.info('MySQL Database connected successfully');
      logger.info('Database connection established');
      return;
      
    } catch (error) {
      retries++;
      logger.error(`Error connecting to MySQL Database (attempt ${retries}/${maxRetries}):`, error.message);
      
      if (retries === maxRetries) {
        logger.error('Max retries reached. Exiting...');
        process.exit(1);
      }
      
      // Wait 5 seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

// Handle connection events
sequelize.addHook('afterConnect', () => {
  logger.info('MySQL connection established');
});

sequelize.addHook('afterDisconnect', () => {
  logger.warn('MySQL connection disconnected');
});

// Add connection error handling
sequelize.addHook('afterConnect', (connection) => {
  connection.on('error', (err) => {
    logger.error('MySQL connection error:', err);
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await sequelize.close();
  logger.info('MySQL connection closed through app termination');
  process.exit(0);
});

module.exports = { sequelize, connectDB };
