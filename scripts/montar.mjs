#!/usr/bin/env node
/*
  Monta la web publicable del Biofy Hub en publicar/ (no se guarda en la rama main):
    1. copia src/ (portada, núcleo común, estilo, logos);
    2. mete los módulos que ya funcionan a partir de su código de siempre (Pizarra, Dashboard,
       Formularios, Academia). Cada módulo se cambia lo mínimo: la entrada pasa a ser la del Hub;
    3. genera comun/llaveros.json: un llavero por persona, cifrado con SU contraseña de siempre,
       con sus permisos y SOLO las llaves de sus módulos, más el REGISTRO cifrado del panel de Accesos.

  Quién tiene acceso a qué sale del REGISTRO publicado (lo cambia el panel de Accesos), no del Mac:
  así volver a montar nunca pisa lo que se haya hecho en el panel. Solo la primera vez (--importar)
  se crea el registro a partir de accesos.json.

  Uso:
    node scripts/montar.mjs --accesos /Users/diseno/claves-biofy/accesos.json \
      --hub /Users/diseno/claves-biofy/hub-secretos.json \
      --pizarra /Users/diseno/claves-pizarra/pizarra-secretos.json \
      --dashboard /Users/diseno/claves-biofy/dashboard-secretos.json \
      --formularios /Users/diseno/claves-formularios/formularios-secretos.json \
      --fichas /Users/diseno/fichas-producto/hub      (módulo Productos: sale de fichas-producto/plantilla/para-hub.py)
      --quinielas /Users/diseno/claves-biofy/quinielas-secretos.json   (módulo Quinielas: repositorio, token y claves)
    [--importar]            crea el registro desde accesos.json (solo la primera vez)
    [--registro-de f.json]  lee el registro de un archivo en vez de la web publicada (pruebas)
    [--compat]              deja también comun/llaveros.js para páginas viejas en caché (solo al pasar a llaveros.json)

  Nunca escribe contraseñas ni claves en pantalla. Comprueba al final que ninguna sale en claro.
  Al mudarnos a nuestro servidor, este script deja de generar llaveros: el servidor da los permisos.
*/
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { webcrypto as crypto, randomBytes, createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import vm from 'node:vm';
import { encrypt, decrypt } from './cifrar.mjs';

const aqui = dirname(fileURLToPath(import.meta.url)), raiz = join(aqui, '..');
const arg = k => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : null; };
const out = join(raiz, 'publicar');
const falla = m => { console.error('ERROR: ' + m); process.exit(1); };
const lee = (k, campos) => {
  const S = JSON.parse(readFileSync(arg(k) || falla('falta --' + k), 'utf8'));
  for (const c of campos) if (!S[c]) falla(`falta «${c}» en los secretos de ${k}`);
  return S;
};

const accesos = JSON.parse(readFileSync(arg('accesos') || falla('falta --accesos'), 'utf8')).usuarios;
const PZ = lee('pizarra', ['owner', 'repo', 'read_token', 'write_token']);
const DB = lee('dashboard', ['owner', 'repo', 'read_token', 'write_token']);
const FM = lee('formularios', ['owner', 'repo', 'token', 'claves']);
const HB = lee('hub', ['clave']);
// Quinielas (23/11): repositorio privado y claves ECDH. Sin «token» todavía, nadie recibe la llave (el módulo no guarda).
const QN = arg('quinielas') ? lee('quinielas', ['owner', 'repo', 'pub', 'priv']) : null;   // llave del registro de Accesos y llave de publicar (gh), si ya existe
const CURSO = randomBytes(33).toString('base64');   // llave nueva del curso en cada montaje
const BUILD = Date.now().toString(36);              // cada publicación, una versión: el navegador no usa copias viejas
const b64 = f => readFileSync(f).toString('base64');
const LOGO = '/Users/diseno/formularios/src/logo-horizontal-blue.svg', LOGO_W = '/Users/diseno/formularios/src/logo-horizontal-white.svg';

