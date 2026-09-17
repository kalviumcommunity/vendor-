import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Layers, 
  GitCompare, 
  FileText, 
  Search, 
  CheckCircle2, 
  ExternalLink,
  Code2,
  Database,
  Activity,
  Zap,
  Terminal
} from 'lucide-react';
import { useDoc } from '../context/DocContext';

export const LandingPage = () => {
  const { openSourceInspector } = useDoc();
  const [demoVersion, setDemoVersion] = useState('v3.0');

  const demoScenarios = {
    'v1.0': {
      question: "How do I authenticate with the API in v1?",
      answer: "In NovaAPI v1.0, authentication is performed using HTTP Basic Authentication over HTTPS [1]. You pass your username and API secret key as base64-encoded credentials in the Authorization header.",
      code: `Authorization: Basic <base64(username:secret_key)>\ncurl -X GET https://api.novacloud.io/v1/user/profile \\\n  -u "my_username:nova_sec_991823"`,
      source: {
        document: "NovaAPI v1.0 Reference Manual",
        document_id: "api_reference",
        version: "v1.0",
        section: "Authentication",
        page: 14,
        chunk_id: "api_reference-v1_0-authentica-001",
        relevance: 98,
        text: "Authentication in v1.0 uses HTTP Basic Authentication over HTTPS. You must pass your account username and secret API key as base64 encoded credentials in the Authorization header.",
        document_type: "api_reference"
      }
    },
    'v2.0': {
      question: "How do I authenticate with the API in v2?",
      answer: "In NovaAPI v2.0, authentication requires a dedicated API Key passed via the X-API-Key HTTP header [1]. Basic Authentication is discontinued and returns HTTP 401 Unauthorized.",
      code: `X-API-Key: nova_live_a98f7b6c5d4e3f2a1b\ncurl -X GET https://api.novacloud.io/v2/users \\\n  -H "X-API-Key: nova_live_a98f7b6c5d4e3f2a1b"`,
      source: {
        document: "NovaAPI v2.0 RESTful Reference",
        document_id: "api_reference",
        version: "v2.0",
        section: "Authentication",
        page: 14,
        chunk_id: "api_reference-v2_0-authentica-001",
        relevance: 97,
        text: "Authentication in v2.0 requires an API Key sent via the X-API-Key HTTP header. Basic Authentication is no longer accepted and will return HTTP 401 Unauthorized.",
        document_type: "api_reference"
      }
    },
    'v3.0': {
      question: "How do I authenticate in API v3?",
      answer: "API v3 uses Bearer token authentication in the standard Authorization header [1]. Static API keys are deprecated and will return HTTP 401. You must exchange client credentials via POST /api/v3/auth/tokens to receive a 1-hour JWT token.",
      code: `Authorization: Bearer <jwt_access_token>\ncurl -X POST https://api.novacloud.io/v3/auth/tokens \\\n  -d '{"client_id": "client_live_8819", "client_secret": "sec_jwt_secret_0128"}'`,
      source: {
        document: "NovaAPI v3.0 Developer Reference",
        document_id: "api_reference",
        version: "v3.0",
        section: "Authentication",
        page: 14,
        chunk_id: "api_reference-v3_0-authentica-001",
        relevance: 96,
        text: "Authentication in v3.0 uses Bearer token authentication in the standard Authorization header. Static API keys in X-API-Key headers are deprecated and will return HTTP 401 Unauthorized in v3.",
        document_type: "api_reference"
      }
    },
    'v4.0': {
      question: "How do I authenticate with the API in v4?",
      answer: "NovaAPI v4.0 requires OAuth 2.0 with PKCE and granular scopes (e.g. users:read, users:write) [1]. Requests must also pass the mandatory Nova-Version: 2026-08-01 header.",
      code: `Authorization: Bearer <oauth2_scoped_token>\nNova-Version: 2026-08-01\ncurl -X GET https://api.novacloud.io/v4/users \\\n  -H "Authorization: Bearer nova_tok_oauth2_scoped_882918"`,
      source: {
        document: "NovaAPI v4.0 Modern Enterprise Reference",
        document_id: "api_reference",
        version: "v4.0",
        section: "Authentication",
        page: 14,
        chunk_id: "api_reference-v4_0-authentica-001",
        relevance: 99,
        text: "Authentication in v4.0 requires OAuth 2.0 Access Tokens with strict granular scopes. Tokens are passed in the Authorization header with the Bearer scheme alongside the Nova-Version header.",
        document_type: "api_reference"
      }
    }
  };

  const activeDemo = demoScenarios[demoVersion];

  return (
    <div className="space-y-16 pb-16">
      
      {/* Hero Section */}
      <section className="relative pt-12 pb-8 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200/80 text-brand-700 text-xs font-semibold shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
            <span>Zero Hallucinations • Version-Isolated Retrieval • Traceable Citations</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.12]">
            Ask Your Documentation. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-brand-600 to-indigo-600 bg-clip-text text-transparent">
              Get the Exact Version.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            An AI-powered documentation assistant that understands API versions, migration guides, and changelogs — with answers grounded in the original source.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/assistant"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-brand-500/25 transition-all hover:scale-[1.02]"
            >
              <Sparkles className="w-4 h-4" />
              <span>Ask Documentation</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>

            <Link
              to="/explorer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm rounded-xl border border-slate-200 shadow-subtle transition-all hover:border-slate-300"
            >
              <FileText className="w-4 h-4 text-slate-500" />
              <span>Explore Documentation</span>
            </Link>
          </div>

        </div>
      </section>

      {/* Visual Live Demonstration Sandbox */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
          
          {/* Demo Header & Version Switcher */}
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />
              <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" />
              <span className="w-3 h-3 rounded-full bg-green-400 inline-block" />
              <span className="text-xs font-semibold text-slate-700 ml-2">Live Version-Aware RAG Sandbox</span>
            </div>

            {/* Version Switch Tabs */}
            <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-lg text-xs font-medium">
              {['v1.0', 'v2.0', 'v3.0', 'v4.0'].map(v => (
                <button
                  key={v}
                  onClick={() => setDemoVersion(v)}
                  className={`px-3 py-1 rounded-md transition-all ${
                    demoVersion === v
                      ? 'bg-white text-slate-900 font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Demonstration Body */}
          <div className="p-6 space-y-6">
            
            {/* User Bubble */}
            <div className="flex items-start gap-3 justify-end">
              <div className="bg-brand-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-lg text-sm shadow-xs">
                {activeDemo.question}
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                U
              </div>
            </div>

            {/* AI Response Bubble */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center text-xs shrink-0 shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="space-y-4 max-w-2xl flex-1">
                <div className="bg-slate-50 border border-slate-200/90 rounded-2xl rounded-tl-sm p-4 text-sm text-slate-800 leading-relaxed space-y-3">
                  <p>{activeDemo.answer}</p>
                  <pre className="bg-[#0d1117] text-slate-200 p-3 rounded-lg text-xs font-mono overflow-x-auto">
                    <code>{activeDemo.code}</code>
                  </pre>
                </div>

                {/* Grounded Source Card */}
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Verified Source
                      </span>
                      <span className="font-semibold text-xs text-slate-900">{activeDemo.source.document}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>Version: <strong className="text-slate-800">{activeDemo.source.version}</strong></span>
                      <span>Section: <strong className="text-slate-800">{activeDemo.source.section}</strong></span>
                      <span>Page: <strong className="text-slate-800">{activeDemo.source.page}</strong></span>
                    </div>
                  </div>

                  <button
                    onClick={() => openSourceInspector(activeDemo.source)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors shadow-2xs"
                  >
                    <span>View Source</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

              </div>
            </div>

          </div>

        </div>
      </section>

      {/* RAG Pipeline Architecture Section */}
      <section className="max-w-6xl mx-auto px-4 pt-4">
        <div className="text-center space-y-3 mb-10">
          <h2 className="text-2xl font-bold text-slate-900">End-to-End Grounded RAG Architecture</h2>
          <p className="text-sm text-slate-600 max-w-xl mx-auto">
            How NovaDoc AI retrieves, filters, and generates version-isolated responses with strict citation guarantees.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              step: "01",
              title: "Version Metadata Filter",
              desc: "Incoming queries are immediately scoped by targeted product version (v1-v4) to prevent cross-version pollution.",
              icon: Layers
            },
            {
              step: "02",
              title: "Hybrid Dense + BM25",
              desc: "Simultaneous semantic embedding similarity and lexical BM25 token matching across structured documentation chunks.",
              icon: Database
            },
            {
              step: "03",
              title: "Cross-Feature Re-ranking",
              desc: "Candidates are re-scored based on code block presence, exact parameter headers, and section boundaries.",
              icon: Zap
            },
            {
              step: "04",
              title: "Grounded Synthesis",
              desc: "Deterministic citation tags [1], [2] linked directly to verifiable page and chunk IDs in the knowledge base.",
              icon: ShieldCheck
            }
          ].map((card, i) => {
            const Icon = card.icon;
            return (
              <div key={i} className="p-5 bg-white border border-slate-200 rounded-xl shadow-card hover:shadow-card-hover transition-all space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-300">{card.step}</span>
                </div>
                <h3 className="font-bold text-sm text-slate-900">{card.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{card.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Core Feature Matrix Showcase */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <h3 className="text-2xl font-bold">Ready to query your multi-version documentation?</h3>
            <p className="text-sm text-slate-300">
              Switch versions dynamically, run migration diffs, and inspect verifiable chunk citations in seconds.
            </p>
          </div>
          <Link
            to="/assistant"
            className="px-6 py-3 bg-brand-500 hover:bg-brand-400 text-white font-bold text-sm rounded-xl transition-all shadow-md shrink-0"
          >
            Launch AI Assistant
          </Link>
        </div>
      </section>

    </div>
  );
};
