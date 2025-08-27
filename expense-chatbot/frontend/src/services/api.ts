import axios from 'axios';
import { 
  LoginCredentials, 
  RegisterCredentials, 
  ApiResponse, 
  User, 
  Expense,
  ExpenseFilters,
  AnalyticsData,
  Insight
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<ApiResponse<{ user: User; token: string }>> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  register: async (credentials: RegisterCredentials): Promise<ApiResponse<{ user: User; token: string }>> => {
    const response = await api.post('/auth/register', credentials);
    return response.data;
  },

  getMe: async (): Promise<ApiResponse<{ user: User }>> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updatePreferences: async (preferences: Partial<User['preferences']>): Promise<ApiResponse<{ user: User }>> => {
    const response = await api.put('/auth/preferences', preferences);
    return response.data;
  },
};

// Chat API
export const chatAPI = {
  sendMessage: async (message: string): Promise<ApiResponse<{
    response: string;
    data?: any;
    intent: string;
    confidence: number;
  }>> => {
    const response = await api.post('/chat/message', { message });
    return response.data;
  },

  getChatHistory: async (): Promise<ApiResponse<{
    chatHistory: Array<{
      message: string;
      response: string;
      timestamp: string;
    }>;
  }>> => {
    const response = await api.get('/chat/history');
    return response.data;
  },
};

// Expenses API
export const expensesAPI = {
  getExpenses: async (filters?: ExpenseFilters): Promise<ApiResponse<{
    expenses: Expense[];
    pagination: {
      total: number;
      page: number;
      pages: number;
      limit: number;
    };
  }>> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    const response = await api.get(`/expenses?${params.toString()}`);
    return response.data;
  },

  getExpense: async (id: string): Promise<ApiResponse<{ expense: Expense }>> => {
    const response = await api.get(`/expenses/${id}`);
    return response.data;
  },

  createExpense: async (expense: Partial<Expense>): Promise<ApiResponse<{ expense: Expense }>> => {
    const response = await api.post('/expenses', expense);
    return response.data;
  },

  updateExpense: async (id: string, expense: Partial<Expense>): Promise<ApiResponse<{ expense: Expense }>> => {
    const response = await api.put(`/expenses/${id}`, expense);
    return response.data;
  },

  deleteExpense: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete(`/expenses/${id}`);
    return response.data;
  },

  getCategories: async (): Promise<ApiResponse<{ categories: string[] }>> => {
    const response = await api.get('/expenses/data/categories');
    return response.data;
  },

  bulkImport: async (expenses: Partial<Expense>[]): Promise<ApiResponse<{ count: number }>> => {
    const response = await api.post('/expenses/bulk-import', { expenses });
    return response.data;
  },
};

// Analytics API
export const analyticsAPI = {
  getSummary: async (period?: string, year?: number, month?: number): Promise<ApiResponse<AnalyticsData>> => {
    const params = new URLSearchParams();
    if (period) params.append('period', period);
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());
    
    const response = await api.get(`/analytics/summary?${params.toString()}`);
    return response.data;
  },

  getTrends: async (months?: number): Promise<ApiResponse<{
    trends: Array<{
      month: string;
      year: number;
      monthNumber: number;
      totalAmount: number;
      totalTransactions: number;
      avgTransactionAmount: number;
      categoryBreakdown: { [category: string]: number };
      growthRate?: number;
    }>;
    period: string;
  }>> => {
    const params = new URLSearchParams();
    if (months) params.append('months', months.toString());
    
    const response = await api.get(`/analytics/trends?${params.toString()}`);
    return response.data;
  },

  getTopCategories: async (period?: string, limit?: number): Promise<ApiResponse<{
    categories: Array<{
      name: string;
      totalAmount: number;
      count: number;
      avgAmount: number;
      lastExpense: string;
    }>;
    period: string;
    startDate: string;
    endDate: string;
  }>> => {
    const params = new URLSearchParams();
    if (period) params.append('period', period);
    if (limit) params.append('limit', limit.toString());
    
    const response = await api.get(`/analytics/top-categories?${params.toString()}`);
    return response.data;
  },

  getInsights: async (): Promise<ApiResponse<{
    insights: Insight[];
    currentMonthTotal: number;
    lastMonthTotal: number;
    monthOverMonthChange: number;
    averageDailySpending: number;
  }>> => {
    const response = await api.get('/analytics/insights');
    return response.data;
  },
};

export default api;