/* 1. Copia de src/ */
rmSync(out, { recursive: true, force: true });
cpSync(join(raiz, 'src'), out, { recursive: true });
for (const f of ['index.html', 'modulo.html', 'accesos/index.html', 'productos/index.html', 'quinielas/index.html']) {
  const p = join(out, f);
  writeFileSync(p, readFileSync(p, 'utf8').replace(/(src|href)="((\.\.\/)?comun\/[^"?]+\.(js|css))"/g, `$1="$2?v=${BUILD}"`));
}

/* 2. Módulos. Cada cambio tiene que encontrar su sitio exacto; si no, se para (el código original cambió). */
function modulo(nombre, html, cambios) {
  for (const [a, b] of cambios) {
    if (html.split(a).length !== 2) falla(`${nombre}: no encuentro «${a.slice(0, 60)}»`);
    html = html.replace(a, () => b);
  }
  mkdirSync(join(out, nombre), { recursive: true });
  writeFileSync(join(out, nombre, 'index.html'), html);
}
const HUB_HEAD = ['config', 'nucleo', 'volver'].map(f => `<script src="../comun/${f}.js?v=${BUILD}"></script>`).join('\n') + '\n';

// Pizarra
{
  const d = '/Users/diseno/pizarra-comercial/src/';
  const h = readFileSync(d + 'pizarra.html', 'utf8').split('__LOGO_AZUL__').join(b64(d + 'logo-horizontal-blue.svg')).split('__LOGO_BLANCO__').join(b64(d + 'logo-horizontal-white.svg'));
  modulo('pizarra', h, [
    ['const CLOUD=/*__CLOUD__*/null;', 'const CLOUD=' + JSON.stringify({ owner: PZ.owner, repo: PZ.repo, branch: PZ.branch || 'main', dir: PZ.dir || 'pizarra', reads: [], writes: [] }) + ';'],
    ['const LOCAL_CONFIG=/*__CONFIG__*/null;', `const LOCAL_CONFIG=null;
// Biofy Hub: la llave sale del llavero de la persona (ver: solo lectura; admin: escritura)
function HUB_ACCESO(){const k=Hub.llave('pizarra');return k?{read:k.read,write:k.write||null,role:k.write?'admin':'ver'}:null;}`],
    ['  const a=leerAcceso();\n  if(!a){mostrarCandado();return;}', "  await Hub.listo;const a=HUB_ACCESO();\n  if(!a){location.replace('../index.html');return;}"],
    ['function guardarAcceso(recordar){', 'function guardarAcceso(recordar){return;'],
    ["$('#cerrarSesion').onclick=()=>{borrarAcceso();location.reload();};", "$('#cerrarSesion').onclick=()=>{borrarAcceso();Hub.salir();};"],
    ['</head>', HUB_HEAD + '</head>'],
    ['</style>', '#secAdminLogin,#salirAdmin{display:none!important}.marca{cursor:pointer}\n</style>'],
    ['burbujas();pintar();marcarRol();', "document.querySelectorAll('.marca').forEach(x=>x.onclick=()=>location.href='../index.html');\nburbujas();pintar();marcarRol();"],
  ]);
}

// Dashboard
{
  const h = readFileSync('/Users/diseno/panel-comercial/src/v3.html', 'utf8').split('__LOGO_W__').join(b64(LOGO_W)).split('__LOGO__').join(b64(LOGO));
  modulo('dashboard', h, [
    ['const CLOUD=/*__CLOUD__*/null;', 'const CLOUD=' + JSON.stringify({ owner: DB.owner, repo: DB.repo, branch: DB.branch || 'main', dir: DB.dir || 'versiones', jefes: [], admins: [] }) + `;
// Biofy Hub: la llave sale del llavero de la persona (jefe: ver y guardar; admin: además renombrar y borrar)
function HUB_ACCESO(){const k=Hub.llave('dashboard');return k?{read:k.read,write:k.write||null,role:k.role}:null;}`],
    ["  gh.read=store.get('cb_read');gh.write=store.get('cb_write');gh.role=store.get('cb_role');\n  if(!gh.read||!gh.role){['cb_read','cb_write','cb_role','cb_jwrite'].forEach(store.del);gh.read=gh.write=gh.role=null;showLock();return;}",
     "  {await Hub.listo;const a=HUB_ACCESO();if(!a){location.replace('../index.html');return;}gh.read=a.read;gh.write=a.write;gh.role=a.role;}"],
    ["if(e.target.id==='btnLogout'){['cb_read','cb_write','cb_role','cb_jwrite'].forEach(store.del);location.reload();}",
     "if(e.target.id==='btnLogout'){['cb_read','cb_write','cb_role','cb_jwrite'].forEach(store.del);Hub.salir();}"],
    ['</head>', HUB_HEAD + '<style>#adminBox .admin-box:has(#admForm),#admOut{display:none!important}header.top .brand{cursor:pointer}</style>\n</head>'],
    ['/* ============================== BOOT ============================== */', "document.querySelectorAll('header.top .brand').forEach(x=>x.onclick=()=>location.href='../index.html');\n/* ============================== BOOT ============================== */"],
  ]);
}

