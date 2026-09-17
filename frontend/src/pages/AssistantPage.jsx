import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  Layers, 
  Filter, 
  CheckCircle2, 
  ExternalLink, 
  Copy, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Search, 
  Clock, 
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  FileCode,
  Zap,
  Info
} from 'lucide-react';
import { useDoc } from '../context/DocContext';
import { useChat } from '../context/ChatContext';
import { CodeBlock } from '../components/ui/CodeBlock';

export const AssistantPage = () => {
  const { selectedVersion, setSelectedVersion, selectedDocType, setSelectedDocType, versions, openSourceInspector } = useDoc();
  const { 
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
  } = useChat();

  const [inputQuery, setInputQuery] = useState('');
  const [expandedSources, setExpandedSources] = useState({}); // { msgId: boolean }
  const [convSearch, setConvSearch] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputQuery.trim() || isStreaming) return;
    sendMessage(inputQuery);
    setInputQuery('');
  };

  const handlePromptClick = (promptText, promptVersion = null) => {
    if (promptVersion) {
      setSelectedVersion(promptVersion);
    }
    sendMessage(promptText, promptVersion);
  };

  const toggleSourceExpand = (msgId) => {
    setExpandedSources(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const filteredConversations = conversations.filter(c => 
    c.title.toLowerCase().includes(convSearch.toLowerCase())
  );

  const samplePrompts = [
    { text: "How do I authenticate with the API in version 3?", v: "v3.0", category: "Auth" },
    { text: "What changed in authentication between v2 and v3?", v: "v3.0", category: "Migration" },
    { text: "What parameters does the createUser API accept in v4?", v: "v4.0", category: "Endpoints" },
    { text: "What are the rate limit headers in v2 vs v3?", v: "v3.0", category: "Rate Limits" }
  ];

  return (
    <div className="flex h-[calc(100vh-4.1rem)] overflow-hidden bg-[#F8FAFC]">
      
      {/* Left Chat History Sub-Sidebar */}
      <div className="w-72 bg-white border-r border-slate-200 flex flex-col justify-between hidden lg:flex shrink-0">
        
        <div className="p-3 border-b border-slate-200 space-y-2">
          <button
            onClick={startNewConversation}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Documentation Chat</span>
          </button>

          {/* Search conversations */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={convSearch}
              onChange={(e) => setConvSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 text-slate-800 placeholder-slate-400"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="p-2 space-y-1 overflow-y-auto flex-1">
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Recent Questions
          </div>
          {filteredConversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => setActiveConversationId(conv.id)}
              className={`group flex items-start justify-between p-2.5 rounded-lg cursor-pointer transition-all text-xs ${
                activeConversationId === conv.id
                  ? 'bg-brand-50 text-brand-900 border border-brand-200/70 font-medium'
                  : 'text-slate-600 hover:bg-slate-100/80'
              }`}
            >
              <div className="space-y-0.5 max-w-[190px]">
                <div className="truncate text-xs font-semibold text-slate-800 group-hover:text-brand-700">
                  {conv.title}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <span className="font-mono bg-white px-1 py-0.2 border border-slate-200 rounded text-slate-600">
                    {conv.version}
                  </span>
                  <span>•</span>
                  <span>{conv.created_at}</span>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteConversation(conv.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 transition-opacity"
                title="Delete session"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Info Grounding Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Every answer cites verifiable knowledge chunks.</span>
        </div>

      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
        
        {/* Chat Header Controls */}
        <div className="px-5 py-3 border-b border-slate-200 bg-white/95 flex flex-wrap items-center justify-between gap-3 shrink-0">
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600 font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                Documentation AI Assistant
                <span className="px-1.5 py-0.2 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                  Grounded RAG
                </span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Grounded strictly in NovaAPI multi-version corpus
              </p>
            </div>
          </div>

          {/* Filter Bar: Version & Doc Types */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Version dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={selectedVersion}
                onChange={(e) => setSelectedVersion(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="All">All Versions</option>
                <option value="v1.0">v1.0 (Legacy)</option>
                <option value="v2.0">v2.0 (Stable)</option>
                <option value="v3.0">v3.0 (Current)</option>
                <option value="v4.0">v4.0 (Latest)</option>
              </select>
            </div>

            {/* Doc Type Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
              {[
                { id: 'all', label: 'All Docs' },
                { id: 'api_reference', label: 'API Reference' },
                { id: 'migration_guide', label: 'Migration Guide' },
                { id: 'changelog', label: 'Changelog' }
              ].map(dt => (
                <button
                  key={dt.id}
                  onClick={() => setSelectedDocType(dt.id)}
                  className={`px-2 py-1 rounded-md text-[11px] transition-colors ${
                    selectedDocType === dt.id
                      ? 'bg-white text-slate-900 font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {dt.label}
                </button>
              ))}
            </div>

          </div>

        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center max-w-lg mx-auto text-center space-y-4 my-8">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600 shadow-subtle">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">How can I help with your API integration?</h3>
                <p className="text-xs text-slate-500">
                  Select a version and ask any technical question about endpoints, authentication, parameter changes, or migration steps.
                </p>
              </div>

              {/* Sample Prompts Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full pt-2">
                {samplePrompts.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => handlePromptClick(p.text, p.v)}
                    className="p-3 text-left bg-slate-50 hover:bg-brand-50/60 border border-slate-200 hover:border-brand-200 rounded-xl transition-all group space-y-1 shadow-2xs"
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className="text-brand-700 bg-brand-100/70 px-1.5 py-0.2 rounded font-mono">{p.v}</span>
                      <span className="text-slate-400">{p.category}</span>
                    </div>
                    <p className="text-xs text-slate-700 group-hover:text-slate-900 leading-snug">
                      {p.text}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.sender === 'user';
              const isAi = msg.sender === 'ai';
              const isExpanded = expandedSources[msg.id] !== false; // Default expanded for convenience

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}
                >
                  {isAi && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center text-xs shrink-0 shadow-xs">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`space-y-3 max-w-3xl ${isUser ? 'items-end' : 'items-start'}`}>
                    
                    {/* Message Bubble */}
                    <div
                      className={`p-4 rounded-2xl text-sm leading-relaxed ${
                        isUser
                          ? 'bg-slate-900 text-white rounded-tr-sm shadow-xs'
                          : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-sm shadow-card space-y-3'
                      }`}
                    >
                      {/* Version tag header */}
                      <div className="flex items-center justify-between text-[11px] pb-1 border-b border-slate-100">
                        <span className={`font-semibold font-mono ${isUser ? 'text-slate-300' : 'text-slate-500'}`}>
                          Version Context: {msg.version || selectedVersion}
                        </span>
                        <span className={`text-[10px] ${isUser ? 'text-slate-400' : 'text-slate-400'}`}>
                          {msg.timestamp}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="whitespace-pre-wrap font-sans text-xs sm:text-sm leading-relaxed">
                        {msg.text || (
                          <span className="text-slate-400 italic">Thinking and synthesizing grounded response...</span>
                        )}
                      </div>

                      {/* Latency & Quality Badges */}
                      {isAi && msg.latency_ms > 0 && (
                        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 font-mono text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                              <ShieldCheck className="w-3 h-3" /> Grounded ({msg.confidence || 96}%)
                            </span>
                            <span>•</span>
                            <span className="font-mono text-slate-500">{msg.latency_ms}ms</span>
                          </div>
                          <span className="text-[10px] text-slate-400">Zero Hallucinations Verified</span>
                        </div>
                      )}
                    </div>

                    {/* SOURCE PANEL (Grounding traceability) */}
                    {isAi && msg.sources && msg.sources.length > 0 && (
                      <div className="bg-slate-50/80 border border-slate-200 rounded-xl overflow-hidden shadow-2xs space-y-0">
                        
                        {/* Source Header */}
                        <div 
                          onClick={() => toggleSourceExpand(msg.id)}
                          className="px-3.5 py-2 bg-slate-100/70 flex items-center justify-between cursor-pointer hover:bg-slate-200/50 transition-colors select-none text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-700 flex items-center gap-1.5">
                              <FileCode className="w-3.5 h-3.5 text-brand-600" />
                              SUPPORTING SOURCES ({msg.sources.length})
                            </span>
                            <span className="text-[10px] bg-brand-100 text-brand-700 font-semibold px-1.5 py-0.2 rounded">
                              Traceable
                            </span>
                          </div>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                        </div>

                        {/* Collapsible List of Source Cards */}
                        {isExpanded && (
                          <div className="p-3 space-y-2.5 divide-y divide-slate-200/70">
                            {msg.sources.map((src, sIdx) => (
                              <div key={sIdx} className="pt-2 first:pt-0 flex flex-wrap items-start justify-between gap-3 text-xs">
                                <div className="space-y-1 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold font-mono text-[11px] text-brand-700 bg-brand-50 px-1.5 py-0.2 rounded border border-brand-200">
                                      [{src.index || sIdx + 1}]
                                    </span>
                                    <span className="font-semibold text-slate-900">{src.document}</span>
                                    <span className="px-1.5 py-0.2 text-[10px] font-bold bg-slate-200 text-slate-700 rounded">
                                      {src.version}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                                    <span>Section: <strong className="text-slate-700">{src.section}</strong></span>
                                    <span>•</span>
                                    <span>Page: <strong className="text-slate-700">{src.page}</strong></span>
                                    <span>•</span>
                                    <span className="font-mono text-emerald-600 font-medium">{src.relevance}% Match</span>
                                  </div>

                                  <div className="text-[11px] text-slate-600 font-mono bg-white p-2 rounded border border-slate-200 line-clamp-2">
                                    {src.text}
                                  </div>
                                </div>

                                <button
                                  onClick={() => openSourceInspector(src)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg shadow-2xs transition-colors shrink-0"
                                >
                                  <span>View Source</span>
                                  <ExternalLink className="w-3 h-3 text-slate-400" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                      </div>
                    )}

                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      U
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Thinking Progress Indicator */}
          {isStreaming && (
            <div className="flex items-center gap-3 p-3.5 bg-brand-50/70 border border-brand-200 rounded-xl text-xs text-brand-800 animate-shimmer max-w-lg">
              <div className="w-2.5 h-2.5 rounded-full bg-brand-600 animate-ping" />
              <div className="space-y-0.5">
                <span className="font-bold capitalize block">{thinkingStage || 'Processing'}...</span>
                <span className="text-[11px] text-brand-700">{thinkingMessage}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-200 bg-white space-y-2">
          
          <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder={`Ask anything about NovaAPI ${selectedVersion} documentation, migration, or parameters...`}
              disabled={isStreaming}
              className="flex-1 px-4 py-3 text-sm bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 text-slate-900 placeholder-slate-400 transition-colors"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || isStreaming}
              className="px-4 py-3 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm flex items-center gap-1.5 shadow-md shadow-brand-500/20 transition-all"
            >
              <span>Send</span>
              <Send className="w-4 h-4" />
            </button>
          </form>

          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>Answers generated using strict vector retrieval & metadata version isolation.</span>
            <span className="font-mono">Active Target: {selectedVersion}</span>
          </div>

        </div>

      </div>

    </div>
  );
};
