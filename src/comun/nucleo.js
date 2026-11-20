/* Biofy Hub · núcleo común: tema, iconos, cabecera con etiqueta, sesión y permisos.
   Los módulos solo usan Hub.* — nunca hablan directamente con GitHub ni con un servidor.
   Al mudarnos se cambia el «acceso» y los «datos» aquí y los módulos siguen igual. */
(function () {
  const C = window.HUB_CONFIG, K = k => C.almacen + k;
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
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

  /* ---------- Acceso (tipo «cifrado») ----------
     Cada persona tiene un LLAVERO cifrado con su contraseña (comun/llaveros.js, se genera al montar).
     Dentro: nombre, permisos por módulo y SOLO las llaves de sus módulos y funciones.
     Sin la llave, un módulo no tiene datos aunque se escriba su dirección.
     Con servidor propio, entrar() preguntará al servidor; la interfaz (sesion, puede, llave, salir) no cambia. */
  const u8 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
  const clave = pw => crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveBits', 'deriveKey']);
  async function idDe(pw) {   // nombre del llavero: se saca de la contraseña, así no hay que probarlos todos
    return hex(await crypto.subtle.deriveBits({ name:'PBKDF2', salt:new TextEncoder().encode('biofy-hub/llavero'), iterations:100000, hash:'SHA-256' }, await clave(pw), 128));
  }
  async function abre(b, pw) {
    try {
      const k = await crypto.subtle.deriveKey({ name:'PBKDF2', salt:u8(b.s), iterations:b.n, hash:'SHA-256' }, await clave(pw), { name:'AES-GCM', length:256 }, false, ['decrypt']);
      return new TextDecoder().decode(await crypto.subtle.decrypt({ name:'AES-GCM', iv:u8(b.i) }, k, u8(b.c)));
    } catch (e) { return null; }
  }
  async function entrar(pw, recordar) {
    const b = (window.HUB_LLAVEROS || {})[await idDe(pw)];
    const txt = b && await abre(b, pw);
    if (!txt) return false;
    const s = JSON.parse(txt);
    s.exp = Date.now() + (recordar ? C.acceso.recordarDias * 864e5 : 12 * 36e5);
    salirSinIr();
    try { (recordar ? ls() : ss()).setItem(K('sesion'), JSON.stringify(s)); } catch (e) {}
    return true;
  }
  function sesion() {
    for (const st of [ss(), ls()]) {
      if (!st) continue;
      try { const s = JSON.parse(st.getItem(K('sesion')) || 'null'); if (s && s.exp > Date.now()) return s; st.removeItem(K('sesion')); } catch (e) {}
    }
    return null;
  }
  function salirSinIr() { for (const st of [ss(), ls()]) { try { st.removeItem(K('sesion')); } catch (e) {} } }
  const salir = () => { salirSinIr(); location.href = Hub.raiz + 'index.html'; };
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

  window.Hub = { raiz: document.currentScript.src.replace(/comun\/nucleo\.js.*$/, ''), config: C, icono, esc, cambiaTema, sesion, entrar, salir, puede, permiso, llave, misModulos, modulo, href, cabecera, guarda, lee };
})();
