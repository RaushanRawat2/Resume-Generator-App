const express = require('express');
const authMiddleware = require('../middleware/auth');
const nlpProcessor = require('../utils/nlpProcessor');
const Expense = require('../models/Expense');
const User = require('../models/User');
const { format, parseISO } = require('date-fns');

const router = express.Router();

// Chat endpoint - main conversational interface
router.post('/message', authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a message'
      });
    }

    // Process the message using NLP
    const processedData = nlpProcessor.processMessage(message);
    
    let response = '';
    let data = null;

    switch (processedData.intent) {
      case 'add_expense':
        const result = await handleAddExpense(req.user, processedData);
        response = result.response;
        data = result.data;
        break;
        
      case 'query_expense':
        const queryResult = await handleQueryExpense(req.user, processedData);
        response = queryResult.response;
        data = queryResult.data;
        break;
        
      case 'greeting':
        response = getGreetingResponse(req.user.name);
        break;
        
      case 'help':
        response = getHelpResponse();
        break;
        
      default:
        response = getDefaultResponse();
    }

    // Save chat history
    await User.findByIdAndUpdate(req.user._id, {
      $push: {
        chatHistory: {
          message: message.trim(),
          response,
          timestamp: new Date()
        }
      }
    });

    res.json({
      success: true,
      response,
      data,
      intent: processedData.intent,
      confidence: processedData.confidence
    });

  } catch (error) {
    console.error('Chat message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing your message. Please try again.'
    });
  }
});

// Handle adding expense
async function handleAddExpense(user, processedData) {
  try {
    const { amount, category, description, date, people, originalMessage } = processedData;
    
    // Validation
    if (!amount || amount <= 0) {
      return {
        response: "I couldn't find a valid amount in your message. Could you please specify how much you spent? For example: 'I spent ₹500 on dinner'",
        data: null
      };
    }

    // Create expense object
    const expenseData = {
      userId: user._id,
      amount,
      category: category || user.preferences.defaultCategory,
      description: description || `${category} expense`,
      date: date || new Date(),
      people: people || [],
      addedVia: 'chat',
      confidence: processedData.confidence,
      originalMessage
    };

    // Create new expense
    const expense = new Expense(expenseData);
    
    // Check for duplicates
    const isDuplicate = await expense.isDuplicate();
    if (isDuplicate) {
      return {
        response: `It looks like you already added a similar expense recently. Do you want me to add this ₹${amount} ${category} expense anyway?`,
        data: { expense: expenseData, warning: 'duplicate' }
      };
    }

    await expense.save();

    // Format response
    let response = `✅ Got it! Added ₹${amount} to ${category}`;
    if (description && description !== `${category} expense`) {
      response += ` with note: ${description}`;
    }
    if (people.length > 0) {
      response += ` (with ${people.join(', ')})`;
    }
    response += '.';

    return {
      response,
      data: { expense }
    };

  } catch (error) {
    console.error('Add expense error:', error);
    return {
      response: "Sorry, I couldn't add that expense. Please try again.",
      data: null
    };
  }
}

// Handle expense queries
async function handleQueryExpense(user, processedData) {
  try {
    const { category, timeRange } = processedData;
    const { startDate, endDate } = timeRange;

    // Build query
    const query = { userId: user._id };
    
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }
    
    if (category && category !== 'Others') {
      query.category = category;
    }

    // Get expenses
    const expenses = await Expense.find(query).sort({ date: -1 });
    
    if (expenses.length === 0) {
      let response = `You haven't recorded any expenses`;
      if (category && category !== 'Others') {
        response += ` in ${category}`;
      }
      response += ` for the specified period.`;
      
      return { response, data: { expenses: [] } };
    }

    // Calculate totals
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Get category breakdown
    const categoryBreakdown = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {});

    // Sort categories by amount
    const topCategories = Object.entries(categoryBreakdown)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);

    // Format response
    let response = '';
    
    if (category && category !== 'Others') {
      response = `You spent ₹${totalAmount.toLocaleString()} on ${category}`;
    } else if (processedData.originalMessage.toLowerCase().includes('top')) {
      response = `Your top spending categories:\n`;
      topCategories.forEach(([cat, amount], index) => {
        response += `${index + 1}. ${cat}: ₹${amount.toLocaleString()}\n`;
      });
    } else {
      response = `You spent a total of ₹${totalAmount.toLocaleString()}`;
    }
    
    // Add time period info
    const timeInfo = getTimePeriodDescription(startDate, endDate);
    if (timeInfo) {
      response += ` ${timeInfo}`;
    }
    
    response += '.';

    return {
      response,
      data: {
        expenses,
        totalAmount,
        categoryBreakdown,
        topCategories,
        timeRange: { startDate, endDate }
      }
    };

  } catch (error) {
    console.error('Query expense error:', error);
    return {
      response: "Sorry, I couldn't retrieve your expense data. Please try again.",
      data: null
    };
  }
}

function getTimePeriodDescription(startDate, endDate) {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Check if it's current month
  if (start.getMonth() === now.getMonth() && start.getFullYear() === now.getFullYear()) {
    return 'this month';
  }
  
  // Check if it's last month
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  if (start.getMonth() === lastMonth.getMonth() && start.getFullYear() === lastMonth.getFullYear()) {
    return 'last month';
  }
  
  // For other periods, format the date range
  return `from ${format(start, 'MMM dd')} to ${format(end, 'MMM dd')}`;
}

function getGreetingResponse(userName) {
  const greetings = [
    `Hello ${userName}! 👋 Ready to track your expenses? You can tell me things like "I spent ₹500 on dinner" or ask "How much did I spend on food this month?"`,
    `Hi ${userName}! 😊 I'm here to help you manage your expenses. Just tell me about your spending in natural language!`,
    `Hey ${userName}! 💰 Let's keep track of your expenses together. What would you like to add or know about your spending?`
  ];
  
  return greetings[Math.floor(Math.random() * greetings.length)];
}

function getHelpResponse() {
  return `I can help you track expenses in a conversational way! Here's what you can do:

📝 **Add Expenses:**
• "I spent ₹500 on dinner with friends"
• "Paid ₹200 for uber ride"
• "Movie ticket cost ₹250"

📊 **Check Spending:**
• "How much did I spend on food this month?"
• "Show my top 3 categories"
• "What's my total spending last month?"

💡 **Tips:**
• Just type naturally - I'll understand amounts, categories, and dates
• I can detect people you spent with and categorize automatically
• Ask me anything about your spending patterns!`;
}

function getDefaultResponse() {
  return `I'm not sure I understood that. You can:
• Tell me about an expense: "I spent ₹300 on groceries"
• Ask about your spending: "How much on food this month?"
• Type "help" for more examples

Try being more specific about amounts and what you spent on! 😊`;
}

// Get chat history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('chatHistory');
    
    res.json({
      success: true,
      chatHistory: user.chatHistory.reverse() // Latest first
    });
  } catch (error) {
    console.error('Chat history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching chat history'
    });
  }
});

module.exports = router;