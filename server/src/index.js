const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const xss = require('xss-clean');
const hpp = require('hpp');
const path = require('path');

require('express-async-errors');
require('dotenv').config({ path: './config.env' });

const { connectDB } = require('./config/database');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

// Import routes
const authRoutes = require('./routes/auth');
const superAdminRoutes = require('./routes/super-admin');
const companyAdminRoutes = require('./routes/company-admin');
const widgetRoutes = require('./routes/widget');
const analyticsRoutes = require('./routes/analytics');
const integrationsRoutes = require('./routes/integrations');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

// Import models to ensure they are registered
require('./models');

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: process.env.NODE_ENV === 'development' ? false : {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Allow inline scripts for widget demos
        "'unsafe-eval'", // Allow eval for widget functionality
        "https://unpkg.com", // Allow React CDN
        "https://cdn.jsdelivr.net", // Allow other CDNs
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Allow inline styles for widget styling
        "https://fonts.googleapis.com",
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https:",
      ],
      connectSrc: [
        "'self'",
        "http://localhost:5001", // Allow API connections
        "http://localhost:5173", // Allow dev server
        "ws://localhost:*", // Allow websockets
      ],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Parse multiple CLIENT_URLs separated by commas
    const clientUrls = process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map(url => url.trim()) : [];
    
    // Allow localhost origins and configured client URLs
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      ...clientUrls
    ].filter(Boolean);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // Allow all origins for widget scripts
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Speed limiting
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // allow 50 requests per 15 minutes, then...
  delayMs: 500 // begin adding 500ms of delay per request above 50
});
app.use('/api/', speedLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Data sanitization against XSS
app.use(xss());



// Prevent parameter pollution
app.use(hpp());

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public'), {
  setHeaders: (res, filePath) => {
    // Set appropriate CORS headers for widget files
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Set cache headers
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
      res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour cache
    } else if (filePath.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Cache-Control', 'no-cache'); // No cache for HTML
    }
  }
}));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/company-admin', companyAdminRoutes);
app.use('/api/widget', widgetRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/integrations', integrationsRoutes);

// API documentation
if (process.env.NODE_ENV === 'development') {
  const swaggerJsdoc = require('swagger-jsdoc');
  const swaggerUi = require('swagger-ui-express');
  
  const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Chatbot Management API',
        version: '1.0.0',
        description: 'API documentation for the Chatbot Management System',
      },
      servers: [
        {
          url: `http://localhost:${PORT}`,
          description: 'Development server',
        },
      ],
    },
    apis: ['./src/routes/*.js', './src/routes/**/*.js'],
  };
  
  const specs = swaggerJsdoc(options);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
}

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

// Socket.io setup
const io = require('socket.io')(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  logger.info('New client connected:', socket.id);
  
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    logger.info(`Client ${socket.id} joined room: ${roomId}`);
  });
  
  socket.on('leave-room', (roomId) => {
    socket.leave(roomId);
    logger.info(`Client ${socket.id} left room: ${roomId}`);
  });
  
  socket.on('disconnect', () => {
    logger.info('Client disconnected:', socket.id);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

module.exports = app;
