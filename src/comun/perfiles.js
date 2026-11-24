/* Biofy Hub · perfiles por módulo y qué llaves lleva cada uno.
   Lo usan a la vez el panel de Accesos (en el navegador) y scripts/montar.mjs (en el Mac),
   para que los llaveros salgan siempre iguales. Aquí no va ninguna clave: solo las reglas.
   Un perfil nuevo (una «zona» que capar) se añade aquí y en el módulo que lo use. */
(function (g) {
  // Tipo de cada persona (Juan, 23/11): sirve para filtrar (p. ej., quién hace quiniela) y para administración.
  g.HUB_TIPOS = ['Comercial', 'Comercial VIP', 'Consultor Técnico', 'Instalador', 'Teleoperadora', 'Teleoperadora Mailing', 'Coord. Teleoperadoras', 'Coord. Mailing', 'Jefe de equipo', 'Administración', 'Dirección', 'Marketing', 'Practicante', 'Dispositivo'];
  // Equipo de cada persona (Juan, 24/11): un jefe de equipo solo ve las quinielas de su equipo; la hoja de producción va por equipo.
  g.HUB_EQUIPOS = ['Córdoba', 'Alicante', 'VIP', 'Consultores técnicos', 'Instaladores', 'Teleoperadoras', 'Mailing'];
  // Si no tiene equipo puesto, se deduce del tipo (y del cargo, para Alicante).
  g.HUB_EQUIPO_DE = u => u.equipo || (/VIP/i.test(u.tipo || '') ? 'VIP' : /Instalador/i.test(u.tipo || '') ? 'Instaladores' : /Consultor/i.test(u.tipo || '') ? 'Consultores técnicos'
    : /Mailing/i.test(u.tipo || '') ? 'Mailing' : /Teleoperadora/i.test(u.tipo || '') ? 'Teleoperadoras' : /Alicante/i.test(u.rol || '') ? 'Alicante' : /Comercial/i.test(u.tipo || '') ? 'Córdoba' : '');
  // Hojas de producción que se rellenan a mano (Juan, 24/11): las de las coordinadoras de teleoperadoras y de mailing.
  g.HUB_HOJAS = { tel: 'Teleoperadoras', mail: 'Mailing' };
  // permiso → perfiles posibles, de menos a más. El primero de cada lista es el más limitado.
  g.HUB_PERFILES = {
    pizarra:     [{ id: 'ver',       nombre: 'Solo ver' },            { id: 'admin', nombre: 'Administrar (subir PDF, fotos, versiones)' }],
    dashboard:   [{ id: 'jefe',      nombre: 'Ver y guardar versiones' }, { id: 'admin', nombre: 'Administrar (además renombrar y borrar)' }],
    formularios: [{ id: 'responder', nombre: 'Solo responder' },      { id: 'panel', nombre: 'Ver las respuestas' }],
    curso:       [{ id: 'alumno',    nombre: 'Alumno' }],
    // Productos (Juan, 23/11): ver las fichas; administrar = además ver las eliminadas y elegir qué fichas se ven
    // (guardarlo pide además ser administrador del Hub, que es quien tiene la llave de publicar).
    fichas:      [{ id: 'ver',       nombre: 'Ver las fichas' },      { id: 'admin', nombre: 'Administrar (eliminadas y qué fichas se ven)' }],
    // Quinielas (Juan, 23/11): Usuario = solo la suya; Jefe = todas y la hoja, sin quiniela propia; Admin = todo
    // (además puede rellenar la de otra persona). Van cifradas: «Usuario» no tiene la llave para leer las de los demás.
    // 24/11: Jefe = solo su equipo; «Ver todas» = administración y dirección (todas las quinielas y todas las hojas);
    // las coordinadoras de teleoperadoras y de mailing solo rellenan su hoja de producción (no ven quinielas).
    quinielas:   [{ id: 'rellenar',  nombre: 'Usuario (solo su quiniela)' }, { id: 'hojatel', nombre: 'Coord. teleoperadoras (rellena su hoja de producción)' },
                  { id: 'hojamail', nombre: 'Coord. mailing (rellena su hoja de producción)' }, { id: 'jefe', nombre: 'Jefe (las de su equipo y su hoja)' },
                  { id: 'ver', nombre: 'Ver todas (quinielas y hojas de producción)' }, { id: 'todas', nombre: 'Admin (todo)' }]
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
    if (S.quinielas && S.quinielas.token && ['rellenar', 'hojatel', 'hojamail', 'jefe', 'ver', 'todas'].includes(w.quinielas)) {
      const Q = S.quinielas, eq = Q.equipo || [], sinQk = m => ({ uid: m.uid, nombre: m.nombre, rol: m.rol, tipo: m.tipo, equipo: m.equipo });
      L.quinielas = { t: Q.token, o: Q.owner, r: Q.repo, pub: Q.pub, vapid: Q.vapid || null, pubEq: Q.pubEq || {} };
      // Admin: lee todas y lleva la llave de cada usuario (para rellenarle la quiniela y que él pueda releerla).
      if (w.quinielas === 'todas') Object.assign(L.quinielas, { priv: Q.priv, equipo: eq, jefes: Q.jefes || [], hk: Q.hk, hojas: Q.hojas });
      if (w.quinielas === 'ver') Object.assign(L.quinielas, { priv: Q.priv, equipo: eq.map(sinQk), hk: Q.hk, hojas: Q.hojas });
      // Coordinadoras: solo su hoja (la llave de las hojas y su lista de chicas), sin llave para leer quinielas
      if (w.quinielas === 'hojatel' || w.quinielas === 'hojamail') { const h = w.quinielas === 'hojatel' ? 'tel' : 'mail'; Object.assign(L.quinielas, { hk: Q.hk, hojas: { [h]: (Q.hojas || {})[h] || [] }, soloHoja: h }); }
      // Jefe: su equipo se pone en HUB_CONTENIDO (hace falta saber quién es)
    }
    if (w.hub === 'admin') L.hub = { clave: S.hub.clave, gh: S.hub.gh || null };
    return L;
  };

  // Lo que va dentro del llavero de cada persona.
  g.HUB_CONTENIDO = function (u, S) {
    const webs = {};
    for (const [k, v] of Object.entries(u.webs || {})) if (v) webs[k] = v;
    if (u.sinAcceso) return null;   // ficha sin acceso al Hub (solo para salir en listas): no lleva llavero
    const dispositivo = /dispositivo/i.test(u.rol || '');
    const llaves = g.HUB_LLAVES(webs, S);
    // Quinielas: cada persona lleva además SU llave (u.qk), con la que relee sus propias quinielas, y su identificador.
    const equipo = g.HUB_EQUIPO_DE(u);
    if (llaves.quinielas && ['rellenar', 'todas'].includes(webs.quinielas)) Object.assign(llaves.quinielas, { propia: u.qk || null, uid: u.uid, nombreCompleto: u.nombre, tipo: u.tipo || '', equipoPropio: equipo });   // tipo: la quiniela cambia según sea (VIP, instalador)
    if (llaves.quinielas && webs.quinielas === 'jefe') {   // Jefe: solo su equipo (su llave de equipo y su lista)
      const Q = S.quinielas || {};
      Object.assign(llaves.quinielas, { equipoJefe: equipo, privEq: (Q.privEq || {})[equipo] || null,
        equipo: (Q.equipo || []).filter(m => m.equipo === equipo).map(m => ({ uid: m.uid, nombre: m.nombre, rol: m.rol, tipo: m.tipo, equipo: m.equipo })) });
    }
    if (S.fotos) llaves.fotos = { k: S.fotos };   // fotos de las personas (Juan, 23/11): las ve todo el Hub
    return { nombre: dispositivo ? u.nombre : u.nombre.split(' ')[0], nombreCompleto: u.nombre, perfil: u.rol || '', admin: webs.hub === 'admin', permisos: webs, llaves };
  };
  // Antes de publicar: quien tiene Quinielas y aún no tiene su llave propia, la recibe (al azar, 32 bytes en base64).
  // y quien ve todas recibe la lista de quién tiene que rellenarla (para ver quién la ha enviado y quién no).
  g.HUB_PREPARA = function (usuarios, azar, S) {
    for (const u of usuarios) if (!u.baja && u.webs && ['rellenar', 'todas', 'jefe'].includes(u.webs.quinielas) && !u.qk) u.qk = azar();
    if (S && S.quinielas) {
      // quien rellena quiniela (también una ficha sin acceso con «Usuario»: el admin se la rellena)
      const ficha = u => ({ uid: u.uid, nombre: u.nombre, rol: u.rol || '', tipo: u.tipo || '', equipo: g.HUB_EQUIPO_DE(u), qk: u.qk });
      S.quinielas.equipo = usuarios.filter(u => !u.baja && u.webs && u.webs.quinielas === 'rellenar').map(ficha);
      // jefes de equipo: el admin también puede rellenarles la quiniela (Juan, 24/11), aunque no salgan en la lista de quién la debe enviar
      S.quinielas.jefes = usuarios.filter(u => !u.baja && u.webs && u.webs.quinielas === 'jefe').map(ficha);
      // Quién sale en cada hoja de producción a mano, en el orden del registro (el de la hoja en papel). Con o sin acceso al Hub.
      S.quinielas.hojas = {};
      // orden: el de la hoja en papel si se dio (ordenHojas), y si no, el del registro
      for (const h of Object.keys(g.HUB_HOJAS)) S.quinielas.hojas[h] = usuarios.map((u, i) => [u, i]).filter(([u]) => !u.baja && (u.hojas || []).includes(h))
        .sort(([a, i], [b, j]) => ((a.ordenHojas || {})[h] ?? 1e3 + i) - ((b.ordenHojas || {})[h] ?? 1e3 + j)).map(([u]) => ({ uid: u.uid, nombre: u.nombre }));
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
