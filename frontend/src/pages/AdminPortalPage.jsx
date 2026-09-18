import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Unlock, 
  Key, 
  Plus, 
  ShieldCheck, 
  Sparkles, 
  Layers, 
  Code2, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Eye, 
  EyeOff, 
  Server, 
  Zap, 
  Database,
  ArrowRight,
  ExternalLink,
  Settings,
  PlusCircle
} from 'lucide-react';
import { useDoc } from '../context/DocContext';
import { useChat } from '../context/ChatContext';
import { useNavigate, useSearchParams } from 'react-router-dom';

const API_BASE = 'http://localhost:8000/api';

export const AdminPortalPage = () => {
  const { versions, setSelectedVersion } = useDoc();
  const { sendMessage } = useChat();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('verdoc_admin_auth') === 'true';
  });
  const [adminToken, setAdminToken] = useState(() => {
    return sessionStorage.getItem('verdoc_admin_token') || 'admin_authenticated_session';
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Active Admin Tabs: 'add_api' | 'llm_config' | 'custom_apis'
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'add_api');

  // AI Configuration State
  const [llmConfig, setLlmConfig] = useState({
    api_key: '',
    api_url: 'https://api.openai.com/v1/chat/completions',
    model_name: 'gpt-4o-mini',
    masked_api_key: ''
  });
  const [configSuccess, setConfigSuccess] = useState('');

  // Add API Endpoint Form State
  const [apiForm, setApiForm] = useState({
    title: '',
    version: 'v3.0',
    document_type: 'api_reference',
    method: 'POST',
    path: '/api/v3/',
    section: 'Endpoints',
    description: '',
    headers: [{ key: 'Authorization', value: 'Bearer <token>' }],
    request_params: [{ name: '', type: 'string', required: true, description: '' }],
    request_body: '{\n  "name": "Production Service",\n  "enabled": true\n}',
    response_body: '{\n  "status": "success",\n  "id": "res_881920",\n  "created_at": 1726550000\n}'
  });
  const [endpointLoading, setEndpointLoading] = useState(false);
  const [endpointSuccess, setEndpointSuccess] = useState('');

  // Custom APIs List
  const [customApis, setCustomApis] = useState([]);
  const [customApiVersionFilter, setCustomApiVersionFilter] = useState('All');

  const applyVersionDefaults = (v) => {
    const versionHeaderMap = {
      'v1.0': [{ key: 'Authorization', value: 'Basic <base64_credentials>' }],
      'v2.0': [{ key: 'X-API-Key', value: 'nova_live_981249712a' }],
      'v3.0': [{ key: 'Authorization', value: 'Bearer <token>' }],
      'v4.0': [
        { key: 'Authorization', value: 'Bearer <scoped_token>' },
        { key: 'Nova-Version', value: '2026-08-01' }
      ]
    };
    setApiForm(prev => ({
      ...prev,
      version: v,
      path: prev.path.startsWith('/api/') ? `/api/${v}/${prev.path.split('/').slice(3).join('/')}` : `/api/${v}/`,
      headers: versionHeaderMap[v] || prev.headers
    }));
  };

  useEffect(() => {
    const versionParam = searchParams.get('version');
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
    if (versionParam) {
      applyVersionDefaults(versionParam);
    }
  }, [searchParams]);

  // Fetch Config and APIs when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    // Fetch config
    fetch(`${API_BASE}/admin/config`, {
      headers: { 'x-admin-token': adminToken }
    })
      .then(res => res.json())
      .then(data => {
        setLlmConfig(prev => ({
          ...prev,
          api_url: data.api_url || prev.api_url,
          model_name: data.model_name || prev.model_name,
          masked_api_key: data.masked_api_key || ''
        }));
      })
      .catch(console.error);

    // Fetch custom APIs
    fetch(`${API_BASE}/admin/custom-apis`, {
      headers: { 'x-admin-token': adminToken }
    })
      .then(res => res.json())
      .then(data => setCustomApis(data || []))
      .catch(console.error);
  }, [isAuthenticated, adminToken]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const res = await fetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Incorrect admin password.');
      }

      const data = await res.json();
      setIsAuthenticated(true);
      setAdminToken(data.token);
      sessionStorage.setItem('verdoc_admin_auth', 'true');
      sessionStorage.setItem('verdoc_admin_token', data.token);
      setPasswordInput('');
    } catch (err) {
      setLoginError(err.message || 'Login failed.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('verdoc_admin_auth');
    sessionStorage.removeItem('verdoc_admin_token');
  };

  // Add Header / Param row handlers
  const addHeaderRow = () => {
    setApiForm(prev => ({ ...prev, headers: [...prev.headers, { key: '', value: '' }] }));
  };
  const removeHeaderRow = (index) => {
    setApiForm(prev => ({ ...prev, headers: prev.headers.filter((_, i) => i !== index) }));
  };
  const addParamRow = () => {
    setApiForm(prev => ({ ...prev, request_params: [...prev.request_params, { name: '', type: 'string', required: true, description: '' }] }));
  };
  const removeParamRow = (index) => {
    setApiForm(prev => ({ ...prev, request_params: prev.request_params.filter((_, i) => i !== index) }));
  };

  const handleCreateAPIEndpoint = async (e) => {
    e.preventDefault();
    if (!apiForm.title || !apiForm.path || !apiForm.description) {
      alert("Please fill in Title, Path, and Description.");
      return;
    }

    setEndpointLoading(true);
    setEndpointSuccess('');

    try {
      const res = await fetch(`${API_BASE}/admin/add-api-endpoint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken
        },
        body: JSON.stringify(apiForm)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to create endpoint.');
      }

      const data = await res.json();
      setEndpointSuccess(`✅ ${data.message}`);
      setCustomApis(prev => [data.api, ...prev]);

      // Reset form title/path
      setApiForm(prev => ({
        ...prev,
        title: '',
        path: `/api/${prev.version}/`,
        description: ''
      }));
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setEndpointLoading(false);
      setTimeout(() => setEndpointSuccess(''), 5000);
    }
  };

  const handleSaveLLMConfig = async (e) => {
    e.preventDefault();
    setConfigSuccess('');

    try {
      const res = await fetch(`${API_BASE}/admin/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken
        },
        body: JSON.stringify({
          api_key: llmConfig.api_key || undefined,
          api_url: llmConfig.api_url,
          model_name: llmConfig.model_name
        })
      });

      if (!res.ok) throw new Error('Failed to update config.');
      const data = await res.json();
      setConfigSuccess(data.message);
      if (llmConfig.api_key) {
        setLlmConfig(prev => ({ ...prev, masked_api_key: 'sk-***saved', api_key: '' }));
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setTimeout(() => setConfigSuccess(''), 4000);
    }
  };

  const handleDeleteCustomAPI = async (apiId) => {
    if (!window.confirm("Remove this custom endpoint from vector database?")) return;
    try {
      await fetch(`${API_BASE}/admin/custom-apis/${apiId}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': adminToken }
      });
      setCustomApis(prev => prev.filter(a => a.id !== apiId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleTestInAssistant = (api) => {
    setSelectedVersion(api.version);
    sendMessage(`Explain how to use the ${api.title} endpoint (${api.method} ${api.path}) in ${api.version}.`, api.version);
    navigate('/assistant');
  };

  // 1. Password Protected Login View
  if (!isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-4.1rem)] flex items-center justify-center p-4 bg-[#F8FAFC]">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-8 space-y-6 animate-in zoom-in-95 duration-200">
          
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-900 to-indigo-900 text-white flex items-center justify-center mx-auto shadow-md">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">Admin Control Portal</h2>
            <p className="text-xs text-slate-500">
              Restricted management portal for API creation & LLM keys.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Master Admin Password:</span>
                <span className="text-[10px] text-slate-400 font-normal">Default: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-mono">admin123</code></span>
              </label>
              
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter admin password..."
                  autoFocus
                  required
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 focus:bg-white text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {loginError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading || !passwordInput}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              {loginLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Authenticate & Access Admin</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Session encrypted & protected</span>
            </span>
          </div>

        </div>
      </div>
    );
  }

  // 2. Authenticated Admin Portal View
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* Top Header & Admin Session Status */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-subtle flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Authenticated Admin Session</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Admin Documentation & API Control</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Add custom APIs dynamically to any version or configure external LLM API endpoints.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveTab('add_api');
              window.scrollTo({ top: 150, behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add New API</span>
          </button>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-colors"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lock Admin</span>
          </button>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3 text-xs font-semibold">
        {[
          { id: 'add_api', label: 'Add Custom API Endpoint', icon: PlusCircle, badge: 'Dynamic Ingestion' },
          { id: 'llm_config', label: 'AI Provider & LLM Config', icon: Settings },
          { id: 'custom_apis', label: `Custom APIs (${customApis.length})`, icon: Database }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="px-1.5 py-0.2 text-[10px] bg-brand-500 text-white rounded font-normal">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: ADD CUSTOM API ENDPOINT */}
      {activeTab === 'add_api' && (
        <form onSubmit={handleCreateAPIEndpoint} className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-card space-y-6">
          
          <div className="border-b border-slate-100 pb-4 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-brand-600" />
                <span>Publish New API Endpoint to Vector Corpus</span>
              </h3>
              <p className="text-xs text-slate-500">
                The endpoint will be automatically parsed, converted into structured Markdown, chunked, and indexed into the RAG vector index for <strong>{apiForm.version}</strong>.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-mono font-bold bg-brand-50 text-brand-700 border border-brand-200 rounded-lg">
                Target: {apiForm.version}
              </span>
              <button
                type="submit"
                disabled={endpointLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-brand-500/20 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add API to {apiForm.version}</span>
              </button>
            </div>
          </div>

          {/* Preset templates */}
          <div className="flex flex-wrap items-center gap-2 pt-1 pb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Quick Presets:</span>
            <button
              type="button"
              onClick={() => setApiForm({
                title: 'Create Payment Intent',
                version: 'v3.0',
                document_type: 'api_reference',
                method: 'POST',
                path: '/api/v3/payments/intent',
                section: 'Payments & Billing',
                description: 'Initializes a secure checkout payment intent with dynamic idempotency key and currency handling.',
                headers: [
                  { key: 'Authorization', value: 'Bearer <token>' },
                  { key: 'Idempotency-Key', value: 'idem_99218204' }
                ],
                request_params: [
                  { name: 'amount', type: 'integer', required: true, description: 'Amount in smallest currency unit (e.g. cents)' },
                  { name: 'currency', type: 'string', required: true, description: 'Three-letter ISO currency code (USD, EUR, GBP)' },
                  { name: 'customer_id', type: 'string', required: true, description: 'Customer identifier (cus_...)' }
                ],
                request_body: '{\n  "amount": 4900,\n  "currency": "usd",\n  "customer_id": "cus_9941a82"\n}',
                response_body: '{\n  "id": "pi_live_89123",\n  "status": "requires_payment_method",\n  "amount": 4900,\n  "currency": "usd"\n}'
              })}
              className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 rounded-lg border border-slate-200 transition-colors cursor-pointer"
            >
              + Payment Intent API
            </button>
            <button
              type="button"
              onClick={() => setApiForm({
                title: 'OAuth PKCE Token Exchange',
                version: 'v4.0',
                document_type: 'api_reference',
                method: 'POST',
                path: '/api/v4/oauth/token',
                section: 'Authentication & Scopes',
                description: 'Exchanges authorization code for a scoped access token using OAuth 2.0 PKCE verification.',
                headers: [
                  { key: 'Nova-Version', value: '2026-08-01' },
                  { key: 'Content-Type', value: 'application/json' }
                ],
                request_params: [
                  { name: 'grant_type', type: 'string', required: true, description: 'Must be authorization_code' },
                  { name: 'code_verifier', type: 'string', required: true, description: 'Original unhashed PKCE code verifier' },
                  { name: 'code', type: 'string', required: true, description: 'Authorization code issued by login flow' }
                ],
                request_body: '{\n  "grant_type": "authorization_code",\n  "code": "auth_code_9812",\n  "code_verifier": "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"\n}',
                response_body: '{\n  "access_token": "v4_pkce_eyJhbGciOi...",\n  "token_type": "Bearer",\n  "expires_in": 3600,\n  "scope": "users:read users:write"\n}'
              })}
              className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 rounded-lg border border-slate-200 transition-colors cursor-pointer"
            >
              + OAuth PKCE Token API
            </button>
            <button
              type="button"
              onClick={() => setApiForm({
                title: 'Register Event Webhook',
                version: 'v3.0',
                document_type: 'api_reference',
                method: 'POST',
                path: '/api/v3/webhooks/endpoints',
                section: 'Webhooks',
                description: 'Subscribes an HTTPS URL to real-time asynchronous API state changes and webhooks.',
                headers: [
                  { key: 'Authorization', value: 'Bearer <token>' }
                ],
                request_params: [
                  { name: 'url', type: 'string', required: true, description: 'Valid secure HTTPS endpoint' },
                  { name: 'events', type: 'array', required: true, description: 'Array of event topic strings' }
                ],
                request_body: '{\n  "url": "https://example.com/api/webhooks",\n  "events": ["user.created", "payment.succeeded"]\n}',
                response_body: '{\n  "webhook_id": "wh_sec_99182",\n  "status": "active",\n  "secret": "whsec_live_01823"\n}'
              })}
              className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 rounded-lg border border-slate-200 transition-colors cursor-pointer"
            >
              + Webhooks API
            </button>
          </div>

          {endpointSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{endpointSuccess}</span>
            </div>
          )}

          {/* Version Category Selector Pills */}
          <div className="space-y-2 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-brand-600" />
                <span>Select Target Version Category:</span>
              </label>
              <span className="text-[11px] font-mono text-slate-500">
                Selected: <strong className="text-brand-700">{apiForm.version}</strong>
              </span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { v: 'v1.0', label: 'v1.0 (Legacy)', desc: 'Basic Auth / XML & JSON' },
                { v: 'v2.0', label: 'v2.0 (Stable)', desc: 'X-API-Key / Offset' },
                { v: 'v3.0', label: 'v3.0 (Current)', desc: 'Bearer JWT / Webhooks' },
                { v: 'v4.0', label: 'v4.0 (Latest)', desc: 'OAuth PKCE / Scopes' }
              ].map(item => (
                <button
                  key={item.v}
                  type="button"
                  onClick={() => applyVersionDefaults(item.v)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    apiForm.version === item.v
                      ? 'bg-brand-50 border-brand-500 ring-2 ring-brand-500/20 shadow-2xs text-brand-950 font-bold'
                      : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono font-bold">
                    <span>{item.v}</span>
                    {apiForm.version === item.v && <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" />}
                  </div>
                  <div className="text-[10px] text-slate-500 font-normal mt-0.5">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Row 1: Title, Version, Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">API Title / Action Name *</label>
              <input
                type="text"
                value={apiForm.title}
                onChange={(e) => setApiForm({ ...apiForm, title: e.target.value })}
                placeholder="e.g. Create Payment Intent"
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Target Product Version *</label>
              <select
                value={apiForm.version}
                onChange={(e) => applyVersionDefaults(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 cursor-pointer"
              >
                <option value="v1.0">v1.0 (Legacy)</option>
                <option value="v2.0">v2.0 (Stable)</option>
                <option value="v3.0">v3.0 (Current)</option>
                <option value="v4.0">v4.0 (Latest)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Documentation Section</label>
              <input
                type="text"
                value={apiForm.section}
                onChange={(e) => setApiForm({ ...apiForm, section: e.target.value })}
                placeholder="e.g. Payments, Users, Webhooks"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Row 2: Method & Path */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">HTTP Method *</label>
              <select
                value={apiForm.method}
                onChange={(e) => setApiForm({ ...apiForm, method: e.target.value })}
                className="w-full px-3 py-2 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 font-mono"
              >
                <option value="POST">POST</option>
                <option value="GET">GET</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
              </select>
            </div>

            <div className="sm:col-span-3 space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Endpoint URL Path *</label>
              <input
                type="text"
                value={apiForm.path}
                onChange={(e) => setApiForm({ ...apiForm, path: e.target.value })}
                placeholder="/api/v3/payments/charge"
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Description & Usage Details *</label>
            <textarea
              rows={3}
              value={apiForm.description}
              onChange={(e) => setApiForm({ ...apiForm, description: e.target.value })}
              placeholder="Explain the endpoint behavior, authentication prerequisites, status codes, and rate limits..."
              required
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 leading-relaxed"
            />
          </div>

          {/* Request Headers Builder */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">Required HTTP Headers</label>
              <button
                type="button"
                onClick={addHeaderRow}
                className="text-[11px] font-semibold text-brand-700 hover:text-brand-900 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Header
              </button>
            </div>
            {apiForm.headers.map((h, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Header Name (e.g. Authorization)"
                  value={h.key}
                  onChange={(e) => {
                    const newH = [...apiForm.headers];
                    newH[i].key = e.target.value;
                    setApiForm({ ...apiForm, headers: newH });
                  }}
                  className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
                <input
                  type="text"
                  placeholder="Value / Example (e.g. Bearer <jwt>)"
                  value={h.value}
                  onChange={(e) => {
                    const newH = [...apiForm.headers];
                    newH[i].value = e.target.value;
                    setApiForm({ ...apiForm, headers: newH });
                  }}
                  className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
                <button
                  type="button"
                  onClick={() => removeHeaderRow(i)}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Parameters Builder */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">Body & Query Parameters</label>
              <button
                type="button"
                onClick={addParamRow}
                className="text-[11px] font-semibold text-brand-700 hover:text-brand-900 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Parameter
              </button>
            </div>
            {apiForm.request_params.map((p, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center bg-slate-50 p-2 rounded-xl border border-slate-200/80">
                <input
                  type="text"
                  placeholder="Parameter name"
                  value={p.name}
                  onChange={(e) => {
                    const newP = [...apiForm.request_params];
                    newP[i].name = e.target.value;
                    setApiForm({ ...apiForm, request_params: newP });
                  }}
                  className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono"
                />
                <select
                  value={p.type}
                  onChange={(e) => {
                    const newP = [...apiForm.request_params];
                    newP[i].type = e.target.value;
                    setApiForm({ ...apiForm, request_params: newP });
                  }}
                  className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono"
                >
                  <option value="string">string</option>
                  <option value="integer">integer</option>
                  <option value="boolean">boolean</option>
                  <option value="object">object</option>
                  <option value="array">array</option>
                </select>
                <input
                  type="text"
                  placeholder="Description"
                  value={p.description}
                  onChange={(e) => {
                    const newP = [...apiForm.request_params];
                    newP[i].description = e.target.value;
                    setApiForm({ ...apiForm, request_params: newP });
                  }}
                  className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                />
                <div className="flex items-center justify-between pl-2">
                  <label className="text-[11px] text-slate-600 flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={p.required}
                      onChange={(e) => {
                        const newP = [...apiForm.request_params];
                        newP[i].required = e.target.checked;
                        setApiForm({ ...apiForm, request_params: newP });
                      }}
                      className="rounded"
                    />
                    <span>Required</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => removeParamRow(i)}
                    className="p-1 text-slate-400 hover:text-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Request & Response Examples */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">JSON Request Body Example</label>
              <textarea
                rows={4}
                value={apiForm.request_body}
                onChange={(e) => setApiForm({ ...apiForm, request_body: e.target.value })}
                className="w-full p-2.5 text-xs bg-[#0d1117] text-slate-200 font-mono rounded-xl border border-slate-700 focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">JSON Response Example (200 OK)</label>
              <textarea
                rows={4}
                value={apiForm.response_body}
                onChange={(e) => setApiForm({ ...apiForm, response_body: e.target.value })}
                className="w-full p-2.5 text-xs bg-[#0d1117] text-slate-200 font-mono rounded-xl border border-slate-700 focus:outline-none"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={endpointLoading}
            className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-brand-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {endpointLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Chunking & Indexing API into {apiForm.version}...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>+ Add & Index API to {apiForm.version} Knowledge Base</span>
              </>
            )}
          </button>

        </form>
      )}

      {/* TAB 2: AI PROVIDER & LLM CONFIG */}
      {activeTab === 'llm_config' && (
        <form onSubmit={handleSaveLLMConfig} className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-card space-y-6">
          <div className="border-b border-slate-100 pb-4 space-y-1">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Key className="w-4 h-4 text-brand-600" />
              <span>Configure AI & LLM Provider API</span>
            </h3>
            <p className="text-xs text-slate-500">
              Configure OpenAI, Anthropic, Gemini, Azure, or local Ollama endpoints for live generative inference.
            </p>
          </div>

          {configSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{configSuccess}</span>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>LLM API Secret Key (OpenAI / Compatible)</span>
                {llmConfig.masked_api_key && (
                  <span className="text-[11px] font-mono text-emerald-600">Active: {llmConfig.masked_api_key}</span>
                )}
              </label>
              <input
                type="password"
                value={llmConfig.api_key}
                onChange={(e) => setLlmConfig({ ...llmConfig, api_key: e.target.value })}
                placeholder="sk-proj-... (leave blank to keep current key)"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">API Endpoint URL</label>
              <input
                type="text"
                value={llmConfig.api_url}
                onChange={(e) => setLlmConfig({ ...llmConfig, api_url: e.target.value })}
                placeholder="https://api.openai.com/v1/chat/completions"
                required
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Model Name</label>
              <input
                type="text"
                value={llmConfig.model_name}
                onChange={(e) => setLlmConfig({ ...llmConfig, model_name: e.target.value })}
                placeholder="gpt-4o-mini, gpt-4o, claude-3-5-sonnet, gemini-1.5-pro"
                required
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            Save LLM Configuration
          </button>
        </form>
      )}

      {/* TAB 3: CUSTOM CREATED APIS INVENTORY */}
      {activeTab === 'custom_apis' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="space-y-0.5">
              <h3 className="font-bold text-sm text-slate-900">Custom Admin-Added APIs</h3>
              <p className="text-[11px] text-slate-500">APIs dynamically indexed across product versions</p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">{customApis.length} Custom Endpoints</span>
              <button
                onClick={() => {
                  applyVersionDefaults(customApiVersionFilter === 'All' ? 'v3.0' : customApiVersionFilter);
                  setActiveTab('add_api');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold transition-all shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add API to {customApiVersionFilter === 'All' ? 'Corpus' : customApiVersionFilter}</span>
              </button>
            </div>
          </div>

          {/* Version Category Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {['All', 'v1.0', 'v2.0', 'v3.0', 'v4.0'].map(v => (
              <button
                key={v}
                onClick={() => setCustomApiVersionFilter(v)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  customApiVersionFilter === v
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {v === 'All' ? 'All Versions' : v}
              </button>
            ))}
          </div>

          {customApis.filter(a => customApiVersionFilter === 'All' || a.version === customApiVersionFilter).length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <p className="text-xs font-semibold text-slate-700">No custom APIs found for {customApiVersionFilter}.</p>
              <p className="text-[11px] text-slate-400">
                Click on "+ Add API to {customApiVersionFilter === 'All' ? 'Corpus' : customApiVersionFilter}" above to publish your first dynamic endpoint.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {customApis
                .filter(a => customApiVersionFilter === 'All' || a.version === customApiVersionFilter)
                .map((api) => (
                <div key={api.id} className="py-3 flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-slate-900 text-white rounded font-mono">
                        {api.method}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-800">{api.path}</span>
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-brand-50 text-brand-700 border border-brand-200 rounded">
                        {api.version}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{api.title} • Section: {api.section}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTestInAssistant(api)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-semibold rounded-lg transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Test in AI Assistant</span>
                    </button>
                    <button
                      onClick={() => handleDeleteCustomAPI(api.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                      title="Delete endpoint"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
