import React, { useState } from 'react';
import { 
  History, 
  Sparkles, 
  Layers, 
  Calendar, 
  Tag, 
  AlertCircle, 
  PlusCircle, 
  RefreshCw, 
  CheckCircle2, 
  Ban, 
  Wrench,
  ExternalLink,
  Copy,
  Check,
  Download
} from 'lucide-react';
import { useDoc } from '../context/DocContext';
import { useChat } from '../context/ChatContext';
import { useNavigate } from 'react-router-dom';
import { downloadFile, copyToClipboard } from '../utils/downloadHelper';

export const ChangelogPage = () => {
  const { setSelectedVersion } = useDoc();
  const { sendMessage } = useChat();
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState('all');
  const [versionFilter, setVersionFilter] = useState('All');
  const [copiedRelIdx, setCopiedRelIdx] = useState(null);

  const releases = [
    {
      version: 'v4.2.0',
      date: 'September 2026',
      status: 'latest',
      highlights: 'Webhook DLQ replay, GraphQL complexity cost headers, adaptive 5k req/min limits.',
      changes: [
        { type: 'new', text: 'Real-time webhook payload replay and dead-letter queue inspection in Developer Console.' },
        { type: 'new', text: 'Enhanced GraphQL query complexity limits and automatic cost analysis headers.' },
        { type: 'changed', text: 'Adaptive rate limits upgraded to 5,000 requests/minute for Enterprise accounts.' },
        { type: 'fixed', text: 'Fixed WebSocket reconnection backoff on transient network partitions.' }
      ]
    },
    {
      version: 'v4.0.0',
      date: 'August 2026',
      status: 'major',
      highlights: 'OAuth 2.0 PKCE, granular scopes, GraphQL gateway, real-time WebSocket subscriptions.',
      changes: [
        { type: 'breaking', text: 'Replaced static JWTs with OAuth 2.0 PKCE and granular scopes (users:read, users:write).' },
        { type: 'breaking', text: 'Mandatory Nova-Version: 2026-08-01 header required on all HTTP requests.' },
        { type: 'breaking', text: 'Replaced role string with role_id UUID and added required tenant_id on user mutations.' },
        { type: 'new', text: 'GraphQL endpoint available at /api/v4/graphql.' },
        { type: 'new', text: 'WebSockets event streaming at wss://stream.novacloud.io/v4/events.' }
      ]
    },
    {
      version: 'v3.2.0',
      date: 'December 2024',
      status: 'minor',
      highlights: 'Webhook signature timestamp tolerance, batch user updates.',
      changes: [
        { type: 'new', text: 'Webhook signature verification improvements with timestamp tolerance checks.' },
        { type: 'new', text: 'Added batch user status updates endpoint (POST /api/v3/users/batch-status).' },
        { type: 'fixed', text: 'Fixed cursor serialization bug on edge-case empty collections.' }
      ]
    },
    {
      version: 'v3.0.0',
      date: 'September 2024',
      status: 'major',
      highlights: 'Bearer JWT tokens, cursor pagination, webhooks subsystem, Idempotency-Key support.',
      changes: [
        { type: 'breaking', text: 'Replaced static X-API-Key with OAuth-style JWT Bearer tokens via Authorization: Bearer <token>.' },
        { type: 'breaking', text: 'Switched all list endpoints to cursor pagination (starting_after / ending_before).' },
        { type: 'breaking', text: 'Standardized rate limit headers to RateLimit-* (dropping X- prefix).' },
        { type: 'new', text: 'Added Webhooks subsystem (POST /api/v3/webhooks).' },
        { type: 'new', text: 'Added Idempotency-Key header support for safe POST retries.' },
        { type: 'changed', text: 'Increased rate limit ceiling to 1,000 requests per minute.' }
      ]
    },
    {
      version: 'v2.4.0',
      date: 'March 2024',
      status: 'minor',
      highlights: 'Projects API, offset pagination improvements.',
      changes: [
        { type: 'new', text: 'Added Projects API (POST /api/v2/projects, GET /api/v2/projects).' },
        { type: 'changed', text: 'User listing pagination improved with offset/limit parameters.' },
        { type: 'fixed', text: 'Fixed timestamp parsing bug on timezone offsets.' }
      ]
    },
    {
      version: 'v2.0.0',
      date: 'November 2023',
      status: 'major',
      highlights: 'Pure RESTful JSON APIs, X-API-Key header auth, 300 req/min rate limit.',
      changes: [
        { type: 'breaking', text: 'Replaced Basic Authentication with X-API-Key headers.' },
        { type: 'breaking', text: 'Dropped XML format support; API is strictly JSON.' },
        { type: 'breaking', text: 'Renamed user creation parameters (user_name -> username, user_email -> email).' },
        { type: 'new', text: 'Added standardized rate limit headers (X-RateLimit-Limit, X-RateLimit-Remaining).' },
        { type: 'changed', text: 'Increased rate limit to 300 req/min.' }
      ]
    },
    {
      version: 'v1.0.0',
      date: 'January 2023',
      status: 'initial',
      highlights: 'Initial launch of NovaAPI with Basic Auth and XML/JSON parsing.',
      changes: [
        { type: 'new', text: 'Launch of NovaAPI v1.0 core service.' },
        { type: 'new', text: 'Basic Auth credential verification.' },
        { type: 'new', text: 'User management endpoints (/user/create, /user/profile).' }
      ]
    }
  ];

  const handleAskAboutRelease = (rel) => {
    const vPrefix = rel.version.slice(0, 2) + '.0';
    sendMessage(`Summarize all major additions and breaking changes introduced in NovaAPI release ${rel.version} (${rel.date}).`, vPrefix, 'changelog');
    navigate('/assistant');
  };

  const handleCopyRelease = async (rel, idx) => {
    let md = `# NovaAPI Release ${rel.version} (${rel.date})\n\n`;
    md += `**Highlights**: ${rel.highlights}\n\n`;
    md += `## Changes\n`;
    rel.changes.forEach(c => {
      md += `- [${c.type.toUpperCase()}] ${c.text}\n`;
    });
    const success = await copyToClipboard(md);
    if (success) {
      setCopiedRelIdx(idx);
      setTimeout(() => setCopiedRelIdx(null), 2000);
    }
  };

  const handleDownloadRelease = (rel) => {
    let md = `# NovaAPI Release ${rel.version} (${rel.date})\n\n`;
    md += `**Highlights**: ${rel.highlights}\n\n`;
    md += `## Changes\n`;
    rel.changes.forEach(c => {
      md += `- [${c.type.toUpperCase()}] ${c.text}\n`;
    });
    downloadFile(md, `nova_api_release_${rel.version}.md`);
  };

  const getTagBadge = (type) => {
    switch (type) {
      case 'breaking':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 rounded uppercase">Breaking</span>;
      case 'new':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded uppercase">New</span>;
      case 'changed':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded uppercase">Changed</span>;
      case 'deprecated':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded uppercase">Deprecated</span>;
      case 'fixed':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 rounded uppercase">Fixed</span>;
      default:
        return null;
    }
  };

  const filteredReleases = releases.filter(r => {
    if (versionFilter !== 'All' && !r.version.startsWith(versionFilter.slice(0, 2))) return false;
    if (activeCategory === 'all') return true;
    return r.changes.some(c => c.type === activeCategory);
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-brand-50 text-brand-700 text-xs font-semibold">
            <History className="w-3.5 h-3.5" />
            <span>Changelog & Release Notes Timeline</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Product Evolution & Version History</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Track API deprecations, new endpoints, and enhancements across all releases.
          </p>
        </div>

        {/* Version Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Version:</span>
          <select
            value={versionFilter}
            onChange={(e) => setVersionFilter(e.target.value)}
            className="bg-white border border-slate-200 text-xs font-bold text-slate-800 rounded-lg px-2.5 py-1.5 focus:outline-none"
          >
            <option value="All">All Releases</option>
            <option value="v4.0">v4.x Releases</option>
            <option value="v3.0">v3.x Releases</option>
            <option value="v2.0">v2.x Releases</option>
            <option value="v1.0">v1.x Releases</option>
          </select>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {[
          { id: 'all', label: 'All Changes' },
          { id: 'breaking', label: 'Breaking Changes' },
          { id: 'new', label: 'New Features' },
          { id: 'changed', label: 'Changed' },
          { id: 'deprecated', label: 'Deprecated' },
          { id: 'fixed', label: 'Fixed' }
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeCategory === cat.id
                ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Timeline List */}
      <div className="relative border-l-2 border-slate-200 ml-4 space-y-8 pl-6">
        {filteredReleases.map((rel, idx) => (
          <div key={idx} className="relative space-y-4">
            
            {/* Timeline node icon */}
            <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-white border-4 border-brand-600 shadow-2xs" />

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-subtle space-y-4">
              
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl font-extrabold text-slate-900 font-mono">{rel.version}</span>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {rel.date}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleCopyRelease(rel, idx)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 text-xs font-medium rounded-lg border border-slate-200 transition-colors"
                    title="Copy release notes"
                  >
                    {copiedRelIdx === idx ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedRelIdx === idx ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={() => handleDownloadRelease(rel)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 text-xs font-medium rounded-lg border border-slate-200 transition-colors"
                    title="Download release notes as Markdown (.md)"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download (.md)</span>
                  </button>
                  <button
                    onClick={() => handleAskAboutRelease(rel)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-semibold rounded-lg border border-brand-200/70 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Ask AI About This Release</span>
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-600 italic">
                {rel.highlights}
              </p>

              <div className="space-y-2 pt-1">
                {rel.changes
                  .filter(c => activeCategory === 'all' || c.type === activeCategory)
                  .map((change, cIdx) => (
                    <div key={cIdx} className="flex items-start gap-2.5 text-xs text-slate-800">
                      <div className="shrink-0 mt-0.5">{getTagBadge(change.type)}</div>
                      <span className="leading-relaxed">{change.text}</span>
                    </div>
                  ))}
              </div>

            </div>

          </div>
        ))}
      </div>

    </div>
  );
};