// Formularios (quien tiene el panel lee las respuestas; los comerciales responden en la web de siempre por ahora)
{
  const d = '/Users/diseno/formularios/';
  let h = readFileSync(d + 'src/app.html', 'utf8').split('__LOGO_W__').join(b64(LOGO_W)).split('__LOGO__').join(b64(LOGO));
  const forms = readdirSync(d + 'forms').filter(f => f.endsWith('.json')).sort().map(f => JSON.parse(readFileSync(d + 'forms/' + f, 'utf8')));
  const pub = FM.claves.pub;
  modulo('formularios', h, [
    ['const FORMS=/*__FORMS__*/[];', 'const FORMS=' + JSON.stringify(forms) + ';'],
    ['const CLOUD=/*__CLOUD__*/null;', 'const CLOUD=' + JSON.stringify({ owner: FM.owner, repo: FM.repo, branch: FM.branch || 'main', dir: FM.dir || 'respuestas', pub: { kty: pub.kty, crv: pub.crv, x: pub.x, y: pub.y }, resp: null, users: [] }) + ';'],
    ["  const raw=JSON.stringify(s);if(s.role==='admin')S.set('fm_sess',raw,true);else{S.set('fm_sess',raw,true);if(remember)S.set('fm_sess',raw);}", '  /* Biofy Hub: la sesión la guarda el Hub */'],
    ["$('#btnOut').onclick=()=>{S.del('fm_sess');location.hash='';location.reload();};", "$('#btnOut').onclick=()=>{S.del('fm_sess');Hub.salir();};"],
    ["$('#goHome').onclick=()=>{location.hash='';};", "$('#goHome').onclick=()=>{if(location.hash.replace(/^#\\/?/,''))location.hash='';else location.href='../index.html';};"],
    ["  const raw=S.get('fm_sess',true)||S.get('fm_sess');\n  if(raw)try{const s=JSON.parse(raw);if(s&&s.token)return startSession(s,false);}catch(e){}\n  setTimeout(()=>$('#lockPw').focus(),50);",
     "  await Hub.listo;const k=Hub.llave('formularios');if(!k){location.replace('../index.html');return;}\n  return startSession(k.k?{role:'admin',user:Hub.sesion().nombre,token:k.t,priv:k.k}:{role:'resp',user:null,token:k.t,priv:null},false);"],
    ['</head>', HUB_HEAD + '</head>'],
  ]);
}

