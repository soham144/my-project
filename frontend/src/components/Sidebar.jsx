import { useState } from 'react';
import { MessageSquarePlus, Trash2, MessageCircle, ChevronLeft, Sparkles } from 'lucide-react';
import './Sidebar.css';

function Sidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  isOpen,
  onClose,
}) {
  const [hoveredId, setHoveredId] = useState(null);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
      {/* Header */}
      <div className="sidebar__header">
        <div className="sidebar__logo">
          <div className="sidebar__logo-icon">
            <Sparkles size={18} />
          </div>
          <span className="sidebar__logo-text">NexusAI</span>
        </div>
        <button className="sidebar__close-btn" onClick={onClose} aria-label="Close sidebar">
          <ChevronLeft size={18} />
        </button>
      </div>

      {/* New Chat Button */}
      <div className="sidebar__actions">
        <button className="sidebar__new-chat" onClick={onNewChat} id="new-chat-btn">
          <MessageSquarePlus size={16} />
          <span>New Chat</span>
        </button>
      </div>

      {/* Conversation List */}
      <div className="sidebar__conversations">
        {conversations.length === 0 ? (
          <div className="sidebar__empty">
            <MessageCircle size={32} className="sidebar__empty-icon" />
            <p>No conversations yet</p>
            <p className="sidebar__empty-hint">Start a new chat to begin</p>
          </div>
        ) : (
          <ul className="sidebar__list">
            {conversations.map((conv) => (
              <li
                key={conv.id}
                className={`sidebar__item ${
                  activeConversationId === conv.id ? 'sidebar__item--active' : ''
                }`}
                onClick={() => onSelectConversation(conv.id)}
                onMouseEnter={() => setHoveredId(conv.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <div className="sidebar__item-content">
                  <MessageCircle size={14} className="sidebar__item-icon" />
                  <span className="sidebar__item-title">{conv.title}</span>
                </div>
                <div className="sidebar__item-meta">
                  <span className="sidebar__item-date">
                    {formatDate(conv.updated_at || conv.created_at)}
                  </span>
                  {(hoveredId === conv.id || activeConversationId === conv.id) && (
                    <button
                      className="sidebar__item-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(conv.id);
                      }}
                      aria-label="Delete conversation"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="sidebar__footer">
        <div className="sidebar__footer-text">
          Powered by Mistral AI + MCP
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
