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
    this.render();
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
      // Call API
      const response = await axios.post(
        `${this.config.apiUrl}/api/v1/orgs/${this.config.orgId}/chat`,
        {
          query: message,
          citations: false,
        },
        {
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
          },
        }
      );

      // Add AI response
      this.messages.push({
        role: 'assistant',
        content: response.data.answer,
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
        content: 'Sorry, I encountered an error. Please try again.',
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