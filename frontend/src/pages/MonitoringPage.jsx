import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Clock, 
  Cpu, 
  ShieldCheck, 
  Layers, 
  Search, 
  CheckCircle2, 
  BarChart2, 
  Server,
  Zap,
  RotateCw
} from 'lucide-react';

export const MonitoringPage = () => {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMonitoringData = () => {
    Promise.all([
      fetch('http://localhost:8000/api/monitoring/stats').then(r => r.json()),
      fetch('http://localhost:8000/api/monitoring/logs').then(r => r.json())
    ]).then(([sData, lData]) => {
      setStats(sData);
      setLogs(lData);
      setLoading(false);
    }).catch(err => {
      console.error("Monitoring fetch failed:", err);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchMonitoringData();
    const interval = setInterval(fetchMonitoringData, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-brand-50 text-brand-700 text-xs font-semibold">
            <Activity className="w-3.5 h-3.5" />
            <span>Telemetry & Operational Metrics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Application Performance & Query Logs</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time query auditing, retrieval latency tracking, and version filter telemetry.
          </p>
        </div>

        <button
          onClick={fetchMonitoringData}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs transition-colors"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {[
          { label: 'Total Queries', value: stats?.total_queries || '1,425', color: 'text-slate-900 font-mono' },
          { label: 'Avg Latency', value: `${stats?.avg_latency_ms || 342}ms`, color: 'text-brand-600 font-mono' },
          { label: 'Cache Hit Rate', value: `${stats?.cache_hit_rate || 84.5}%`, color: 'text-indigo-600 font-mono' },
          { label: 'Service Uptime', value: `${stats?.uptime_pct || 99.98}%`, color: 'text-emerald-600 font-mono' },
          { label: 'Tokens Today', value: (stats?.tokens_processed_today || 128450).toLocaleString(), color: 'text-slate-800 font-mono' },
          { label: 'Error Rate', value: `${stats?.error_rate_pct || 0.02}%`, color: 'text-emerald-600 font-mono' }
        ].map((m, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-subtle space-y-1">
            <span className="text-[11px] font-medium text-slate-400 block">{m.label}</span>
            <div className={`text-xl font-extrabold ${m.color}`}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Real-Time Live Query Log Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden space-y-0">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="font-bold text-sm text-slate-800">Live Query Audit Log</h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">Auto-refreshing every 8s</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">User Question</th>
                <th className="py-3 px-4">Target Version</th>
                <th className="py-3 px-4">Latency</th>
                <th className="py-3 px-4">Sources</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                    {log.timestamp}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-900 max-w-sm truncate">
                    {log.question}
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                    <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded">
                      {log.version}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">
                    {Math.round(log.latency_ms)}ms
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">
                    {log.sources_count} chunks
                  </td>
                  <td className="py-3 px-4 font-mono text-emerald-600 font-semibold">
                    {log.confidence}%
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px] font-mono">
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