// Academia (curso e-learning): la página entera va cifrada con una llave al azar, que va en los llaveros con «curso»
{
  const cuerpo = await encrypt(CURSO, readFileSync('/Users/diseno/curso-elearning-biofy/index.html', 'utf8'));
  mkdirSync(join(out, 'academia'), { recursive: true });
  writeFileSync(join(out, 'academia/index.html'), `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="robots" content="noindex,nofollow">
<title>Academia · Biofy Hub</title><link rel="stylesheet" href="../comun/estilo.css">
${HUB_HEAD}</head><body><p class="muted" style="padding:40px;text-align:center">Abriendo la Academia…</p>
<script>
const CUERPO=${JSON.stringify(cuerpo)};
const HUB_SCRIPTS=${JSON.stringify(HUB_HEAD).replace(/<\//g, '<\\/')};
(async()=>{
  await Hub.listo;const k=Hub.llave('academia');if(!k){location.replace('../index.html');return;}
  const u8=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
  try{
    const base=await crypto.subtle.importKey('raw',new TextEncoder().encode(k.clave),'PBKDF2',false,['deriveKey']);
    const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:u8(CUERPO.s),iterations:CUERPO.n,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['decrypt']);
    const html=new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:u8(CUERPO.i)},key,u8(CUERPO.c)));
    const i=html.lastIndexOf('</body>'),extra=HUB_SCRIPTS;
    document.open();document.write(i>0?html.slice(0,i)+extra+html.slice(i):html+extra);document.close();
  }catch(e){document.body.innerHTML='<p style="padding:40px;text-align:center">No se pudo abrir la Academia. Vuelve a entrar en el Hub.</p>';}
})();
</script></body></html>`);
}

/* 3. Registro y llaveros */
vm.runInThisContext(readFileSync(join(raiz, 'src/comun/perfiles.js'), 'utf8'));
const { HUB_CONTENIDO, HUB_PREPARA } = globalThis;
const hex = b => Buffer.from(b).toString('hex'), B = s => Buffer.from(s, 'base64');
async function idDe(pw) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveBits']);
  return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode('biofy-hub/llavero'), iterations: 100000, hash: 'SHA-256' }, base, 128));
}
async function llaveDe(pw, id) {   // la misma llave que saca el navegador al entrar
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveKey']);
  const k = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: Buffer.from(id, 'hex'), iterations: 600000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, true, ['encrypt']);
  return Buffer.from(await crypto.subtle.exportKey('raw', k)).toString('base64');
}
async function cierra(kB64, texto, sal) {
  const k = await crypto.subtle.importKey('raw', B(kB64), 'AES-GCM', false, ['encrypt']), iv = randomBytes(12);
  const c = Buffer.from(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, k, new TextEncoder().encode(texto))).toString('base64');
  return sal ? { n: 600000, s: sal.toString('base64'), i: iv.toString('base64'), c } : { i: iv.toString('base64'), c };
}
async function abre(kB64, b) {
  try { const k = await crypto.subtle.importKey('raw', B(kB64), 'AES-GCM', false, ['decrypt']); return new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: B(b.i) }, k, B(b.c))); } catch (e) { return null; }
}

