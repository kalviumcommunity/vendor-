import React, { useState, useEffect } from 'react';
import { 
  GitCompare, 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Code2, 
  ShieldAlert, 
  FileText,
  ExternalLink,
  ChevronRight,
  Layers,
  ArrowRightLeft,
  Copy,
  Check,
  Download
} from 'lucide-react';
import { useDoc } from '../context/DocContext';
import { useChat } from '../context/ChatContext';
import { useNavigate } from 'react-router-dom';
import { CodeBlock } from '../components/ui/CodeBlock';
import { downloadFile, copyToClipboard } from '../utils/downloadHelper';

export const MigrationPage = () => {
  const { openSourceInspector } = useDoc();
  const { sendMessage } = useChat();
  const navigate = useNavigate();

  const [fromVer, setFromVer] = useState('v2.0');
  const [toVer, setToVer] = useState('v3.0');
  const [diffData, setDiffData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantAnswer, setAssistantAnswer] = useState(null);
  const [copiedGuide, setCopiedGuide] = useState(false);

  useEffect(() => {
    setLoading(true);
    setAssistantAnswer(null);
    fetch(`http://localhost:8000/api/versions/${fromVer}/diff/${toVer}`)
      .then(res => res.json())
      .then(data => {
        setDiffData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading diff:", err);
        setLoading(false);
      });
  }, [fromVer, toVer]);

  const handleAskMigrationAssistant = (topic = "authentication and endpoints") => {
    setAssistantLoading(true);
    fetch('http://localhost:8000/api/migration/assist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source_version: fromVer,
        target_version: toVer,
        topic: topic,
        custom_question: `How do I migrate from ${fromVer} to ${toVer} regarding ${topic}? Provide exact code differences and checklist.`
      })
    })
      .then(res => res.json())
      .then(data => {
        setAssistantAnswer(data);
        setAssistantLoading(false);
      })
      .catch(err => {
        console.error("Assistant error:", err);
        setAssistantLoading(false);
      });
  };

  const handleOpenFullChat = () => {
    if (assistantAnswer) {
      sendMessage(assistantAnswer.question, toVer, 'migration_guide');
      navigate('/assistant');
    }
  };

  const generateMigrationMarkdown = () => {
    let md = `# Migration Guide: NovaAPI ${fromVer} to ${toVer}\n\n`;
    md += `## 1. Major Breaking Changes\n\n`;
    diffData?.breaking_changes?.forEach(bc => {
      md += `- **${bc.title}**: ~${bc.old}~ ➔ **${bc.new}**\n`;
    });
    md += `\n## 2. New APIs in ${toVer}\n\n`;
    diffData?.new_features?.forEach(nf => {
      md += `- ${nf}\n`;
    });
    if (assistantAnswer) {
      md += `\n## 3. AI Migration Recommendations\n\n${assistantAnswer.answer}\n`;
    }
    return md;
  };

  const handleCopyGuide = async () => {
    const md = generateMigrationMarkdown();
    const success = await copyToClipboard(md);
    if (success) {
      setCopiedGuide(true);
      setTimeout(() => setCopiedGuide(false), 2000);
    }
  };

  const handleDownloadGuide = () => {
    const md = generateMigrationMarkdown();
    downloadFile(md, `migration_guide_${fromVer}_to_${toVer}.md`);
  };

  const getCodeSnippet = () => {
    if (fromVer === 'v2.0' && toVer === 'v3.0') {
      return {
        oldLang: 'javascript (v2.0)',
        oldCode: `// v2.0 - Static API Key\nconst response = await fetch("https://api.novacloud.io/v2/users?limit=20&offset=40", {\n  headers: {\n    "X-API-Key": "nova_live_981249712a",\n    "Content-Type": "application/json"\n  }\n});`,
        newLang: 'javascript (v3.0)',
        newCode: `// v3.0 - Dynamic Bearer JWT + Cursor Pagination\nconst auth = await fetch("https://api.novacloud.io/v3/auth/tokens", {\n  method: "POST",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify({ client_id: "client_live_8819", client_secret: "sec_jwt_012" })\n});\nconst { access_token } = await auth.json();\n\nconst response = await fetch("https://api.novacloud.io/v3/users?limit=50&starting_after=usr_v3_99410", {\n  headers: {\n    "Authorization": \`Bearer \${access_token}\`,\n    "Content-Type": "application/json"\n  }\n});`
      };
    } else if (fromVer === 'v3.0' && toVer === 'v4.0') {
      return {
        oldLang: 'javascript (v3.0)',
        oldCode: `// v3.0 - General Token\nconst res = await fetch("https://api.novacloud.io/v3/users", {\n  method: "POST",\n  headers: { "Authorization": \`Bearer \${v3Token}\` },\n  body: JSON.stringify({ username: "alex", email: "alex@example.com", role: "developer" })\n});`,
        newLang: 'javascript (v4.0)',
        newCode: `// v4.0 - OAuth 2.0 PKCE Scoped + Nova-Version + UUID role_id\nconst res = await fetch("https://api.novacloud.io/v4/users", {\n  method: "POST",\n  headers: {\n    "Authorization": \`Bearer \${v4ScopedToken}\`,\n    "Nova-Version": "2026-08-01",\n    "Content-Type": "application/json"\n  },\n  body: JSON.stringify({\n    username: "alex",\n    email: "alex@example.com",\n    role_id: "role_lead_developer_99",\n    tenant_id: "ten_prod_01"\n  })\n});`
      };
    }
    return {
      oldLang: 'python (v1.0)',
      oldCode: `# v1.0 - Basic Auth\nheaders = {"Authorization": "Basic " + base64(user + ":" + key)}\nrequests.post("https://api.novacloud.io/v1/user/create", headers=headers, json={"user_name": "jane"})`,
      newLang: 'python (v2.0)',
      newCode: `# v2.0 - Header API Key\nheaders = {"X-API-Key": "nova_live_981249712a"}\nrequests.post("https://api.novacloud.io/v2/users", headers=headers, json={"username": "jane", "email": "jane@example.com", "role": "developer"})`
    };
  };

  const codeSnippets = getCodeSnippet();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-10">
      
      {/* Header & Version Selectors */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-subtle space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-brand-50 text-brand-700 text-xs font-semibold">
              <GitCompare className="w-3.5 h-3.5" />
              <span>Interactive Migration Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Upgrade & Migration Assistant</h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Select your current and target versions to review breaking changes, parameter updates, and code refactorings.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopyGuide}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-all shadow-2xs"
              title="Copy entire migration guide as Markdown"
            >
              {copiedGuide ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedGuide ? 'Copied Guide' : 'Copy Guide'}</span>
            </button>
            <button
              onClick={handleDownloadGuide}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-all shadow-2xs"
              title="Download migration guide as Markdown (.md)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Guide (.md)</span>
            </button>
            <button
              onClick={() => handleAskMigrationAssistant("authentication, parameters, and endpoints")}
              disabled={assistantLoading}
              className="inline-flex items-center gap-2 px-5 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-brand-500/25 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>{assistantLoading ? 'Analyzing Corpus...' : 'Ask Migration Assistant'}</span>
            </button>
          </div>
        </div>

        {/* FROM -> TO Selectors */}
        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">FROM:</span>
            <select
              value={fromVer}
              onChange={(e) => setFromVer(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-900 font-mono font-bold text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-brand-500 cursor-pointer"
            >
              <option value="v1.0">v1.0 (Legacy)</option>
              <option value="v2.0">v2.0 (Stable)</option>
              <option value="v3.0">v3.0 (Current)</option>
            </select>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-400" />

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">TO:</span>
            <select
              value={toVer}
              onChange={(e) => setToVer(e.target.value)}
              className="bg-brand-50 border border-brand-300 text-brand-900 font-mono font-bold text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-brand-500 cursor-pointer"
            >
              <option value="v2.0">v2.0 (Stable)</option>
              <option value="v3.0">v3.0 (Current)</option>
              <option value="v4.0">v4.0 (Latest)</option>
            </select>
          </div>

          <div className="text-xs text-slate-500 ml-auto hidden sm:block">
            Targeting <strong className="text-slate-800">{fromVer} → {toVer}</strong> migration checklist
          </div>
        </div>
      </div>

      {/* AI Migration Assistant Response Panel (If triggered) */}
      {assistantAnswer && (
        <div className="bg-gradient-to-r from-brand-50/70 to-indigo-50/70 border-2 border-brand-300/80 rounded-2xl p-6 shadow-md space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-brand-600 text-white flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">AI Migration Assistant Guidance</h3>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded border border-emerald-300">
                Grounded ({assistantAnswer.confidence_score}%)
              </span>
            </div>

            <button
              onClick={handleOpenFullChat}
              className="text-xs font-semibold text-brand-700 hover:text-brand-900 flex items-center gap-1"
            >
              <span>Continue in Full Chat</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="bg-white p-4 rounded-xl border border-brand-200/80 text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed shadow-2xs font-sans">
            {assistantAnswer.answer}
          </div>

          {/* Sources */}
          {assistantAnswer.sources?.length > 0 && (
            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Citations:</span>
              {assistantAnswer.sources.map((s, i) => (
                <button
                  key={i}
                  onClick={() => openSourceInspector(s)}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[11px] font-mono text-slate-700"
                >
                  <span>[{s.index || i+1}] {s.document} (§ {s.section})</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 7 Structured Migration Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 1. Breaking Changes */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>1. Breaking Changes & Dropped Behaviors</span>
          </div>
          <div className="space-y-2.5">
            {diffData?.breaking_changes?.map((bc, i) => (
              <div key={i} className="p-3 bg-red-50/50 border border-red-200/70 rounded-xl space-y-1 text-xs">
                <span className="font-bold text-red-900 block">{bc.title}</span>
                <div className="flex items-center gap-2 text-slate-600">
                  <span className="line-through text-red-700">{bc.old}</span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                  <span className="font-semibold text-emerald-800">{bc.new}</span>
                </div>
              </div>
            )) || (
              <p className="text-xs text-slate-400">Loading breaking change deltas...</p>
            )}
          </div>
        </div>

        {/* 2. New APIs & Subsystems */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
            <CheckCircle2 className="w-4 h-4" />
            <span>2. New APIs & Capabilities in {toVer}</span>
          </div>
          <div className="space-y-2">
            {diffData?.new_features?.map((nf, i) => (
              <div key={i} className="flex items-start gap-2 p-2.5 bg-emerald-50/50 border border-emerald-200/70 rounded-xl text-xs text-emerald-900">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>{nf}</span>
              </div>
            )) || (
              <p className="text-xs text-slate-400">Loading new capabilities...</p>
            )}
          </div>
        </div>

      </div>

      {/* Code Changes: Side-by-Side Before vs After */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
            <Code2 className="w-4 h-4 text-brand-600" />
            <span>Code Refactoring: {fromVer} vs {toVer}</span>
          </div>
          <span className="text-xs text-slate-400 font-mono">Before & After</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <div className="text-xs font-bold text-red-700 bg-red-50 px-3 py-1 rounded-t-lg border border-b-0 border-red-200">
              Legacy Approach ({fromVer})
            </div>
            <CodeBlock code={codeSnippets.oldCode} language={codeSnippets.oldLang} />
          </div>

          <div>
            <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-t-lg border border-b-0 border-emerald-200">
              Modern Implementation ({toVer})
            </div>
            <CodeBlock code={codeSnippets.newCode} language={codeSnippets.newLang} />
          </div>
        </div>
      </div>

    </div>
  );
};
