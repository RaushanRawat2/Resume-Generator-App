import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
  Chip,
  Alert,
  LinearProgress,
  Divider,
} from '@mui/material';
import {
  AccountCircle as AccountIcon,
  Logout as LogoutIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Receipt as ReceiptIcon,
  Category as CategoryIcon,
  Insights as InsightsIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { analyticsAPI } from '../services/api';
import { AnalyticsData, Insight } from '../types';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import ChatInterface from './ChatInterface';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [analyticsResponse, insightsResponse] = await Promise.all([
        analyticsAPI.getSummary('month'),
        analyticsAPI.getInsights(),
      ]);

      if (analyticsResponse.success && analyticsResponse.data) {
        setAnalyticsData(analyticsResponse.data);
      }

      if (insightsResponse.success && insightsResponse.data) {
        setInsights(insightsResponse.data.insights);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
  };

  const formatCurrency = (amount: number) => {
    return `${user?.preferences.currency || '₹'}${amount.toLocaleString()}`;
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning': return '⚠️';
      case 'success': return '🎉';
      case 'info': return '📊';
      case 'tip': return '💡';
      case 'projection': return '🔮';
      default: return '💰';
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'warning': return 'warning';
      case 'success': return 'success';
      case 'info': return 'info';
      case 'tip': return 'primary';
      case 'projection': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="h5" fontWeight="bold">
          💰 Expense Chatbot
        </Typography>
        
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton color="inherit" onClick={handleRefresh} disabled={refreshing}>
            <RefreshIcon sx={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          </IconButton>
          
          <Button
            color="inherit"
            startIcon={<AccountIcon />}
            onClick={handleMenuOpen}
          >
            {user?.name}
          </Button>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        <Grid container sx={{ height: '100%' }}>
          {/* Left Panel - Analytics */}
          <Grid item xs={12} md={4}>
            <Box sx={{ height: '100%', overflow: 'auto', p: 2 }}>
              {loading && <LinearProgress sx={{ mb: 2 }} />}
              
              {/* Monthly Summary */}
              {analyticsData && (
                <Card sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      📅 {analyticsData.period.label}
                    </Typography>
                    
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <ReceiptIcon color="primary" />
                      <Typography variant="h4" color="primary.main">
                        {formatCurrency(analyticsData.summary.totalAmount)}
                      </Typography>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {analyticsData.summary.totalTransactions} transactions
                    </Typography>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Avg Daily
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(analyticsData.summary.avgDailySpending)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Avg Transaction
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(analyticsData.summary.avgTransactionAmount)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              )}

              {/* Top Categories */}
              {analyticsData && (
                <Card sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      📊 Top Categories
                    </Typography>
                    
                    {Object.entries(analyticsData.categoryBreakdown)
                      .sort(([,a], [,b]) => b.amount - a.amount)
                      .slice(0, 5)
                      .map(([category, data]) => (
                        <Box key={category} sx={{ mb: 2 }}>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2">{category}</Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {formatCurrency(data.amount)}
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={data.percentage}
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {data.percentage.toFixed(1)}% • {data.count} transactions
                          </Typography>
                        </Box>
                      ))}
                  </CardContent>
                </Card>
              )}

              {/* Insights */}
              {insights.length > 0 && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      💡 Smart Insights
                    </Typography>
                    
                    {insights.map((insight, index) => (
                      <Alert
                        key={index}
                        severity={getInsightColor(insight.type) as any}
                        icon={<span style={{ fontSize: '1.2em' }}>{getInsightIcon(insight.type)}</span>}
                        sx={{ mb: 1 }}
                      >
                        <Typography variant="subtitle2" fontWeight="bold">
                          {insight.title}
                        </Typography>
                        <Typography variant="body2">
                          {insight.message}
                        </Typography>
                      </Alert>
                    ))}
                  </CardContent>
                </Card>
              )}
            </Box>
          </Grid>

          {/* Right Panel - Chat Interface */}
          <Grid item xs={12} md={8}>
            <Box
              sx={{
                height: '100%',
                borderLeft: { md: 1 },
                borderColor: 'divider',
              }}
            >
              <ChatInterface onExpenseAdded={handleRefresh} />
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default Dashboard;