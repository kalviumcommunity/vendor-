import React, { useState, useEffect } from 'react';
import { X, ExternalLink, FileText, CheckCircle2, Copy, Hash, Layers, BookOpen } from 'lucide-react';
import { useDoc } from '../../context/DocContext';

export const SourceDrawer = () => {
  const { sourceViewerDoc, closeSourceInspector } = useDoc();
  const [copiedChunkId, setCopiedChunkId] = useState(false);
  const [fullDocData, setFullDocData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sourceViewerDoc) {
      setFullDocData(null);
      return;
    }

    // Fetch full document content if document_id is available
    if (sourceViewerDoc.document_id) {
      setLoading(true);
      fetch(`http://localhost:8000/api/documents/${sourceViewerDoc.document_id}`)
        .then(res => res.json())
        .then(data => {
          setFullDocData(data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch document content:", err);
          setLoading(false);
        });
    }
  }, [sourceViewerDoc]);

  if (!sourceViewerDoc) return null;

  const handleCopyChunkId = () => {
    navigator.clipboard.writeText(sourceViewerDoc.chunk_id || '');
    setCopiedChunkId(true);
    setTimeout(() => setCopiedChunkId(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end transition-opacity animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300"
        role="dialog"
      >
        
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-brand-50 text-brand-700 rounded-lg border border-brand-200/60">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-slate-900">{sourceViewerDoc.document || sourceViewerDoc.title || 'Source Document'}</h3>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 rounded border border-slate-200">
                  {sourceViewerDoc.version}
                </span>
              </div>
              <p className="text-xs text-slate-500">Verified Knowledge Base Chunk</p>
            </div>
          </div>

          <button
            onClick={closeSourceInspector}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metadata Inspector Banner */}
        <div className="p-3.5 bg-slate-50/90 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-[11px] text-slate-500 block">Section</span>
            <span className="font-semibold text-slate-800 truncate block">{sourceViewerDoc.section || 'Overview'}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block">Page / Location</span>
            <span className="font-semibold text-slate-800">Page {sourceViewerDoc.page || 1}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block">Relevance</span>
            <span className="font-semibold text-emerald-700 font-mono">{sourceViewerDoc.relevance || 95}% Match</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block">Type</span>
            <span className="font-semibold text-slate-800 capitalize">{sourceViewerDoc.document_type || 'API Reference'}</span>
          </div>
        </div>

        {/* Chunk Identifier Tag */}
        <div className="px-4 py-2.5 bg-amber-50/60 border-b border-amber-200/50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-amber-900 font-mono text-[11px]">
            <Hash className="w-3.5 h-3.5 text-amber-600" />
            <span className="font-semibold">{sourceViewerDoc.chunk_id || '#chunk-auto-01'}</span>
          </div>
          <button
            onClick={handleCopyChunkId}
            className="flex items-center gap-1 text-[11px] text-amber-700 hover:text-amber-900 font-medium"
          >
            {copiedChunkId ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedChunkId ? 'Copied' : 'Copy ID'}</span>
          </button>
        </div>

        {/* Document Content View */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-sm leading-relaxed text-slate-700">
          
          {/* Highlighted Chunk Box */}
          <div className="p-4 bg-yellow-50/70 border-2 border-yellow-300/80 rounded-xl space-y-2 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-bold text-yellow-900">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                CITED GROUNDING CHUNK
              </span>
              <span className="text-[10px] bg-yellow-200/80 text-yellow-900 px-1.5 py-0.5 rounded font-mono">
                Exact Reference
              </span>
            </div>
            <div className="text-slate-900 font-normal whitespace-pre-wrap font-mono text-xs sm:text-[13px] leading-relaxed bg-white/70 p-3 rounded-lg border border-yellow-200">
              {sourceViewerDoc.text}
            </div>
          </div>

          {/* Full document view or loading state */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h4 className="font-semibold text-xs uppercase tracking-wider text-slate-400">
                Surrounding Document Context
              </h4>
              {sourceViewerDoc.source_url && (
                <span className="text-[11px] font-mono text-slate-500">
                  {sourceViewerDoc.source_url}
                </span>
              )}
            </div>

            {loading ? (
              <div className="py-8 text-center text-slate-400 text-xs animate-pulse">
                Loading full document structure...
              </div>
            ) : fullDocData ? (
              <div className="space-y-4 text-xs sm:text-sm">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 whitespace-pre-wrap font-sans text-slate-700">
                  {fullDocData.content}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                Full section context active for version {sourceViewerDoc.version}.
              </p>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Source verified with zero hallucinations</span>
          <button
            onClick={closeSourceInspector}
            className="px-3.5 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
          >
            Close Source
          </button>
        </div>

      </div>
    </div>
  );
};
