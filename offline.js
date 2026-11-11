/* dreamPlay offline mode: when the game runs inside the tablet app (no PC server), every /api/ call is answered
   from the tablet's own storage (localStorage). On the PC (127.0.0.1) this file does nothing. It also turns
   finger touches into mouse events for the Tower Defense editor, so painting the map works with a finger. */
window.DP_VERSION = '1.0.5';   // bump this for every update you send to the tablet
(function () {
  // ---- in-app updates (tablet app only): "New update! Install? YES / NO" -> downloads, installs, restarts by itself
  window.dpUpdateInfo = (info) => {
    if (!info || !info.version || document.getElementById('dpUpd')) return;
    const box = document.createElement('div'); box.id = 'dpUpd';
    box.innerHTML = `<div style="position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(2,4,12,.75);backdrop-filter:blur(6px);font-family:'Segoe UI',system-ui,sans-serif">
      <div style="width:min(460px,92vw);padding:24px;border-radius:24px;color:#eaf4ff;text-align:center;border:2px solid transparent;background:linear-gradient(rgba(10,16,34,.97),rgba(10,16,34,.97)) padding-box,linear-gradient(120deg,#3ad0ff,#8a7dff,#ff5ad6) border-box;box-shadow:0 30px 80px rgba(0,0,0,.6),0 0 40px rgba(110,120,255,.3)">
        <div style="font-size:54px">🎉</div>
        <div style="font-size:24px;font-weight:900;background:linear-gradient(120deg,#3ad0ff,#8a7dff,#ff5ad6);-webkit-background-clip:text;background-clip:text;color:transparent">A new update is ready!</div>
        <div style="color:#9fb3d8;margin:6px 0 10px">Version <b style="color:#fff">${info.version}</b> (you have ${window.DP_VERSION})</div>
        ${(info.notes || []).length ? `<div style="text-align:left;background:rgba(255,255,255,.05);border-radius:14px;padding:10px 14px;margin-bottom:12px;font-size:14px">${info.notes.map((n) => '✨ ' + n).join('<br>')}</div>` : ''}
        <div style="font-size:17px;font-weight:800;margin-bottom:14px">Do you want to install it now?</div>
        <div id="dpUpdBtns" style="display:flex;gap:12px;justify-content:center">
          <button id="dpYes" style="flex:1;padding:14px;border:0;border-radius:14px;font-size:18px;font-weight:900;color:#fff;background:linear-gradient(120deg,#22c56a,#1e90ff)">✔ YES</button>
          <button id="dpNo" style="flex:1;padding:14px;border:1px solid rgba(111,227,255,.3);border-radius:14px;font-size:18px;font-weight:900;color:#fff;background:rgba(30,44,80,.9)">✖ NO</button></div>
        <div id="dpProg" style="display:none"><div style="height:12px;border-radius:8px;background:#0a1a33;overflow:hidden"><div id="dpBar" style="height:100%;width:0;background:linear-gradient(90deg,#3ad0ff,#8a7dff,#ff5ad6);transition:width .2s"></div></div><div id="dpMsg" style="margin-top:8px;color:#9fb3d8">Downloading…</div></div>
      </div></div>`;
    document.body.appendChild(box);
    document.getElementById('dpNo').onclick = () => box.remove();
    document.getElementById('dpYes').onclick = () => { document.getElementById('dpUpdBtns').style.display = 'none'; document.getElementById('dpProg').style.display = 'block'; window.DreamPlayApp.installUpdate(); };
  };
  window.dpUpdateProgress = (pct, msg) => { const b = document.getElementById('dpBar'); if (b) b.style.width = Math.round(pct) + '%'; const m = document.getElementById('dpMsg'); if (m && msg) m.textContent = msg; };
  window.dpUpdateFailed = (msg) => { const m = document.getElementById('dpMsg'); if (m) m.textContent = '😕 ' + (msg || 'The update could not be installed. Try again later.'); setTimeout(() => { const b = document.getElementById('dpUpd'); if (b) b.remove(); }, 4000); };
  document.addEventListener('DOMContentLoaded', () => { try { if (window.DreamPlayApp && !sessionStorage.getItem('dpChecked')) { sessionStorage.setItem('dpChecked', '1'); window.DreamPlayApp.checkUpdate(window.DP_VERSION); } } catch (e) { } });
  if (location.search.includes('updtest')) document.addEventListener('DOMContentLoaded', () => setTimeout(() => window.dpUpdateInfo({ version: '1.0.1', notes: ['The new Morph Lab', 'Touch controls for tablets'] }), 300));
  const onPC = (location.hostname === '127.0.0.1' || location.hostname === 'localhost') && !location.search.includes('offline');
  window.DREAMPLAY_OFFLINE = !onPC;
  if (!onPC) {
    const realFetch = window.fetch.bind(window);
    const get = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
    const put = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } };
    const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json' } });
    const safe = (s, d) => (String(s || '').replace(/[^\w\- ]/g, '').trim().slice(0, 40) || d);
    window.fetch = async (input, init = {}) => {
      const url = new URL(typeof input === 'string' ? input : input.url, location.href);
      if (!url.pathname.startsWith('/api/')) return realFetch(input, init);
      const method = (init.method || 'GET').toUpperCase(), q = url.searchParams, p = url.pathname;
      let body = {}; try { body = init.body ? JSON.parse(init.body) : {}; } catch (e) { }
      if (p === '/api/ping') return json({ ok: true, offline: true });
      if (p === '/api/adv') { const id = safe(q.get('p'), 'main').toLowerCase(); if (method === 'POST') { put('dp_adv_' + id, body); return json({ ok: true }); } return json(get('dp_adv_' + id, {})); }
      if (p === '/api/advprofiles') {
        const out = [];
        for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (!k.startsWith('dp_adv_')) continue; const d = get(k, {}); if (d.name) out.push({ id: k.slice(7), name: d.name, step: d.step || '', team: (d.team || []).length, avatar: d.avatar || {} }); }
        return json({ profiles: out });
      }
      if (p === '/api/profile') { if (method === 'POST') { put('dp_profile', body); return json({ ok: true }); } return json(get('dp_profile', {})); }
      if (p === '/api/custom') { if (method === 'POST') { put('dp_custom', body); return json({ ok: true }); } return json(get('dp_custom', { elements: [] })); }
      if (p === '/api/maps') { const maps = []; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith('dp_map_')) maps.push(k.slice(7)); } return json({ maps: maps.sort() }); }
      if (p === '/api/map') {
        if (method === 'POST') { const name = safe(body.name, 'My map'); body.name = name; put('dp_map_' + name, body); return json({ ok: true, name }); }
        const m = get('dp_map_' + safe(q.get('name'), 'My map'), null); return m ? json(m) : json({ error: 'not found' }, 404);
      }
      if (p.startsWith('/api/claude')) return json({ sdk: false, key: false, ready: false, offline: true, model: '' });
      if (p === '/api/search') return json({ error: 'Search with Claude works in the PC version of dreamPlay.' }, 503);
      return json({ error: 'not available offline' }, 404);
    };
  }
  // finger -> mouse for the Tower Defense map editor (painting tiles by dragging)
  document.addEventListener('DOMContentLoaded', () => {
    const wrap = document.getElementById('stageWrap');
    if (!wrap) return;
    wrap.style.touchAction = 'none';
    const fire = (type, t) => { const el = document.elementFromPoint(t.clientX, t.clientY) || wrap; el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX: t.clientX, clientY: t.clientY, button: 0, buttons: type === 'mouseup' ? 0 : 1 })); };
    wrap.addEventListener('touchstart', (e) => { if (e.touches.length > 1) return; e.preventDefault(); fire('mousedown', e.changedTouches[0]); }, { passive: false });
    wrap.addEventListener('touchmove', (e) => { if (e.touches.length > 1) return; e.preventDefault(); fire('mousemove', e.changedTouches[0]); }, { passive: false });
    wrap.addEventListener('touchend', (e) => { e.preventDefault(); const t = e.changedTouches[0]; fire('mouseup', t); }, { passive: false });
  });
})();
