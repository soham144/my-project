import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Search, Database, BarChart3, Sparkles } from 'lucide-react';
import './ChatInput.css';

const SUGGESTED_PROMPTS = [
  { icon: Search, text: 'Search the web for latest AI news', color: 'purple' },
  { icon: Database, text: 'Show me all products in the database', color: 'blue' },
  { icon: BarChart3, text: 'Analyze the sales table statistics', color: 'cyan' },
  { icon: Sparkles, text: 'What are the top selling products by region?', color: 'teal' },
];

function ChatInput({ onSendMessage, isLoading, hasMessages }) {
  const [input, setInput] = useState('');
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [input]);

  // Focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestion = (text) => {
    onSendMessage(text);
  };

  return (
    <div className="chat-input-container">
      {/* Suggested Prompts (only when no messages) */}
      {!hasMessages && (
        <div className="chat-input__suggestions fade-in-up">
          {SUGGESTED_PROMPTS.map((prompt, i) => {
            const Icon = prompt.icon;
            return (
              <button
                key={i}
                className={`chat-input__suggestion chat-input__suggestion--${prompt.color}`}
                onClick={() => handleSuggestion(prompt.text)}
              >
                <Icon size={14} />
                <span>{prompt.text}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Input Area */}
      <form className="chat-input" onSubmit={handleSubmit}>
        <div className="chat-input__wrapper">
          <textarea
            ref={textareaRef}
            id="chat-input-field"
            className="chat-input__field"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            rows={1}
            disabled={isLoading}
            autoComplete="off"
          />
          <button
            type="submit"
            className={`chat-input__send ${input.trim() && !isLoading ? 'chat-input__send--active' : ''}`}
            disabled={!input.trim() || isLoading}
            aria-label="Send message"
            id="send-message-btn"
          >
            {isLoading ? (
              <Loader2 size={18} className="chat-input__spinner" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
        <p className="chat-input__disclaimer">
          NexusAI can make mistakes. Verify important information.
        </p>
      </form>
    </div>
  );
}

export default ChatInput;
