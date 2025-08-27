const natural = require('natural');
const compromise = require('compromise');
const { parseISO, subDays, subMonths, startOfMonth, endOfMonth, format } = require('date-fns');

class NLPProcessor {
  constructor() {
    this.classifier = new natural.BayesClassifier();
    this.stemmer = natural.PorterStemmer;
    this.tokenizer = new natural.WordTokenizer();
    
    // Train the classifier with intent examples
    this.trainClassifier();
    
    // Common categories and their keywords
    this.categoryKeywords = {
      'Food & Dining': ['food', 'dinner', 'lunch', 'breakfast', 'restaurant', 'cafe', 'pizza', 'burger', 'snacks', 'meal', 'eating', 'restaurant'],
      'Transportation': ['uber', 'taxi', 'bus', 'train', 'metro', 'auto', 'rickshaw', 'petrol', 'fuel', 'gas', 'travel', 'transport'],
      'Shopping': ['shopping', 'clothes', 'shoes', 'shirt', 'dress', 'amazon', 'flipkart', 'mall', 'store', 'purchase', 'buy', 'bought'],
      'Entertainment': ['movie', 'cinema', 'game', 'party', 'club', 'bar', 'concert', 'show', 'entertainment', 'fun'],
      'Bills & Utilities': ['electricity', 'water', 'gas', 'internet', 'phone', 'mobile', 'wifi', 'bill', 'utility', 'rent'],
      'Healthcare': ['doctor', 'hospital', 'medicine', 'pharmacy', 'medical', 'health', 'clinic', 'treatment'],
      'Groceries': ['grocery', 'vegetables', 'fruits', 'milk', 'bread', 'rice', 'dal', 'supermarket', 'market'],
      'Education': ['books', 'course', 'fees', 'school', 'college', 'university', 'education', 'learning'],
      'Travel': ['hotel', 'flight', 'trip', 'vacation', 'holiday', 'booking', 'accommodation'],
      'Others': []
    };
    
    this.currencySymbols = ['₹', '$', '€', '£', '¥'];
    this.amountPatterns = [
      /(\d+(?:\.\d{1,2})?)/g,
      /(?:₹|rs\.?|rupees?)\s*(\d+(?:\.\d{1,2})?)/gi,
      /(\d+(?:\.\d{1,2})?)\s*(?:₹|rs\.?|rupees?)/gi
    ];
  }

  trainClassifier() {
    // Training data for intent classification
    const trainingData = [
      // Add Expense Intent
      { text: 'I spent 500 on dinner', intent: 'add_expense' },
      { text: 'Paid 200 for uber', intent: 'add_expense' },
      { text: 'Bought groceries for 1500', intent: 'add_expense' },
      { text: 'Movie ticket cost 250', intent: 'add_expense' },
      { text: 'Added 100 rupees for coffee', intent: 'add_expense' },
      { text: 'Expense of 300 on shopping', intent: 'add_expense' },
      
      // Query Intent
      { text: 'How much did I spend on food', intent: 'query_expense' },
      { text: 'Show my expenses for last month', intent: 'query_expense' },
      { text: 'What is my total spending', intent: 'query_expense' },
      { text: 'Top categories this month', intent: 'query_expense' },
      { text: 'Monthly breakdown of expenses', intent: 'query_expense' },
      { text: 'How much on entertainment', intent: 'query_expense' },
      
      // General/Greeting Intent
      { text: 'Hello', intent: 'greeting' },
      { text: 'Hi there', intent: 'greeting' },
      { text: 'Good morning', intent: 'greeting' },
      { text: 'Help me', intent: 'help' },
      { text: 'What can you do', intent: 'help' }
    ];

    trainingData.forEach(item => {
      this.classifier.addDocument(item.text.toLowerCase(), item.intent);
    });

    this.classifier.train();
  }

  classifyIntent(message) {
    const intent = this.classifier.classify(message.toLowerCase());
    const confidence = this.classifier.getClassifications(message.toLowerCase());
    
    return {
      intent,
      confidence: confidence[0].value
    };
  }

