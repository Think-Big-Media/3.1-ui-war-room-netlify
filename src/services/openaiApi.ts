/**
 * OpenAI API Service
 * Handles chat completions and AI assistant functionality for War Room
 */

import { baseApi } from './baseApi';
import { shouldUseMockData } from '../config/mockMode';

// Types for OpenAI chat functionality
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// System prompts for different contexts
const SYSTEM_PROMPTS = {
  campaign: `You are a strategic campaign advisor for political campaigns. You have access to real-time polling data, social media sentiment, advertising metrics, and voter intelligence. Provide actionable insights to help optimize campaign performance, messaging, and targeting strategies. Keep responses concise and strategic.`,
  
  intelligence: `You are an intelligence analyst specializing in political campaign intelligence. You analyze social media trends, opposition research, voter sentiment, and media coverage to provide strategic recommendations. Focus on actionable intelligence that can inform campaign decisions.`,
  
  crisis: `You are a crisis management advisor for political campaigns. You monitor for potential issues, analyze threat levels, and provide rapid response recommendations. Prioritize protecting campaign reputation while maintaining strategic momentum.`,
  
  general: `You are War Room AI, a comprehensive campaign intelligence assistant. You help political campaigns with strategy, intelligence analysis, crisis management, and performance optimization. Provide clear, actionable advice based on data and best practices.`
};

// Mock responses for different contexts
const MOCK_RESPONSES = {
  campaign: [
    "Based on current polling trends, I recommend increasing digital ad spend in suburban markets where we're seeing 12% growth in favorability ratings.",
    "Your healthcare messaging is resonating well with key demographics. Consider expanding this narrative across additional platforms.",
    "Opposition research shows vulnerabilities in their economic policy stance. This could be leveraged in upcoming debates.",
    "Social media sentiment analysis indicates strong positive response to your infrastructure proposals. Double down on this messaging."
  ],
  
  intelligence: [
    "Recent social media analysis shows emerging conversations around education policy in your district. This represents an opportunity to lead the narrative.",
    "Influencer engagement patterns suggest your environmental messaging is gaining traction with younger voter segments.",
    "Opposition research indicates their latest ad campaign is testing poorly in focus groups. Consider strategic counter-messaging.",
    "Trend analysis shows increasing voter concern about healthcare costs - align your messaging accordingly."
  ],
  
  crisis: [
    "No immediate threats detected. Current sentiment remains stable with positive trending indicators.",
    "Minor negative sentiment spike detected around recent policy statement. Recommend proactive clarification messaging.",
    "Opposition attack ad campaign launched. Deploying rapid response team with fact-check materials and counter-narrative.",
    "Social media monitoring shows potential story developing. Recommend getting ahead with transparent communication."
  ]
};

// Function to get appropriate system prompt based on page context
function getSystemPrompt(context?: string): string {
  const path = window.location.pathname.toLowerCase();
  
  if (path.includes('intelligence')) return SYSTEM_PROMPTS.intelligence;
  if (path.includes('alert') || path.includes('crisis')) return SYSTEM_PROMPTS.crisis;
  if (path.includes('campaign')) return SYSTEM_PROMPTS.campaign;
  
  return SYSTEM_PROMPTS.general;
}

// Function to get mock response based on context
function getMockResponse(context?: string): string {
  const path = window.location.pathname.toLowerCase();
  let responses = MOCK_RESPONSES.campaign;
  
  if (path.includes('intelligence')) responses = MOCK_RESPONSES.intelligence;
  else if (path.includes('alert') || path.includes('crisis')) responses = MOCK_RESPONSES.crisis;
  
  return responses[Math.floor(Math.random() * responses.length)];
}

// OpenAI Service Class
class OpenAIService {
  private apiKey: string | null = null;
  private baseURL = 'https://api.openai.com/v1';

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || null;
  }

  async chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    // Use mock data if no API key or in mock mode
    if (shouldUseMockData('openai') || !this.apiKey) {
      console.log('[OpenAI] Using mock response');
      
      const mockResponse: ChatCompletionResponse = {
        id: `chatcmpl-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: 'gpt-4',
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: getMockResponse()
          },
          finish_reason: 'stop'
        }],
        usage: {
          prompt_tokens: 50,
          completion_tokens: 30,
          total_tokens: 80
        }
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
      return mockResponse;
    }

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: request.model || 'gpt-4',
          messages: request.messages,
          temperature: request.temperature || 0.7,
          max_tokens: request.max_tokens || 500,
          ...request
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[OpenAI] API call failed:', error);
      // Fallback to mock response on error
      return this.chatCompletion({ ...request, model: 'mock' });
    }
  }

  async sendMessage(message: string, context?: string): Promise<string> {
    const systemPrompt = getSystemPrompt(context);
    
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ];

    const response = await this.chatCompletion({ messages });
    return response.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
  }

  async sendConversation(messages: ChatMessage[], context?: string): Promise<string> {
    const systemPrompt = getSystemPrompt(context);
    
    const fullMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    const response = await this.chatCompletion({ messages: fullMessages });
    return response.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
  }
}

// Singleton instance
export const openaiService = new OpenAIService();

/**
 * OpenAI RTK Query API endpoints
 */
export const openaiApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    sendChatMessage: builder.mutation<
      string,
      { message: string; context?: string }
    >({
      queryFn: async ({ message, context }) => {
        try {
          const response = await openaiService.sendMessage(message, context);
          return { data: response };
        } catch (error) {
          return { 
            error: { 
              status: 'CUSTOM_ERROR', 
              data: error instanceof Error ? error.message : 'Chat request failed'
            } 
          };
        }
      },
    }),

    sendChatConversation: builder.mutation<
      string,
      { messages: ChatMessage[]; context?: string }
    >({
      queryFn: async ({ messages, context }) => {
        try {
          const response = await openaiService.sendConversation(messages, context);
          return { data: response };
        } catch (error) {
          return { 
            error: { 
              status: 'CUSTOM_ERROR', 
              data: error instanceof Error ? error.message : 'Conversation request failed'
            } 
          };
        }
      },
    }),

    generateIntelligenceSummary: builder.mutation<
      string,
      { data: Record<string, any>; type: 'campaign' | 'intelligence' | 'crisis' }
    >({
      queryFn: async ({ data, type }) => {
        try {
          const prompt = `Analyze this ${type} data and provide a strategic summary: ${JSON.stringify(data)}`;
          const response = await openaiService.sendMessage(prompt, type);
          return { data: response };
        } catch (error) {
          return { 
            error: { 
              status: 'CUSTOM_ERROR', 
              data: error instanceof Error ? error.message : 'Analysis failed'
            } 
          };
        }
      },
    }),
  }),
});

export const {
  useSendChatMessageMutation,
  useSendChatConversationMutation,
  useGenerateIntelligenceSummaryMutation,
} = openaiApi;

export type { ChatMessage, ChatCompletionRequest, ChatCompletionResponse };