import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DocProvider } from './context/DocContext';
import { ChatProvider } from './context/ChatContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { SourceDrawer } from './components/layout/SourceDrawer';
import { CommandBarModal } from './components/search/CommandBarModal';

// Pages
import { LandingPage } from './pages/LandingPage';
import { AssistantPage } from './pages/AssistantPage';
import { ExplorerPage } from './pages/ExplorerPage';
import { VersionsPage } from './pages/VersionsPage';
import { MigrationPage } from './pages/MigrationPage';
import { ChangelogPage } from './pages/ChangelogPage';
import { UploadPage } from './pages/UploadPage';
import { AdminPage } from './pages/AdminPage';
import { EvaluationPage } from './pages/EvaluationPage';
import { MonitoringPage } from './pages/MonitoringPage';

export function App() {
  return (
    <DocProvider>
      <ChatProvider>
        <Router>
          <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 font-sans selection:bg-brand-500 selection:text-white">
            
            {/* Top Navigation */}
            <Navbar />

            {/* Main Layout Area */}
            <div className="flex-1 flex w-full">
              
              {/* Left Sidebar */}
              <Sidebar />

              {/* Main Content View */}
              <main className="flex-1 min-w-0 overflow-y-auto">
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/assistant" element={<AssistantPage />} />
                  <Route path="/explorer" element={<ExplorerPage />} />
                  <Route path="/versions" element={<VersionsPage />} />
                  <Route path="/migration" element={<MigrationPage />} />
                  <Route path="/changelog" element={<ChangelogPage />} />
                  <Route path="/upload" element={<UploadPage />} />
                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="/evaluation" element={<EvaluationPage />} />
                  <Route path="/monitoring" element={<MonitoringPage />} />
                </Routes>
              </main>

            </div>

            {/* Global Modals & Drawers */}
            <SourceDrawer />
            <CommandBarModal />

          </div>
        </Router>
      </ChatProvider>
    </DocProvider>
  );
}

export default App;
