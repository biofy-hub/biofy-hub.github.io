/* Biofy Hub · perfiles por módulo y qué llaves lleva cada uno.
   Lo usan a la vez el panel de Accesos (en el navegador) y scripts/montar.mjs (en el Mac),
   para que los llaveros salgan siempre iguales. Aquí no va ninguna clave: solo las reglas.
   Un perfil nuevo (una «zona» que capar) se añade aquí y en el módulo que lo use. */
(function (g) {
  // permiso → perfiles posibles, de menos a más. El primero de cada lista es el más limitado.
  g.HUB_PERFILES = {
    pizarra:     [{ id: 'ver',       nombre: 'Solo ver' },            { id: 'admin', nombre: 'Administrar (subir PDF, fotos, versiones)' }],
    dashboard:   [{ id: 'jefe',      nombre: 'Ver y guardar versiones' }, { id: 'admin', nombre: 'Administrar (además renombrar y borrar)' }],
    formularios: [{ id: 'responder', nombre: 'Solo responder' },      { id: 'panel', nombre: 'Ver las respuestas' }],
    curso:       [{ id: 'alumno',    nombre: 'Alumno' }],
    // Productos (Juan, 23/11): ver las fichas; administrar = además ver las eliminadas y elegir qué fichas se ven
    // (guardarlo pide además ser administrador del Hub, que es quien tiene la llave de publicar).
    fichas:      [{ id: 'ver',       nombre: 'Ver las fichas' },      { id: 'admin', nombre: 'Administrar (eliminadas y qué fichas se ven)' }]
  };

  // Llaves de cada persona según sus permisos. S = secretos de los módulos (solo los tienen el Mac y los administradores del Hub).
  g.HUB_LLAVES = function (w, S) {
    const L = {};
    if (w.pizarra === 'admin') L.pizarra = { read: S.pizarra.write_token, write: S.pizarra.write_token };
    else if (w.pizarra === 'ver') L.pizarra = { read: S.pizarra.read_token };
    if (w.dashboard === 'admin') L.dashboard = { read: S.dashboard.write_token, write: S.dashboard.write_token, role: 'admin' };
    else if (w.dashboard === 'jefe') L.dashboard = { read: S.dashboard.read_token, write: S.dashboard.write_token, role: 'jefe' };
    if (w.formularios === 'panel') L.formularios = { t: S.formularios.token, k: S.formularios.priv };
    else if (w.formularios === 'responder') L.formularios = { t: S.formularios.token };
    if (w.curso) L.curso = { clave: S.curso };
    if (S.fichas && w.fichas === 'admin') L.fichas = { ver: S.fichas.ver, admin: S.fichas.admin };
    else if (S.fichas && w.fichas === 'ver') L.fichas = { ver: S.fichas.ver };
    if (w.hub === 'admin') L.hub = { clave: S.hub.clave, gh: S.hub.gh || null };
    return L;
  };

  // Lo que va dentro del llavero de cada persona.
  g.HUB_CONTENIDO = function (u, S) {
    const webs = {};
    for (const [k, v] of Object.entries(u.webs || {})) if (v) webs[k] = v;
    const dispositivo = /dispositivo/i.test(u.rol || '');
    return { nombre: dispositivo ? u.nombre : u.nombre.split(' ')[0], perfil: u.rol || '', admin: webs.hub === 'admin', permisos: webs, llaves: g.HUB_LLAVES(webs, S) };
  };
})(typeof window !== 'undefined' ? window : globalThis);
