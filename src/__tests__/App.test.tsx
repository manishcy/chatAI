import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';
import { useChat } from '../hooks/useChat';

// Mock the useChat hook
vi.mock('../hooks/useChat');

// Mock child components
vi.mock('../components/ModelSelector', () => ({
  ModelSelector: ({ selectedModel, onModelChange }: any) => (
    <div data-testid="model-selector">
      <button onClick={() => onModelChange('gpt-4-turbo')}>
        Select GPT-4 Turbo
      </button>
      <button onClick={() => onModelChange('gpt-3.5-turbo')}>
        Select GPT-3.5 Turbo
      </button>
      <span>Current: {selectedModel}</span>
    </div>
  ),
}));

vi.mock('../components/ChatArea', () => ({
  ChatArea: ({ messages, isLoading }: any) => (
    <div data-testid="chat-area">
      {messages.map((msg: any, idx: number) => (
        <div key={idx} data-testid={`message-${msg.role}`}>
          {msg.content}
        </div>
      ))}
      {isLoading && <div data-testid="loading">Loading...</div>}
    </div>
  ),
}));

vi.mock('../components/ChatInput', () => ({
  ChatInput: ({ onSendMessage, disabled, placeholder }: any) => (
    <div data-testid="chat-input">
      <input
        data-testid="message-input"
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => {
          if (e.target.value) {
            onSendMessage(e.target.value);
          }
        }}
      />
    </div>
  ),
}));

vi.mock('../data/models', () => ({
  availableModels: [
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI' },
  ],
}));

