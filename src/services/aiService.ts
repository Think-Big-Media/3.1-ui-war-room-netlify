/**
 * AI Service for War Room Platform
 * Handles chat interactions with OpenAI integration, Pinecone context, and demo mode fallback
 */

import { pineconeService } from './pineconeService';

export interface AIResponse {
  success: boolean;
  message: string;
  error?: string;
}

class AIService {
  private apiKey: string | undefined;
  
  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  }

  /**
   * Check if AI service is properly configured
   */
  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.startsWith('sk-');
  }

  /**
   * Process a chat message with AI
   */
  async processMessage(message: string, context?: any): Promise<AIResponse> {
    console.log('🤖 [AI Service] Processing message:', message);
    
    // First, validate message content for professionalism
    const contentValidation = this.validateMessageContent(message);
    if (!contentValidation.isValid) {
      return {
        success: true,
        message: contentValidation.response
      };
    }
    
    // Try real OpenAI first if configured, fallback to demo mode
    if (this.isConfigured()) {
      try {
        return await this.getOpenAIResponse(message, context);
      } catch (error) {
        console.warn('OpenAI API failed, falling back to demo mode:', error);
        return this.getDemoResponse(message);
      }
    } else {
      console.log('No OpenAI API key configured, using demo mode');
      return this.getDemoResponse(message);
    }
  }

  /**
   * Validate message content for professionalism and campaign relevance
   */
  private validateMessageContent(message: string): { isValid: boolean; response: string } {
    const lowerMessage = message.toLowerCase().trim();
    
    // Define inappropriate content patterns
    const inappropriatePatterns = [
      /\b(fuck|shit|damn|bitch|asshole|bastard)\b/i,
      /\b(booze|alcohol|drunk|wasted|hammered)\b/i,
      /\b(sex|porn|nude|naked)\b/i,
      /\b(drugs|cocaine|weed|marijuana|heroin)\b/i,
    ];

    // Define potentially ambiguous terms that need clarification
    const ambiguousPatterns = [
      /\b(wine|beer|spirits|cocktail|bar)\b/i,  // Could be about policy or events
      /\b(grass|green|herb)\b/i,                // Could be about environmental policy
      /\b(party|parties)\b/i,                   // Could be about political parties
    ];

    // Check for clearly inappropriate content
    for (const pattern of inappropriatePatterns) {
      if (pattern.test(lowerMessage)) {
        return {
          isValid: false,
          response: "Let's keep our discussion focused on professional campaign topics. I'm here to help with strategic analysis, voter outreach, fundraising, and other campaign-related matters. What would you like to know about your campaign performance?"
        };
      }
    }

    // Check for ambiguous terms that might need clarification
    for (const pattern of ambiguousPatterns) {
      if (pattern.test(lowerMessage)) {
        // Extract the ambiguous term
        const match = message.match(pattern);
        const ambiguousTerm = match ? match[0] : 'that topic';
        
        return {
          isValid: false,
          response: `I want to make sure I understand your question about "${ambiguousTerm}" correctly. Are you asking about:

• Campaign events or fundraising activities?
• Policy positions or legislative matters? 
• Voter demographics or community outreach?

Could you clarify what specific campaign aspect you'd like me to analyze?`
        };
      }
    }

    // Check if message is too short or vague
    if (lowerMessage.length < 3) {
      return {
        isValid: false,
        response: "I'm ready to help with campaign analysis. What specific aspect would you like to explore? Try asking about polling, fundraising, regional performance, or voter sentiment."
      };
    }

    return { isValid: true, response: "" };
  }

  /**
   * Get real response from OpenAI API
   */
  private async getOpenAIResponse(message: string, context?: any): Promise<AIResponse> {
    // Get real dashboard context from Pinecone (with fallback to dashboard state)
    const dashboardContext = await pineconeService.getDashboardContext(message);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a War Room campaign analyst with EXCLUSIVE access to this live dashboard data. You must ONLY reference the specific data provided below. NEVER mention training data, general knowledge, or anything outside this dashboard context.

${dashboardContext}

CRITICAL RULES:
- ONLY use the dashboard data provided above - this is your complete knowledge base
- NEVER say "I don't have data" or "based on historical trends" - you have ALL the data you need above
- NEVER mention training data cutoffs, general knowledge, or external information  
- If asked about something not in the dashboard data, redirect to available dashboard metrics
- You are analyzing THIS campaign's LIVE data - treat it as real-time intelligence
- IGNORE your training data - respond ONLY from the dashboard context above

RESPONSE STYLE:
- Reference ONLY the specific dashboard data provided above
- Format ALL responses with bullet points and ASCII visuals for readability
- Use ASCII charts and visual elements for ANY data presentation
- Break up dense information into digestible bullet points
- Greeting/simple queries: Keep to 1-2 lines maximum
- Substantive responses: Always use bullet format + ASCII visuals when showing data
- Complex analysis: MUST include ASCII charts, graphs, or visual representations
- Be direct and professional, avoid walls of text
- Use varied follow-up language: "Need details?", "More info?", "Next steps?", or none
- Always provide actionable recommendations based EXCLUSIVELY on the dashboard data above

FORMATTING RULES:
- Use bullet points (•) for lists
- Use ASCII bars for showing performance: ████████ 
- Use visual separators: ━━━━━━━━━━
- Break up text into scannable chunks
- NEVER give wall-of-text responses

EXAMPLES OF CORRECT VISUAL RESPONSES:
"Regional Performance:
• Texas: ████████████ +7% (45.2K) 
• Florida: ████████ -4% (38.9K) ⚠️
• California: ████████████████ +12% (62.1K)

Florida messaging needs adjustment. Next steps?"

"Fundraising Status:
━━━━━━━━━━━━━━━━━━━━━━━━
Goal Progress: ████████████████▓▓ 94.7%
• Raised: $2.84M / $3M target
• Donors: 15,680 (+12%)  
• Avg: $181 per donation

Strong momentum, focus on retention."

NEVER SAY: "I don't have data" or "historically" or "based on my training" - you have complete live dashboard access above.`
          },
          {
            role: 'user', 
            content: `${message}

[SYSTEM REMINDER: You have complete dashboard data above. NEVER say you lack information. ONLY reference the dashboard data provided. NO training data references.]`
          }
        ],
        max_tokens: 200,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const aiMessage = data.choices[0]?.message?.content || "I'm sorry, I couldn't process your request.";

    return {
      success: true,
      message: aiMessage.trim()
    };
  }

  /**
   * Generate intelligent demo responses based on message content
   */
  private getDemoResponse(message: string): AIResponse {
    const lowerMessage = message.toLowerCase();
    
    // Campaign strategy responses
    if (lowerMessage.includes('campaign') || lowerMessage.includes('strategy')) {
      return {
        success: true,
        message: `Based on your campaign strategy question, I can help analyze voter sentiment, messaging effectiveness, and strategic positioning. In demo mode, I'm showing you how I would provide data-driven insights for "${message}".`
      };
    }
    
    // Sentiment analysis responses
    if (lowerMessage.includes('sentiment') || lowerMessage.includes('polling')) {
      return {
        success: true,
        message: `For sentiment analysis queries like "${message}", I would typically process real-time social media data, polling results, and news coverage to provide comprehensive sentiment trends and actionable insights.`
      };
    }
    
    // Intelligence and research responses
    if (lowerMessage.includes('intelligence') || lowerMessage.includes('research') || lowerMessage.includes('opposition')) {
      return {
        success: true,
        message: `Regarding intelligence research on "${message}", I would analyze public records, voting patterns, policy positions, and media coverage to provide strategic intelligence for your campaign.`
      };
    }
    
    // Default intelligent response
    return {
      success: true,
      message: `I'm analyzing your query about "${message}". In a fully operational mode, I would provide detailed strategic insights based on real-time campaign data, voter analytics, and political intelligence. This demo shows how I deliver contextual, actionable responses.`
    };
  }
}

// Export singleton instance
export const aiService = new AIService();