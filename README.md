# WealthSense

A modern personal finance management web application built with React, TypeScript, and Firebase. Track your income, expenses, savings, and get AI-powered financial insights.

## Features

- **Dashboard**: Overview of your financial health with key metrics and visualizations
- **Transaction Management**: Add, view, and categorize income and expenses
- **Budget Tracking**: Set and monitor budgets for different spending categories
- **Reports & Analytics**: Visual reports using Recharts for spending patterns
- **Savings Progress**: Track your savings goals and monthly contributions
- **AI Insights**: Get intelligent financial advice powered by Google GenAI
- **Calendar View**: Visual calendar for tracking financial events
- **Document Management**: Store and manage important financial documents (Aadhaar, PAN, UPI)
- **Bank Account Tracking**: Manage multiple bank accounts with details
- **Receipt Management**: Upload and OCR-process receipts for expense tracking
- **Payment Methods**: Manage your payment methods (cards, UPI, bank transfers)
- **Notifications**: Stay updated with financial alerts and reminders
- **App Lock**: Secure your data with PIN protection
- **Dark Mode**: Beautiful dark mode support
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **Frontend**: React 19, TypeScript
- **Build Tool**: Vite 6
- **Routing**: React Router DOM 7
- **State Management**: React Context API
- **UI Components**: Custom components with Lucide React icons
- **Charts**: Recharts 3
- **Backend**: Firebase 12 (Authentication, Database, Storage)
- **AI**: Google GenAI 1.34
- **Styling**: Tailwind CSS (implied from class names)
- **Deployment**: Vercel

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Firebase account with a project created

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Ricky-1211/WealthSense.git
cd WealthSense
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with your Firebase configuration:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GOOGLE_GENAI_API_KEY=your_genai_api_key
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Building for Production

```bash
npm run build
```

The optimized build will be in the `dist` directory.

## Project Structure

```
WealthSense/
├── components/          # Reusable UI components
│   ├── AddTransactionModal.tsx
│   ├── BottomNav.tsx
│   ├── Navbar.tsx
│   ├── Sidebar.tsx
│   ├── StatCard.tsx
│   └── TransactionTable.tsx
├── context/            # React Context providers
│   └── AppContext.tsx
├── db/                 # Database utilities
├── hooks/              # Custom React hooks
│   └── useIsMobile.ts
├── pages/              # Page components
│   ├── AIServicePage.tsx
│   ├── AuthPage.tsx
│   ├── BudgetsPage.tsx
│   ├── Dashboard.tsx
│   ├── NotificationsPage.tsx
│   ├── ReportsPage.tsx
│   ├── SavingsProgressPage.tsx
│   ├── SettingsPage.tsx
│   ├── TrackingPage.tsx
│   ├── TransactionsPage.tsx
│   └── calder.tsx
├── services/           # API and business logic services
├── App.tsx             # Main app component with routing
├── index.tsx           # Entry point
├── types.ts            # TypeScript type definitions
└── vite.config.ts      # Vite configuration
```

## Key Features Explained

### Authentication
- Firebase Authentication for secure login/signup
- User profile management
- Session persistence

### Transaction Categories
- **Income**: Salary, Investment, Other
- **Expenses**: Food, Rent, Transport, Entertainment, Shopping, Health, Other

### Data Storage
- Firebase Firestore for real-time data sync
- Firebase Storage for document and receipt uploads
- Local storage for preferences and caching

### AI Insights
- Powered by Google GenAI
- Provides personalized financial advice
- Analyzes spending patterns and suggests improvements

## Deployment

This project is configured for Vercel deployment. The `vercel.json` file includes:

- Build command: `npm run build`
- Output directory: `dist`
- SPA routing with rewrites
- Asset caching headers

To deploy to Vercel:

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables
4. Deploy

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

### Adding New Features

1. Create components in `components/`
2. Create pages in `pages/`
3. Add routes in `App.tsx`
4. Update types in `types.ts` if needed
5. Add services in `services/` for business logic

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is private and proprietary.

## Support

For issues and questions, please open an issue in the repository.
