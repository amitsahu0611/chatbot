// CORS Configuration for Widget Routes - Add this to your production server

const cors = require('cors');

// Widget-specific CORS middleware - allows ALL origins for widget endpoints
const widgetCORS = cors({
  origin: true, // This allows ALL origins
  credentials: false, // Widget doesn't need credentials
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
});

// Apply this middleware to ALL widget routes
app.use('/api/widget', widgetCORS);

// Alternative: Individual route protection
app.use('/api/widget/embed/*', widgetCORS);
app.use('/api/widget/session/*', widgetCORS);
app.use('/api/widget/search/*', widgetCORS);
app.use('/api/widget/chat/*', widgetCORS);
app.use('/api/widget/form/*', widgetCORS);

module.exports = { widgetCORS };
