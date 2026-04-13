export const sanitizeFileName = (name: string) => {
  const base = String(name || "video").trim().replace(/[\\/:*?"<>|]+/g, "-");
  return base || "video";
};

export const ensureMp4 = (name: string) => {
  const trimmed = String(name || 'video').trim();
  const hasExt = /\.[a-z0-9]+$/i.test(trimmed);
  if (hasExt) return trimmed;
  return trimmed.toLowerCase().endsWith('.mp4') ? trimmed : `${trimmed}.mp4`;
};

export const downloadFile = async (url: string, filename: string) => {
  const safe = ensureMp4(sanitizeFileName(filename));
  if (!url) return;

  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const emit = (type: string, detail: any = {}) => {
    try { window.dispatchEvent(new CustomEvent(type, { detail: { id, filename: safe, url, ...detail } })); } catch {}
  };

  const trigger = (href: string) => {
    const a = document.createElement("a");
    a.href = href;
    a.download = safe;
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (url.startsWith("blob:") || url.startsWith("data:")) {
    emit('download-start');
    trigger(url);
    emit('download-complete');
    return;
  }

  try {
    const target = new URL(url, window.location.href);
    const sameOrigin = target.origin === window.location.origin;
    const resp = await fetch(url, { mode: sameOrigin ? "same-origin" : "cors", credentials: sameOrigin ? "include" : "omit" });
    if (!resp.ok || !resp.body) {
      emit('download-start');
      trigger(url);
      emit('download-complete');
      return;
    }
    const total = Number(resp.headers.get('content-length') || 0);
    const reader = resp.body.getReader();
    let received = 0;
    emit('download-start', { total });
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        received += value.byteLength;
        emit('download-progress', { received, total });
      }
    }
    const blob = new Blob(chunks);
    const blobUrl = URL.createObjectURL(blob);
    try {
      trigger(blobUrl);
      emit('download-complete');
    } finally {
      URL.revokeObjectURL(blobUrl);
    }
  } catch (e) {
    emit('download-start');
    trigger(url);
    emit('download-complete');
  }
};
