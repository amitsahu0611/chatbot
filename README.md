# Chatbot Management System

A comprehensive chatbot management platform with multi-tenant architecture, featuring super admin and company admin panels, form builders, lead management, FAQ systems, and embeddable widgets.

## Project Structure

```
chatbot/
├── client/                 # Frontend React Application
│   ├── public/            # Static files
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   │   ├── common/    # Shared components
│   │   │   ├── super-admin/  # Super admin components
│   │   │   │   ├── companies/
│   │   │   │   └── users/
│   │   │   ├── company-admin/  # Company admin components
│   │   │   │   ├── dashboard/
│   │   │   │   ├── form-builder/
│   │   │   │   ├── lead-viewer/
│   │   │   │   ├── faq-manager/
│   │   │   │   ├── support-settings/
│   │   │   │   └── widget-management/
│   │   │   └── widget/    # Widget components
│   │   │       ├── chat/
│   │   │       └── form/
│   │   ├── pages/         # Page components
│   │   │   ├── super-admin/
│   │   │   ├── company-admin/
│   │   │   ├── widget/
│   │   │   ├── analytics/
│   │   │   └── integrations/
│   │   ├── hooks/         # Custom React hooks
│   │   ├── context/       # React context providers
│   │   ├── utils/         # Utility functions
│   │   ├── styles/        # CSS/SCSS files
│   │   └── assets/        # Images, icons, etc.
│   └── package.json
│
├── server/                # Backend Node.js API
│   ├── src/
│   │   ├── controllers/   # Route controllers
│   │   │   ├── super-admin/
│   │   │   ├── company-admin/
│   │   │   ├── widget/
│   │   │   ├── analytics/
│   │   │   └── integrations/
│   │   ├── models/        # Database models
│   │   │   ├── super-admin/
│   │   │   ├── company-admin/
│   │   │   ├── widget/
│   │   │   ├── analytics/
│   │   │   └── integrations/
│   │   ├── routes/        # API routes
│   │   │   ├── super-admin/
│   │   │   ├── company-admin/
│   │   │   ├── widget/
│   │   │   ├── analytics/
│   │   │   └── integrations/
│   │   ├── services/      # Business logic
│   │   │   ├── super-admin/
│   │   │   ├── company-admin/
│   │   │   ├── widget/
│   │   │   ├── analytics/
│   │   │   └── integrations/
│   │   ├── middleware/    # Express middleware
│   │   ├── utils/         # Utility functions
│   │   ├── config/        # Configuration files
│   │   └── validators/    # Input validation
│   ├── tests/             # Test files
│   └── package.json
│
└── README.md
```

## Features

### Super Admin Panel
- **Company Management**: Create, edit, delete companies
- **User Management**: Manage users across all companies
- **System-wide Analytics**: Overview of all companies and users

### Company Admin Panel
- **Dashboard**: Statistics for leads, forms, FAQs
- **Form Builder**: Drag-and-drop form creation
- **Lead Viewer**: Filter, search, and export leads
- **FAQ Manager**: CRUD operations for FAQs
- **Support Settings**: Configure phone and email support
- **Widget Management**: Generate embed codes for widgets

### Chatbot Widget
- **Embeddable Bubble**: Floating chat button
- **Popup Interface**: Expandable chat window
- **Form Display**: Dynamic form rendering
- **Chat Interface**: FAQ and LLM-powered responses

### Future Enhancements
- **Multi-language FAQ Support**: Internationalization
- **Analytics Dashboard**: Top questions, conversion rates
- **WhatsApp/Telegram Integration**: Multi-platform support
- **Payment Plans**: Subscription model for companies

## Technology Stack

### Frontend (Client)
- **React 18**: UI framework
- **React Router**: Navigation
- **Tailwind CSS**: Styling
- **React Hook Form**: Form management
- **React Query**: Data fetching
- **React Beautiful DnD**: Drag and drop
- **Chart.js**: Data visualization
- **Socket.io Client**: Real-time communication
- **Framer Motion**: Animations

### Backend (Server)
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **MongoDB**: Database
- **Mongoose**: ODM
- **JWT**: Authentication
- **Socket.io**: Real-time communication
- **Redis**: Caching
- **Winston**: Logging
- **Joi**: Validation
- **Multer**: File uploads
- **OpenAI**: LLM integration
- **Twilio**: SMS/WhatsApp integration
- **Stripe**: Payment processing

## Getting Started

### Prerequisites
- Node.js >= 16.0.0
- MongoDB
- Redis (optional, for caching)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd chatbot
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd server
   npm install
   
   # Install frontend dependencies
   cd ../client
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Backend environment variables
   cd server
   cp .env.example .env
   # Edit .env with your configuration
   
   # Frontend environment variables
   cd ../client
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development servers**
   ```bash
   # Start backend server (from server directory)
   npm run dev
   
   # Start frontend server (from client directory)
   npm start
   ```

### Environment Variables

#### Backend (.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/chatbot
JWT_SECRET=your-jwt-secret
OPENAI_API_KEY=your-openai-api-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
STRIPE_SECRET_KEY=your-stripe-secret
REDIS_URL=redis://localhost:6379
```

#### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000
REACT_APP_ENVIRONMENT=development
```

## API Documentation

The API documentation is available at `/api-docs` when the server is running.

## Testing

```bash
# Backend tests
cd server
npm test

# Frontend tests
cd client
npm test
```

## Deployment

### Backend Deployment
1. Set production environment variables
2. Build the application: `npm run build`
3. Start the server: `npm start`

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy the `build` folder to your hosting service

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.
