# Chatbot Client

Frontend React application for the Chatbot Management System.

## Features

- **Super Admin Panel**: Manage companies and users across the platform
- **Company Admin Panel**: Dashboard, form builder, lead management, FAQ management
- **Widget System**: Embeddable chatbot widget for customer interactions
- **Analytics**: Comprehensive reporting and insights
- **Integrations**: Connect with external platforms (WhatsApp, Telegram, etc.)

## Tech Stack

- **React 18** with modern hooks and functional components
- **React Router v6** for navigation
- **Tailwind CSS** for styling
- **React Query** for data fetching and caching
- **React Hook Form** for form management
- **Chart.js** for data visualization
- **Heroicons** for icons
- **Framer Motion** for animations

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Update environment variables in `.env`:
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000
```

### Development

Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:3000`

### Building for Production

```bash
npm run build
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── common/         # Shared components (Header, Footer, Layout)
│   ├── super-admin/    # Super admin specific components
│   ├── company-admin/  # Company admin specific components
│   └── widget/         # Widget components
├── pages/              # Page components
│   ├── auth/          # Authentication pages
│   ├── super-admin/   # Super admin pages
│   ├── company-admin/ # Company admin pages
│   ├── analytics/     # Analytics pages
│   ├── integrations/  # Integration pages
│   └── widget/        # Widget pages
├── context/           # React context providers
├── hooks/             # Custom React hooks
├── utils/             # Utility functions
└── styles/            # CSS/SCSS files
```

## Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

## Authentication

The application uses JWT-based authentication with role-based access control:

- **Super Admin**: Full platform access
- **Company Admin**: Company-specific access
- **User**: Limited access based on permissions

## API Integration

The frontend communicates with the backend API through:

- RESTful endpoints for CRUD operations
- WebSocket connections for real-time features
- File uploads for media and documents

## Styling

The application uses Tailwind CSS with custom components and utilities:

- Responsive design with mobile-first approach
- Dark/light theme support (planned)
- Custom component classes for consistency
- Icon system using Heroicons

## State Management

- **React Query**: Server state management
- **React Context**: Global application state
- **Local State**: Component-specific state with useState/useReducer

## Performance

- Code splitting with React.lazy()
- Memoization with React.memo() and useMemo()
- Optimized re-renders with useCallback()
- Image optimization and lazy loading

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Follow the existing code style
2. Write meaningful commit messages
3. Test your changes thoroughly
4. Update documentation as needed

## License

MIT License - see LICENSE file for details
