import React, { createContext, useContext, useState, useEffect } from 'react';

const DocContext = createContext();

export const DocProvider = ({ children }) => {
  const [selectedVersion, setSelectedVersion] = useState('v3.0');
  const [selectedDocType, setSelectedDocType] = useState('all');
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [sourceViewerDoc, setSourceViewerDoc] = useState(null); // { documentId, chunkId, title, version, section, page }
  const [versions, setVersions] = useState([
    { version: 'v1.0', label: 'v1.0 (Legacy)', status: 'legacy', color: 'bg-slate-100 text-slate-700 border-slate-300' },
    { version: 'v2.0', label: 'v2.0 (Stable)', status: 'stable', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { version: 'v3.0', label: 'v3.0 (Current)', status: 'current', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { version: 'v4.0', label: 'v4.0 (Latest)', status: 'latest', color: 'bg-purple-50 text-purple-700 border-purple-200' }
  ]);

  // Global keyboard shortcut for search (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const openSourceInspector = (source) => {
    setSourceViewerDoc(source);
  };

  const closeSourceInspector = () => {
    setSourceViewerDoc(null);
  };

  return (
    <DocContext.Provider value={{
      selectedVersion,
      setSelectedVersion,
      selectedDocType,
      setSelectedDocType,
      searchModalOpen,
      setSearchModalOpen,
      sourceViewerDoc,
      openSourceInspector,
      closeSourceInspector,
      versions
    }}>
      {children}
    </DocContext.Provider>
  );
};

export const useDoc = () => useContext(DocContext);
