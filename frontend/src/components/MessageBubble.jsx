import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, User, Sparkles } from 'lucide-react';
import SourceCard from './SourceCard.jsx';
import './MessageBubble.css';

function MessageBubble({ message }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const isStreaming = message.isStreaming;
  const isError = message.isError;

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`message ${isUser ? 'message--user' : 'message--assistant'} fade-in-up`}>
      {/* Avatar */}
      <div className={`message__avatar ${isUser ? 'message__avatar--user' : 'message__avatar--assistant'}`}>
        {isUser ? <User size={16} /> : <Sparkles size={16} />}
      </div>

      {/* Content */}
      <div className="message__body">
        <div className={`message__content ${isError ? 'message__content--error' : ''}`}>
          {isUser ? (
            <p>{message.content}</p>
          ) : (
            <>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content || (isStreaming ? '' : '...')}
              </ReactMarkdown>
              {isStreaming && message.content && (
                <span className="message__cursor" />
              )}
            </>
          )}
        </div>

        {/* Tool Call Badges */}
        {!isUser && message.toolCalls && message.toolCalls.length > 0 && (
          <div className="message__tools">
            {message.toolCalls.map((tc, i) => (
              <span key={i} className="message__tool-badge">
                {getToolEmoji(tc.tool_name)} {formatToolName(tc.tool_name)}
              </span>
            ))}
          </div>
        )}

        {/* Sources */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="message__sources">
            <p className="message__sources-title">Sources</p>
            <div className="message__sources-list">
              {message.sources.map((source, i) => (
                <SourceCard key={i} source={source} index={i + 1} />
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {!isUser && message.content && !isStreaming && (
          <div className="message__actions">
            <button
              className="message__action-btn"
              onClick={handleCopy}
              aria-label="Copy message"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function getToolEmoji(toolName) {
  const map = {
    web_search: '🔍',
    query_database: '🗄️',
    analyze_database: '📊',
    summarize_text: '📝',
  };
  return map[toolName] || '🔧';
}

function formatToolName(toolName) {
  const map = {
    web_search: 'Web Search',
    query_database: 'DB Query',
    analyze_database: 'Analysis',
    summarize_text: 'Summary',
  };
  return map[toolName] || toolName;
}

export default MessageBubble;
