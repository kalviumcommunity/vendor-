import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  Home, 
  Sparkles, 
  BookOpen, 
  Code2, 
  GitCompare, 
  History, 
  Layers, 
  Database, 
  UploadCloud, 
  CheckCircle2, 
  Activity, 
  HelpCircle, 
  ShieldCheck,
  ChevronRight,
  User
} from 'lucide-react';
import { useDoc } from '../../context/DocContext';

export const Sidebar = () => {
  const { selectedVersion, setSelectedVersion, versions } = useDoc();

  const navItems = [
    { label: 'Dashboard', path: '/', icon: Home },
    { label: 'AI Assistant', path: '/assistant', icon: Sparkles, badge: 'RAG' },
    { label: 'Documentation', path: '/explorer', icon: BookOpen },
    { label: 'API Reference', path: '/explorer?type=api_reference', icon: Code2 },
    { label: 'Migration Guides', path: '/migration', icon: GitCompare },
    { label: 'Changelog', path: '/changelog', icon: History },
    { label: 'Versions', path: '/versions', icon: Layers },
    { label: 'Sources', path: '/admin', icon: Database },
    { label: 'Upload Documents', path: '/upload', icon: UploadCloud },
    { label: 'Admin Portal', path: '/admin-portal', icon: ShieldCheck, badge: 'Password' },
    { label: 'Evaluation', path: '/evaluation', icon: CheckCircle2, badge: '96.4%' },
    { label: 'Monitoring', path: '/monitoring', icon: Activity },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between h-[calc(100vh-4rem)] sticky top-16 select-none shrink-0 hidden md:flex">
      
      {/* Top Nav List */}
      <div className="p-3.5 space-y-6 overflow-y-auto flex-1">
        
        <div>
          <div className="px-2.5 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Platform Navigation
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `
                    flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all group
                    ${isActive
                      ? 'bg-brand-50 text-brand-700 font-semibold shadow-2xs border border-brand-200/50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }
                  `}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-slate-400 group-hover:text-brand-600 transition-colors" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-brand-100 text-brand-700 rounded-md">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Grounding Guarantee Box */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Grounded AI Engine</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Strict multi-version metadata filtering. No hallucinated endpoints or parameters.
          </p>
        </div>

      </div>

      {/* Bottom Sidebar: Version & User Profile */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/50 space-y-2.5">
        
        {/* Version Switcher Card */}
        <div className="flex items-center justify-between px-2.5 py-2 bg-white border border-slate-200/90 rounded-lg shadow-2xs text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-500 text-[11px]">Active Version:</span>
          </div>
          <span className="font-bold text-slate-800 font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
            {selectedVersion}
          </span>
        </div>

        {/* User profile & Help */}
        <div className="flex items-center justify-between pt-1 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-semibold flex items-center justify-center text-[10px]">
              DEV
            </div>
            <span className="text-slate-700 font-medium text-xs">Developer User</span>
          </div>
          <button 
            onClick={() => alert("NovaDoc AI Help:\n1. Choose product version (v1-v4)\n2. Ask any natural language question\n3. Inspect citations & exact source chunks.")}
            className="text-slate-400 hover:text-slate-700 p-1" 
            title="Help & Info"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>

      </div>

    </aside>
  );
};
