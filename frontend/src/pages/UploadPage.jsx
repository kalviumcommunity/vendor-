import React, { useState } from 'react';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  Layers, 
  Clock, 
  Cpu, 
  Database, 
  Sparkles,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { useDoc } from '../context/DocContext';

export const UploadPage = () => {
  const { versions } = useDoc();
  const [selectedFile, setSelectedFile] = useState(null);
  const [targetVersion, setTargetVersion] = useState('v3.0');
  const [targetDocType, setTargetDocType] = useState('api_reference');
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadResult(null);
      setErrorMessage('');
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setErrorMessage('');
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('version', targetVersion);
    formData.append('document_type', targetDocType);

    try {
      const response = await fetch('http://localhost:8000/api/documents/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Upload failed');
      }

      const data = await response.json();
      setUploadResult(data);
    } catch (err) {
      setErrorMessage(err.message || 'Error uploading file.');
    } finally {
      setUploading(false);
    }
  };

  const pipelineStages = [
    { name: 'Upload', desc: 'Secure payload intake' },
    { name: 'Text Extraction', desc: 'Format parser (PDF, MD, HTML)' },
    { name: 'Cleaning & Normalization', desc: 'Whitespace & token filtering' },
    { name: 'Smart Chunking', desc: 'Preserves code & headings' },
    { name: 'Metadata Attachment', desc: 'Version, section, chunk ID' },
    { name: 'Embedding Generation', desc: 'Hybrid dense & BM25 vectors' },
    { name: 'Vector DB Indexing', desc: 'Memory & disk persistence' },
    { name: 'Ready for Query', desc: 'Live in RAG pipeline' }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* Header */}
      <div className="space-y-1 border-b border-slate-200 pb-5">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-brand-50 text-brand-700 text-xs font-semibold">
          <UploadCloud className="w-3.5 h-3.5" />
          <span>Document Ingestion Pipeline</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Upload & Index Documentation</h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Ingest Markdown, TXT, HTML, PDF, or DOCX files into the version-isolated knowledge base.
        </p>
      </div>

      {/* Upload Form Box */}
      <form onSubmit={handleUploadSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card space-y-6">
        
        {/* Drag & Drop Area */}
        <div className="border-2 border-dashed border-slate-300 hover:border-brand-500 rounded-2xl p-8 text-center space-y-3 transition-colors bg-slate-50/50 cursor-pointer relative">
          <input
            type="file"
            onChange={handleFileChange}
            accept=".md,.txt,.html,.json,.pdf,.docx"
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
          <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto shadow-2xs">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-800">
              {selectedFile ? selectedFile.name : 'Click to select or drag and drop documentation file'}
            </p>
            <p className="text-xs text-slate-400">
              Supported formats: Markdown (.md), Plain Text (.txt), HTML (.html), PDF, DOCX
            </p>
          </div>
          {selectedFile && (
            <div className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Ready for ingestion ({Math.round(selectedFile.size / 1024)} KB)</span>
            </div>
          )}
        </div>

        {/* Metadata Controls: Version & Document Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              Target Product Version:
            </label>
            <select
              value={targetVersion}
              onChange={(e) => setTargetVersion(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-brand-500"
            >
              <option value="v1.0">v1.0 (Legacy)</option>
              <option value="v2.0">v2.0 (Stable)</option>
              <option value="v3.0">v3.0 (Current)</option>
              <option value="v4.0">v4.0 (Latest)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Document Category:
            </label>
            <select
              value={targetDocType}
              onChange={(e) => setTargetDocType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-brand-500"
            >
              <option value="api_reference">API Reference</option>
              <option value="migration_guide">Migration Guide</option>
              <option value="changelog">Changelog & Release Notes</option>
              <option value="getting_started">Getting Started</option>
            </select>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={!selectedFile || uploading}
          className="w-full py-3 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-md shadow-brand-500/25 transition-all flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Processing Ingestion Pipeline...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Start Ingestion & Indexing</span>
            </>
          )}
        </button>

      </form>

      {/* Real-Time Processing Status Tracker */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-subtle space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Automated Ingestion Pipeline Stages
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {pipelineStages.map((stg, i) => {
            const isCompleted = uploadResult ? true : false;
            return (
              <div
                key={i}
                className={`p-3 rounded-xl border text-xs space-y-1 transition-all ${
                  isCompleted
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                    : 'bg-slate-50 border-slate-200/80 text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span>{stg.name}</span>
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <span className="text-[10px] text-slate-400 font-mono">0{i+1}</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">{stg.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upload Success Report */}
      {uploadResult && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 space-y-3 text-xs text-emerald-900 animate-in fade-in">
          <div className="flex items-center gap-2 font-bold text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{uploadResult.message}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-slate-700">
            <div>
              <span className="text-[11px] text-slate-400 block">File Name</span>
              <span className="font-semibold font-mono">{uploadResult.file_name}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">Version Filter</span>
              <span className="font-semibold">{uploadResult.version}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">Chunks Created</span>
              <span className="font-semibold text-emerald-700 font-mono">{uploadResult.chunks_created} Chunks</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">Status</span>
              <span className="font-semibold text-emerald-700">Indexed & Searchable</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
