#!/usr/bin/env node
/*
  Monta la web publicable del Biofy Hub en publicar/ (no se guarda en la rama main):
    1. copia src/ (portada, núcleo común, estilo, logos);
    2. mete los módulos que ya funcionan (hoy: la Pizarra) a partir de su código de siempre;
    3. genera comun/llaveros.js: un llavero por persona, cifrado con SU contraseña de siempre,
       con sus permisos y SOLO las llaves de sus módulos.

  Uso:
    node scripts/montar.mjs --accesos /Users/diseno/claves-biofy/accesos.json \
                            --pizarra /Users/diseno/claves-pizarra/pizarra-secretos.json

  Nunca escribe contraseñas ni claves en pantalla. Comprueba al final que ninguna sale en claro.
  Al mudarnos a nuestro servidor, este script deja de generar llaveros: el servidor da los permisos.
*/
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { webcrypto as crypto } from 'node:crypto';
import { encrypt, decrypt } from './cifrar.mjs';

const aqui = dirname(fileURLToPath(import.meta.url)), raiz = join(aqui, '..');
const arg = k => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : null; };
const out = join(raiz, 'publicar');
const falla = m => { console.error('ERROR: ' + m); process.exit(1); };

const accesos = JSON.parse(readFileSync(arg('accesos') || falla('falta --accesos'), 'utf8')).usuarios;
const P = JSON.parse(readFileSync(arg('pizarra') || falla('falta --pizarra'), 'utf8'));
for (const k of ['owner', 'repo', 'read_token', 'write_token']) if (!P[k]) falla('falta «' + k + '» en los secretos de la pizarra');

/* 1. Copia de src/ */
rmSync(out, { recursive: true, force: true });
cpSync(join(raiz, 'src'), out, { recursive: true });

/* 2. Módulo Pizarra: el mismo código que la web de siempre, con la entrada del Hub */
{
  const piz = '/Users/diseno/pizarra-comercial/src/';
  let h = readFileSync(piz + 'pizarra.html', 'utf8');
  h = h.split('__LOGO_AZUL__').join(readFileSync(piz + 'logo-horizontal-blue.svg').toString('base64'))
       .split('__LOGO_BLANCO__').join(readFileSync(piz + 'logo-horizontal-white.svg').toString('base64'));
  const cambia = (a, b) => { if (h.split(a).length !== 2) falla('Pizarra: no encuentro «' + a.slice(0, 50) + '»'); h = h.replace(a, b); };
  // Datos: el mismo repositorio privado. Sin claves aquí: llegan del llavero de cada persona.
  cambia('const CLOUD=/*__CLOUD__*/null;', 'const CLOUD=' + JSON.stringify({ owner: P.owner, repo: P.repo, branch: P.branch || 'main', dir: P.dir || 'pizarra', reads: [], writes: [] }) + ';');
  // Entrada: la del Hub. Sin permiso de pizarra, vuelve a la portada.
  cambia('  const a=leerAcceso();\n  if(!a){mostrarCandado();return;}',
         "  const a=HUB_ACCESO();\n  if(!a){location.replace('../index.html');return;}");
  cambia('const LOCAL_CONFIG=/*__CONFIG__*/null;', `const LOCAL_CONFIG=null;
// Biofy Hub: la llave de la pizarra sale del llavero de la persona (ver: solo lectura; admin: escritura)
function HUB_ACCESO(){const k=Hub.llave('pizarra');return k?{read:k.read,write:k.write||null,role:k.write?'admin':'ver'}:null;}`);
  cambia('function guardarAcceso(recordar){', 'function guardarAcceso(recordar){return;'); // la sesión la guarda el Hub
  cambia("$('#cerrarSesion').onclick=()=>{borrarAcceso();location.reload();};", "$('#cerrarSesion').onclick=()=>{borrarAcceso();Hub.salir();};");
  cambia('</head>', '<script src="../comun/config.js"></script>\n<script src="../comun/nucleo.js"></script>\n</head>');
  // El administrador ya entra como tal: fuera la segunda contraseña. El logo vuelve al Hub.
  cambia('</style>', '#secAdminLogin,#salirAdmin{display:none!important}.marca{cursor:pointer}\n</style>');
  cambia('burbujas();pintar();marcarRol();', "document.querySelectorAll('.marca').forEach(x=>x.onclick=()=>location.href='../index.html');\nburbujas();pintar();marcarRol();");
  mkdirSync(join(out, 'pizarra'), { recursive: true });
  writeFileSync(join(out, 'pizarra/index.html'), h);
}

/* 3. Llaveros */
const hex = b => Buffer.from(b).toString('hex');
async function idDe(pw) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveBits']);
  return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode('biofy-hub/llavero'), iterations: 100000, hash: 'SHA-256' }, base, 128));
}
function llaves(u) {
  const L = {};
  const pz = u.webs.pizarra;
  if (pz === 'admin') L.pizarra = { read: P.write_token, write: P.write_token };
  else if (pz === 'ver') L.pizarra = { read: P.read_token };
  return L;
}
const llaveros = {}, resumen = [];
for (const u of accesos) {
  if (!u.pw || !u.webs) continue;
  const dispositivo = /dispositivo/i.test(u.rol || '');
  const contenido = {
    nombre: dispositivo ? u.nombre : u.nombre.split(' ')[0],
    perfil: u.rol || '',
    admin: u.webs.hub === 'admin',
    permisos: u.webs,
    llaves: llaves(u)
  };
  const id = await idDe(u.pw);
  if (llaveros[id]) falla('dos personas con la misma contraseña');
  llaveros[id] = await encrypt(u.pw, JSON.stringify(contenido));
  resumen.push({ u, contenido, id });
}
writeFileSync(join(out, 'comun/llaveros.js'),
  '/* Llaveros del Biofy Hub: uno por persona, cifrado con su contraseña (AES-GCM, PBKDF2 600.000). Generado por scripts/montar.mjs. */\n' +
  'window.HUB_LLAVEROS = ' + JSON.stringify(llaveros) + ';\n');

/* Comprobaciones */
let ok = true;
for (const { u, contenido, id } of resumen) {
  const abre = JSON.parse(await decrypt(llaveros[await idDe(u.pw)], u.pw) || 'null');
  const bien = abre && JSON.stringify(abre) === JSON.stringify(contenido);
  const verSinEscritura = u.webs.pizarra !== 'ver' || !abre?.llaves?.pizarra?.write;
  if (!bien || !verSinEscritura) ok = false;
  console.log(`${bien && verSinEscritura ? 'OK ' : 'MAL'} ${contenido.perfil.padEnd(36)} módulos: ${Object.keys(u.webs).join(', ')}${contenido.admin ? ' · admin del Hub' : ''} · llaves: ${Object.keys(contenido.llaves).join(', ') || 'ninguna'}`);
}
// Nada en claro en lo que se publica
const secretos = [P.read_token, P.write_token, ...accesos.map(u => u.pw).filter(Boolean)];
const archivos = d => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? archivos(p) : [p]; });
for (const f of archivos(out)) {
  const t = readFileSync(f, 'utf8');
  if (secretos.some(s => t.includes(s)) || /github_pat_|ghp_/.test(t)) { ok = false; console.error('SECRETO EN CLARO en ' + f); }
}
if (!ok) falla('las comprobaciones han fallado: NO publicar');
console.log(`Hecho: ${resumen.length} llaveros · ningún secreto en claro · ${out}`);
