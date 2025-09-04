import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Send, Mic, Paperclip, Sparkles, MessageCircle, X, Clock } from 'lucide-react';
import { perfectCardShadow } from '../lib/utils';
import { aiService } from '../services/aiService';
import { warRoomAI } from '../services/warRoomAIService';

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  suggestions?: string[];
}

interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messages: ChatMessage[];
}

interface FloatingChatBarProps {
  onSendMessage: (message: string) => void;
  placeholder?: string;
}

// Component to format AI messages with natural flow and mixed content
const FormattedMessage: React.FC<{ content: string }> = ({ content }) => {
  // Split by line breaks and process intelligently for natural flow
  const lines = content.split('\n').filter(line => line.trim() !== '');
  const elements: React.ReactNode[] = [];
  
  let currentParagraphLines: string[] = [];
  let currentBulletGroup: string[] = [];
  
  const flushParagraph = () => {
    if (currentParagraphLines.length > 0) {
      const paragraphText = currentParagraphLines.join(' ');
      elements.push(
        <div key={`para-${elements.length}`} className="leading-relaxed mb-2">
          {paragraphText}
        </div>
      );
      currentParagraphLines = [];
    }
  };
  
  const flushBullets = () => {
    if (currentBulletGroup.length > 0) {
      elements.push(
        <div key={`bullets-${elements.length}`} className="space-y-1 mb-3">
          {currentBulletGroup.map((bullet, idx) => (
            <div key={idx} className="flex items-start gap-2 ml-2">
              <span className="text-blue-600 font-medium mt-0.5">•</span>
              <span className="text-gray-700 flex-1">{bullet.substring(1).trim()}</span>
            </div>
          ))}
        </div>
      );
      currentBulletGroup = [];
    }
  };
  
  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    // Handle headers (lines ending with :)
    if (trimmedLine.endsWith(':') && !trimmedLine.startsWith('•')) {
      flushParagraph();
      flushBullets();
      elements.push(
        <div key={`header-${index}`} className="font-semibold text-gray-900 mt-4 mb-2 first:mt-0">
          {trimmedLine}
        </div>
      );
      return;
    }
    
    // Handle bullet points - group them together
    if (trimmedLine.startsWith('•')) {
      flushParagraph();
      currentBulletGroup.push(trimmedLine);
      return;
    }
    
    // Handle ASCII visual elements (preserve monospace)
    if (trimmedLine.includes('█') || trimmedLine.includes('━') || trimmedLine.includes('▓')) {
      flushParagraph();
      flushBullets();
      elements.push(
        <div key={`ascii-${index}`} className="font-mono text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded border-l-4 border-blue-200 my-2">
          {trimmedLine}
        </div>
      );
      return;
    }
    
    // Handle empty lines as paragraph breaks
    if (trimmedLine === '') {
      flushParagraph();
      flushBullets();
      return;
    }
    
    // Regular text - accumulate for paragraph grouping
    flushBullets(); // End any bullet group before starting paragraph
    
    currentParagraphLines.push(trimmedLine);
    
    // If this line ends a complete thought, flush the paragraph
    const isEndOfThought = /[.!?]$/.test(trimmedLine);
    if (isEndOfThought) {
      flushParagraph();
    }
  });
  
  // Flush any remaining content
  flushParagraph();
  flushBullets();
  
  return (
    <div className="space-y-0">
      {elements}
    </div>
  );
};

