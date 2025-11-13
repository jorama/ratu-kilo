import axios from 'axios';
import './styles.css';

// =========================
// RATU CHAT WIDGET
// =========================

interface RatuWidgetConfig {
  apiUrl: string;
  orgId: string;
  apiKey: string;
  theme?: 'light' | 'dark';
  position?: 'bottom-right' | 'bottom-left';
}

class RatuWidget {
  private config: RatuWidgetConfig;
  private container: HTMLDivElement | null = null;
  private isOpen: boolean = false;
  private messages: Array<{ role: string; content: string }> = [];
  private hasGreeted: boolean = false;
  private userContext: {
    industry?: string;
    role?: string;
    interests?: string[];
  } = {};

  constructor(config: RatuWidgetConfig) {
    this.config = {
      theme: 'light',
      position: 'bottom-right',
      ...config,
    };
    this.init();
  }

  private init() {
    // Create widget container
    this.container = document.createElement('div');
    this.container.id = 'ratu-widget';
    this.container.className = `ratu-widget ${this.config.position}`;
    document.body.appendChild(this.container);

    // Render initial state
    this.render();
  }

  private render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="ratu-widget-container ${this.config.theme}">
        ${this.isOpen ? this.renderChat() : this.renderButton()}
      </div>
    `;

    this.attachEventListeners();
  }

  private renderButton(): string {
    return `
      <button class="ratu-toggle-btn" id="ratu-toggle">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </button>
    `;
  }

  private renderChat(): string {
    return `
      <div class="ratu-chat-window">
        <div class="ratu-chat-header">
          <h3>🧠 Ratu AI</h3>
          <button class="ratu-close-btn" id="ratu-close">×</button>
        </div>
        
        <div class="ratu-chat-messages" id="ratu-messages">
          ${this.messages.map(msg => this.renderMessage(msg)).join('')}
          ${this.messages.length === 0 ? '<div class="ratu-welcome">Hi! How can I help you today?</div>' : ''}
        </div>
        