// Registro: el publicado (con lo que se haya cambiado en el panel) o, la primera vez, el de accesos.json.
let usuarios, historial = [];
if (process.argv.includes('--importar')) {
  usuarios = [];
  for (const u of accesos) if (u.pw && u.webs) { const id = await idDe(u.pw); usuarios.push({ uid: randomBytes(6).toString('hex'), nombre: u.nombre, rol: u.rol || '', webs: u.webs, alta: u.alta || '', id, k: await llaveDe(u.pw, id) }); }
  historial.push({ fecha: new Date().toISOString().slice(0, 10), quien: 'Claude', que: 'Registro creado con los accesos de siempre' });
} else {
  let pub;
  try {
    pub = arg('registro-de') ? readFileSync(arg('registro-de'), 'utf8')
      : execFileSync('gh', ['api', 'repos/biofy-hub/biofy-hub.github.io/contents/comun/llaveros.json?ref=gh-pages', '-H', 'Accept: application/vnd.github.raw'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch (e) { falla('no puedo leer el registro publicado (¿sin conexión?). La primera vez se usa --importar'); }
  const t = JSON.parse(pub).registro && await abre(HB.clave, JSON.parse(pub).registro);
  if (!t) falla('el registro publicado no se abre con la llave del Hub');
  ({ usuarios, historial = [] } = JSON.parse(t));
}
// Productos (Juan, 23/11): los administradores del Hub lo administran (eliminadas y qué fichas se ven).
if (!HB.fichas || !HB.fichas.ver || !HB.fichas.admin) falla('faltan las llaves de «fichas» en los secretos del Hub');
for (const u of usuarios) if (!u.baja && u.webs && u.webs.hub === 'admin' && !u.webs.fichas) {
  u.webs.fichas = 'admin';
  historial.push({ fecha: new Date().toISOString().slice(0, 10), quien: 'Claude', que: `${u.nombre}: Productos (administrar), por ser administrador del Hub` });
}
// Quinielas (Juan, 23/11): los administradores del Hub las ven todas (dirección).
if (QN) for (const u of usuarios) if (!u.baja && u.webs && u.webs.hub === 'admin' && !u.webs.quinielas) {
  u.webs.quinielas = 'todas';
  historial.push({ fecha: new Date().toISOString().slice(0, 10), quien: 'Claude', que: `${u.nombre}: Quinielas (ver todas), por ser administrador del Hub` });
}
const secretos = {
  ...(QN ? { quinielas: { owner: QN.owner, repo: QN.repo, token: QN.token || null, pub: QN.pub, priv: QN.priv, vapid: QN.vapid ? QN.vapid.pub : null } } : {}),
  fichas: { ver: HB.fichas.ver, admin: HB.fichas.admin },
  pizarra: { read_token: PZ.read_token, write_token: PZ.write_token },
  dashboard: { read_token: DB.read_token, write_token: DB.write_token },
  formularios: { token: FM.token, priv: FM.claves.priv },
  curso: CURSO,
  hub: { clave: HB.clave, gh: HB.gh || null }
};
HUB_PREPARA(usuarios, () => randomBytes(32).toString('base64'), secretos);   // Quinielas: llave propia de cada uno y lista de quién rellena
const llaveros = {}, resumen = [];
for (const u of usuarios) {
  if (u.baja) continue;
  // Con usuario, el llavero se guarda con su usuario (Juan, 23/11); sin usuario, con el nombre sacado de la contraseña
  const kk = u.usuario ? 'u' + createHash('sha256').update('biofy-hub/usuario/' + String(u.usuario).trim().toLowerCase()).digest('hex').slice(0, 32) : u.id;
  if (llaveros[kk]) falla(u.usuario ? 'dos personas con el mismo usuario' : 'dos personas sin usuario con la misma contraseña');
  const contenido = HUB_CONTENIDO(u, secretos);
  llaveros[kk] = await cierra(u.k, JSON.stringify(contenido), Buffer.from(u.id, 'hex'));
  resumen.push({ u, contenido, kk });
}
const registro = await cierra(HB.clave, JSON.stringify({ usuarios, secretos, historial }));
writeFileSync(join(out, 'comun/llaveros.json'), JSON.stringify({ build: BUILD, llaveros, registro }));
// --compat: solo en la publicación que cambia de llaveros.js a llaveros.json, para las páginas viejas que el navegador aún tenga guardadas (10 min)
if (process.argv.includes('--compat')) writeFileSync(join(out, 'comun/llaveros.js'), `window.HUB_BUILD = "${BUILD}";\nwindow.HUB_LLAVEROS = ${JSON.stringify(llaveros)};\n`);

/* 4. Productos: catálogo y archivos cifrados. Las activas, con la llave «ver»; las eliminadas, con la de administrar.
   Los archivos llevan un nombre al azar (no dicen de qué producto son). */
{
  const dir = arg('fichas') || falla('falta --fichas (carpeta de fichas-producto/hub)');
  const cat = JSON.parse(readFileSync(join(dir, 'catalogo.json'), 'utf8'));
  mkdirSync(join(out, 'productos/a'), { recursive: true });
  async function cierraBin(kB64, buf) {
    const k = await crypto.subtle.importKey('raw', B(kB64), 'AES-GCM', false, ['encrypt']), iv = randomBytes(12);
    return Buffer.concat([iv, Buffer.from(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, k, buf))]);
  }
  const grupos = { ver: [], admin: [] };
  let bytes = 0;
  for (const p of cat.productos) {
    const g = p.estado === 'activo' ? 'ver' : 'admin', a = { nombre: p.archivos.nombre };
    for (const campo of ['foto', 'ficha', 'pdf']) {
      if (!p.archivos[campo]) continue;
      const n = randomBytes(12).toString('hex') + '.bin', c = await cierraBin(HB.fichas[g], readFileSync(join(dir, 'archivos', p.archivos[campo])));
      writeFileSync(join(out, 'productos/a', n), c); bytes += c.length; a[campo] = n;
    }
    grupos[g].push({ ...p, archivos: a });
  }
  writeFileSync(join(out, 'productos/datos.json'), JSON.stringify({
    ver: await cierra(HB.fichas.ver, JSON.stringify({ fecha: cat.fecha, etiquetas: cat.etiquetas, iconos: cat.iconos, productos: grupos.ver })),
    admin: await cierra(HB.fichas.admin, JSON.stringify({ productos: grupos.admin }))
  }));
  // Qué fichas se ven: lo cambian los administradores desde la página; volver a montar no lo pisa.
  let estado = null;
  try { estado = execFileSync('gh', ['api', 'repos/biofy-hub/biofy-hub.github.io/contents/productos/estado.json?ref=gh-pages', '-H', 'Accept: application/vnd.github.raw'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) {}
  if (estado) writeFileSync(join(out, 'productos/estado.json'), estado);
  console.log(`Productos: ${grupos.ver.length} activas y ${grupos.admin.length} eliminadas, ${(bytes / 1e6).toFixed(1)} MB cifrados · ${estado ? 'se conserva qué fichas se ven' : 'todas visibles (sin estado publicado)'}`);
}

/* Comprobaciones */
let ok = true;
const pwDe = {};
for (const a of accesos) if (a.pw) pwDe[await idDe(a.pw)] = a.pw;
for (const { u, contenido, kk } of resumen) {
  const abreK = JSON.parse(await abre(u.k, llaveros[kk]) || 'null');
  // si la contraseña está en el Mac, se comprueba también que abre con ella (como en el navegador)
  const pw = pwDe[u.id], abrePw = pw ? JSON.parse(await decrypt(llaveros[kk], pw) || 'null') : abreK;
  const bien = abreK && JSON.stringify(abreK) === JSON.stringify(contenido) && JSON.stringify(abrePw) === JSON.stringify(contenido);
  const sobran = Object.keys(abreK?.llaves || {}).filter(m => !contenido.permisos[m]);
  const verSinEscritura = contenido.permisos.pizarra !== 'ver' || !abreK?.llaves?.pizarra?.write;
  const hubSoloAdmin = !abreK?.llaves?.hub || contenido.admin;
  const eliminadasSoloAdmin = !abreK?.llaves?.fichas?.admin || contenido.permisos.fichas === 'admin';
  const bueno = bien && !sobran.length && verSinEscritura && hubSoloAdmin && eliminadasSoloAdmin;
  if (!bueno) ok = false;
  console.log(`${bueno ? 'OK ' : 'MAL'} ${contenido.perfil.padEnd(36)} ${contenido.admin ? '[admin Hub] ' : ''}${pw ? '' : '(contraseña solo en el Excel) '}llaves: ${Object.keys(abreK?.llaves || {}).map(m => m + ' (' + contenido.permisos[m] + ')').join(', ') || 'ninguna'}`);
}
const enClaro = [PZ.read_token, PZ.write_token, DB.read_token, DB.write_token, FM.token, FM.claves.priv.d, CURSO, HB.clave, HB.gh, HB.fichas.ver, HB.fichas.admin, QN && QN.token, QN && QN.priv.d, QN && QN.vapid && QN.vapid.priv, ...usuarios.map(u => u.k), ...usuarios.map(u => u.qk), ...accesos.map(u => u.pw)].filter(Boolean);
const archivos = d => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? archivos(p) : [p]; });
for (const f of archivos(out)) {
  const t = readFileSync(f, 'utf8');
  if (enClaro.some(s => t.includes(s)) || /github_pat_|ghp_/.test(t)) { ok = false; console.error('SECRETO EN CLARO en ' + f); }
}
if (!ok) falla('las comprobaciones han fallado: NO publicar');
console.log(`Hecho: ${resumen.length} llaveros (${usuarios.filter(u => u.baja).length} bajas) · registro de Accesos cifrado · ${HB.gh ? 'con' : 'SIN'} llave de publicar · ningún secreto en claro`);
