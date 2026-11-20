// Capturas del boceto (móvil y ordenador, claro y oscuro) para enseñarlo antes de publicar.
const { chromium } = require('/Users/diseno/.claude/skills/playwright-skill/node_modules/playwright');
const path = require('path');
const src = 'file://' + path.join(__dirname, '..', 'src');
const out = path.join(__dirname, '..', 'salida');
(async () => {
  const b = await chromium.launch();
  const shot = async (nombre, w, h, url, perfil, oscuro) => {
    const c = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
    const p = await c.newPage();
    const errores = []; p.on('pageerror', e => errores.push(e.message)); p.on('console', m => m.type() === 'error' && errores.push(m.text()));
    await p.goto(src + '/index.html');
    if (oscuro) { await p.evaluate(() => localStorage.setItem('hub_tema', 'dark')); await p.reload(); }
    if (perfil) { await p.click(`[data-p="${perfil}"]`); await p.waitForTimeout(300); }
    if (url) await p.goto(src + '/' + url);
    await p.waitForTimeout(1500);
    const ancho = await p.evaluate(() => document.documentElement.scrollWidth);
    await p.screenshot({ path: path.join(out, nombre + '.png'), fullPage: true });
    console.log(nombre, 'ancho', ancho, 'de', w, errores.length ? 'ERRORES: ' + errores.join(' | ') : 'sin errores');
    await c.close();
  };
  await shot('1-entrada', 1280, 800);
  await shot('2-portada-admin', 1280, 800, null, 'admin');
  await shot('3-portada-admin-oscuro', 1280, 800, null, 'admin', true);
  await shot('4-portada-comercial-movil', 390, 844, null, 'comercial');
  await shot('5-modulo-dashboard', 1280, 700, 'modulo.html?m=dashboard', 'admin');
  await shot('6-modulo-bot-movil', 390, 844, 'modulo.html?m=bot', 'admin');
  await shot('7-tv-solo-pizarra', 1920, 1080, null, 'tv');
  await b.close();
})();
