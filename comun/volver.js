/* Biofy Hub · botón «Hub» para volver a la portada desde cualquier módulo.
   Va junto al logo de cada módulo. No sale a quien solo tiene un módulo (por ejemplo, la TV). */
(function () {
  function pon() {
    try { if (!window.Hub || Hub.misModulos().length < 2) return; } catch (e) { return; }
    if (document.getElementById('hub-volver')) return;
    const a = document.createElement('a');
    a.id = 'hub-volver'; a.href = Hub.raiz + 'index.html'; a.title = 'Volver al Hub'; a.setAttribute('aria-label', 'Volver al Hub');
    a.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg><span>Hub</span>';
    a.style.cssText = 'display:inline-flex;align-items:center;gap:4px;flex:none;background:#2968fe;color:#fff;font:700 13px/1 Montserrat,system-ui,sans-serif;padding:8px 13px 8px 9px;border-radius:999px;text-decoration:none;box-shadow:0 4px 12px rgba(41,104,254,.28);margin-right:10px;transition:transform .15s';
    a.onmouseenter = () => a.style.transform = 'translateX(-2px)'; a.onmouseleave = () => a.style.transform = '';
    a.onclick = e => e.stopPropagation();
    const sitio = [...document.querySelectorAll('.marca, header.top .brand, #goHome, .marca-top')].find(x => x.getClientRects().length && getComputedStyle(x).visibility !== 'hidden');
    if (sitio) sitio.parentNode.insertBefore(a, sitio);
    else { a.style.cssText += ';position:fixed;left:14px;bottom:14px;z-index:99999;margin:0'; document.body.appendChild(a); }
  }
  const ya = () => (window.Hub && Hub.listo ? Hub.listo : Promise.resolve()).then(pon);
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', ya) : ya();
})();
