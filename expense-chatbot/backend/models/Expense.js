const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  date: {
    type: Date,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'bank_transfer', 'other'],
    default: 'other'
  },
  tags: [{
    type: String,
    trim: true
  }],
  people: [{
    type: String,
    trim: true
  }],
  location: {
    type: String,
    trim: true
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
      default: 'monthly'
    },
    interval: {
      type: Number,
      default: 1,
      min: 1
    },
    endDate: Date
  },
  addedVia: {
    type: String,
    enum: ['chat', 'manual', 'import'],
    default: 'chat'
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 1
  },
  originalMessage: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
expenseSchema.index({ userId: 1, date: -1 });
expenseSchema.index({ userId: 1, category: 1 });
expenseSchema.index({ userId: 1, createdAt: -1 });

// Pre-save middleware to extract additional information
expenseSchema.pre('save', function(next) {
  // Auto-generate tags from description
  if (this.description && this.tags.length === 0) {
    const words = this.description.toLowerCase().split(' ');
    this.tags = words.filter(word => word.length > 3);
  }
  
  next();
});

// Method to check if expense is duplicate
expenseSchema.methods.isDuplicate = async function() {
  const timeRange = 5 * 60 * 1000; // 5 minutes
  const amountRange = 0.01; // 1 paisa
  
  const duplicates = await this.constructor.find({
    userId: this.userId,
    amount: { 
      $gte: this.amount - amountRange, 
      $lte: this.amount + amountRange 
    },
    category: this.category,
    createdAt: {
      $gte: new Date(this.createdAt.getTime() - timeRange),
      $lte: new Date(this.createdAt.getTime() + timeRange)
    },
    _id: { $ne: this._id }
  });
  
  return duplicates.length > 0;
};

// Static method to get spending insights
expenseSchema.statics.getSpendingInsights = async function(userId, startDate, endDate) {
  const pipeline = [
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$category',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$amount' }
      }
    },
    {
      $sort: { totalAmount: -1 }
    }
  ];
  
  return this.aggregate(pipeline);
};

module.exports = mongoose.model('Expense', expenseSchema);