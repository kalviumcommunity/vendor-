import React, { createContext, useContext, useState, useEffect } from 'react';
import { useDoc } from './DocContext';

const ChatContext = createContext();

const API_BASE = 'http://localhost:8000/api';

export const ChatProvider = ({ children }) => {
  const { selectedVersion, selectedDocType } = useDoc();
  
  const [conversations, setConversations] = useState([
    {
      id: 'conv_01',
      title: 'Authentication differences between v2 & v3',
      version: 'v3.0',
      last_message: 'Authentication changed in v3 to use Bearer tokens...',
      created_at: '2026-09-17 08:30',
      messages_count: 2
    },
    {
      id: 'conv_02',
      title: 'Migrating user creation to v4 OAuth',
      version: 'v4.0',
      last_message: 'In v4, role was replaced with role_id UUID...',
      created_at: '2026-09-16 16:45',
      messages_count: 2
    }
  ]);

  const [activeConversationId, setActiveConversationId] = useState('conv_01');
  const [messages, setMessages] = useState([
    {
      id: 'msg_01',
      sender: 'user',
      text: 'What changed in authentication between v2 and v3?',
      version: 'v3.0',
      timestamp: '08:30 AM'
    },
    {
      id: 'msg_02',
      sender: 'ai',
      text: `In **NovaAPI v3.0**, authentication was significantly overhauled [1]:\n\n1. **Bearer Token Transition**: In v2.0, static API keys were passed via the \`X-API-Key\` header. In v3.0, authentication requires **Bearer JWT tokens** passed in the standard \`Authorization\` header [1].\n2. **Token Endpoint**: You must exchange client credentials via \`POST /api/v3/auth/tokens\` to obtain short-lived tokens (1 hour lifetime) [1].\n3. **Deprecation**: Passing \`X-API-Key\` in v3.0 is rejected with HTTP 401 Unauthorized [1].`,
      version: 'v3.0',
      confidence: 96,
      latency_ms: 380,
      timestamp: '08:30 AM',
      sources: [
        {
          index: 1,
          document: 'Migration Guide: NovaAPI v2.0 to v3.0',
          document_id: 'migration_v2_to_v3',
          version: 'v3.0',
          section: 'Major Breaking Changes',
          page: 1,
          chunk_id: 'migration_v2_to_v3-v3_0-major_breaki-001',
          relevance: 96,
          text: 'Authentication Migration: v2.0 used static API key passed via X-API-Key header. v3.0 uses dynamic JWT token passed via Authorization: Bearer <jwt_token>. Call POST /api/v3/auth/tokens using client_id and client_secret.',
          source_url: '/docs/v3.0/migration_guide/major-breaking-changes'
        }
      ]
    }
  ]);

  const [isStreaming, setIsStreaming] = useState(false);
  const [thinkingStage, setThinkingStage] = useState(''); // 'thinking', 'retrieving', 'reranking', 'generating'
  const [thinkingMessage, setThinkingMessage] = useState('');

  const startNewConversation = () => {
    const newId = `conv_${Date.now()}`;
    const newConv = {
      id: newId,
      title: 'New Conversation',
      version: selectedVersion,
      last_message: 'Started new session',
      created_at: 'Just now',
      messages_count: 0
    };
    setConversations(prev => [newConv, ...prev]);
    setActiveConversationId(newId);
    setMessages([]);
  };

  const deleteConversation = (id) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConversationId === id) {
      setMessages([]);
    }
  };

  const sendMessage = async (userQuestion, customVersion = null, customDocType = null) => {
    if (!userQuestion.trim() || isStreaming) return;

    const queryVersion = customVersion || selectedVersion;
    const queryDocType = customDocType || selectedDocType;

    const userMsg = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: userQuestion,
      version: queryVersion,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setIsStreaming(true);
    setThinkingStage('thinking');
    setThinkingMessage('Analyzing query semantics and version constraints...');

    const aiMsgId = `ai_${Date.now()}`;
    let accumulatedText = '';
    let responseSources = [];
    let responseLatency = 350;
    let responseConfidence = 95;

    // Temporary placeholder AI message
    const initialAiMsg = {
      id: aiMsgId,
      sender: 'ai',
      text: '',
      version: queryVersion,
      confidence: 0,
      latency_ms: 0,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sources: []
    };
    setMessages(prev => [...prev, initialAiMsg]);

    try {
      // Try streaming endpoint
      const response = await fetch(`${API_BASE}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userQuestion,
          version: queryVersion,
          documentType: queryDocType === 'all' ? null : queryDocType
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (!dataStr) continue;

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.stage === 'thinking') {
                setThinkingStage('thinking');
                setThinkingMessage(parsed.message);
              } else if (parsed.stage === 'retrieving') {
                setThinkingStage('retrieving');
                setThinkingMessage(parsed.message);
              } else if (parsed.stage === 'reranking') {
                setThinkingStage('reranking');
                setThinkingMessage(parsed.message);
              } else if (parsed.stage === 'streaming') {
                setThinkingStage('generating');
                accumulatedText += parsed.delta;
                setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: accumulatedText } : m));
              } else if (parsed.stage === 'done') {
                accumulatedText = parsed.answer || accumulatedText;
                responseSources = parsed.sources || [];
                responseLatency = parsed.latency_ms || 350;
                responseConfidence = parsed.confidence || 95;

                setMessages(prev => prev.map(m => m.id === aiMsgId ? {
                  ...m,
                  text: accumulatedText,
                  sources: responseSources,
                  latency_ms: responseLatency,
                  confidence: responseConfidence
                } : m));
              }
            } catch (err) {
              console.error('Error parsing SSE event:', err);
            }
          }
        }
      }
    } catch (err) {
      console.warn('Streaming failed, falling back to standard POST /api/chat endpoint:', err);
      try {
        const fallbackRes = await fetch(`${API_BASE}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: userQuestion,
            version: queryVersion,
            documentType: queryDocType === 'all' ? null : queryDocType
          })
        });
        const data = await fallbackRes.json();
        setMessages(prev => prev.map(m => m.id === aiMsgId ? {
          ...m,
          text: data.answer,
          sources: data.sources || [],
          latency_ms: data.latency_ms || 320,
          confidence: data.confidence_score || 95
        } : m));
      } catch (fallbackErr) {
        setMessages(prev => prev.map(m => m.id === aiMsgId ? {
          ...m,
          text: `⚠️ Network error: Could not communicate with backend at ${API_BASE}. Please ensure the FastAPI server is running.`,
          sources: []
        } : m));
      }
    } finally {
      setIsStreaming(false);
      setThinkingStage('');
      setThinkingMessage('');

      // Update conversation title if new
      setConversations(prev => prev.map(c => {
        if (c.id === activeConversationId && c.title === 'New Conversation') {
          return { ...c, title: userQuestion.slice(0, 38) + '...', last_message: userQuestion };
        }
        return c;
      }));
    }
  };

  return (
    <ChatContext.Provider value={{
      conversations,
      activeConversationId,
      setActiveConversationId,
      messages,
      isStreaming,
      thinkingStage,
      thinkingMessage,
      sendMessage,
      startNewConversation,
      deleteConversation
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
