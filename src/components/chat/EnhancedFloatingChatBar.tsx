/**
 * Enhanced Floating Chat Bar with OpenAI Integration
 * Replaces the mock chat with real AI functionality
 */

import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Send, Mic, Paperclip, MessageCircle, X, Clock, Bot } from 'lucide-react';
import { perfectCardShadow } from '../../lib/utils';
import { useSendChatMessageMutation } from '../../services/openaiApi';
import type { ChatMessage as OpenAIChatMessage } from '../../services/openaiApi';

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isError?: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messages: ChatMessage[];
}

interface EnhancedFloatingChatBarProps {
  onSendMessage?: (message: string) => void;
  placeholder?: string;
  context?: string;
}

const EnhancedFloatingChatBar: React.FC<EnhancedFloatingChatBarProps> = ({
  onSendMessage,
  placeholder = 'Ask War Room about your campaign...',
  context
}) => {
  const [message, setMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [chatState, setChatState] = useState<'history' | 'chat' | 'closed'>('closed');
  const [activeChat, setActiveChat] = useState<ChatSession | null>(null);
  const [currentMessages, setCurrentMessages] = useState<ChatMessage[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const expandedRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // OpenAI chat mutation
  const [sendChatMessage, { isLoading: isAIThinking }] = useSendChatMessageMutation();

  // Mock chat history data (keep for chat history functionality)
  const [chatHistory] = useState<ChatSession[]>([
    {
      id: '1',
      title: 'District 3 Polling Analysis',
      lastMessage: 'Latest polling shows 8% increase in favorability...',
      timestamp: new Date(Date.now() - 86400000), // 1 day ago
      messages: [
        {
          id: '1-1',
          text: 'How are we performing in District 3?',
          isUser: true,
          timestamp: new Date(Date.now() - 86400000),
        },
        {
          id: '1-2',
          text: 'District 3 polling shows 8% increase in favorability with strong voter engagement across suburban areas. Consider increasing digital ad spend in this region.',
          isUser: false,
          timestamp: new Date(Date.now() - 86400000 + 60000),
        },
      ],
    },
    {
      id: '2',
      title: 'Healthcare Messaging Strategy',
      lastMessage: 'I recommend focusing on policy specifics...',
      timestamp: new Date(Date.now() - 172800000), // 2 days ago
      messages: [
        {
          id: '2-1',
          text: 'What messaging strategy should we use for healthcare policy?',
          isUser: true,
          timestamp: new Date(Date.now() - 172800000),
        },
        {
          id: '2-2',
          text: 'I recommend focusing on policy specifics and testimonials to build voter trust. Your healthcare messaging is resonating well with key demographics based on sentiment analysis.',
          isUser: false,
          timestamp: new Date(Date.now() - 172800000 + 120000),
        },
      ],
    },
    {
      id: '3',
      title: 'Crisis Response Strategy',
      lastMessage: 'Monitoring shows no immediate threats...',
      timestamp: new Date(Date.now() - 259200000), // 3 days ago
      messages: [
        {
          id: '3-1',
          text: 'Any potential crisis situations I should be aware of?',
          isUser: true,
          timestamp: new Date(Date.now() - 259200000),
        },
        {
          id: '3-2',
          text: 'Current monitoring shows no immediate threats detected. Social media sentiment remains stable with positive trending indicators. I\'ll alert you if anything changes.',
          isUser: false,
          timestamp: new Date(Date.now() - 259200000 + 90000),
        },
      ],
    },
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isAIThinking) {
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        text: message.trim(),
        isUser: true,
        timestamp: new Date(),
      };

      // Add user message immediately
      setCurrentMessages((prev) => [...prev, userMessage]);
      setChatState('chat');
      setIsExpanded(true);
      
      // Call the provided callback if exists
      if (onSendMessage) {
        onSendMessage(message.trim());
      }

      const userMessageText = message.trim();
      setMessage('');

      try {
        // Send message to OpenAI
        const aiResponse = await sendChatMessage({
          message: userMessageText,
          context: context || window.location.pathname
        }).unwrap();

        // Add AI response
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: aiResponse,
          isUser: false,
          timestamp: new Date(),
        };
        setCurrentMessages((prev) => [...prev, aiMessage]);

      } catch (error) {
        // Add error message
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: 'Sorry, I encountered an error processing your request. Please try again.',
          isUser: false,
          timestamp: new Date(),
          isError: true,
        };
        setCurrentMessages((prev) => [...prev, errorMessage]);
        console.error('Chat error:', error);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const toggleChatHistory = () => {
    if (chatState === 'history') {
      setChatState('closed');
      setIsExpanded(false);
    } else {
      setChatState('history');
      setIsExpanded(true);
      setActiveChat(null);
    }
  };

  const openChat = (chat: ChatSession) => {
    setActiveChat(chat);
    setCurrentMessages(chat.messages);
    setChatState('chat');
  };

  const startNewChat = () => {
    setActiveChat(null);
    setCurrentMessages([]);
    setChatState('chat');
    setIsExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return 'Today';
    }
    if (diffInDays === 1) {
      return 'Yesterday';
    }
    if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    }
    return date.toLocaleDateString();
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isExpanded &&
        expandedRef.current &&
        !expandedRef.current.contains(event.target as Node)
      ) {
        setIsExpanded(false);
        setChatState('closed');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  useEffect(() => {
    if (isExpanded && chatState === 'chat') {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isExpanded, chatState]);

  return (
    <div className="max-w-4xl mx-auto">
      <div
        ref={expandedRef}
        className={`bg-white/20 backdrop-blur-xl rounded-2xl border border-white/40 animate-in slide-in-from-bottom-5 fade-in duration-400 ${
          isExpanded ? 'pb-0' : ''
        }`}
        style={{ boxShadow: perfectCardShadow }}
      >
        {/* Chat Window Content - rendered above input when expanded */}
        {isExpanded && (
          <div
            className={`bg-white/10 backdrop-blur-xl rounded-t-2xl overflow-hidden border-b border-white/20 ${
              chatState === 'history' ? 'h-[400px]' : 'min-h-[400px] max-h-[50vh]'
            }`}
          >
            {/* Chat History State */}
            {chatState === 'history' && (
              <div className="flex flex-col h-full">
                <div className="p-3 border-b border-gray-200/50 flex items-center justify-between">
                  <h3 className="text-gray-800 font-medium flex items-center text-sm">
                    <Clock className="w-4 h-4 mr-2" />
                    Recent Conversations
                  </h3>
                  <button
                    onClick={startNewChat}
                    className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-lg transition-colors duration-200"
                  >
                    New Chat
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-3 scroll-fade-subtle">
                  <div className="space-y-2">
                    {chatHistory.map((chat) => (
                      <button
                        key={chat.id}
                        onClick={() => openChat(chat)}
                        className="w-full p-2.5 bg-white/60 hover:bg-white/80 rounded-lg border border-gray-200/50 hover:border-gray-300/50 transition-all duration-200 text-left hover:scale-[1.01]"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="text-gray-800 font-medium text-sm">{chat.title}</h4>
                          <span className="text-gray-500 text-xs">
                            {formatTime(chat.timestamp)}
                          </span>
                        </div>
                        <p className="text-gray-600 text-xs line-clamp-2">{chat.lastMessage}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Active Chat State */}
            {chatState === 'chat' && (
              <div className="flex flex-col h-full">
                {/* Chat Header */}
                <div className="p-3 border-b border-gray-200/50 bg-white/50 flex items-center justify-between">
                  <h3 className="text-gray-800 font-medium text-sm flex items-center">
                    <Bot className="w-4 h-4 mr-2 text-blue-500" />
                    {activeChat ? activeChat.title : 'War Room AI Assistant'}
                  </h3>
                  {!activeChat && (
                    <span className="text-xs text-gray-500 bg-green-100 px-2 py-1 rounded">
                      Live AI • OpenAI GPT-4
                    </span>
                  )}
                </div>

                {/* Messages Area */}
                <div className="flex-1 p-3 overflow-y-auto scroll-fade-subtle">
                  <div className="space-y-3">
                    {currentMessages.length === 0 && !activeChat && (
                      <div className="text-center text-gray-500 text-sm py-8">
                        <Bot className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                        <p>Start a conversation with War Room AI</p>
                        <p className="text-xs mt-1">Ask about campaign strategy, intelligence, or crisis management</p>
                      </div>
                    )}
                    
                    {currentMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] px-4 py-3 text-sm leading-relaxed ${
                            msg.isUser 
                              ? 'bg-blue-500 text-white rounded-l-2xl rounded-tr-2xl rounded-br-md' 
                              : msg.isError
                              ? 'bg-red-100 text-red-800 rounded-r-2xl rounded-tl-2xl rounded-bl-md border border-red-200'
                              : 'bg-gray-100 text-gray-800 rounded-r-2xl rounded-tl-2xl rounded-bl-md'
                          }`}
                        >
                          {msg.text}
                          <div className="text-xs opacity-70 mt-1">
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* AI Thinking Indicator */}
                    {isAIThinking && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 p-4 rounded-r-2xl rounded-tl-2xl rounded-bl-md max-w-[75%]">
                          <div className="flex items-center space-x-2">
                            <Bot className="w-4 h-4 text-blue-500" />
                            <span className="text-sm text-gray-600">War Room AI is thinking...</span>
                          </div>
                          <div className="flex space-x-1 mt-2">
                            <div
                              className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"
                              style={{ animationDelay: '0ms' }}
                            />
                            <div
                              className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"
                              style={{ animationDelay: '200ms' }}
                            />
                            <div
                              className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"
                              style={{ animationDelay: '400ms' }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Input Bar - always rendered at bottom of container */}
        <form onSubmit={handleSubmit} className="flex items-center p-3">
          {/* Chat History Button with Tooltip */}
          <div className="relative group">
            <button
              type="button"
              onClick={toggleChatHistory}
              className={`p-1.5 rounded-xl transition-all duration-200 mr-2 ${
                chatState === 'history'
                  ? 'text-white bg-white/20'
                  : 'text-white hover:text-gray-200 hover:bg-white/20'
              }`}
            >
              <MessageCircle className="w-5 h-5" />
            </button>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
              Chat History
            </div>
          </div>

          {/* Input Field */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isAIThinking}
              placeholder={isAIThinking ? 'AI is thinking...' : placeholder}
              className="w-full bg-white/70 text-gray-600 placeholder-gray-500 rounded-xl px-4 py-3 pr-12 border border-white/50 focus:border-white/70 focus:outline-none focus:ring-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            />

            {/* AI Indicator */}
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className={`w-2 h-2 rounded-full ${isAIThinking ? 'bg-blue-400 animate-pulse' : 'bg-green-400'}`} />
            </div>
          </div>

          {/* Action Buttons with Tooltips */}
          <div className="flex items-center space-x-1 ml-2">
            {/* Send Button */}
            <div className="relative group">
              <button
                type="submit"
                disabled={!message.trim() || isAIThinking}
                className={`p-1.5 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 ${
                  message.trim() && !isAIThinking
                    ? 'bg-white/80 text-gray-800 shadow-lg hover:bg-white'
                    : 'bg-white/30 text-white cursor-not-allowed'
                }`}
              >
                <Send className="w-5 h-5" />
              </button>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                Send Message
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnhancedFloatingChatBar;