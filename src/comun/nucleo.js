/* Biofy Hub · núcleo común: tema, iconos, cabecera con etiqueta, sesión y permisos.
   Los módulos solo usan Hub.* — nunca hablan directamente con GitHub ni con un servidor.
   Así, al mudarnos, se cambia el «acceso» y los «datos» aquí y los módulos siguen igual. */
(function () {
  const C = window.HUB_CONFIG, K = k => C.almacen + k;
  const guarda = (k, v) => { try { v == null ? localStorage.removeItem(K(k)) : localStorage.setItem(K(k), v); } catch (e) {} };
  const lee = k => { try { return localStorage.getItem(K(k)); } catch (e) { return null; } };

  /* ---------- Tema: claro por defecto, se recuerda en cada dispositivo ---------- */
  if (lee('tema') === 'dark') document.documentElement.dataset.theme = 'dark';
  const cambiaTema = () => {
    const osc = document.documentElement.dataset.theme !== 'dark';
    if (osc) document.documentElement.dataset.theme = 'dark'; else delete document.documentElement.dataset.theme;
    guarda('tema', osc ? 'dark' : 'light');
  };

  /* ---------- Iconos (trazo blanco o de color, 24×24) ---------- */
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
    atras:'<path d="M19 12H5M11 6l-6 6 6 6"/>',
    luna:'<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>',
    sol:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    salir:'<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l-4-4 4-4M6 12h10"/>',
    obra:'<path d="M3 20h18M5 20l3-12h8l3 12M7.5 14h9M9 8l1-4h4l1 4"/>'
  };
  const icono = (n, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || P.hub}</svg>`;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

  /* ---------- Acceso ----------
     BOCETO: se elige un perfil de ejemplo para ver cómo se capan los módulos.
     Siguiente fase («cifrado»): la contraseña de cada persona abre solo las llaves de sus módulos.
     Después («servidor»): inicio de sesión en nuestro hosting. La interfaz no cambia: sesion(), puede(), salir(). */
  const PERFILES_EJEMPLO = {
    admin:     { nombre:'Juan',  perfil:'Administrador', modulos:'*' },
    jefe:      { nombre:'Jefa de equipo', perfil:'Jefe de equipo', modulos:['pizarra','dashboard','quinielas','academia','fichas','formularios'] },
    comercial: { nombre:'Comercial', perfil:'Comercial', modulos:['pizarra','quinielas','academia','fichas','formularios'] },
    tv:        { nombre:'TV de la sala', perfil:'Solo pizarra', modulos:['pizarra'] }
  };
  const sesion = () => { try { return JSON.parse(sessionStorage.getItem(K('sesion')) || lee('sesion') || 'null'); } catch (e) { return null; } };
  const entrar = (clave, recordar) => {
    const s = PERFILES_EJEMPLO[clave]; if (!s) return false;
    const v = JSON.stringify({ ...s, clave });
    try { sessionStorage.setItem(K('sesion'), v); } catch (e) {}
    if (recordar) guarda('sesion', v);
    return true;
  };
  const salir = () => { try { sessionStorage.removeItem(K('sesion')); } catch (e) {} guarda('sesion', null); location.href = Hub.raiz + 'index.html'; };
  const puede = id => { const s = sesion(); return !!s && (s.modulos === '*' || s.modulos.includes(id)); };
  const misModulos = () => window.HUB_MODULOS.filter(m => puede(m.id) && (m.id !== 'accesos' || sesion().modulos === '*'));

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

  window.Hub = { raiz: document.currentScript.src.replace(/comun\/nucleo\.js.*$/, ''), config: C, icono, esc, cambiaTema, sesion, entrar, salir, puede, misModulos, cabecera, guarda, lee };
})();
