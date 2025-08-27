const mongoose = require('mongoose');
const User = require('../models/User');
const Expense = require('../models/Expense');
require('dotenv').config();

const sampleExpenses = [
  {
    amount: 500,
    category: 'Food & Dining',
    description: 'Dinner with friends at restaurant',
    people: ['John', 'Sarah'],
    addedVia: 'chat',
    originalMessage: 'I spent 500 on dinner with John and Sarah'
  },
  {
    amount: 200,
    category: 'Transportation',
    description: 'Uber ride to office',
    addedVia: 'chat',
    originalMessage: 'Paid 200 for uber'
  },
  {
    amount: 1500,
    category: 'Shopping',
    description: 'Bought new clothes',
    addedVia: 'manual'
  },
  {
    amount: 250,
    category: 'Entertainment',
    description: 'Movie tickets',
    addedVia: 'chat',
    originalMessage: 'Movie cost 250'
  },
  {
    amount: 800,
    category: 'Groceries',
    description: 'Weekly grocery shopping',
    addedVia: 'manual'
  },
  {
    amount: 300,
    category: 'Food & Dining',
    description: 'Coffee and snacks',
    addedVia: 'chat'
  },
  {
    amount: 150,
    category: 'Transportation',
    description: 'Bus fare',
    addedVia: 'manual'
  },
  {
    amount: 2000,
    category: 'Bills & Utilities',
    description: 'Electricity bill',
    addedVia: 'manual'
  },
  {
    amount: 600,
    category: 'Healthcare',
    description: 'Doctor consultation',
    addedVia: 'manual'
  },
  {
    amount: 1200,
    category: 'Education',
    description: 'Online course subscription',
    addedVia: 'manual'
  }
];

const seedDatabase = async () => {
  try {
    console.log('🌱 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('🗑️  Clearing existing data...');
    await Expense.deleteMany({});
    
    // Find or create a test user
    let testUser = await User.findOne({ email: 'test@example.com' });
    
    if (!testUser) {
      console.log('👤 Creating test user...');
      testUser = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123' // This will be hashed automatically
      });
      await testUser.save();
      console.log('✅ Test user created with email: test@example.com, password: password123');
    }
    
    console.log('💰 Seeding sample expenses...');
    
    const expenses = sampleExpenses.map(expense => ({
      ...expense,
      userId: testUser._id,
      date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
    }));
    
    await Expense.insertMany(expenses);
    
    console.log(`✅ Successfully seeded ${expenses.length} sample expenses`);
    console.log('🎉 Database seeding completed!');
    
    // Show summary
    const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    console.log(`📊 Total seeded amount: ₹${totalAmount.toLocaleString()}`);
    
    const categories = [...new Set(expenses.map(exp => exp.category))];
    console.log(`📂 Categories: ${categories.join(', ')}`);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the seeder
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;