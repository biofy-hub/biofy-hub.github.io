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
  // Usuario (Juan, 23/11): quien tiene usuario se busca por él (así dos personas pueden tener la misma contraseña);
  // quien todavía no tiene, entra solo con la contraseña, como siempre.
  const normUsuario = t => String(t || '').trim().toLowerCase();
  async function claveUsuario(usuario) {
    return 'u' + hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('biofy-hub/usuario/' + normUsuario(usuario)))).slice(0, 32);
  }
  const claveLlavero = async u => u.usuario ? claveUsuario(u.usuario) : u.id;
  async function entrar(usuario, pw, recordar) {
    if (pw === undefined || typeof pw === 'boolean') { recordar = pw; pw = usuario; usuario = ''; }
    const llave = normUsuario(usuario) ? await claveUsuario(usuario) : await idDe(pw), b = (window.HUB_LLAVEROS || {})[llave];
    if (!b) return false;
    const k = await llaveDe(pw, u8(b.s)), txt = await abreCon(k, b);
    if (!txt) return false;
    const s = JSON.parse(txt);
    s.id = hex(u8(b.s)); s.llave = llave;
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
    let llave = s.llave || s.id, b = (window.HUB_LLAVEROS || {})[llave], txt = null;
    if (b && s.k) txt = await abreConB64(s.k, b);
    // Si le han puesto usuario (o se lo han cambiado), su llavero cambia de sitio: se busca el que abre su llave.
    if (!txt && s.k) for (const [kk, bb] of Object.entries(window.HUB_LLAVEROS || {})) { txt = await abreConB64(s.k, bb); if (txt) { llave = kk; break; } }
    if (!txt) { salirSinIr(); return; }
    guardaSesion({ ...JSON.parse(txt), id: s.id, llave, k: s.k, build: window.HUB_BUILD, exp: s.exp }, recordar);
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
    if (window.HUB_PREPARA) HUB_PREPARA(reg.usuarios, () => b64(crypto.getRandomValues(new Uint8Array(32))), reg.secretos);
    for (const u of reg.usuarios) {
      if (u.baja || u.sinAcceso) continue;   // sin acceso = solo ficha (para listas): no lleva llavero
      const kk = await claveLlavero(u);
      if (llaveros[kk]) throw new Error(u.usuario ? 'Dos personas con el mismo usuario (' + u.usuario + ')' : 'Dos personas sin usuario con la misma contraseña. Ponles usuario.');
      llaveros[kk] = await cierraLlavero(u, JSON.stringify(HUB_CONTENIDO(u, reg.secretos)));
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
    const r = await fetch(api, { method:'PUT', headers: h, body: JSON.stringify({ message: mensaje, content: b64(texto instanceof Uint8Array ? texto : new TextEncoder().encode(texto)), branch: P.rama, ...(sha ? { sha } : {}) }) });
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

  /* ---------- Fotos de las personas (Juan, 23/11): un solo sitio para todo el Hub ----------
     Cada foto va cifrada en fotos/<código>.bin; el código sale del nombre (igual que en la pizarra: sin tildes,
     en minúsculas y con guiones), así la misma persona tiene la misma foto en la pizarra, Accesos y Quinielas. */
  const slugNombre = t => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  async function archivoFoto(nombre) { return 'fotos/' + hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('biofy-hub/foto/' + slugNombre(nombre)))).slice(0, 24) + '.bin'; }
  const FOTOS = {};
  function foto(nombre) {
    const s = slugNombre(nombre); if (!s) return Promise.resolve(null);
    if (!(s in FOTOS)) FOTOS[s] = (async () => {
      const k = ((sesion() || {}).llaves || {}).fotos; if (!k) return null;
      const r = await fetch(RAIZ + await archivoFoto(nombre) + '?v=' + (window.HUB_BUILD || '')); if (!r.ok) return null;
      return URL.createObjectURL(new Blob([await abreBinario(k.k, await r.arrayBuffer())], { type: 'image/jpeg' }));
    })().catch(() => null);
    return FOTOS[s];
  }
  // Solo administradores del Hub (llave de publicar). bytes = JPEG ya recortado.
  async function subeFoto(nombre, bytes) {
    const k = ((sesion() || {}).llaves || {}).fotos; if (!k) throw new Error('Falta la llave de las fotos. Vuelve a entrar en el Hub.');
    const key = await crypto.subtle.importKey('raw', u8(k.k), 'AES-GCM', false, ['encrypt']), iv = crypto.getRandomValues(new Uint8Array(12));
    const c = new Uint8Array(await crypto.subtle.encrypt({ name:'AES-GCM', iv }, key, bytes)), todo = new Uint8Array(12 + c.length);
    todo.set(iv); todo.set(c, 12);
    await publicaArchivo(await archivoFoto(nombre), todo, 'Foto de una persona (Accesos)');
    FOTOS[slugNombre(nombre)] = Promise.resolve(URL.createObjectURL(new Blob([bytes], { type: 'image/jpeg' })));
  }
  // Recorta una imagen en cuadrado (centrada) y la deja en JPEG, como en la pizarra
  async function recortaFoto(archivo, lado = 400) {
    const img = await createImageBitmap(archivo), m = Math.min(img.width, img.height), cv = document.createElement('canvas');
    cv.width = cv.height = lado; cv.getContext('2d').drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, lado, lado);
    const blob = await new Promise(ok => cv.toBlob(ok, 'image/jpeg', 0.86));
    return new Uint8Array(await blob.arrayBuffer());
  }

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
    if (s) foto(s.nombreCompleto || s.nombre).then(u => { if (u) h.querySelector('.yo .av').innerHTML = `<img src="${u}" alt="">`; });
    const yo = h.querySelector('.yo'), menu = h.querySelector('.menu');
    if (yo) {
      yo.onclick = e => { e.stopPropagation(); menu.classList.toggle('open'); };
      document.addEventListener('click', () => menu.classList.remove('open'));
      menu.onclick = e => { const a = e.target.closest('button')?.dataset.a; if (a === 'salir') salir(); if (a === 'hub') location.href = Hub.raiz + 'index.html'; };
    }
    document.title = `${etiqueta === 'Hub' ? '' : etiqueta + ' · '}${C.nombre}`;
  }

  /* ---------- Añadir el Hub a la pantalla de inicio (Juan, 23/11) ----------
     Android/Chrome: abre la ventana de instalar. iPhone: Apple no deja hacerlo con un botón, así que se enseñan los pasos. */
  let pideInstalar = null;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); pideInstalar = e; });
  const esIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const esAndroid = () => /Android/i.test(navigator.userAgent);
  const enIcono = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  // Se recuerda en el móvil: si una vez se abrió desde el icono (o se instaló), ya no se enseñan los pasos (Juan, 24/11).
  if (enIcono()) guarda('instalado', '1');
  window.addEventListener('appinstalled', () => guarda('instalado', '1'));
  const instalado = () => enIcono() || lee('instalado') === '1';
  const esMovil = () => esIOS() || /Android|Mobi/i.test(navigator.userAgent);
  // iPhone: solo Safari (y Chrome con iOS reciente) dejan añadirlo; en otros navegadores se pide abrirlo en Safari.
  const navegadorIOS = () => /CriOS/.test(navigator.userAgent) ? 'Chrome' : /FxiOS|EdgiOS|OPiOS/.test(navigator.userAgent) ? 'otro' : 'Safari';
  async function anadirInicio() {
    if (pideInstalar) { pideInstalar.prompt(); try { if ((await pideInstalar.userChoice).outcome === 'accepted') guarda('instalado', '1'); } catch (e) {} pideInstalar = null; return; }
    const d = document.createElement('dialog');
    d.style.cssText = 'margin:auto;border:0;border-radius:20px;padding:0;max-width:min(420px,calc(100% - 24px));background:var(--surface);color:var(--ink);box-shadow:var(--shadow-up)';
    const paso = (n, t) => `<li style="display:flex;gap:12px;align-items:flex-start;margin:10px 0"><b style="flex:none;width:26px;height:26px;border-radius:8px;background:var(--brand);color:#fff;display:grid;place-items:center;font-size:13px">${n}</b><span>${t}</span></li>`;
    d.innerHTML = `<div style="padding:22px"><h2 style="font-size:19px;font-weight:800;margin-bottom:6px">Añadir el Hub a la pantalla de inicio</h2>
      <p style="font-size:13px;color:var(--muted)">${esIOS() ? 'Pasos para iPhone' : esAndroid() ? 'Pasos para Android' : 'Pasos para tu móvil'}</p>
      <ol style="list-style:none;font-size:14.5px;line-height:1.45">${esIOS()
        ? (navegadorIOS() === 'Safari'
            ? paso(1, 'Toca el botón <b>Compartir</b>: el cuadrado con una flecha hacia arriba, abajo en la pantalla.')
            : navegadorIOS() === 'Chrome'
              ? paso(1, 'Toca el botón <b>Compartir</b> (el cuadrado con una flecha hacia arriba), arriba a la derecha, junto a la dirección. Si no te sale la opción del paso 2, abre esta página en <b>Safari</b>.')
              : paso(1, 'Abre esta página en <b>Safari</b> (este navegador no deja añadirla). Allí toca <b>Compartir</b>: el cuadrado con una flecha hacia arriba.'))
          + paso(2, 'Baja y elige <b>«Añadir a pantalla de inicio»</b>, y luego <b>«Añadir»</b>.') + paso(3, 'Abre el Hub desde el icono nuevo. Así funciona como una app y te pueden llegar los avisos.')
        : paso(1, 'Abre el menú del navegador (los tres puntos, arriba a la derecha).') + paso(2, 'Elige <b>«Instalar aplicación»</b> o <b>«Añadir a pantalla de inicio»</b>, y luego <b>«Instalar»</b>.') + paso(3, 'Abre el Hub desde el icono nuevo.')}</ol>
      <div style="text-align:right;margin-top:12px"><button class="btn" type="button" style="width:auto;padding:0 22px">Entendido</button></div></div>`;
    document.body.appendChild(d); d.querySelector('button').onclick = () => { d.close(); d.remove(); }; d.showModal();
  }

  // ¿Qué módulo es esta página? Por su carpeta (pizarra/, dashboard/…) o por modulo.html?m=…
  (function () {
    const resto = location.href.split('#')[0].split('?')[0].replace(RAIZ, '');
    let m = (window.HUB_MODULOS || []).find(x => x.ruta && resto.startsWith(x.ruta));
    if (!m && /modulo\.html$/.test(resto)) m = modulo(new URLSearchParams(location.search).get('m'));
    try { iconoPestana(m ? m.icono : 'hub'); } catch (e) {}
  })();

  window.Hub = { raiz: RAIZ, config: C, accesos: { registro, publica: publicaAccesos, nuevaPersona, claveUsuario }, publicaArchivo, shaDe, cifra, foto, subeFoto, recortaFoto, slugNombre, anadirInicio, instalado, enIcono, esMovil, esIOS, esAndroid, icono, esc, cambiaTema, sesion, entrar, salir, listo, puede, permiso, llave, misModulos, modulo, href, cabecera, guarda, lee };
})();
