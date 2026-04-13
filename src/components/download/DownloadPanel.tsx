import React, { useEffect, useMemo, useState } from "react";

type DownloadItem = {
  id: string;
  filename: string;
  url: string;
  received: number;
  total: number;
  startedAt: number;
  lastTickAt: number;
  status: 'running' | 'done' | 'error';
};

const formatMB = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
const clamp = (n: number, min = 0, max = 1) => Math.min(Math.max(n, min), max);

const DownloadPanel: React.FC = () => {
  const [items, setItems] = useState<DownloadItem[]>([]);
  const [visible, setVisible] = useState<boolean>(false);

  useEffect(() => {
    const onStart = (e: any) => {
      const { id, filename, url, total } = e.detail || {};
      setVisible(true);
      setItems(prev => [{ id, filename, url, received: 0, total: Number(total || 0), startedAt: Date.now(), lastTickAt: Date.now(), status: 'running' }, ...prev]);
    };
    const onProgress = (e: any) => {
      const { id, received, total } = e.detail || {};
      setItems(prev => prev.map(it => it.id === id ? { ...it, received: Number(received || 0), total: Number(total || it.total), lastTickAt: Date.now() } : it));
    };
    const onComplete = (e: any) => {
      const { id } = e.detail || {};
      setItems(prev => prev.map(it => it.id === id ? { ...it, status: 'done', received: it.total || it.received } : it));
    };
    const onError = (e: any) => {
      const { id } = e.detail || {};
      setItems(prev => prev.map(it => it.id === id ? { ...it, status: 'error' } : it));
      setVisible(true);
    };

    window.addEventListener('download-start' as any, onStart as any);
    window.addEventListener('download-progress' as any, onProgress as any);
    window.addEventListener('download-complete' as any, onComplete as any);
    window.addEventListener('download-error' as any, onError as any);
    return () => {
      window.removeEventListener('download-start' as any, onStart as any);
      window.removeEventListener('download-progress' as any, onProgress as any);
      window.removeEventListener('download-complete' as any, onComplete as any);
      window.removeEventListener('download-error' as any, onError as any);
    };
  }, []);

  const computed = useMemo(() => items.map(it => {
    const pct = it.total ? clamp(it.received / it.total) : 0;
    const elapsed = (Date.now() - it.startedAt) / 1000;
    const speed = it.received && elapsed ? it.received / elapsed : 0; // bytes/sec
    const remainingBytes = (it.total && it.total > it.received) ? (it.total - it.received) : 0;
    const etaSec = speed ? remainingBytes / speed : 0;
    return { ...it, pct, speed, etaSec };
  }), [items]);

  if (!visible) return null;

  return (
    <div className="fixed top-6 right-6 z-[1000] w-[340px] bg-[#1B1B1B] border border-[#2A2A2A] rounded-xl shadow-xl">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2A2A2A]">
        <span className="text-white text-sm font-semibold">Download history</span>
        <button className="text-white/80 hover:text-white" onClick={() => setVisible(false)} aria-label="Close">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 13.913L13.913 0L16 2.087L2.087 16L0 13.913Z" fill="currentColor"/><path d="M16 13.913L2.087 0L0 2.087L13.913 16L16 13.913Z" fill="currentColor"/></svg>
        </button>
      </div>
      <div className="max-h-[380px] overflow-y-auto p-3 space-y-3">
        {computed.map((d) => (
          <div key={d.id} className="bg-[#252525] rounded-lg p-3">
            <div className="text-white text-xs font-medium truncate" title={d.filename}>{d.filename}</div>
            <div className="mt-1">
              <div className="h-1.5 bg-[#111] rounded-full overflow-hidden">
                <div className="h-full bg-white" style={{ width: `${Math.round(d.pct * 100)}%` }} />
              </div>
            </div>
            <div className="mt-2 text-white/80 text-[11px]">
              {d.status === 'running' && (
                <span>↓ {formatMB(d.received)}{d.total ? ` / ${formatMB(d.total)}` : ''}{d.total ? ` • ${Math.max(0, Math.round(d.etaSec))}s left` : ''}</span>
              )}
              {d.status === 'done' && (
                <span>{formatMB(d.total || d.received)} • just now</span>
              )}
              {d.status === 'error' && (
                <span className="text-red-400">Failed</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DownloadPanel;

