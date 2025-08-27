export interface User {
  id: string;
  email: string;
  name: string;
  preferences: {
    currency: string;
    categories: string[];
    defaultCategory: string;
  };
}

export interface Expense {
  _id: string;
  userId: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  paymentMethod: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'other';
  tags: string[];
  people: string[];
  location?: string;
  isRecurring: boolean;
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: string;
  };
  addedVia: 'chat' | 'manual' | 'import';
  confidence: number;
  originalMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  message: string;
  response: string;
  timestamp: string;
  isUser: boolean;
  intent?: string;
  confidence?: number;
  data?: any;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface ExpenseFilters {
  category?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SpendingSummary {
  totalAmount: number;
  totalTransactions: number;
  avgDailySpending: number;
  avgTransactionAmount: number;
}

export interface CategoryBreakdown {
  [category: string]: {
    amount: number;
    count: number;
    percentage: number;
  };
}

export interface AnalyticsData {
  period: {
    type: string;
    startDate: string;
    endDate: string;
    label: string;
  };
  summary: SpendingSummary;
  categoryBreakdown: CategoryBreakdown;
  dailySpending: { [date: string]: number };
  topSpendingDays: Array<{
    date: string;
    amount: number;
    formattedDate: string;
  }>;
}

export interface Insight {
  type: 'warning' | 'success' | 'info' | 'tip' | 'projection';
  title: string;
  message: string;
  icon: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  token?: string;
  user?: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}