  extractAmount(message) {
    let amount = null;
    
    for (const pattern of this.amountPatterns) {
      const matches = message.match(pattern);
      if (matches) {
        // Extract numeric value
        const numMatch = matches[0].match(/(\d+(?:\.\d{1,2})?)/);
        if (numMatch) {
          amount = parseFloat(numMatch[1]);
          break;
        }
      }
    }
    
    return amount;
  }

  extractCategory(message) {
    const lowerMessage = message.toLowerCase();
    let bestMatch = 'Others';
    let maxScore = 0;

    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      let score = 0;
      for (const keyword of keywords) {
        if (lowerMessage.includes(keyword.toLowerCase())) {
          score += 1;
        }
      }
      
      if (score > maxScore) {
        maxScore = score;
        bestMatch = category;
      }
    }

    return bestMatch;
  }

  extractPeople(message) {
    const doc = compromise(message);
    const people = doc.people().out('array');
    
    // Also look for common patterns like "with [name]"
    const withPattern = /with\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)/gi;
    const withMatches = message.match(withPattern);
    
    if (withMatches) {
      withMatches.forEach(match => {
        const name = match.replace(/with\s+/i, '').trim();
        if (!people.includes(name)) {
          people.push(name);
        }
      });
    }

    return people;
  }

  extractDate(message) {
    const doc = compromise(message);
    const dates = doc.dates().out('array');
    
    if (dates.length > 0) {
      // Try to parse the date
      try {
        return new Date(dates[0]);
      } catch (error) {
        return new Date(); // Default to today
      }
    }

    // Look for relative dates
    const lowerMessage = message.toLowerCase();
    const today = new Date();
    
    if (lowerMessage.includes('yesterday')) {
      return subDays(today, 1);
    } else if (lowerMessage.includes('today')) {
      return today;
    } else if (lowerMessage.includes('last week')) {
      return subDays(today, 7);
    } else if (lowerMessage.includes('last month')) {
      return subMonths(today, 1);
    }

    return today; // Default to today
  }

  extractTimeRange(message) {
    const lowerMessage = message.toLowerCase();
    const today = new Date();
    
    if (lowerMessage.includes('last month')) {
      const lastMonth = subMonths(today, 1);
      return {
        startDate: startOfMonth(lastMonth),
        endDate: endOfMonth(lastMonth)
      };
    } else if (lowerMessage.includes('this month')) {
      return {
        startDate: startOfMonth(today),
        endDate: endOfMonth(today)
      };
    } else if (lowerMessage.includes('last week')) {
      return {
        startDate: subDays(today, 7),
        endDate: today
      };
    } else if (lowerMessage.includes('today')) {
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);
      return {
        startDate: startOfDay,
        endDate: endOfDay
      };
    }

    // Default to last 30 days
    return {
      startDate: subDays(today, 30),
      endDate: today
    };
  }

  extractDescription(message, amount, category) {
    let description = message;
    
    // Remove amount references
    description = description.replace(/(\d+(?:\.\d{1,2})?)/g, '');
    description = description.replace(/(?:₹|rs\.?|rupees?)/gi, '');
    
    // Remove category references
    const categoryKeywords = this.categoryKeywords[category] || [];
    categoryKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      description = description.replace(regex, '');
    });
    
    // Remove common expense words
    const expenseWords = ['spent', 'paid', 'cost', 'expense', 'bought', 'purchase', 'for', 'on'];
    expenseWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      description = description.replace(regex, '');
    });
    
    // Clean up and trim
    description = description.replace(/\s+/g, ' ').trim();
    
    return description || `${category} expense`;
  }

  processMessage(message) {
    const { intent, confidence } = this.classifyIntent(message);
    
    const result = {
      intent,
      confidence,
      originalMessage: message
    };

    if (intent === 'add_expense') {
      result.amount = this.extractAmount(message);
      result.category = this.extractCategory(message);
      result.people = this.extractPeople(message);
      result.date = this.extractDate(message);
      result.description = this.extractDescription(message, result.amount, result.category);
    } else if (intent === 'query_expense') {
      result.category = this.extractCategory(message);
      result.timeRange = this.extractTimeRange(message);
    }

    return result;
  }
}

module.exports = new NLPProcessor();