describe('App Component', () => {
  const mockSendMessage = vi.fn();
  const mockClearChat = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useChat as any).mockReturnValue({
      messages: [],
      isLoading: false,
      sendMessage: mockSendMessage,
      clearChat: mockClearChat,
    });
  });

  describe('Rendering', () => {
    it('should render the app title and description', () => {
      render(<App />);
      
      expect(screen.getByText('AI Assistant')).toBeInTheDocument();
      expect(screen.getByText('Choose your model and start chatting')).toBeInTheDocument();
    });

    it('should render all main components', () => {
      render(<App />);
      
      expect(screen.getByTestId('model-selector')).toBeInTheDocument();
      expect(screen.getByTestId('chat-area')).toBeInTheDocument();
      expect(screen.getByTestId('chat-input')).toBeInTheDocument();
    });

    it('should render the footer', () => {
      render(<App />);
      
      expect(screen.getByText(/AI Assistant Client v1.0/)).toBeInTheDocument();
    });

    it('should display "No question asked yet" when there are no messages', () => {
      render(<App />);
      
      expect(screen.getByText('No question asked yet.')).toBeInTheDocument();
    });
  });

  describe('Model Selection', () => {
    it('should initialize with gpt-4-turbo as default model', () => {
      render(<App />);
      
      expect(screen.getByText('Current: gpt-4-turbo')).toBeInTheDocument();
    });

    it('should update selected model when changed', () => {
      render(<App />);
      
      const selectButton = screen.getByText('Select GPT-3.5 Turbo');
      fireEvent.click(selectButton);
      
      expect(screen.getByText('Current: gpt-3.5-turbo')).toBeInTheDocument();
    });

    it('should pass the selected model to useChat hook', () => {
      render(<App />);
      
      expect(useChat).toHaveBeenCalledWith('gpt-4-turbo');
      
      const selectButton = screen.getByText('Select GPT-3.5 Turbo');
      fireEvent.click(selectButton);
      
      expect(useChat).toHaveBeenCalledWith('gpt-3.5-turbo');
    });
  });

  describe('Message Handling', () => {
    it('should call sendMessage when user sends a message', () => {
      render(<App />);
      
      const input = screen.getByTestId('message-input');
      fireEvent.change(input, { target: { value: 'Hello, AI!' } });
      
      expect(mockSendMessage).toHaveBeenCalledWith('Hello, AI!');
    });

    it('should pass disabled=false to ChatInput when not loading and model is selected', () => {
      render(<App />);
      
      const input = screen.getByTestId('message-input');
      expect(input).not.toBeDisabled();
    });

    it('should pass disabled=true to ChatInput when loading', () => {
      (useChat as any).mockReturnValue({
        messages: [],
        isLoading: true,
        sendMessage: mockSendMessage,
        clearChat: mockClearChat,
      });

      render(<App />);
      
      const input = screen.getByTestId('message-input');
      expect(input).toBeDisabled();
    });

    it('should display messages in chat area', () => {
      (useChat as any).mockReturnValue({
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there!' },
        ],
        isLoading: false,
        sendMessage: mockSendMessage,
        clearChat: mockClearChat,
      });

      render(<App />);
      
      expect(screen.getByTestId('message-user')).toHaveTextContent('Hello');
      expect(screen.getByTestId('message-assistant')).toHaveTextContent('Hi there!');
    });
  });

  describe('Clear Chat', () => {
    it('should not show clear chat button when there are no messages', () => {
      render(<App />);
      
      expect(screen.queryByRole('button', { name: /clear chat/i })).not.toBeInTheDocument();
    });

    it('should show clear chat button when there are messages', () => {
      (useChat as any).mockReturnValue({
        messages: [{ role: 'user', content: 'Hello' }],
        isLoading: false,
        sendMessage: mockSendMessage,
        clearChat: mockClearChat,
      });

      render(<App />);
      
      expect(screen.getByRole('button', { name: /clear chat/i })).toBeInTheDocument();
    });

    it('should call clearChat when clear button is clicked', () => {
      (useChat as any).mockReturnValue({
        messages: [{ role: 'user', content: 'Hello' }],
        isLoading: false,
        sendMessage: mockSendMessage,
        clearChat: mockClearChat,
      });

      render(<App />);
      
      const clearButton = screen.getByRole('button', { name: /clear chat/i });
      fireEvent.click(clearButton);
      
      expect(mockClearChat).toHaveBeenCalledTimes(1);
    });
  });

  describe('Last User Message Display', () => {
    it('should display the last user message in the sidebar', () => {
      (useChat as any).mockReturnValue({
        messages: [
          { role: 'user', content: 'First question' },
          { role: 'assistant', content: 'First answer' },
          { role: 'user', content: 'Second question' },
          { role: 'assistant', content: 'Second answer' },
        ],
        isLoading: false,
        sendMessage: mockSendMessage,
        clearChat: mockClearChat,
      });

      render(<App />);
      
      const sidebar = screen.getByText('Last Question').parentElement;
      expect(sidebar).toHaveTextContent('Second question');
    });

    it('should find the last user message even if assistant message is last', () => {
      (useChat as any).mockReturnValue({
        messages: [
          { role: 'user', content: 'My question' },
          { role: 'assistant', content: 'My answer' },
        ],
        isLoading: false,
        sendMessage: mockSendMessage,
        clearChat: mockClearChat,
      });

      render(<App />);
      
      const sidebar = screen.getByText('Last Question').parentElement;
      expect(sidebar).toHaveTextContent('My question');
    });

    it('should handle HTML content in user messages', () => {
      (useChat as any).mockReturnValue({
        messages: [
          { role: 'user', content: '<strong>Bold question</strong>' },
        ],
        isLoading: false,
        sendMessage: mockSendMessage,
        clearChat: mockClearChat,
      });

      render(<App />);
      
      const sidebar = screen.getByText('Last Question').parentElement;
      expect(sidebar?.querySelector('strong')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should pass isLoading to ChatArea', () => {
      (useChat as any).mockReturnValue({
        messages: [],
        isLoading: true,
        sendMessage: mockSendMessage,
        clearChat: mockClearChat,
      });

      render(<App />);
      
      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });
  });

  describe('Placeholder Text', () => {
    it('should show default placeholder when model is selected', () => {
      render(<App />);
      
      expect(screen.getByPlaceholderText('Ask me anything...')).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('should handle complete user interaction flow', async () => {
      const { rerender } = render(<App />);
      
      // Select a different model
      const modelButton = screen.getByText('Select GPT-3.5 Turbo');
      fireEvent.click(modelButton);
      
      // Send a message
      const input = screen.getByTestId('message-input');
      fireEvent.change(input, { target: { value: 'Test message' } });
      
      expect(mockSendMessage).toHaveBeenCalledWith('Test message');
      
      // Update with messages
      (useChat as any).mockReturnValue({
        messages: [
          { role: 'user', content: 'Test message' },
          { role: 'assistant', content: 'Test response' },
        ],
        isLoading: false,
        sendMessage: mockSendMessage,
        clearChat: mockClearChat,
      });
      
      rerender(<App />);
      
      // Clear chat
      const clearButton = screen.getByRole('button', { name: /clear chat/i });
      fireEvent.click(clearButton);
      
      expect(mockClearChat).toHaveBeenCalled();
    });
  });
});
