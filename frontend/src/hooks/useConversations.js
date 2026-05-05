import { useState, useEffect, useCallback } from 'react';

const API_BASE = '/api';

export function useConversations() {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/conversations`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const createConversation = useCallback(async (title = 'New Conversation') => {
    try {
      const res = await fetch(`${API_BASE}/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (res.ok) {
        const data = await res.json();
        await fetchConversations();
        setActiveConversationId(data.id);
        return data.id;
      }
    } catch (err) {
      console.error('Failed to create conversation:', err);
    }
    return null;
  }, [fetchConversations]);

  const deleteConversation = useCallback(async (convId) => {
    try {
      const res = await fetch(`${API_BASE}/conversations/${convId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchConversations();
        if (activeConversationId === convId) {
          setActiveConversationId(null);
        }
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  }, [activeConversationId, fetchConversations]);

  return {
    conversations,
    activeConversationId,
    setActiveConversationId,
    createConversation,
    deleteConversation,
    refreshConversations: fetchConversations,
  };
}
