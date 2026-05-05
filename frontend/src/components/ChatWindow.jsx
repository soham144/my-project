import { useEffect, useRef } from 'react';
import { Menu, Sparkles, Search, Database, BarChart3, FileText } from 'lucide-react';
import MessageBubble from './MessageBubble.jsx';
import ToolIndicator from './ToolIndicator.jsx';
import ThinkingAnimation from './ThinkingAnimation.jsx';
import './ChatWindow.css';

function ChatWindow({ messages, isLoading, activeTools, onToggleSidebar, hasConversation }) {
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, activeTools]);

  const showWelcome = messages.length === 0;

  return (
    <div className="chat-window">
      {/* Header */}
      <header className="chat-window__header">
        <button className="chat-window__menu-btn" onClick={onToggleSidebar} aria-label="Toggle sidebar">
          <Menu size={20} />
        </button>
        <div className="chat-window__header-title">
          <Sparkles size={16} className="chat-window__header-icon" />
          <span>NexusAI</span>
        </div>
        <div className="chat-window__header-badge">
          <span className="chat-window__status-dot" />
          Online
        </div>
      </header>

      {/* Messages Area */}
      <div className="chat-window__messages" ref={containerRef}>
        {showWelcome ? (
          <div className="chat-window__welcome fade-in-up">
            <div className="chat-window__welcome-glow" />
            <div className="chat-window__welcome-icon">
              <Sparkles size={36} />
            </div>
            <h1 className="chat-window__welcome-title">Welcome to NexusAI</h1>
            <p className="chat-window__welcome-subtitle">
              Your intelligent assistant for web search, data analysis, and more.
            </p>

            <div className="chat-window__capabilities">
              <div className="chat-window__capability">
                <div className="chat-window__capability-icon chat-window__capability-icon--search">
                  <Search size={18} />
                </div>
                <div>
                  <h3>Web Search</h3>
                  <p>Find real-time information from the internet</p>
                </div>
              </div>
              <div className="chat-window__capability">
                <div className="chat-window__capability-icon chat-window__capability-icon--db">
                  <Database size={18} />
                </div>
                <div>
                  <h3>Database Query</h3>
                  <p>Query and explore your PostgreSQL data</p>
                </div>
              </div>
              <div className="chat-window__capability">
                <div className="chat-window__capability-icon chat-window__capability-icon--analyze">
                  <BarChart3 size={18} />
                </div>
                <div>
                  <h3>Data Analysis</h3>
                  <p>Get statistics and insights from your data</p>
                </div>
              </div>
              <div className="chat-window__capability">
                <div className="chat-window__capability-icon chat-window__capability-icon--summarize">
                  <FileText size={18} />
                </div>
                <div>
                  <h3>Summarization</h3>
                  <p>Condense long texts into key takeaways</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="chat-window__messages-list">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
          </div>
        )}

        {/* Active Tool Indicators */}
        {activeTools.length > 0 && (
          <div className="chat-window__tools">
            {activeTools.map((tool, i) => (
              <ToolIndicator key={`${tool.name}-${i}`} tool={tool} />
            ))}
          </div>
        )}

        {/* Thinking Animation */}
        {isLoading && activeTools.length === 0 && messages.length > 0 && (
          <ThinkingAnimation />
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

export default ChatWindow;
