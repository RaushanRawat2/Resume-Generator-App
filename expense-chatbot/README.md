# 💰 Expense Chatbot - MERN Stack AI-Powered Expense Tracker

A conversational expense tracking application built with the MERN stack that allows users to track expenses through natural language conversations with an AI chatbot.

## 🌟 Features

### 🤖 Conversational Interface
- Natural language expense input: *"I spent ₹500 on dinner with friends"*
- AI-powered intent classification and entity extraction
- Chat-style UI with WhatsApp-like experience
- Smart expense categorization
- Duplicate detection and prevention

### 📊 Smart Analytics
- Real-time spending insights
- Category-wise breakdown
- Monthly trends and comparisons
- AI-generated spending recommendations
- Top spending categories and patterns

### 🎯 Key Capabilities
- **Add Expenses**: "I paid ₹200 for uber", "Movie ticket cost ₹250"
- **Query Spending**: "How much did I spend on food this month?", "Show my top 3 categories"
- **Auto-categorization**: Automatically detects Food, Transport, Shopping, Entertainment, etc.
- **People Extraction**: Identifies who you spent with
- **Date Recognition**: Supports "yesterday", "last week", "last month"

## 🏗️ Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Natural** & **Compromise** for NLP
- **OpenAI API** integration ready
- **JWT** authentication
- **bcryptjs** for password hashing

### Frontend
- **React 18** with TypeScript
- **Material-UI (MUI)** for components
- **React Router Dom** for navigation
- **Axios** for API calls
- **React Hook Form** for form handling
- **date-fns** for date manipulation

### AI/NLP Features
- Intent classification (Add Expense vs Query)
- Entity extraction (amount, category, people, dates)
- Confidence scoring
- Duplicate detection
- Smart category mapping

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd expense-chatbot
```

2. **Backend Setup**
```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Edit .env with your MongoDB URI and other configs

# Start the backend server
npm run dev
```

3. **Frontend Setup**
```bash
cd frontend
npm install

# Start the frontend development server
npm start
```

4. **Start MongoDB**
```bash
# If using local MongoDB
mongod

# Or use MongoDB Atlas (cloud)
# Update MONGODB_URI in backend/.env
```

### Environment Variables

**Backend (.env)**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/expense-chatbot
JWT_SECRET=your_jwt_secret_here
OPENAI_API_KEY=your_openai_key_here (optional)
NODE_ENV=development
```

**Frontend (.env)**
```env
REACT_APP_API_URL=http://localhost:5000/api
```

## 📱 Usage Examples

### Adding Expenses
```
User: "I spent ₹500 on dinner at a restaurant"
Bot: "✅ Got it! Added ₹500 to Food & Dining with note: dinner at a restaurant."

User: "Paid ₹200 for uber ride"
Bot: "✅ Added ₹200 to Transportation with note: uber ride."
```

### Querying Expenses
```
User: "How much did I spend on food this month?"
Bot: "You spent ₹3,200 on Food & Dining this month."

User: "Show my top 3 spending categories"
Bot: "Your top spending categories:
1. Food & Dining: ₹3,200
2. Transportation: ₹2,500
3. Shopping: ₹1,800"
```

## 🏛️ Architecture

### Backend Structure
```
backend/
├── models/          # MongoDB schemas
│   ├── User.js      # User model with preferences
│   └── Expense.js   # Expense model with analytics
├── routes/          # API routes
│   ├── auth.js      # Authentication routes
│   ├── expenses.js  # CRUD operations
│   ├── chat.js      # Chat interface
│   └── analytics.js # Analytics and insights
├── controllers/     # Business logic
├── middleware/      # Auth and validation
├── utils/           # Helper functions
│   └── nlpProcessor.js # NLP processing logic
└── server.js        # Express server setup
```

### Frontend Structure
```
frontend/
├── src/
│   ├── components/  # Reusable components
│   │   ├── ChatInterface.tsx
│   │   └── Dashboard.tsx
│   ├── pages/       # Page components
│   │   ├── Login.tsx
│   │   └── Register.tsx
│   ├── hooks/       # Custom hooks
│   │   └── useAuth.tsx
│   ├── services/    # API calls
│   │   └── api.ts
│   ├── types/       # TypeScript types
│   └── App.tsx      # Main app component
```

## 🤖 AI/NLP Implementation

### Intent Classification
The system uses a Naive Bayes classifier to identify:
- **add_expense**: Adding new expenses
- **query_expense**: Querying spending data
- **greeting**: General conversation
- **help**: Requesting assistance

### Entity Extraction
- **Amount**: ₹500, 500, Rs 500
- **Category**: Food, Transportation, Shopping, etc.
- **People**: "with John", "with friends"
- **Dates**: "yesterday", "last month", specific dates
- **Description**: Additional context

### Smart Features
- **Duplicate Detection**: Prevents similar expenses within 5 minutes
- **Confidence Scoring**: Shows AI confidence in classifications
- **Auto-categorization**: Maps keywords to expense categories
- **Context Understanding**: Handles incomplete or ambiguous inputs

## 📊 Analytics Features

### Spending Insights
- Monthly spending summaries
- Category-wise breakdowns
- Daily spending patterns
- Month-over-month comparisons

### Smart Recommendations
- Spending alerts (when exceeding trends)
- Savings congratulations
- Budget projections
- Small expense accumulation warnings

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- Input validation and sanitization
- Rate limiting
- CORS protection
- Helmet for security headers

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 🚀 Deployment

### Backend (Node.js)
- Deploy to Heroku, Railway, or DigitalOcean
- Set up MongoDB Atlas for production
- Configure environment variables
- Enable HTTPS

### Frontend (React)
- Deploy to Vercel, Netlify, or AWS S3
- Update API URLs for production
- Configure build settings

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 API Documentation

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Chat Interface
- `POST /api/chat/message` - Send chat message
- `GET /api/chat/history` - Get chat history

### Expenses
- `GET /api/expenses` - Get user expenses
- `POST /api/expenses` - Create expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense

### Analytics
- `GET /api/analytics/summary` - Spending summary
- `GET /api/analytics/trends` - Spending trends
- `GET /api/analytics/insights` - AI insights

## 🎯 Future Enhancements

- [ ] Voice input support
- [ ] Receipt scanning with OCR
- [ ] Budget setting and alerts
- [ ] Expense sharing with friends
- [ ] Bank account integration
- [ ] Mobile app development
- [ ] Advanced ML models
- [ ] Multi-language support

## 📄 License

MIT License - see LICENSE file for details

## 👥 Team

Built as a hackathon project demonstrating MERN stack + AI capabilities for conversational expense tracking.

---

**🎉 Happy Expense Tracking!** 💰✨