        <div class="ratu-chat-input">
          <input 
            type="text" 
            id="ratu-input" 
            placeholder="Ask a question..."
            class="ratu-input"
          />
          <button id="ratu-send" class="ratu-send-btn">Send</button>
        </div>
      </div>
    `;
  }

  private renderMessage(msg: { role: string; content: string }): string {
    const isUser = msg.role === 'user';
    return `
      <div class="ratu-message ${isUser ? 'ratu-message-user' : 'ratu-message-ai'}">
        <div class="ratu-message-content">${this.escapeHtml(msg.content)}</div>
      </div>
    `;
  }

  private attachEventListeners() {
    const toggleBtn = document.getElementById('ratu-toggle');
    const closeBtn = document.getElementById('ratu-close');
    const sendBtn = document.getElementById('ratu-send');
    const input = document.getElementById('ratu-input') as HTMLInputElement;

    toggleBtn?.addEventListener('click', () => this.toggle());
    closeBtn?.addEventListener('click', () => this.toggle());
    sendBtn?.addEventListener('click', () => this.sendMessage());
    input?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendMessage();
    });
  }

  private toggle() {
    this.isOpen = !this.isOpen;
    
    // Send proactive greeting when opened for first time
    if (this.isOpen && !this.hasGreeted) {
      this.sendProactiveGreeting();
      this.hasGreeted = true;
    }
    
    this.render();
  }

  /**
   * Send proactive sales greeting
   */
  private async sendProactiveGreeting() {
    const greetings = [
      {
        message: "👋 Hi! I'm Ratu, your AI assistant. I'd love to learn about your organization and show you how Ratu Sovereign AI can help!",
        followUp: "What industry is your organization in? (e.g., Government, Healthcare, Education, Enterprise)"
      },
      {
        message: "Welcome! I'm here to help you discover how Ratu can give your organization its own sovereign AI node.",
        followUp: "What's your biggest challenge with AI or knowledge management right now?"
      },
      {
        message: "Hello! 🧠 I'm Ratu's AI assistant. I can show you how to build your own private AI node with complete data control.",
        followUp: "Are you looking for AI solutions for customer support, internal knowledge, or something else?"
      }
    ];

    const greeting = greetings[Math.floor(Math.random() * greetings.length)];

    // Add greeting message
    this.messages.push({
      role: 'assistant',
      content: greeting.message,
    });

    this.render();

    // Add follow-up question after a short delay
    setTimeout(() => {
      this.messages.push({
        role: 'assistant',
        content: greeting.followUp,
      });
      this.render();
    }, 1500);
  }

  /**
   * Analyze user response and provide tailored recommendations
   */
  private async analyzeAndRespond(userMessage: string) {
    const lowerMessage = userMessage.toLowerCase();

    // Detect industry
    if (lowerMessage.includes('government') || lowerMessage.includes('ministry')) {
      this.userContext.industry = 'government';
    } else if (lowerMessage.includes('healthcare') || lowerMessage.includes('hospital')) {
      this.userContext.industry = 'healthcare';
    } else if (lowerMessage.includes('university') || lowerMessage.includes('education')) {
      this.userContext.industry = 'education';
    } else if (lowerMessage.includes('enterprise') || lowerMessage.includes('company')) {
      this.userContext.industry = 'enterprise';
    }

    // Detect interests
    if (lowerMessage.includes('customer support') || lowerMessage.includes('chatbot')) {
      this.userContext.interests = [...(this.userContext.interests || []), 'customer_support'];
    }
    if (lowerMessage.includes('knowledge') || lowerMessage.includes('documents')) {
      this.userContext.interests = [...(this.userContext.interests || []), 'knowledge_management'];
    }
    if (lowerMessage.includes('compliance') || lowerMessage.includes('audit')) {
      this.userContext.interests = [...(this.userContext.interests || []), 'compliance'];
    }

    // Build context-aware system prompt
    let contextPrompt = '';
    if (this.userContext.industry) {
      contextPrompt += `The user is from the ${this.userContext.industry} industry. `;
    }
    if (this.userContext.interests && this.userContext.interests.length > 0) {
      contextPrompt += `They are interested in: ${this.userContext.interests.join(', ')}. `;
    }
    contextPrompt += 'Tailor your response to their specific needs and highlight relevant Ratu features. Be conversational, helpful, and guide them toward a demo or trial.';

    return contextPrompt;
  }

  private async sendMessage() {
    const input = document.getElementById('ratu-input') as HTMLInputElement;
    const message = input?.value.trim();

    if (!message) return;

    // Add user message
    this.messages.push({ role: 'user', content: message });
    input.value = '';
    this.render();

    try {
      // Analyze user message for context
      const contextPrompt = await this.analyzeAndRespond(message);

      // Build enhanced system prompt for sales
      const systemPrompt = `You are Ratu, an AI sales assistant for Ratu Sovereign AI.

Your role is to:
1. Understand the visitor's needs and challenges
2. Ask qualifying questions to learn about their organization
3. Highlight relevant Ratu features and benefits
4. Guide them toward a free trial or demo
5. Be conversational, helpful, and consultative (not pushy)

${contextPrompt}

Key selling points to emphasize:
- True data sovereignty (your data stays yours)
- Model-off training (base model never retrained)
- Multi-agent council for complex analysis
- Citations for every answer (transparency)
- On-premise deployment options
- Zero vendor lock-in

Always end responses with a helpful next step or question to keep the conversation going.`;

      // Call API with enhanced prompt
      const response = await axios.post(
        `${this.config.apiUrl}/api/v1/orgs/${this.config.orgId}/chat`,
        {
          query: message,
          citations: false,
          system_prompt: systemPrompt,
        },
        {
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
          },
        }
      );

      // Add AI response
      let aiResponse = response.data.answer;

      // Add contextual CTAs based on conversation
      if (this.messages.length > 4 && !aiResponse.includes('trial') && !aiResponse.includes('demo')) {
        aiResponse += '\n\n💡 Would you like to start a free trial or schedule a demo to see Ratu in action?';
      }

      this.messages.push({
        role: 'assistant',
        content: aiResponse,
      });

      this.render();

      // Scroll to bottom
      const messagesDiv = document.getElementById('ratu-messages');
      if (messagesDiv) {
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
      }
    } catch (error) {
      console.error('Chat error:', error);
      this.messages.push({
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again or contact us at sales@ratu.ai',
      });
      this.render();
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  public destroy() {
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }
}

// =========================
// GLOBAL API
// =========================

declare global {
  interface Window {
    RatuWidget: typeof RatuWidget;
    ratuWidget?: RatuWidget;
  }
}

window.RatuWidget = RatuWidget;

// Auto-initialize if config is provided
if ((window as any).ratuConfig) {
  window.ratuWidget = new RatuWidget((window as any).ratuConfig);
}

export default RatuWidget;