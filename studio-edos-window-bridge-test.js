/**
 * HVA LEARNING STUDIO — test-only window bridge to authenticated EDOS opener.
 * Does not access parent storage, credentials, URL tokens or provider keys.
 * Activate explicitly during test; do not auto-run in Studio production.
 */
export function connectEdosStudioTest({ win = window, timeoutMs = 10000 } = {}) {
  const EDOS_ORIGIN = 'https://nvthahv03-cell.github.io';
  const PROTOCOL = 'hva-studio-test-1';
  const opener = win.opener;
  if (!opener || opener.closed) return Promise.reject(new Error('Mở Studio từ EDOS để thử kết nối.'));
  const requests = new Map();
  let channel = null;
  let closed = false;
  let readyResolve, readyReject;
  const ready = new Promise((resolve, reject) => { readyResolve = resolve; readyReject = reject; });
  const handshakeTimer = win.setTimeout(() => {
    if (!channel) { readyReject(new Error('EDOS chưa xác nhận kết nối.')); close(); }
  }, timeoutMs);
  function receive(event) {
    if (closed || event.origin !== EDOS_ORIGIN || event.source !== opener) return;
    const msg = event.data;
    if (!msg || msg.protocol !== PROTOCOL || typeof msg.type !== 'string') return;
    if (msg.type === 'READY' && typeof msg.channel === 'string' && /^[a-fA-F0-9-]{36}$/.test(msg.channel)) {
      if (channel) return;
      channel = msg.channel;
      win.clearTimeout(handshakeTimer);
      readyResolve(true);
      return;
    }
    if (msg.type !== 'RESULT' || msg.channel !== channel || !requests.has(msg.id)) return;
    const entry = requests.get(msg.id);
    requests.delete(msg.id);
    win.clearTimeout(entry.timer);
    entry.resolve(msg.result);
  }
  function close() {
    if (closed) return;
    closed = true;
    win.clearTimeout(handshakeTimer);
    win.removeEventListener('message', receive);
    for (const req of requests.values()) { win.clearTimeout(req.timer); req.reject(new Error('Đã ngắt kết nối EDOS.')); }
    requests.clear();
  }
  win.addEventListener('message', receive);
  opener.postMessage({ protocol: PROTOCOL, type: 'HELLO' }, EDOS_ORIGIN);
  return ready.then(() => Object.freeze({
    generate(task) {
      if (closed) return Promise.reject(new Error('Kết nối EDOS đã đóng.'));
      if (!task || typeof task !== 'object' || Array.isArray(task)) return Promise.reject(new Error('Yêu cầu không hợp lệ.'));
      const id = 'studio-' + win.crypto.randomUUID();
      const payload = { ...task, action: 'hva_studio_ai_generate' };
      return new Promise((resolve, reject) => {
        const timer = win.setTimeout(() => {
          requests.delete(id);
          reject(new Error('Hết thời gian chờ Backend.'));
        }, 65000);
        requests.set(id, { resolve, reject, timer });
        opener.postMessage({ protocol: PROTOCOL, channel, type: 'GENERATE', id, task: payload }, EDOS_ORIGIN);
      });
    },
    close
  })).catch(error => { close(); throw error; });
}
