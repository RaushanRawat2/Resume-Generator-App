const express = require('express');
const authMiddleware = require('../middleware/auth');
const Expense = require('../models/Expense');
const { 
  startOfMonth, 
  endOfMonth, 
  subMonths, 
  format, 
  parseISO,
  startOfYear,
  endOfYear
} = require('date-fns');

const router = express.Router();

// Get spending summary
router.get('/summary', authMiddleware, async (req, res) => {
  try {
    const { period = 'month', year, month } = req.query;
    
    let startDate, endDate;
    const now = new Date();
    
    if (period === 'month') {
      if (year && month) {
        startDate = startOfMonth(new Date(year, month - 1, 1));
        endDate = endOfMonth(new Date(year, month - 1, 1));
      } else {
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
      }
    } else if (period === 'year') {
      if (year) {
        startDate = startOfYear(new Date(year, 0, 1));
        endDate = endOfYear(new Date(year, 0, 1));
      } else {
        startDate = startOfYear(now);
        endDate = endOfYear(now);
      }
    } else {
      // Default to current month
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
    }

    // Get expenses for the period
    const expenses = await Expense.find({
      userId: req.user._id,
      date: { $gte: startDate, $lte: endDate }
    });

    // Calculate totals
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalTransactions = expenses.length;

    // Category breakdown
    const categoryBreakdown = expenses.reduce((acc, expense) => {
      if (!acc[expense.category]) {
        acc[expense.category] = {
          amount: 0,
          count: 0,
          percentage: 0
        };
      }
      acc[expense.category].amount += expense.amount;
      acc[expense.category].count += 1;
      return acc;
    }, {});

    // Calculate percentages
    Object.keys(categoryBreakdown).forEach(category => {
      categoryBreakdown[category].percentage = 
        totalAmount > 0 ? (categoryBreakdown[category].amount / totalAmount) * 100 : 0;
    });

    // Get daily spending
    const dailySpending = expenses.reduce((acc, expense) => {
      const day = format(expense.date, 'yyyy-MM-dd');
      acc[day] = (acc[day] || 0) + expense.amount;
      return acc;
    }, {});

    // Top spending days
    const topSpendingDays = Object.entries(dailySpending)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    // Average daily spending
    const daysInPeriod = Object.keys(dailySpending).length;
    const avgDailySpending = daysInPeriod > 0 ? totalAmount / daysInPeriod : 0;

    res.json({
      success: true,
      data: {
        period: {
          type: period,
          startDate,
          endDate,
          label: format(startDate, 'MMM yyyy')
        },
        summary: {
          totalAmount,
          totalTransactions,
          avgDailySpending,
          avgTransactionAmount: totalTransactions > 0 ? totalAmount / totalTransactions : 0
        },
        categoryBreakdown,
        dailySpending,
        topSpendingDays: topSpendingDays.map(([date, amount]) => ({
          date,
          amount,
          formattedDate: format(parseISO(date), 'MMM dd')
        }))
      }
    });
  } catch (error) {
    console.error('Analytics summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating analytics summary'
    });
  }
});

// Get trends over time
router.get('/trends', authMiddleware, async (req, res) => {
  try {
    const { months = 6 } = req.query;
    const now = new Date();
    
    const trends = [];
    
    for (let i = parseInt(months) - 1; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const startDate = startOfMonth(monthDate);
      const endDate = endOfMonth(monthDate);
      
      const monthExpenses = await Expense.find({
        userId: req.user._id,
        date: { $gte: startDate, $lte: endDate }
      });
      
      const totalAmount = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const totalTransactions = monthExpenses.length;
      
      // Category breakdown for this month
      const categoryBreakdown = monthExpenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
      }, {});
      
      trends.push({
        month: format(monthDate, 'MMM yyyy'),
        year: monthDate.getFullYear(),
        monthNumber: monthDate.getMonth() + 1,
        totalAmount,
        totalTransactions,
        avgTransactionAmount: totalTransactions > 0 ? totalAmount / totalTransactions : 0,
        categoryBreakdown
      });
    }

    // Calculate month-over-month growth
    for (let i = 1; i < trends.length; i++) {
      const current = trends[i].totalAmount;
      const previous = trends[i - 1].totalAmount;
      trends[i].growthRate = previous > 0 ? ((current - previous) / previous) * 100 : 0;
    }

    res.json({
      success: true,
      data: {
        trends,
        period: `${months} months`
      }
    });
  } catch (error) {
    console.error('Analytics trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating trends analysis'
    });
  }
});

