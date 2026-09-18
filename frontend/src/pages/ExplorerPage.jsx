import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Code2, 
  Layers, 
  Search, 
  Sparkles, 
  ChevronRight, 
  FileText, 
  ExternalLink, 
  Tag, 
  Clock, 
  CheckCircle2, 
  GitBranch,
  Copy,
  Check,
  Download
} from 'lucide-react';
import { useDoc } from '../context/DocContext';
import { useChat } from '../context/ChatContext';
import { useNavigate } from 'react-router-dom';
import { downloadFile, copyToClipboard } from '../utils/downloadHelper';

export const ExplorerPage = () => {
  const { selectedVersion, setSelectedVersion, versions, openSourceInspector } = useDoc();
  const { sendMessage } = useChat();
  const navigate = useNavigate();

  const [documents, setDocuments] = useState([]);
  const [activeDocId, setActiveDocId] = useState('api_reference');
  const [activeDocDetail, setActiveDocDetail] = useState(null);
  const [filterQuery, setFilterQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedDoc, setCopiedDoc] = useState(false);

  useEffect(() => {
    fetch('http://localhost:8000/api/documents')
      .then(res => res.json())
      .then(data => {
        setDocuments(data.documents || []);
      })
      .catch(err => console.error("Error fetching documents:", err));
  }, []);

  useEffect(() => {
    if (!activeDocId) return;
    setLoading(true);
    fetch(`http://localhost:8000/api/documents/${activeDocId}`)
      .then(res => res.json())
      .then(data => {
        setActiveDocDetail(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching doc details:", err);
        setLoading(false);
      });
  }, [activeDocId]);

  const handleAskAIAboutThisPage = () => {
    if (activeDocDetail) {
      sendMessage(`Explain the core requirements and endpoints in ${activeDocDetail.title} for version ${activeDocDetail.version}.`, activeDocDetail.version);
      navigate('/assistant');
    }
  };

  const handleCopyDoc = async () => {
    if (!activeDocDetail?.content) return;
    const success = await copyToClipboard(activeDocDetail.content);
    if (success) {
      setCopiedDoc(true);
      setTimeout(() => setCopiedDoc(false), 2000);
    }
  };

  const handleDownloadDoc = () => {
    if (!activeDocDetail?.content) return;
    const filename = `${activeDocDetail.id || 'document'}_${activeDocDetail.version || 'v3.0'}.md`;
    downloadFile(activeDocDetail.content, filename);
  };

  const filteredDocs = documents.filter(d => 
    (selectedVersion === 'All' || d.version === selectedVersion) &&
    (d.title.toLowerCase().includes(filterQuery.toLowerCase()) || d.document_type.toLowerCase().includes(filterQuery.toLowerCase()))
  );

  return (
    <div className="flex h-[calc(100vh-4.1rem)] bg-[#F8FAFC] overflow-hidden">
      
      {/* Left Sidebar: Document Categories & Files List */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col justify-between hidden md:flex shrink-0">
        
        {/* Search & Version Controls */}
        <div className="p-3.5 border-b border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-brand-600" />
              Documentation Explorer
            </span>
            <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
              {selectedVersion}
            </span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filter topics..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 text-slate-800 placeholder-slate-400"
            />
          </div>
        </div>

        {/* Document List */}
        <div className="p-2 space-y-1 overflow-y-auto flex-1">
          {filteredDocs.length > 0 ? (
            filteredDocs.map((doc) => (
              <div
                key={doc.id}
                onClick={() => setActiveDocId(doc.id)}
                className={`p-2.5 rounded-lg cursor-pointer transition-all text-xs space-y-1 ${
                  activeDocId === doc.id
                    ? 'bg-brand-50 text-brand-900 border border-brand-200/80 font-medium'
                    : 'text-slate-700 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold truncate text-slate-900">{doc.title}</span>
                  <span className="px-1.5 py-0.2 text-[10px] font-bold bg-slate-100 text-slate-700 rounded border border-slate-200 shrink-0">
                    {doc.version}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="capitalize">{doc.document_type.replace('_', ' ')}</span>
                  <span>•</span>
                  <span>{doc.chunk_count || 4} chunks</span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-xs text-slate-400">
              No documents found for {selectedVersion}. Try selecting "All Versions".
            </div>
          )}
        </div>

        {/* Quick Version Switcher */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/70 text-xs flex items-center justify-between">
          <span className="text-[11px] text-slate-500">Filter Version:</span>
          <select
            value={selectedVersion}
            onChange={(e) => setSelectedVersion(e.target.value)}
            className="bg-white border border-slate-200 rounded px-2 py-1 text-xs font-semibold text-slate-800"
          >
            <option value="All">All Versions</option>
            {versions.map(v => (
              <option key={v.version} value={v.version}>{v.version}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Main Document Reader Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
        
        {loading ? (
          <div className="h-64 flex items-center justify-center text-slate-400 text-xs animate-pulse">
            Loading document content and section tree...
          </div>
        ) : activeDocDetail ? (
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Document Header Banner */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-subtle space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200 rounded-md font-mono">
                      {activeDocDetail.version}
                    </span>
                    <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 rounded-md capitalize">
                      {activeDocDetail.document_type?.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-400">• Updated September 2026</span>
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900">{activeDocDetail.title}</h1>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleCopyDoc}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-all shadow-2xs"
                    title="Copy entire document content"
                  >
                    {copiedDoc ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedDoc ? 'Copied' : 'Copy Doc'}</span>
                  </button>
                  <button
                    onClick={handleDownloadDoc}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-all shadow-2xs"
                    title="Download document as Markdown (.md)"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download (.md)</span>
                  </button>
                  <button
                    onClick={handleAskAIAboutThisPage}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Ask AI About This Page</span>
                  </button>
                </div>
              </div>

              {/* Chunks overview pills */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Indexed Chunks:
                </span>
                {activeDocDetail.chunks?.map((c, i) => (
                  <button
                    key={c.chunk_id}
                    onClick={() => openSourceInspector({
                      document: activeDocDetail.title,
                      document_id: activeDocDetail.id,
                      version: activeDocDetail.version,
                      section: c.section,
                      page: c.page,
                      chunk_id: c.chunk_id,
                      relevance: 98,
                      text: c.text,
                      document_type: activeDocDetail.document_type
                    })}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 hover:bg-brand-50 hover:text-brand-700 border border-slate-200 rounded-md text-[11px] font-mono text-slate-600 transition-colors"
                  >
                    <span>§ {c.section}</span>
                    <span className="text-slate-400">p.{c.page}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Structured Content Viewer */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-card space-y-6 text-sm text-slate-800 leading-relaxed">
              <div className="prose prose-slate max-w-none font-sans whitespace-pre-wrap">
                {activeDocDetail.content}
              </div>
            </div>

          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400 text-xs">
            Select a document from the left explorer.
          </div>
        )}

      </div>

    </div>
  );
};
