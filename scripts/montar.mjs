#!/usr/bin/env node
/*
  Monta la web publicable del Biofy Hub en publicar/ (no se guarda en la rama main):
    1. copia src/ (portada, núcleo común, estilo, logos);
    2. mete los módulos que ya funcionan a partir de su código de siempre (Pizarra, Dashboard,
       Formularios, Academia). Cada módulo se cambia lo mínimo: la entrada pasa a ser la del Hub;
    3. genera comun/llaveros.js: un llavero por persona, cifrado con SU contraseña de siempre,
       con sus permisos y SOLO las llaves de sus módulos.

  Uso:
    node scripts/montar.mjs --accesos /Users/diseno/claves-biofy/accesos.json \
      --pizarra /Users/diseno/claves-pizarra/pizarra-secretos.json \
      --dashboard /Users/diseno/claves-biofy/dashboard-secretos.json \
      --formularios /Users/diseno/claves-formularios/formularios-secretos.json

  Nunca escribe contraseñas ni claves en pantalla. Comprueba al final que ninguna sale en claro.
  Al mudarnos a nuestro servidor, este script deja de generar llaveros: el servidor da los permisos.
*/
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { webcrypto as crypto, randomBytes } from 'node:crypto';
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
const CURSO = randomBytes(33).toString('base64');   // llave nueva del curso en cada montaje
const b64 = f => readFileSync(f).toString('base64');
const LOGO = '/Users/diseno/formularios/src/logo-horizontal-blue.svg', LOGO_W = '/Users/diseno/formularios/src/logo-horizontal-white.svg';

/* 1. Copia de src/ */
rmSync(out, { recursive: true, force: true });
cpSync(join(raiz, 'src'), out, { recursive: true });

/* 2. Módulos. Cada cambio tiene que encontrar su sitio exacto; si no, se para (el código original cambió). */
function modulo(nombre, html, cambios) {
  for (const [a, b] of cambios) {
    if (html.split(a).length !== 2) falla(`${nombre}: no encuentro «${a.slice(0, 60)}»`);
    html = html.replace(a, () => b);
  }
  mkdirSync(join(out, nombre), { recursive: true });
  writeFileSync(join(out, nombre, 'index.html'), html);
}
const HUB_HEAD = '<script src="../comun/config.js"></script>\n<script src="../comun/llaveros.js"></script>\n<script src="../comun/nucleo.js"></script>\n';

