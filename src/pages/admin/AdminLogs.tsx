import React, { useState, useEffect } from 'react';
import { adminService, SystemLog } from '../../api/admin';
import { TerminalSquare, AlertTriangle, Info, ShieldAlert } from 'lucide-react';

export default function AdminLogs() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await adminService.getSystemLogs();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getLevelIcon = (level: string) => {
    switch (level.toUpperCase()) {
      case 'ERROR': return <ShieldAlert className="w-4 h-4 text-rose-500" />;
      case 'WARNING': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level.toUpperCase()) {
      case 'ERROR': return 'bg-rose-100 text-rose-700';
      case 'WARNING': return 'bg-amber-100 text-amber-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <TerminalSquare className="w-6 h-6 text-slate-700" />
            System Logs
          </h1>
          <p className="mt-1 text-slate-500 text-sm">View system events, processing failures, and authentication logs.</p>
        </div>
        <button onClick={fetchLogs} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
          Refresh Logs
        </button>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg overflow-hidden flex flex-col max-h-[700px]">
        <div className="px-4 py-3 border-b border-slate-800 bg-slate-950 flex gap-2">
          <div className="w-3 h-3 rounded-full bg-rose-500"></div>
          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
          <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-xs">
          {loading ? (
            <div className="text-slate-500">Loading system logs...</div>
          ) : logs.length === 0 ? (
            <div className="text-slate-500">No system events logged.</div>
          ) : (
            logs.map(log => (
              <div key={log.id} className="flex items-start gap-3 hover:bg-slate-800/50 p-2 rounded transition-colors">
                <div className="shrink-0 mt-0.5">{getLevelIcon(log.level)}</div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-slate-500">{new Date(log.created_at).toLocaleString()}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider ${getLevelColor(log.level)}`}>
                      {log.level}
                    </span>
                    <span className="text-slate-300 font-semibold">{log.event_type}</span>
                    {log.user_id && <span className="text-slate-500 text-[10px]">USER_ID: {log.user_id}</span>}
                  </div>
                  <div className="text-slate-300">{log.message}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