const FloatingChatBar: React.FC<FloatingChatBarProps> = ({
  onSendMessage,
  placeholder = 'Tell me about...',
}) => {
  const [message, setMessage] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [chatState, setChatState] = useState<'history' | 'chat' | 'closed'>('closed');
  const [activeChat, setActiveChat] = useState<ChatSession | null>(null);
  const [currentMessages, setCurrentMessages] = useState<ChatMessage[]>([]);
  const [usedSuggestions, setUsedSuggestions] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);
  const expandedRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock chat history data
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
          text: 'District 3 polling shows 8% increase in favorability with strong voter engagement across suburban areas.',
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
          text: 'I recommend focusing on policy specifics and testimonials to build voter trust.',
          isUser: false,
          timestamp: new Date(Date.now() - 172800000 + 120000),
        },
      ],
    },
    {
      id: '3',
      title: 'Opposition Research Summary',
      lastMessage: 'Analysis shows 3 key vulnerabilities...',
      timestamp: new Date(Date.now() - 259200000), // 3 days ago
      messages: [
        {
          id: '3-1',
          text: "Can you analyze the opposition's weak points?",
          isUser: true,
          timestamp: new Date(Date.now() - 259200000),
        },
        {
          id: '3-2',
          text: 'Analysis shows 3 key vulnerabilities in their healthcare stance that we can leverage.',
          isUser: false,
          timestamp: new Date(Date.now() - 259200000 + 90000),
        },
      ],
    },
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      // Add user message
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        text: message.trim(),
        isUser: true,
        timestamp: new Date(),
      };

      setCurrentMessages((prev) => [...prev, userMessage]);
      setChatState('chat');
      setIsExpanded(true);
      setIsTyping(true);
      onSendMessage(message.trim());
      
      const userQuery = message.trim();
      setMessage('');

      // Get AI response
      try {
        const aiResponse = await aiService.processMessage(userQuery);
        
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: aiResponse.message || "I apologize, but I'm unable to process your request at this time.",
          isUser: false,
          timestamp: new Date(),
          suggestions: getContextualSuggestions(userQuery, aiResponse.message),
        };
        
        setCurrentMessages((prev) => [...prev, aiMessage]);
      } catch (error) {
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: "I'm experiencing technical difficulties. Please try again in a moment.",
          isUser: false,
          timestamp: new Date(),
        };
        
        setCurrentMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsTyping(false);
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

  // Initialize War Room AI services on component mount
  useEffect(() => {
    warRoomAI.initialize().then(() => {
      const status = warRoomAI.getStatus();
      console.log('🤖 War Room AI Status:', status);
    });
  }, []);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (messagesEndRef.current && chatState === 'chat') {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, [currentMessages, isTyping, chatState]);

  const getContextualSuggestions = (userQuery: string, aiResponse: string): string[] => {
    const query = userQuery.toLowerCase();
    const response = aiResponse.toLowerCase();
    
    // Don't always show suggestions - only about 70% of the time
    if (Math.random() < 0.3) {
      return [];
    }
    
    let suggestions: string[] = [];
    
    // Generate contextual suggestions based on the topic
    if (query.includes('map') || response.includes('map') || response.includes('district') || response.includes('reach') || response.includes('regional')) {
      // If AI is asking about regional details, provide regional options
      if (response.includes('regional metric') || response.includes('which region') || response.includes('regional') && response.includes('details')) {
        suggestions = [
          'Texas performance',
          'Florida metrics', 
          'California data',
          'Pennsylvania trends',
          'All regional comparison'
        ];
      } else {
        suggestions = [
          'District-by-district breakdown',
          'What\'s driving the decline?',
          'Targeted outreach plan',
          'Voter turnout analysis',
          'Regional performance gaps'
        ];
      }
    } else if (query.includes('polling') || query.includes('sentiment') || response.includes('approval')) {
      suggestions = [
        'Demographic breakdowns',
        'Key swing voters',
        'Messaging impact analysis',
        'Polling trend analysis',
        'Voter sentiment deep-dive'
      ];
    } else if (query.includes('fundraising') || response.includes('funding') || response.includes('donation')) {
      suggestions = [
        'Fundraising trends',
        'Top donor segments',
        'Fundraising strategies',
        'Donor retention analysis',
        'Fundraising goal tracking'
      ];
    } else if (query.includes('social') || query.includes('media') || response.includes('engagement')) {
      suggestions = [
        'Engagement metrics',
        'Viral content analysis',
        'Content strategy',
        'Social media reach',
        'Platform performance'
      ];
    } else {
      // Default suggestions for general queries
      suggestions = [
        'Latest data overview',
        'Compare to previous period',
        'Next action items',
        'Weekly performance summary',
        'Key insights analysis'
      ];
    }
    
    // Filter out used suggestions
    const availableSuggestions = suggestions.filter(suggestion => !usedSuggestions.has(suggestion));
    
    // If we're running low on suggestions, reset the used ones (keep it fresh)
    if (availableSuggestions.length < 2) {
      setUsedSuggestions(new Set());
      return suggestions.slice(0, 3);
    }
    
    // Return up to 3 unused suggestions
    return availableSuggestions.slice(0, 3);
  };

  return (
    <div className="max-w-5xl mx-auto">
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
            className="bg-white/10 backdrop-blur-xl rounded-t-2xl border-b border-white/20 h-[400px] overflow-hidden"
          >
            {/* Chat History State */}
            {chatState === 'history' && (
              <div className="flex flex-col h-full">
                <div className="p-3 border-b border-gray-200/50">
                  <h3 className="text-gray-800 font-medium flex items-center text-sm">
                    <Clock className="w-4 h-4 mr-2" />
                    Recent Conversations
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto overscroll-contain p-3" style={{ scrollbarWidth: 'thin' }}>
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
                {activeChat && (
                  <div className="p-3 border-b border-gray-200/50 bg-white/50">
                    <h3 className="text-gray-800 font-medium text-sm">{activeChat.title}</h3>
                  </div>
                )}

                {/* Messages Area */}
                <div className="flex-1 p-4 overflow-y-auto overscroll-contain" style={{ scrollbarWidth: 'thin' }}>
                  <div className="space-y-4">
                    {currentMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex flex-col max-w-[85%] ${msg.isUser ? 'items-end' : 'items-start'}`}>
                          <div
                            className={`px-4 py-3 text-sm leading-relaxed break-words ${
                              msg.isUser 
                                ? 'bg-blue-500 text-white rounded-l-2xl rounded-tr-2xl rounded-br-md' 
                                : 'bg-white/90 text-gray-800 rounded-r-2xl rounded-tl-2xl rounded-bl-md border border-gray-200/50'
                            }`}
                          >
                            {msg.isUser ? (
                              msg.text
                            ) : (
                              <FormattedMessage content={msg.text} />
                            )}
                          </div>
                          
                          {/* Follow-up Suggestions for AI Messages */}
                          {!msg.isUser && msg.suggestions && msg.suggestions.length > 0 && (
                            <div className="mt-2 flex gap-1.5 overflow-x-auto scrollbar-hide">
                              <div className="flex gap-1.5 flex-nowrap">
                                {msg.suggestions.map((suggestion, index) => (
                                  <button
                                    key={index}
                                    onClick={() => {
                                      setUsedSuggestions(prev => new Set(prev).add(suggestion));
                                      setMessage(suggestion);
                                      setTimeout(() => {
                                        const form = document.querySelector('form');
                                        if (form) {
                                          form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                                        }
                                      }, 100);
                                    }}
                                    className="px-3 py-1.5 bg-gray-500/30 hover:bg-gray-500/40 text-white text-sm rounded-md transition-colors duration-200 whitespace-nowrap flex-shrink-0 tracking-wide"
                                  >
                                    {suggestion}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* AI Thinking Indicator */}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <div className="flex space-x-1">
                              <div
                                className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
                                style={{ animationDelay: '0ms' }}
                              />
                              <div
                                className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
                                style={{ animationDelay: '200ms' }}
                              />
                              <div
                                className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
                                style={{ animationDelay: '400ms' }}
                              />
                            </div>
                            <span className="text-blue-600 text-sm font-medium">War Room AI is analyzing...</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Scroll target for auto-scroll */}
                    <div ref={messagesEndRef} />

                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* NotebookLM-Style Chat Bar */}
        <div className="p-2.5">
          {/* Input Bar - Taller and More Prominent */}
          <form onSubmit={handleSubmit} className="flex items-center mb-3">
            {/* Chat History Button */}
            <div className="relative group">
              <button
                type="button"
                onClick={toggleChatHistory}
                className={`p-2 rounded-xl transition-all duration-200 mr-3 ${
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

            {/* NotebookLM-Style Input Field Container */}
            <div className="flex-1 relative">
              {/* Integrated Input + Suggestions Container */}
              <div className="bg-white/70 rounded-xl border border-white/50 focus-within:border-white/70 transition-all duration-200 min-h-[4rem] flex flex-col">
                {/* Input Area */}
                <div className="flex-1 px-3 pt-2 pb-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      setShowSuggestions(e.target.value.length === 0 || e.target.value === 'Tell me about ');
                    }}
                    onKeyPress={handleKeyPress}
                    onKeyDown={(e) => {
                      // Handle backspace deletion of placeholder text
                      if (e.key === 'Backspace' && message === 'Tell me about ') {
                        e.preventDefault();
                        setMessage('');
                        setShowSuggestions(true);
                      }
                    }}
                    onFocus={() => {
                      if (!isExpanded) {
                        setIsExpanded(true);
                        setChatState('chat');
                      }
                      setShowSuggestions(message.length === 0 || message === 'Tell me about ');
                    }}
                    onClick={() => {
                      if (message === '' && inputRef.current) {
                        setMessage('Tell me about ');
                        setShowSuggestions(true);
                        setTimeout(() => {
                          if (inputRef.current) {
                            inputRef.current.setSelectionRange(15, 15);
                          }
                        }, 0);
                      }
                    }}
                    placeholder={placeholder}
                    className="w-full bg-transparent text-gray-600 placeholder-gray-500 focus:outline-none text-base pr-8"
                  />
                </div>

                {/* Integrated Suggestions Within Input Container */}
                {showSuggestions && (message === '' || message === 'Tell me about ') && (
                  <div className="px-3 pb-2">
                    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                      <div className="flex gap-1.5 flex-nowrap">
                        {[
                          "the fundraising trends",
                          "suburban voter patterns", 
                          "recent polling shifts"
                        ].map((suggestion) => (
                          <button
                            key={suggestion}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              const fullSuggestion = `Tell me about ${suggestion}`;
                              setUsedSuggestions(prev => new Set(prev).add(fullSuggestion));
                              setMessage(fullSuggestion);
                              setShowSuggestions(false);
                              setTimeout(() => {
                                const form = document.querySelector('form');
                                if (form) {
                                  form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                                }
                              }, 100);
                            }}
                            className="px-3 py-1.5 bg-gray-500/30 hover:bg-gray-500/40 text-white text-sm rounded-md transition-colors duration-200 whitespace-nowrap flex-shrink-0 tracking-wide"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* AI Indicator */}
              <div className="absolute right-4 top-4">
                <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-1.5 ml-2">
              {/* Attachment Button */}
              <div className="relative group">
                <button
                  type="button"
                  className="p-2 rounded-xl text-white hover:text-gray-200 hover:bg-white/20 transition-all duration-200"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                  Attach File
                </div>
              </div>

              {/* Voice Button */}
              <div className="relative group">
                <button
                  type="button"
                  className="p-2 rounded-xl text-white hover:text-gray-200 hover:bg-white/20 transition-all duration-200"
                >
                  <Mic className="w-5 h-5" />
                </button>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                  Voice Input
                </div>
              </div>

              {/* Send Button */}
              <div className="relative group">
                <button
                  type="submit"
                  disabled={!message.trim()}
                  className={`p-2 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 ${
                    message.trim()
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
    </div>
  );
};

export default FloatingChatBar;