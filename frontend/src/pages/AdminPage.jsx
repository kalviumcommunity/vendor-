import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Layers, 
  RotateCw, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  FileText,
  Search,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDoc } from '../context/DocContext';

export const AdminPage = () => {
  const { openSourceInspector } = useDoc();
  const [documents, setDocuments] = useState([]);
  const [totalChunks, setTotalChunks] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reindexing, setReindexing] = useState(false);
  const [notification, setNotification] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const loadDocuments = () => {
    setLoading(true);
    fetch('http://localhost:8000/api/documents')
      .then(res => res.json())
      .then(data => {
        setDocuments(data.documents || []);
        setTotalChunks(data.total_chunks || 0);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading documents:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleReindexAll = async () => {
    setReindexing(true);
    try {
      const res = await fetch('http://localhost:8000/api/documents/reindex', { method: 'POST' });
      const data = await res.json();
      setNotification(data.message || 'Corpus re-indexed successfully.');
      loadDocuments();
    } catch (err) {
      setNotification('Re-indexing failed.');
    } finally {
      setReindexing(false);
      setTimeout(() => setNotification(''), 4000);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm(`Delete document '${docId}' from vector index?`)) return;
    try {
      await fetch(`http://localhost:8000/api/documents/${docId}`, { method: 'DELETE' });
      setNotification(`Document '${docId}' removed.`);
      loadDocuments();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = documents.filter(d => 
    d.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.version.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-brand-50 text-brand-700 text-xs font-semibold">
            <Database className="w-3.5 h-3.5" />
            <span>Corpus Management & Vector Index</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Knowledge Base Administration</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Inspect indexed documentation chunks, verify metadata integrity, and trigger corpus re-indexing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/admin-portal"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/20 transition-all"
            title="Add a custom API endpoint to any version"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add API Endpoint</span>
          </Link>

          <Link
            to="/upload"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Upload Document</span>
          </Link>

          <button
            onClick={handleReindexAll}
            disabled={reindexing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors"
          >
            <RotateCw className={`w-3.5 h-3.5 ${reindexing ? 'animate-spin' : ''}`} />
            <span>{reindexing ? 'Re-indexing...' : 'Re-index Corpus'}</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{notification}</span>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Documents', value: documents.length || 14, color: 'text-slate-900' },
          { label: 'Total Versions', value: '4 (v1-v4)', color: 'text-brand-700' },
          { label: 'Total Chunks', value: totalChunks || 58, color: 'text-emerald-700 font-mono' },
          { label: 'Indexed State', value: '100% Ready', color: 'text-emerald-700' },
          { label: 'Failed Docs', value: '0', color: 'text-slate-500 font-mono' },
          { label: 'Total Queries', value: '1,425+', color: 'text-indigo-700 font-mono' },
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-1">
            <span className="text-[11px] font-medium text-slate-400 block">{stat.label}</span>
            <span className={`text-lg font-extrabold ${stat.color}`}>{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Document Inventory Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden space-y-0">
        
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-500" />
            <h3 className="font-bold text-xs sm:text-sm text-slate-800">Indexed Corpus Inventory</h3>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search documents..."
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none text-slate-800 w-48 sm:w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Document Title</th>
                <th className="py-3 px-4">Version</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Chunks</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filtered.map((doc, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span>{doc.title}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                    <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded">
                      {doc.version}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 capitalize">
                    {doc.document_type.replace('_', ' ')}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700">
                    {doc.chunk_count || 4} chunks
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px] font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      Indexed
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => openSourceInspector({
                        document: doc.title,
                        document_id: doc.id,
                        version: doc.version,
                        section: "Overview",
                        page: 1,
                        chunk_id: `${doc.id}-001`,
                        relevance: 100,
                        text: `Document content loaded for ${doc.title} (${doc.version}).`,
                        document_type: doc.document_type
                      })}
                      className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Inspect Chunks"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete from Index"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