// Get top categories
router.get('/top-categories', authMiddleware, async (req, res) => {
  try {
    const { period = 'month', limit = 10 } = req.query;
    
    let startDate, endDate;
    const now = new Date();
    
    if (period === 'month') {
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
    } else if (period === 'year') {
      startDate = startOfYear(now);
      endDate = endOfYear(now);
    } else if (period === 'all') {
      startDate = new Date(0); // Beginning of time
      endDate = now;
    }

    const pipeline = [
      {
        $match: {
          userId: req.user._id,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' },
          lastExpense: { $max: '$date' }
        }
      },
      {
        $sort: { totalAmount: -1 }
      },
      {
        $limit: parseInt(limit)
      }
    ];

    const topCategories = await Expense.aggregate(pipeline);

    res.json({
      success: true,
      data: {
        categories: topCategories.map(category => ({
          name: category._id,
          totalAmount: category.totalAmount,
          count: category.count,
          avgAmount: category.avgAmount,
          lastExpense: category.lastExpense
        })),
        period,
        startDate,
        endDate
      }
    });
  } catch (error) {
    console.error('Top categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching top categories'
    });
  }
});

// Get spending insights
router.get('/insights', authMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    // Current month expenses
    const currentMonthExpenses = await Expense.find({
      userId: req.user._id,
      date: { $gte: currentMonthStart, $lte: currentMonthEnd }
    });

    // Last month expenses
    const lastMonthExpenses = await Expense.find({
      userId: req.user._id,
      date: { $gte: lastMonthStart, $lte: lastMonthEnd }
    });

    const currentTotal = currentMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const lastTotal = lastMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Calculate insights
    const insights = [];

    // Spending comparison
    if (lastTotal > 0) {
      const change = ((currentTotal - lastTotal) / lastTotal) * 100;
      if (change > 10) {
        insights.push({
          type: 'warning',
          title: 'Spending Alert',
          message: `Your spending this month is ${change.toFixed(1)}% higher than last month.`,
          icon: '⚠️'
        });
      } else if (change < -10) {
        insights.push({
          type: 'success',
          title: 'Great Savings',
          message: `You've saved ${Math.abs(change).toFixed(1)}% compared to last month!`,
          icon: '🎉'
        });
      }
    }

    // Top category this month
    const categoryTotals = currentMonthExpenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {});

    const topCategory = Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)[0];

    if (topCategory) {
      const percentage = (topCategory[1] / currentTotal) * 100;
      insights.push({
        type: 'info',
        title: 'Top Spending Category',
        message: `${topCategory[0]} accounts for ${percentage.toFixed(1)}% of your spending this month (₹${topCategory[1].toLocaleString()}).`,
        icon: '📊'
      });
    }

    // Frequent small expenses
    const smallExpenses = currentMonthExpenses.filter(exp => exp.amount < 100);
    if (smallExpenses.length > 10) {
      const smallTotal = smallExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      insights.push({
        type: 'tip',
        title: 'Small Expenses Add Up',
        message: `You made ${smallExpenses.length} small purchases (<₹100) totaling ₹${smallTotal.toLocaleString()}.`,
        icon: '💡'
      });
    }

    // Budget suggestions
    const avgDailySpending = currentTotal / new Date().getDate();
    const projectedMonthly = avgDailySpending * 30;
    
    insights.push({
      type: 'projection',
      title: 'Monthly Projection',
      message: `Based on your current spending, you're on track to spend ₹${projectedMonthly.toLocaleString()} this month.`,
      icon: '🔮'
    });

    res.json({
      success: true,
      data: {
        insights,
        currentMonthTotal: currentTotal,
        lastMonthTotal: lastTotal,
        monthOverMonthChange: lastTotal > 0 ? ((currentTotal - lastTotal) / lastTotal) * 100 : 0,
        averageDailySpending: avgDailySpending
      }
    });
  } catch (error) {
    console.error('Insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating insights'
    });
  }
});

module.exports = router;