// Pizarra
{
  const d = '/Users/diseno/pizarra-comercial/src/';
  const h = readFileSync(d + 'pizarra.html', 'utf8').split('__LOGO_AZUL__').join(b64(d + 'logo-horizontal-blue.svg')).split('__LOGO_BLANCO__').join(b64(d + 'logo-horizontal-white.svg'));
  modulo('pizarra', h, [
    ['const CLOUD=/*__CLOUD__*/null;', 'const CLOUD=' + JSON.stringify({ owner: PZ.owner, repo: PZ.repo, branch: PZ.branch || 'main', dir: PZ.dir || 'pizarra', reads: [], writes: [] }) + ';'],
    ['const LOCAL_CONFIG=/*__CONFIG__*/null;', `const LOCAL_CONFIG=null;
// Biofy Hub: la llave sale del llavero de la persona (ver: solo lectura; admin: escritura)
function HUB_ACCESO(){const k=Hub.llave('pizarra');return k?{read:k.read,write:k.write||null,role:k.write?'admin':'ver'}:null;}`],
    ['  const a=leerAcceso();\n  if(!a){mostrarCandado();return;}', "  const a=HUB_ACCESO();\n  if(!a){location.replace('../index.html');return;}"],
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
     "  {const a=HUB_ACCESO();if(!a){location.replace('../index.html');return;}gh.read=a.read;gh.write=a.write;gh.role=a.role;}"],
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
     "  const k=Hub.llave('formularios');if(!k){location.replace('../index.html');return;}\n  return startSession(k.k?{role:'admin',user:Hub.sesion().nombre,token:k.t,priv:k.k}:{role:'resp',user:null,token:k.t,priv:null},false);"],
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
(async()=>{
  const k=Hub.llave('academia');if(!k){location.replace('../index.html');return;}
  const u8=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
  try{
    const base=await crypto.subtle.importKey('raw',new TextEncoder().encode(k.clave),'PBKDF2',false,['deriveKey']);
    const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:u8(CUERPO.s),iterations:CUERPO.n,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['decrypt']);
    const html=new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:u8(CUERPO.i)},key,u8(CUERPO.c)));
    document.open();document.write(html);document.close();
  }catch(e){document.body.innerHTML='<p style="padding:40px;text-align:center">No se pudo abrir la Academia. Vuelve a entrar en el Hub.</p>';}
})();
</script></body></html>`);
}

/* 3. Llaveros: solo las llaves de los módulos que cada persona tiene */
const hex = b => Buffer.from(b).toString('hex');
async function idDe(pw) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveBits']);
  return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode('biofy-hub/llavero'), iterations: 100000, hash: 'SHA-256' }, base, 128));
}
function llaves(w) {
  const L = {};
  if (w.pizarra === 'admin') L.pizarra = { read: PZ.write_token, write: PZ.write_token };
  else if (w.pizarra === 'ver') L.pizarra = { read: PZ.read_token };
  if (w.dashboard === 'admin') L.dashboard = { read: DB.write_token, write: DB.write_token, role: 'admin' };
  else if (w.dashboard === 'jefe') L.dashboard = { read: DB.read_token, write: DB.write_token, role: 'jefe' };  // los jefes guardan versiones (como hasta ahora)
  if (w.formularios === 'panel') L.formularios = { t: FM.token, k: FM.claves.priv };
  else if (w.formularios === 'responder') L.formularios = { t: FM.token };
  if (w.curso) L.curso = { clave: CURSO };
  return L;
}
const llaveros = {}, resumen = [];
for (const u of accesos) {
  if (!u.pw || !u.webs) continue;
  const dispositivo = /dispositivo/i.test(u.rol || '');
  const contenido = { nombre: dispositivo ? u.nombre : u.nombre.split(' ')[0], perfil: u.rol || '', admin: u.webs.hub === 'admin', permisos: u.webs, llaves: llaves(u.webs) };
  const id = await idDe(u.pw);
  if (llaveros[id]) falla('dos personas con la misma contraseña');
  llaveros[id] = await encrypt(u.pw, JSON.stringify(contenido));
  resumen.push({ u, contenido });
}
writeFileSync(join(out, 'comun/llaveros.js'),
  '/* Llaveros del Biofy Hub: uno por persona, cifrado con su contraseña (AES-GCM, PBKDF2 600.000). Generado por scripts/montar.mjs. */\n' +
  'window.HUB_LLAVEROS = ' + JSON.stringify(llaveros) + ';\n');

/* Comprobaciones */
let ok = true;
for (const { u, contenido } of resumen) {
  const abre = JSON.parse(await decrypt(llaveros[await idDe(u.pw)], u.pw) || 'null');
  const bien = abre && JSON.stringify(abre) === JSON.stringify(contenido);
  // nadie lleva llaves de módulos que no tiene, y «ver» nunca lleva escritura
  const mods = { pizarra: 'pizarra', dashboard: 'dashboard', formularios: 'formularios', curso: 'curso' };
  const sobran = Object.keys(abre?.llaves || {}).filter(m => !u.webs[mods[m]]);
  const verSinEscritura = u.webs.pizarra !== 'ver' || !abre?.llaves?.pizarra?.write;
  if (!bien || sobran.length || !verSinEscritura) ok = false;
  console.log(`${bien && !sobran.length && verSinEscritura ? 'OK ' : 'MAL'} ${contenido.perfil.padEnd(36)} ${contenido.admin ? '[admin Hub] ' : ''}llaves: ${Object.entries(u.webs).filter(([m]) => abre?.llaves?.[m]).map(([m, p]) => m + ' (' + p + ')').join(', ') || 'ninguna'}`);
}
const secretos = [PZ.read_token, PZ.write_token, DB.read_token, DB.write_token, FM.token, FM.claves.priv.d, CURSO, ...accesos.map(u => u.pw).filter(Boolean)];
const archivos = d => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? archivos(p) : [p]; });
for (const f of archivos(out)) {
  const t = readFileSync(f, 'utf8');
  if (secretos.some(s => t.includes(s)) || /github_pat_|ghp_/.test(t)) { ok = false; console.error('SECRETO EN CLARO en ' + f); }
}
if (!ok) falla('las comprobaciones han fallado: NO publicar');
console.log(`Hecho: ${resumen.length} llaveros · módulos: pizarra, dashboard, formularios, academia · ningún secreto en claro`);
