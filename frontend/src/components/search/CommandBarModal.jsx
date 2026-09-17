import React, { useState, useEffect } from 'react';
import { Search, X, Layers, ExternalLink, ArrowRight, CornerDownLeft, Sparkles, FileText } from 'lucide-react';
import { useDoc } from '../../context/DocContext';

export const CommandBarModal = () => {
  const { searchModalOpen, setSearchModalOpen, selectedVersion, setSelectedVersion, openSourceInspector, versions } = useDoc();
  const [query, setQuery] = useState('');
  const [activeVersionFilter, setActiveVersionFilter] = useState('All');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!searchModalOpen) {
      setQuery('');
      setResults([]);
      return;
    }
  }, [searchModalOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      setLoading(true);
      const vParam = activeVersionFilter === 'All' ? '' : `&version=${activeVersionFilter}`;
      fetch(`http://localhost:8000/api/search?q=${encodeURIComponent(query)}${vParam}&limit=8`)
        .then(res => res.json())
        .then(data => {
          setResults(data.results || []);
          setLoading(false);
        })
        .catch(err => {
          console.error("Search error:", err);
          setLoading(false);
        });
    }, 180);

    return () => clearTimeout(timer);
  }, [query, activeVersionFilter]);

  if (!searchModalOpen) return null;

  const handleSelectResult = (item) => {
    openSourceInspector({
      document: item.title,
      document_id: item.document_id,
      version: item.version,
      section: item.section,
      page: item.page,
      chunk_id: item.chunk_id,
      relevance: item.relevance_pct,
      text: item.snippet,
      document_type: item.document_type
    });
    setSearchModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3 border-b border-slate-200">
          <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search API reference, authentication, migration steps..."
            className="w-full text-base bg-transparent border-none focus:outline-none placeholder-slate-400 text-slate-900"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setSearchModalOpen(false)}
            className="px-2 py-0.5 text-xs text-slate-400 hover:text-slate-600 bg-slate-100 rounded border border-slate-200"
          >
            ESC
          </button>
        </div>

        {/* Version Filter Pills */}
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto text-xs">
          <span className="text-slate-400 text-[11px] font-medium mr-1 flex items-center gap-1">
            <Layers className="w-3 h-3" /> Version:
          </span>
          {['All', 'v1.0', 'v2.0', 'v3.0', 'v4.0'].map(v => (
            <button
              key={v}
              onClick={() => setActiveVersionFilter(v)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                activeVersionFilter === v
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
              }`}
            >
              {v === 'All' ? 'All Versions' : v}
            </button>
          ))}
        </div>

        {/* Search Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 divide-y divide-slate-100">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400 animate-pulse">
              Searching knowledge corpus across versions...
            </div>
          ) : results.length > 0 ? (
            results.map((item, idx) => (
              <div
                key={idx}
                onClick={() => handleSelectResult(item)}
                className="p-3 hover:bg-brand-50/50 rounded-xl cursor-pointer transition-colors group flex items-start justify-between gap-4"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-slate-900 group-hover:text-brand-700 transition-colors">
                      {item.title}
                    </span>
                    <span className="px-1.5 py-0.2 text-[10px] font-bold bg-slate-100 text-slate-700 rounded border border-slate-200">
                      {item.version}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      § {item.section}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2 font-mono leading-relaxed bg-slate-50 group-hover:bg-white p-1.5 rounded border border-slate-100">
                    {item.snippet}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0 pt-0.5">
                  <span className="text-[10px] font-bold font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    {item.relevance_pct}% match
                  </span>
                  <span className="text-[10px] text-slate-400 group-hover:text-brand-600 flex items-center gap-0.5">
                    Open <ArrowRight className="w-2.5 h-2.5" />
                  </span>
                </div>
              </div>
            ))
          ) : query ? (
            <div className="p-8 text-center space-y-1">
              <p className="text-xs font-semibold text-slate-700">No matching documentation found</p>
              <p className="text-[11px] text-slate-400">Try searching for authentication, endpoints, or migration.</p>
            </div>
          ) : (
            <div className="p-6 space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block px-1">
                Suggested Searches
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  { q: 'authentication in v3', v: 'v3.0' },
                  { q: 'create user endpoint v4', v: 'v4.0' },
                  { q: 'migration v2 to v3', v: 'v3.0' },
                  { q: 'rate limit headers in v2', v: 'v2.0' },
                  { q: 'webhooks HMAC signature', v: 'v3.0' },
                  { q: 'OAuth 2.0 PKCE flow', v: 'v4.0' },
                ].map((s, i) => (
                  <button
                    key={i}
                    onClick={() => { setQuery(s.q); setActiveVersionFilter(s.v); }}
                    className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-700 text-left border border-slate-200/70 transition-colors"
                  >
                    <span>{s.q}</span>
                    <span className="text-[10px] font-mono text-slate-400">{s.v}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded font-mono">↵</kbd> to select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded font-mono">esc</kbd> to dismiss
            </span>
          </div>
          <span className="font-medium text-slate-500">NovaAPI Version-Aware RAG</span>
        </div>

      </div>
    </div>
  );
};
