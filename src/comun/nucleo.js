/* Biofy Hub · núcleo común: tema, iconos, cabecera con etiqueta, sesión y permisos.
   Los módulos solo usan Hub.* — nunca hablan directamente con GitHub ni con un servidor.
   Al mudarnos se cambia el «acceso» y los «datos» aquí y los módulos siguen igual. */
(function () {
  const C = window.HUB_CONFIG, K = k => C.almacen + k;
  const RAIZ = document.currentScript.src.replace(/comun\/nucleo\.js.*$/, '');
  const ls = () => { try { return localStorage; } catch (e) { return null; } };
  const ss = () => { try { return sessionStorage; } catch (e) { return null; } };
  const guarda = (k, v) => { try { v == null ? ls().removeItem(K(k)) : ls().setItem(K(k), v); } catch (e) {} };
  const lee = k => { try { return ls().getItem(K(k)); } catch (e) { return null; } };

  /* ---------- Tema: claro por defecto, se recuerda en cada dispositivo ---------- */
  if (lee('tema') === 'dark') document.documentElement.dataset.theme = 'dark';
  const cambiaTema = () => {
    const osc = document.documentElement.dataset.theme !== 'dark';
    if (osc) document.documentElement.dataset.theme = 'dark'; else delete document.documentElement.dataset.theme;
    guarda('tema', osc ? 'dark' : 'light');
  };

  /* ---------- Iconos (24×24, trazo) ---------- */
  const P = {
    hub:'<rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/>',
    trofeo:'<path d="M8 4h8v5a4 4 0 0 1-8 0V4zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7M10 17h4"/>',
    barras:'<path d="M4 20V11M10 20V5M16 20v-6M21 20H3"/>',
    quiniela:'<rect x="4" y="3.5" width="16" height="17" rx="2.5"/><path d="M8 8.5h8M8 12.5h5M8 16.5h3M15 15.5l1.5 1.5 3-3"/>',
    euro:'<path d="M17.5 6.5A7 7 0 1 0 17.5 17.5M4 10.5h9M4 13.5h9"/>',
    birrete:'<path d="M2.5 9 12 4.5 21.5 9 12 13.5 2.5 9zM6.5 11v4.5c0 1.5 2.5 3 5.5 3s5.5-1.5 5.5-3V11M21.5 9v5"/>',
    ficha:'<rect x="4" y="3.5" width="16" height="17" rx="2.5"/><rect x="7.5" y="7" width="4.5" height="6" rx="1"/><path d="M14.5 8h2M14.5 11h2M7.5 16.5h9"/>',
    portapapeles:'<path d="M9 4h6v3H9zM8 5.5H6v15h12v-15h-2M9 13.5l2 2 4-4.5"/>',
    chat:'<path d="M4 19.5l1.3-3.6A8 8 0 1 1 8.4 19L4 19.5z"/><path d="M9 10.5h6M9 13.5h4"/>',
    llave:'<circle cx="8" cy="15" r="4"/><path d="M11 12l8.5-8.5M16 7l2.5 2.5M14 9l2 2"/>',
    flecha:'<path d="M5 12h14M13 6l6 6-6 6"/>',
    fuera:'<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    atras:'<path d="M19 12H5M11 6l-6 6 6 6"/>',
    luna:'<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>',
    sol:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    salir:'<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l-4-4 4-4M6 12h10"/>',
    obra:'<path d="M3 20h18M5 20l3-12h8l3 12M7.5 14h9M9 8l1-4h4l1 4"/>'
  };
  const icono = (n, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || P.hub}</svg>`;
  // Icono de la pestaña: el del módulo abierto (Juan, 20/11). Cuadrado azul con el dibujo en blanco.
  function iconoPestana(nombre) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#2968fe"/><g transform="translate(14 14) scale(1.5)" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${P[nombre] || P.hub}</g></svg>`;
    document.querySelectorAll('link[rel~="icon"]').forEach(l => l.remove());
    const l = document.createElement('link'); l.rel = 'icon'; l.type = 'image/svg+xml';
    l.href = 'data:image/svg+xml,' + encodeURIComponent(svg);
    document.head.appendChild(l);
  }
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

  /* ---------- Acceso (tipo «cifrado») ----------
     Cada persona tiene un LLAVERO cifrado con su contraseña (comun/llaveros.json: lo genera el montaje
     o el panel de Accesos). Se lee siempre recién publicado, así un cambio de permisos llega al momento.
     Dentro: nombre, permisos por módulo y SOLO las llaves de sus módulos y funciones.
     Sin la llave, un módulo no tiene datos aunque se escriba su dirección.
     Con servidor propio, entrar() preguntará al servidor; la interfaz (sesion, puede, llave, salir) no cambia. */
  const u8 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
  const clave = pw => crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveBits', 'deriveKey']);
  async function idDe(pw) {   // nombre del llavero: se saca de la contraseña, así no hay que probarlos todos
    return hex(await crypto.subtle.deriveBits({ name:'PBKDF2', salt:new TextEncoder().encode('biofy-hub/llavero'), iterations:100000, hash:'SHA-256' }, await clave(pw), 128));
  }
  // La llave de cada llavero sale de la contraseña y del nombre del llavero (siempre el mismo para cada persona).
  // Se guarda la LLAVE (no la contraseña) para poder abrir el llavero nuevo tras cada publicación sin volver a pedirla.
  async function llaveDe(pw, sal) {
    return crypto.subtle.deriveKey({ name:'PBKDF2', salt:sal, iterations:600000, hash:'SHA-256' }, await clave(pw), { name:'AES-GCM', length:256 }, true, ['decrypt', 'encrypt']);
  }
  const b64 = b => { let t = ''; const a = new Uint8Array(b); for (let i = 0; i < a.length; i += 8192) t += String.fromCharCode(...a.subarray(i, i + 8192)); return btoa(t); };
  const deHex = h => new Uint8Array(h.match(/../g).map(x => parseInt(x, 16)));
  // Cierra un texto con una llave AES guardada (la de un llavero o la del registro de Accesos).
  async function cierraCon(kB64, texto, sal) {
    const k = await crypto.subtle.importKey('raw', u8(kB64), 'AES-GCM', false, ['encrypt']), iv = crypto.getRandomValues(new Uint8Array(12));
    const c = await crypto.subtle.encrypt({ name:'AES-GCM', iv }, k, new TextEncoder().encode(texto));
    return sal ? { n:600000, s:b64(sal), i:b64(iv), c:b64(c) } : { i:b64(iv), c:b64(c) };
  }
  async function abreConB64(kB64, b) {
    try { return await abreCon(await crypto.subtle.importKey('raw', u8(kB64), 'AES-GCM', false, ['decrypt']), b); } catch (e) { return null; }
  }
  // Para el panel: de una contraseña nueva saca el nombre del llavero y su llave (la contraseña no se guarda nunca).
  async function nuevaPersona(pw) {
    const id = await idDe(pw), k = await llaveDe(pw, deHex(id));
    return { id, k: b64(await crypto.subtle.exportKey('raw', k)) };
  }
  const cierraLlavero = (u, texto) => cierraCon(u.k, texto, deHex(u.id));
  async function abreCon(k, b) {
    try { return new TextDecoder().decode(await crypto.subtle.decrypt({ name:'AES-GCM', iv:u8(b.i) }, k, u8(b.c))); } catch (e) { return null; }
  }
  function guardaSesion(s, recordar) {
    salirSinIr();
    try { (recordar ? ls() : ss()).setItem(K('sesion'), JSON.stringify(s)); } catch (e) {}
  }
  async function entrar(pw, recordar) {
    const id = await idDe(pw), b = (window.HUB_LLAVEROS || {})[id];
    if (!b) return false;
    const k = await llaveDe(pw, u8(b.s)), txt = await abreCon(k, b);
    if (!txt) return false;
    const s = JSON.parse(txt);
    s.id = id;
    s.k = b64(await crypto.subtle.exportKey('raw', k));
    s.build = window.HUB_BUILD;
    const dias = /dispositivo/i.test(s.perfil || '') ? (C.acceso.recordarDispositivoDias || C.acceso.recordarDias) : C.acceso.recordarDias;
    s.exp = Date.now() + (recordar ? dias * 864e5 : 12 * 36e5);
    guardaSesion(s, recordar);
    return true;
  }
  // Tras cada publicación: abre el llavero nuevo con la llave guardada. Si ya no hay llavero (baja) o cambió la contraseña, cierra la sesión.
  let LL = null;
  const listo = (async () => {
    try { const r = await fetch(RAIZ + 'comun/llaveros.json?t=' + Date.now(), { cache:'no-store' }); if (r.ok) LL = await r.json(); } catch (e) {}
    if (!LL) return;   // sin conexión: se sigue con la sesión que hay
    window.HUB_BUILD = LL.build; window.HUB_LLAVEROS = LL.llaveros || {};
    const s = sesion();
    if (!s || s.build === window.HUB_BUILD) return;
    const recordar = !!(ls() && ls().getItem(K('sesion')));
    const b = (window.HUB_LLAVEROS || {})[s.id];
    let txt = null;
    if (b && s.k) txt = await abreConB64(s.k, b);
    if (!txt) { salirSinIr(); return; }
    guardaSesion({ ...JSON.parse(txt), id: s.id, k: s.k, build: window.HUB_BUILD, exp: s.exp }, recordar);
  })();
  function sesion() {
    for (const st of [ss(), ls()]) {
      if (!st) continue;
      try { const s = JSON.parse(st.getItem(K('sesion')) || 'null'); if (s && s.exp > Date.now()) return s; st.removeItem(K('sesion')); } catch (e) {}
    }
    return null;
  }
  function salirSinIr() { for (const st of [ss(), ls()]) { try { st.removeItem(K('sesion')); } catch (e) {} } }
  const salir = () => { salirSinIr(); location.href = Hub.raiz + 'index.html'; };

  /* ---------- Panel de Accesos (solo administradores del Hub) ----------
     El REGISTRO (personas, permisos y secretos de los módulos) va cifrado con la llave del Hub,
     que solo está en los llaveros de los administradores. Publicar = reescribir comun/llaveros.json. */
  async function registro() {
    const k = llave('accesos');
    if (!k || !LL || !LL.registro) return null;
    const t = await abreConB64(k.clave, LL.registro);
    return t ? JSON.parse(t) : null;
  }
  async function publicaAccesos(reg) {
    const k = llave('accesos'), P = C.acceso.publicar;
    if (!k) throw new Error('Sin permiso');
    if (!k.gh) throw new Error('Falta la llave de publicar del Hub');
    const llaveros = {};
    for (const u of reg.usuarios) {
      if (u.baja) continue;
      if (llaveros[u.id]) throw new Error('Dos personas con la misma contraseña');
      llaveros[u.id] = await cierraLlavero(u, JSON.stringify(HUB_CONTENIDO(u, reg.secretos)));
    }
    const nuevo = { build: Date.now().toString(36), llaveros, registro: await cierraCon(k.clave, JSON.stringify(reg)) };
    const api = `https://api.github.com/repos/${P.owner}/${P.repo}/contents/${P.ruta}`, h = { Authorization: 'Bearer ' + k.gh, Accept: 'application/vnd.github+json' };
    const ahora = await fetch(`${api}?ref=${P.rama}&t=${Date.now()}`, { headers: h, cache:'no-store' });
    if (!ahora.ok) throw new Error('GitHub no deja leer (' + ahora.status + ')');
    const j = await ahora.json(), sha = j.sha;
    let actual = null; try { actual = JSON.parse(new TextDecoder().decode(u8((j.content || '').replace(/\n/g, '')))); } catch (e) {}
    if (!actual || actual.build !== LL.build) throw new Error('Otra persona ha cambiado los accesos mientras tanto. Recarga la página y vuelve a hacer el cambio.');
    const r = await fetch(api, { method:'PUT', headers: h, body: JSON.stringify({ message:'Accesos: cambios desde el panel (' + new Date().toISOString().slice(0, 10) + ')', content: b64(new TextEncoder().encode(JSON.stringify(nuevo))), sha, branch: P.rama }) });
    if (!r.ok) throw new Error('GitHub no deja publicar (' + r.status + ')');
    LL = nuevo; window.HUB_BUILD = nuevo.build; window.HUB_LLAVEROS = llaveros;
    return nuevo;
  }
  // Publica un archivo pequeño de un módulo en la web (p. ej. qué fichas se ven). Solo administradores del Hub
  // (son los que llevan la llave de publicar). Si alguien lo cambió mientras tanto (sha distinto), se para.
  async function publicaArchivo(ruta, texto, mensaje, shaEsperado) {
    const k = llave('accesos'), P = C.acceso.publicar;
    if (!k || !k.gh) throw new Error('Solo los administradores del Hub pueden guardar esto');
    const api = `https://api.github.com/repos/${P.owner}/${P.repo}/contents/${ruta}`, h = { Authorization: 'Bearer ' + k.gh, Accept: 'application/vnd.github+json' };
    const ahora = await fetch(`${api}?ref=${P.rama}&t=${Date.now()}`, { headers: h, cache:'no-store' });
    const sha = ahora.ok ? (await ahora.json()).sha : null;
    if (!ahora.ok && ahora.status !== 404) throw new Error('GitHub no deja leer (' + ahora.status + ')');
    if (shaEsperado !== undefined && sha !== shaEsperado) throw new Error('Otra persona lo ha cambiado mientras tanto. Recarga la página y vuelve a hacerlo.');
    const r = await fetch(api, { method:'PUT', headers: h, body: JSON.stringify({ message: mensaje, content: b64(new TextEncoder().encode(texto)), branch: P.rama, ...(sha ? { sha } : {}) }) });
    if (!r.ok) throw new Error('GitHub no deja guardar (' + r.status + ')');
    return (await r.json()).content.sha;
  }
  // sha del archivo publicado (para saber si otro lo cambió antes de guardar)
  async function shaDe(ruta) {
    const k = llave('accesos'), P = C.acceso.publicar;
    if (!k || !k.gh) return null;
    const r = await fetch(`https://api.github.com/repos/${P.owner}/${P.repo}/contents/${ruta}?ref=${P.rama}&t=${Date.now()}`, { headers: { Authorization: 'Bearer ' + k.gh, Accept: 'application/vnd.github+json' }, cache:'no-store' });
    return r.ok ? (await r.json()).sha : null;
  }
  // Archivos cifrados de un módulo: 12 bytes de iv + el contenido cifrado con AES-GCM.
  async function abreBinario(kB64, buf) {
    const k = await crypto.subtle.importKey('raw', u8(kB64), 'AES-GCM', false, ['decrypt']);
    return crypto.subtle.decrypt({ name:'AES-GCM', iv: new Uint8Array(buf, 0, 12) }, k, new Uint8Array(buf, 12));
  }
  const cifra = { abre: abreConB64, cierra: (kB64, texto) => cierraCon(kB64, texto), abreBinario };

  const modulo = id => window.HUB_MODULOS.find(m => m.id === id);
  // ¿Puede ver este módulo? Accesos: solo administradores del Hub. En construcción: con permiso o administrador.
  function puede(id) {
    const s = sesion(), m = modulo(id);
    if (!s || !m) return false;
    if (m.id === 'accesos') return !!s.admin;
    return !!s.permisos[m.permiso] || (m.estado === 'obra' && !!s.admin);
  }
  const permiso = id => { const s = sesion(), m = modulo(id); return (s && m && s.permisos[m.permiso]) || null; };
  const llave = id => { const s = sesion(), m = modulo(id); return (s && m && s.llaves && s.llaves[m.permiso]) || null; };
  const misModulos = () => window.HUB_MODULOS.filter(m => puede(m.id));
  const href = m => m.ruta ? Hub.raiz + m.ruta : m.fuera || `${Hub.raiz}modulo.html?m=${m.id}`;

  /* ---------- Cabecera común: logo + etiqueta del módulo ---------- */
  function cabecera(etiqueta, iconoEtiqueta) {
    const s = sesion();
    const ini = s ? s.nombre.trim()[0].toUpperCase() : '?';
    const h = document.createElement('header');
    h.className = 'top';
    h.innerHTML = `<div class="in">
      <a class="brand" href="${Hub.raiz}index.html" aria-label="Volver al Hub">
        <img class="logo logo-l" src="${Hub.raiz}comun/marca/logo-horizontal-blue.svg" alt="Culligan Biofy">
        <img class="logo logo-d" src="${Hub.raiz}comun/marca/logo-horizontal-white.svg" alt="Culligan Biofy">
        <span class="etiqueta">${icono(iconoEtiqueta || 'hub')}${esc(etiqueta)}</span>
      </a>
      <button class="btn-ic theme" type="button" aria-label="Cambiar modo claro u oscuro">${icono('luna','moon')}${icono('sol','sun')}</button>
      ${s ? `<button class="yo" type="button" aria-haspopup="true"><span class="av">${esc(ini)}</span><span class="nm">${esc(s.nombre)}<small>${esc(s.perfil)}</small></span></button>
      <div class="menu" role="menu"><button type="button" data-a="hub">${icono('hub')}Ir al Hub</button><button type="button" data-a="salir">${icono('salir')}Cerrar sesión</button></div>` : ''}
    </div>`;
    document.body.prepend(h);
    h.querySelector('.theme').onclick = cambiaTema;
    const yo = h.querySelector('.yo'), menu = h.querySelector('.menu');
    if (yo) {
      yo.onclick = e => { e.stopPropagation(); menu.classList.toggle('open'); };
      document.addEventListener('click', () => menu.classList.remove('open'));
      menu.onclick = e => { const a = e.target.closest('button')?.dataset.a; if (a === 'salir') salir(); if (a === 'hub') location.href = Hub.raiz + 'index.html'; };
    }
    document.title = `${etiqueta === 'Hub' ? '' : etiqueta + ' · '}${C.nombre}`;
  }

  // ¿Qué módulo es esta página? Por su carpeta (pizarra/, dashboard/…) o por modulo.html?m=…
  (function () {
    const resto = location.href.split('#')[0].split('?')[0].replace(RAIZ, '');
    let m = (window.HUB_MODULOS || []).find(x => x.ruta && resto.startsWith(x.ruta));
    if (!m && /modulo\.html$/.test(resto)) m = modulo(new URLSearchParams(location.search).get('m'));
    try { iconoPestana(m ? m.icono : 'hub'); } catch (e) {}
  })();

  window.Hub = { raiz: RAIZ, config: C, accesos: { registro, publica: publicaAccesos, nuevaPersona }, publicaArchivo, shaDe, cifra, icono, esc, cambiaTema, sesion, entrar, salir, listo, puede, permiso, llave, misModulos, modulo, href, cabecera, guarda, lee };
})();
