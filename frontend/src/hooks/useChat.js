import { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE = '/api';

export function useChat(activeConversationId, refreshConversations) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTools, setActiveTools] = useState([]);
  const abortControllerRef = useRef(null);

  // Load messages when conversation changes
  useEffect(() => {
    if (activeConversationId) {
      loadConversationMessages(activeConversationId);
    } else {
      setMessages([]);
    }
  }, [activeConversationId]);

  const loadConversationMessages = async (convId) => {
    try {
      const res = await fetch(`${API_BASE}/conversations/${convId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(
          data.messages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            toolCalls: m.tool_calls || [],
            sources: m.sources || [],
            createdAt: m.created_at,
          }))
        );
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const sendMessage = useCallback(
    async (text, conversationId, onNewConversation) => {
      if (!text.trim() || isLoading) return;

      // Add user message optimistically
      const userMsg = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content: text,
        toolCalls: [],
        sources: [],
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setActiveTools([]);

      // Add placeholder for assistant
      const assistantMsgId = `assistant-${Date.now()}`;
      const assistantMsg = {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        toolCalls: [],
        sources: [],
        createdAt: new Date().toISOString(),
        isStreaming: true,
      };
      setMessages((prev) => [...prev, assistantMsg]);

      try {
        // Use streaming endpoint
        const res = await fetch(`${API_BASE}/chat/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            conversation_id: conversationId || null,
          }),
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullContent = '';
        let allSources = [];
        let allToolCalls = [];
        let newConvId = conversationId;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('event:')) {
              const eventType = line.slice(6).trim();
              continue;
            }

            if (line.startsWith('data:')) {
              const dataStr = line.slice(5).trim();
              if (!dataStr) continue;

              try {
                const data = JSON.parse(dataStr);

                // Detect event type from data content
                if (data.conversation_id && !data.content && !data.sources && !data.error && !data.tool_name) {
                  // conversation_id event or done event
                  if (!newConvId || newConvId !== data.conversation_id) {
                    newConvId = data.conversation_id;
                    if (onNewConversation) {
                      onNewConversation(newConvId);
                    }
                  }
                } else if (data.content !== undefined && !data.tool_name) {
                  // content chunk
                  fullContent += data.content;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMsgId
                        ? { ...m, content: fullContent }
                        : m
                    )
                  );
                } else if (data.tool_name && data.arguments !== undefined) {
                  // tool_start
                  setActiveTools((prev) => [
                    ...prev,
                    { name: data.tool_name, status: 'running' },
                  ]);
                } else if (data.tool_name && data.success !== undefined) {
                  // tool_result
                  setActiveTools((prev) =>
                    prev.map((t) =>
                      t.name === data.tool_name
                        ? { ...t, status: data.success ? 'done' : 'error' }
                        : t
                    )
                  );
                } else if (data.sources) {
                  // sources
                  allSources = data.sources;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMsgId
                        ? { ...m, sources: allSources }
                        : m
                    )
                  );
                } else if (data.error) {
                  fullContent = data.error;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMsgId
                        ? { ...m, content: fullContent, isError: true }
                        : m
                    )
                  );
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }

        // Finalize the assistant message
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, content: fullContent, sources: allSources, isStreaming: false }
              : m
          )
        );

        // Refresh conversation list
        if (refreshConversations) {
          refreshConversations();
        }
      } catch (err) {
        console.error('Send message error:', err);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: `Sorry, I encountered an error: ${err.message}. Please check that the backend is running.`,
                  isStreaming: false,
                  isError: true,
                }
              : m
          )
        );
      } finally {
        setIsLoading(false);
        setActiveTools([]);
      }
    },
    [isLoading, refreshConversations]
  );

  return {
    messages,
    isLoading,
    activeTools,
    sendMessage,
    setMessages,
  };
}
