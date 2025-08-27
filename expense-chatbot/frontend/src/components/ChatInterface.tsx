import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Avatar,
  Chip,
  Card,
  CardContent,
  IconButton,
} from '@mui/material';
import {
  Send as SendIcon,
  Person as PersonIcon,
  SmartToy as BotIcon,
  TrendingUp as TrendingUpIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { chatAPI } from '../services/api';
import { ChatMessage } from '../types';
import { format } from 'date-fns';
import { useAuth } from '../hooks/useAuth';

interface ChatInterfaceProps {
  onExpenseAdded?: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onExpenseAdded }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Load chat history on mount
    loadChatHistory();
    
    // Add welcome message
    if (user) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        message: '',
        response: `Hello ${user.name}! 👋 I'm your expense tracking assistant. You can tell me about your expenses in natural language like "I spent ₹500 on dinner" or ask me about your spending patterns like "How much did I spend on food this month?"`,
        timestamp: new Date().toISOString(),
        isUser: false,
        intent: 'greeting',
      };
      setMessages([welcomeMessage]);
    }
  }, [user]);

  const loadChatHistory = async () => {
    try {
      const response = await chatAPI.getChatHistory();
      if (response.success && response.chatHistory) {
        const formattedMessages: ChatMessage[] = response.chatHistory.map((chat, index) => [
          {
            id: `user-${index}`,
            message: chat.message,
            response: '',
            timestamp: chat.timestamp,
            isUser: true,
          },
          {
            id: `bot-${index}`,
            message: '',
            response: chat.response,
            timestamp: chat.timestamp,
            isUser: false,
          }
        ]).flat();
        
        setMessages(prev => [...prev, ...formattedMessages]);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      message: inputMessage,
      response: '',
      timestamp: new Date().toISOString(),
      isUser: true,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError('');

    try {
      const response = await chatAPI.sendMessage(inputMessage);
      
      if (response.success) {
        const botMessage: ChatMessage = {
          id: `bot-${Date.now()}`,
          message: '',
          response: response.response || 'I received your message!',
          timestamp: new Date().toISOString(),
          isUser: false,
          intent: response.intent,
          confidence: response.confidence,
          data: response.data,
        };

        setMessages(prev => [...prev, botMessage]);

        // If an expense was added, notify parent component
        if (response.intent === 'add_expense' && response.data?.expense && onExpenseAdded) {
          onExpenseAdded();
        }
      } else {
        throw new Error(response.message || 'Failed to send message');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || error.message || 'Failed to send message');
      
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        message: '',
        response: "Sorry, I couldn't process your message right now. Please try again.",
        timestamp: new Date().toISOString(),
        isUser: false,
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const renderMessageContent = (message: ChatMessage) => {
    if (message.data && message.intent === 'add_expense' && message.data.expense) {
      const expense = message.data.expense;
      return (
        <Box>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {message.response}
          </Typography>
          <Card variant="outlined" sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
            <CardContent sx={{ py: 1 }}>
              <Box display="flex" alignItems="center" gap={1}>
                <ReceiptIcon fontSize="small" />
                <Typography variant="body2">
                  <strong>₹{expense.amount}</strong> • {expense.category}
                </Typography>
              </Box>
              {expense.description && (
                <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                  {expense.description}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Box>
      );
    }

    if (message.data && message.intent === 'query_expense') {
      return (
        <Box>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {message.response}
          </Typography>
          {message.data.topCategories && (
            <Card variant="outlined" sx={{ bgcolor: 'info.light', color: 'info.contrastText' }}>
              <CardContent sx={{ py: 1 }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <TrendingUpIcon fontSize="small" />
                  <Typography variant="body2" fontWeight="bold">
                    Spending Breakdown
                  </Typography>
                </Box>
                {message.data.topCategories.map(([category, amount]: [string, number], index: number) => (
                  <Typography key={category} variant="caption" display="block">
                    {index + 1}. {category}: ₹{amount.toLocaleString()}
                  </Typography>
                ))}
              </CardContent>
            </Card>
          )}
        </Box>
      );
    }

    return (
      <Typography variant="body1">
        {message.response || message.message}
      </Typography>
    );
  };

  const quickActions = [
    "I spent ₹500 on dinner",
    "How much did I spend on food this month?",
    "Show my top categories",
    "What's my total spending?",
  ];

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Messages Container */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {messages.map((message) => (
          <Box
            key={message.id}
            display="flex"
            justifyContent={message.isUser ? 'flex-end' : 'flex-start'}
            gap={1}
          >
            {!message.isUser && (
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <BotIcon />
              </Avatar>
            )}
            
            <Paper
              elevation={1}
              sx={{
                p: 2,
                maxWidth: '70%',
                bgcolor: message.isUser ? 'primary.main' : 'grey.100',
                color: message.isUser ? 'primary.contrastText' : 'text.primary',
              }}
            >
              {renderMessageContent(message)}
              
              <Typography
                variant="caption"
                display="block"
                sx={{
                  mt: 1,
                  opacity: 0.7,
                  fontSize: '0.75rem',
                }}
              >
                {format(new Date(message.timestamp), 'HH:mm')}
                {message.confidence && (
                  <Chip
                    label={`${(message.confidence * 100).toFixed(0)}%`}
                    size="small"
                    variant="outlined"
                    sx={{ ml: 1, height: 16, fontSize: '0.6rem' }}
                  />
                )}
              </Typography>
            </Paper>
            
            {message.isUser && (
              <Avatar sx={{ bgcolor: 'secondary.main' }}>
                <PersonIcon />
              </Avatar>
            )}
          </Box>
        ))}
        
        {isLoading && (
          <Box display="flex" justifyContent="flex-start" gap={1}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <BotIcon />
            </Avatar>
            <Paper elevation={1} sx={{ p: 2, bgcolor: 'grey.100' }}>
              <Box display="flex" alignItems="center" gap={1}>
                <CircularProgress size={16} />
                <Typography variant="body2">Typing...</Typography>
              </Box>
            </Paper>
          </Box>
        )}
        
        <div ref={messagesEndRef} />
      </Box>

      {/* Quick Actions */}
      {messages.length <= 1 && (
        <Box sx={{ p: 2, pt: 0 }}>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Quick actions:
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {quickActions.map((action) => (
              <Chip
                key={action}
                label={action}
                variant="outlined"
                size="small"
                clickable
                onClick={() => setInputMessage(action)}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Error Display */}
      {error && (
        <Box sx={{ p: 2, pt: 0 }}>
          <Alert severity="error" onClose={() => setError('')}>
            {error}
          </Alert>
        </Box>
      )}

      {/* Input Area */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Box display="flex" gap={1}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="Tell me about your expense or ask about your spending..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            variant="outlined"
            size="small"
          />
          <IconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            sx={{ alignSelf: 'flex-end' }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default ChatInterface;