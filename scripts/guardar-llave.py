#!/usr/bin/env python3
"""Biofy Hub: guarda la llave de publicar del panel de Accesos en el Mac, sin enseñarla en pantalla.
Uso (en la Terminal):  python3 /Users/diseno/biofy-hub/scripts/guardar-llave.py
Después se le dice a Claude «ya está la llave» para que monte y publique el Hub con ella."""
import getpass, json, os, urllib.request

F = '/Users/diseno/claves-biofy/hub-secretos.json'
t = getpass.getpass('Pega la llave de GitHub (no se verá al pegar) y pulsa Intro: ').strip()
if not t.startswith('github_pat_'):
    raise SystemExit('Eso no parece una llave fine-grained de GitHub (empieza por github_pat_). No se ha guardado nada.')
q = urllib.request.Request('https://api.github.com/repos/biofy-hub/biofy-hub.github.io/contents/comun/llaveros.json?ref=gh-pages',
                           headers={'Authorization': 'Bearer ' + t, 'Accept': 'application/vnd.github+json'})
try:
    urllib.request.urlopen(q, timeout=20)
except Exception as e:
    raise SystemExit(f'GitHub no acepta la llave ({e}). Revisa que sea de «biofy-hub», con el repositorio biofy-hub.github.io y «Contents: Read and write». No se ha guardado nada.')
d = json.load(open(F))
d['gh'] = t
json.dump(d, open(F, 'w'), indent=2)
os.chmod(F, 0o600)
print('Llave guardada en el Mac. Dile a Claude: «ya está la llave».')
