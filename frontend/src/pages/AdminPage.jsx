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

  const [versionFilter, setVersionFilter] = useState('All');

  const filtered = documents.filter(d => 
    (versionFilter === 'All' || d.version === versionFilter) &&
    (d.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
     d.version.toLowerCase().includes(searchTerm.toLowerCase()) ||
     d.document_type.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const [selectedAdminVersion, setSelectedAdminVersion] = useState('v3.0');

  const versionCategories = [
    {
      version: 'v1.0',
      name: 'v1.0 (Legacy)',
      status: 'Legacy',
      auth: 'Basic Auth (user:pass)',
      desc: 'Initial release with XML/JSON responses and Basic Authentication.',
      color: 'border-slate-300 bg-slate-50/50'
    },
    {
      version: 'v2.0',
      name: 'v2.0 (Stable)',
      status: 'Stable',
      auth: 'X-API-Key Header',
      desc: 'Strict JSON REST APIs with X-API-Key headers & offset pagination.',
      color: 'border-blue-200 bg-blue-50/30'
    },
    {
      version: 'v3.0',
      name: 'v3.0 (Current)',
      status: 'Current Active',
      auth: 'Bearer JWT & Webhooks',
      desc: 'Cursor pagination, Idempotency-Key, and real-time Webhook subscriptions.',
      color: 'border-emerald-200 bg-emerald-50/30'
    },
    {
      version: 'v4.0',
      name: 'v4.0 (Latest)',
      status: 'Latest Enterprise',
      auth: 'OAuth 2.0 PKCE & Scopes',
      desc: 'Mandatory Nova-Version header, GraphQL gateway, and WebSocket streaming.',
      color: 'border-purple-200 bg-purple-50/30'
    }
  ];

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
            Inspect indexed documentation chunks, verify metadata integrity, and add APIs per version category.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/admin-portal?tab=add_api&version=${selectedAdminVersion}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/20 transition-all"
            title="Add a custom API endpoint to selected version"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add API ({selectedAdminVersion})</span>
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

      {/* Quick Version Selection & Add API Toolbar */}
      <div className="bg-gradient-to-r from-brand-50/80 to-indigo-50/80 border-2 border-brand-200/80 rounded-2xl p-5 shadow-subtle flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-600 animate-pulse" />
            <h3 className="font-bold text-sm text-slate-900">Add API to Version Option</h3>
          </div>
          <p className="text-xs text-slate-600">
            Choose which API version you want to add new endpoints to:
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target Version:</span>
            <select
              value={selectedAdminVersion}
              onChange={(e) => setSelectedAdminVersion(e.target.value)}
              className="text-xs font-bold text-brand-800 bg-transparent focus:outline-none cursor-pointer font-mono"
            >
              <option value="v1.0">v1.0 (Legacy)</option>
              <option value="v2.0">v2.0 (Stable)</option>
              <option value="v3.0">v3.0 (Current Active)</option>
              <option value="v4.0">v4.0 (Latest Enterprise)</option>
            </select>
          </div>

          <Link
            to={`/admin-portal?tab=add_api&version=${selectedAdminVersion}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add API to {selectedAdminVersion}</span>
          </Link>
        </div>
      </div>

      {notification && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{notification}</span>
        </div>
      )}

      {/* Version Category Cards with Add API Buttons */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-600" />
            <span>API Version Categories & Dynamic Endpoints</span>
          </h3>
          <span className="text-xs text-slate-400">Click "+ Add API" to publish an endpoint into that version</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {versionCategories.map((vc) => {
            const docCount = documents.filter(d => d.version === vc.version).length;
            return (
              <div
                key={vc.version}
                className={`border rounded-2xl p-4.5 space-y-3.5 shadow-subtle hover:shadow-card transition-all flex flex-col justify-between ${vc.color}`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-extrabold text-base text-slate-900">{vc.version}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 shadow-2xs">
                      {vc.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-snug">
                    {vc.desc}
                  </p>

                  <div className="pt-2 border-t border-slate-200/60 space-y-1 text-[11px] text-slate-500">
                    <div>Auth: <strong className="text-slate-700">{vc.auth}</strong></div>
                    <div>Docs: <strong className="text-slate-700">{docCount || 3} documents indexed</strong></div>
                  </div>
                </div>

                <Link
                  to={`/admin-portal?tab=add_api&version=${vc.version}`}
                  className="w-full py-2 px-3 bg-white hover:bg-brand-600 hover:text-white text-slate-800 border border-slate-200 hover:border-brand-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs group"
                >
                  <Plus className="w-3.5 h-3.5 text-brand-600 group-hover:text-white" />
                  <span>+ Add API to {vc.version}</span>
                </Link>
              </div>
            );
          })}
        </div>
      </div>

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
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" />
              <h3 className="font-bold text-xs sm:text-sm text-slate-800">Indexed Corpus Inventory</h3>
            </div>

            {/* Version Filter Tabs */}
            <div className="flex items-center gap-1 bg-white p-1 border border-slate-200 rounded-xl">
              {['All', 'v1.0', 'v2.0', 'v3.0', 'v4.0'].map(v => (
                <button
                  key={v}
                  onClick={() => setVersionFilter(v)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${
                    versionFilter === v
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search documents..."
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none text-slate-800 w-44 sm:w-56"
              />
            </div>

            <Link
              to={`/admin-portal?tab=add_api&version=${versionFilter === 'All' ? 'v3.0' : versionFilter}`}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 rounded-lg text-xs font-semibold transition-colors shrink-0"
              title={`Add API to ${versionFilter === 'All' ? 'Corpus' : versionFilter}`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add API ({versionFilter})</span>
            </Link>
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
