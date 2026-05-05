import { useState, useCallback } from 'react';
import Sidebar from './components/Sidebar.jsx';
import ChatWindow from './components/ChatWindow.jsx';
import ChatInput from './components/ChatInput.jsx';
import { useChat } from './hooks/useChat.js';
import { useConversations } from './hooks/useConversations.js';
import './App.css';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    createConversation,
    deleteConversation,
    refreshConversations,
  } = useConversations();

  const {
    messages,
    isLoading,
    activeTools,
    sendMessage,
    setMessages,
  } = useChat(activeConversationId, refreshConversations);

  const handleSendMessage = useCallback(async (text) => {
    await sendMessage(text, activeConversationId, (newConvId) => {
      setActiveConversationId(newConvId);
    });
  }, [activeConversationId, sendMessage, setActiveConversationId]);

  const handleNewChat = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
    setSidebarOpen(false);
  }, [setActiveConversationId, setMessages]);

  const handleSelectConversation = useCallback((convId) => {
    setActiveConversationId(convId);
    setSidebarOpen(false);
  }, [setActiveConversationId]);

  const handleDeleteConversation = useCallback(async (convId) => {
    await deleteConversation(convId);
    if (convId === activeConversationId) {
      setActiveConversationId(null);
      setMessages([]);
    }
  }, [activeConversationId, deleteConversation, setActiveConversationId, setMessages]);

  return (
    <div className="app-layout">
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <main className="main-content">
        <ChatWindow
          messages={messages}
          isLoading={isLoading}
          activeTools={activeTools}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          hasConversation={!!activeConversationId}
        />
        <ChatInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          hasMessages={messages.length > 0}
        />
      </main>
    </div>
  );
}

export default App;
