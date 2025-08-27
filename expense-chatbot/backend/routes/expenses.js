const express = require('express');
const authMiddleware = require('../middleware/auth');
const Expense = require('../models/Expense');
const { parseISO, startOfMonth, endOfMonth } = require('date-fns');

const router = express.Router();

// Get all expenses for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      category, 
      startDate, 
      endDate,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = { userId: req.user._id };
    
    if (category) {
      query.category = category;
    }
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = parseISO(startDate);
      if (endDate) query.date.$lte = parseISO(endDate);
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const expenses = await Expense.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Expense.countDocuments(query);

    res.json({
      success: true,
      expenses,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching expenses'
    });
  }
});

// Get single expense
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    res.json({
      success: true,
      expense
    });
  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching expense'
    });
  }
});

// Create expense manually
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      amount,
      category,
      description,
      date,
      paymentMethod,
      tags,
      people,
      location
    } = req.body;

    // Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category is required'
      });
    }

    const expenseData = {
      userId: req.user._id,
      amount,
      category,
      description: description || '',
      date: date ? parseISO(date) : new Date(),
      paymentMethod: paymentMethod || 'other',
      tags: tags || [],
      people: people || [],
      location: location || '',
      addedVia: 'manual'
    };

    const expense = new Expense(expenseData);
    await expense.save();

    res.status(201).json({
      success: true,
      message: 'Expense created successfully',
      expense
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating expense'
    });
  }
});

// Update expense
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const {
      amount,
      category,
      description,
      date,
      paymentMethod,
      tags,
      people,
      location
    } = req.body;

    const expense = await Expense.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Update fields
    if (amount !== undefined) expense.amount = amount;
    if (category !== undefined) expense.category = category;
    if (description !== undefined) expense.description = description;
    if (date !== undefined) expense.date = parseISO(date);
    if (paymentMethod !== undefined) expense.paymentMethod = paymentMethod;
    if (tags !== undefined) expense.tags = tags;
    if (people !== undefined) expense.people = people;
    if (location !== undefined) expense.location = location;

    await expense.save();

    res.json({
      success: true,
      message: 'Expense updated successfully',
      expense
    });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating expense'
    });
  }
});

// Delete expense
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    res.json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting expense'
    });
  }
});

// Get categories for user
router.get('/data/categories', authMiddleware, async (req, res) => {
  try {
    const categories = await Expense.distinct('category', { userId: req.user._id });
    
    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories'
    });
  }
});

// Bulk import expenses
router.post('/bulk-import', authMiddleware, async (req, res) => {
  try {
    const { expenses } = req.body;

    if (!Array.isArray(expenses) || expenses.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of expenses'
      });
    }

    // Validate and prepare expenses
    const preparedExpenses = expenses.map(expense => ({
      ...expense,
      userId: req.user._id,
      addedVia: 'import',
      date: expense.date ? parseISO(expense.date) : new Date()
    }));

    const result = await Expense.insertMany(preparedExpenses);

    res.json({
      success: true,
      message: `Successfully imported ${result.length} expenses`,
      count: result.length
    });
  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({
      success: false,
      message: 'Error importing expenses'
    });
  }
});

module.exports = router;