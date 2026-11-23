#!/usr/bin/env python3
"""Biofy Hub: guarda la llave del almacén de QUINIELAS en el Mac, sin enseñarla en pantalla (Juan, 23/11/2026).
Uso (en la Terminal):  python3 /Users/diseno/biofy-hub/scripts/guardar-llave-quinielas.py
Después se le dice a Claude «ya está la llave de las quinielas» para que monte y publique el Hub con ella."""
import getpass, json, os, urllib.error, urllib.request

F = '/Users/diseno/claves-biofy/quinielas-secretos.json'
d = json.load(open(F))
t = getpass.getpass('Pega la llave de GitHub de las quinielas (no se verá al pegar) y pulsa Intro: ').strip()
if not t.startswith('github_pat_'):
    raise SystemExit('Eso no parece una llave fine-grained de GitHub (empieza por github_pat_). No se ha guardado nada.')
# Comprobación: que puede leer el repositorio y escribir en él (con un PUT incompleto que GitHub siempre rechaza: no crea nada).
api = f"https://api.github.com/repos/{d['owner']}/{d['repo']}"
def pide(metodo, url, cuerpo=None):
    q = urllib.request.Request(url, method=metodo, data=json.dumps(cuerpo).encode() if cuerpo is not None else None,
                               headers={'Authorization': 'Bearer ' + t, 'Accept': 'application/vnd.github+json'})
    try:
        return urllib.request.urlopen(q, timeout=20).status
    except urllib.error.HTTPError as e:
        return e.code
if pide('GET', api) != 200:
    raise SystemExit(f"GitHub no deja leer {d['repo']} con esta llave. Revisa que la llave sea solo para «{d['repo']}». No se ha guardado nada.")
if pide('PUT', api + '/contents/prueba-permiso.txt', {}) != 422:
    raise SystemExit('La llave lee pero no puede escribir. Revisa «Contents: Read and write». No se ha guardado nada.')
d['token'] = t
json.dump(d, open(F, 'w'), indent=1)
os.chmod(F, 0o600)
print('Llave guardada en el Mac. Dile a Claude: «ya está la llave de las quinielas».')
