import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Calendar, 
  Lock, 
  Zap, 
  FileText,
  Sparkles,
  Plus
} from 'lucide-react';
import { useDoc } from '../context/DocContext';
import { Link } from 'react-router-dom';

export const VersionsPage = () => {
  const { selectedVersion, setSelectedVersion } = useDoc();
  const [versionsData, setVersionsData] = useState([]);
  const [matrixData, setMatrixData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('http://localhost:8000/api/versions').then(r => r.json()),
      fetch('http://localhost:8000/api/versions/matrix').then(r => r.json())
    ]).then(([vData, mData]) => {
      setVersionsData(vData.available_versions || []);
      setMatrixData(mData.matrix || []);
      setLoading(false);
    }).catch(err => {
      console.error("Error loading versions:", err);
      setLoading(false);
    });
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'legacy':
        return <span className="px-2 py-0.5 text-[11px] font-bold bg-slate-100 text-slate-600 rounded border border-slate-300">Legacy</span>;
      case 'stable':
        return <span className="px-2 py-0.5 text-[11px] font-bold bg-blue-50 text-blue-700 rounded border border-blue-200">Stable</span>;
      case 'current':
        return <span className="px-2 py-0.5 text-[11px] font-bold bg-emerald-50 text-emerald-700 rounded border border-emerald-200">Current (Active)</span>;
      case 'latest':
        return <span className="px-2 py-0.5 text-[11px] font-bold bg-purple-50 text-purple-700 rounded border border-purple-200">Latest (v4)</span>;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-10">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-brand-50 text-brand-700 text-xs font-semibold">
            <Layers className="w-3.5 h-3.5" />
            <span>Product Lifecycle & Metadata</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">NovaAPI Versions & Compatibility Matrix</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Compare API architecture across releases and switch the active RAG retrieval context.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-2 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium pl-2">Current Active Context:</span>
          <span className="px-3 py-1 bg-slate-900 text-white font-mono text-xs font-bold rounded-lg">
            {selectedVersion}
          </span>
        </div>
      </div>

      {/* Version Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {versionsData.map((v) => {
          const isSelected = selectedVersion === v.version;
          return (
            <div
              key={v.version}
              className={`bg-white rounded-2xl border p-5 space-y-4 transition-all shadow-subtle hover:shadow-card flex flex-col justify-between ${
                isSelected
                  ? 'border-brand-500 ring-2 ring-brand-500/20 shadow-md'
                  : 'border-slate-200'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xl font-extrabold text-slate-900 font-mono">{v.version}</span>
                  {getStatusBadge(v.status)}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed min-h-[36px]">
                  {v.description}
                </p>

                <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-400">Release Date</span>
                    <span className="font-medium text-slate-800">{v.release_date}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-400">Auth Method</span>
                    <span className="font-semibold text-slate-800 text-[11px] truncate max-w-[130px]" title={v.auth_method}>
                      {v.auth_method}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-400">Rate Limit</span>
                    <span className="font-medium text-slate-800 font-mono text-[11px]">{v.rate_limit}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-400">Indexed Docs</span>
                    <span className="font-semibold text-slate-800">{v.doc_count} files</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <button
                  onClick={() => setSelectedVersion(v.version)}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200/80 text-slate-800'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Active Context</span>
                    </>
                  ) : (
                    <span>Set as Active Version</span>
                  )}
                </button>

                <Link
                  to={`/admin-portal?tab=add_api&version=${v.version}`}
                  className="w-full py-1.5 px-3 bg-white hover:bg-brand-50 text-brand-700 hover:text-brand-800 border border-brand-200/80 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                  title={`Add custom API endpoint to ${v.version}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add API to {v.version}</span>
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Side-by-Side Feature Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-card space-y-0">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-600" />
            <h3 className="font-bold text-sm text-slate-900">Comprehensive API Feature Matrix</h3>
          </div>
          <span className="text-xs text-slate-500">Metadata filtering applied in RAG</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Feature / Capability</th>
                <th className="py-3 px-4">v1.0 (Legacy)</th>
                <th className="py-3 px-4">v2.0 (Stable)</th>
                <th className="py-3 px-4">v3.0 (Current)</th>
                <th className="py-3 px-4 bg-brand-50/50 text-brand-900">v4.0 (Latest)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[12px]">
              {matrixData.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-sans font-semibold text-slate-900 bg-slate-50/40">
                    {row.feature}
                  </td>
                  <td className="py-3 px-4 text-slate-600">{row.v1}</td>
                  <td className="py-3 px-4 text-slate-700">{row.v2}</td>
                  <td className="py-3 px-4 text-emerald-700 font-medium">{row.v3}</td>
                  <td className="py-3 px-4 text-brand-700 font-semibold bg-brand-50/30">{row.v4}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
