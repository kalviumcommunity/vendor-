import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Sparkles, 
  Search, 
  Layers, 
  GitCompare, 
  History, 
  BookOpen, 
  Activity, 
  Cpu, 
  UploadCloud,
  ChevronDown,
  ShieldCheck
} from 'lucide-react';
import { useDoc } from '../../context/DocContext';

export const Navbar = () => {
  const location = useLocation();
  const { selectedVersion, setSelectedVersion, versions, setSearchModalOpen } = useDoc();

  const isCurrent = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-slate-900">NovaDoc</span>
                <span className="px-1.5 py-0.2 text-[10px] font-semibold bg-brand-50 text-brand-700 border border-brand-200/70 rounded">AI</span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium block -mt-0.5">Version-Aware Developer Intelligence</span>
            </div>
          </Link>
        </div>

        {/* Global Search Bar (Trigger Cmd+K) */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <button
            onClick={() => setSearchModalOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-1.5 text-sm bg-slate-50 hover:bg-slate-100/90 border border-slate-200 text-slate-500 rounded-lg transition-all shadow-subtle group"
          >
            <div className="flex items-center gap-2.5">
              <Search className="w-4 h-4 text-slate-400 group-hover:text-brand-600 transition-colors" />
              <span className="text-slate-500 text-xs sm:text-sm">Search API documentation...</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-mono font-medium text-slate-400 bg-white border border-slate-200/80 px-1.5 py-0.5 rounded shadow-2xs">
              <span>⌘</span>
              <span>K</span>
            </div>
          </button>
        </div>

        {/* Right Section: Version Selector & Navigation Tabs */}
        <div className="flex items-center gap-3">
          
          {/* Active Version Selector Dropdown */}
          <div className="relative flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-subtle">
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedVersion}
              onChange={(e) => setSelectedVersion(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer pr-1"
            >
              <option value="All">All Versions</option>
              {versions.map(v => (
                <option key={v.version} value={v.version}>{v.label}</option>
              ))}
            </select>
          </div>

          {/* Quick Action Links */}
          <Link
            to="/assistant"
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              isCurrent('/assistant')
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Assistant</span>
          </Link>

        </div>

      </div>
    </header>
  );
};
