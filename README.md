# Biofy Hub

La web madre de Culligan Biofy: todos nuestros proyectos como módulos, con una sola entrada y permisos por persona.
Nota del cerebro: `CEREBRO-BIOFY/Proyectos/Web madre/Web madre.md`.

## Carpetas
```
biofy-hub/
  src/                  lo que se publica
    index.html          portada del Hub (entrada + módulos)
    modulo.html         SOLO BOCETO: vista de ejemplo de un módulo
    comun/              lo que comparten todos los módulos
      estilo.css        estilo único (Estilo de nuestras webs)
      config.js         configuración: lo ÚNICO que cambia al mudarnos
      nucleo.js         tema, iconos, cabecera con etiqueta, sesión y permisos
      perfiles.js       perfiles de cada módulo y qué llaves lleva cada uno (lo usan el panel y el montaje)
      llaveros.json     SE GENERA: llaveros por persona + registro cifrado de Accesos
    accesos/            panel de Accesos (solo administradores del Hub)
    productos/          módulo PRODUCTOS: fichas en carrusel o cuadrícula, filtro por etiqueta, página por producto
      marca/            logos
    <módulo>/           (siguiente fase) pizarra/, dashboard/, formularios/…
  scripts/              herramientas (capturas, montaje, cifrado)
  salida/               capturas y pruebas (no se publica)
```

## Reglas para poder migrar sin rehacer nada
1. **Rutas siempre relativas.** Nada de `https://biofy-hub.github.io/…` dentro del código. Así funciona igual en GitHub, en un dominio propio o en subdominios.
2. **Una sola configuración** (`comun/config.js`): dónde están los datos y cómo se entra. Mudarse = cambiar ese archivo y el adaptador.
3. **Los módulos no hablan con GitHub.** Solo usan `Hub.*`:
   - Acceso: `Hub.sesion()`, `Hub.puede('pizarra')`, `Hub.salir()`.
   - Datos (siguiente fase): `Hub.datos.leer()`, `Hub.datos.guardar()`.
   Hoy por detrás hay GitHub; mañana, nuestro servidor. Los módulos no se tocan.
4. **Cada módulo en su carpeta**, con la cabecera común y su etiqueta. Si mañana va en un subdominio, se mueve la carpeta.
5. **Nunca una contraseña ni una clave en el código.** Se cifran al montar (`scripts/`) y se comprueba antes de publicar.
6. **Capar módulos:** cada módulo cifrado con su propia llave; la contraseña de cada persona solo abre las llaves de sus módulos. Con servidor, lo hará el servidor.
7. **Archivos grandes fuera** (vídeos del curso): YouTube oculto, Vimeo u OneDrive. GitHub no admite más de 100 MB por archivo.
8. **Datos en formato abierto** (JSON). Pasar de GitHub a una base de datos es copiar.

## Permisos: bloqueo de verdad, no esconder botones (Juan, 20/11)
Cada persona solo puede usar los módulos **y las funciones** que tenga permitidos, y **de ninguna manera** puede saltárselo (ni cambiando la dirección, ni tocando la página).
- Lo que no se ve no basta: un botón oculto se puede volver a mostrar. Por eso el bloqueo está en **las llaves**, no en la pantalla.
- **Módulos:** los datos de cada módulo van cifrados con su propia llave. La contraseña de cada persona solo abre las llaves de sus módulos. Si alguien escribe la dirección de otro módulo, la página carga, pero sin la llave no hay datos que leer.
- **Funciones** (subir Excel, borrar versiones, ver Comisiones, dar altas…): cada función que lee o cambia datos usa su propia llave o clave de escritura, limitada a lo justo. Solo la reciben las personas con ese permiso. Sin ella, la función no funciona aunque se fuerce el botón.
- Cada permiso se escribe una sola vez: **persona → módulos → funciones**. El panel de Accesos lo cambia.
- Con nuestro servidor (tras la mudanza), el mismo esquema lo comprueba el servidor en cada petición. Los módulos no cambian.
- Lo que sí es público en GitHub: el código de la página (cómo está hecha), nunca los datos ni las claves.

## Plan
1. ✅ Boceto de la portada (20/11/2026).
2. ✅ Organización `biofy-hub` en GitHub y primera publicación (20/11).
3. ✅ Entrada real: llavero por persona con su contraseña de siempre, módulos capados, TV (20/11).
4. ✅ Módulos que ya funcionan dentro del Hub: Pizarra, Dashboard, Formularios y Academia (20/11).
5. ✅ Panel de Accesos (20/11): altas, bajas, contraseña nueva y perfil por módulo. Opción A de Juan: el registro guarda la llave de cada persona (nunca la contraseña), cifrado con la llave del Hub, que solo tienen los administradores.
6. Módulos nuevos: ✅ Productos (23/11), Quinielas (con hojas de producción), Comisiones, Academia, Bot de WhatsApp.
7. Mudanza a nuestro hosting.

## Accesos: cómo funciona (opción A, Juan, 20/11)
- `comun/llaveros.json` lleva los llaveros y el **registro** (personas, permisos, llave de cada llavero y secretos de los módulos), cifrado con la llave del Hub.
- La llave del Hub y la llave de publicar (`gh`, token fine-grained solo para este repositorio, Contents lectura y escritura) están en `/Users/diseno/claves-biofy/hub-secretos.json` y en los llaveros de los administradores.
- El panel cambia el registro y reescribe `comun/llaveros.json` en la rama `gh-pages`. Las sesiones abiertas se ponen al día solas; las bajas se quedan fuera.
- `scripts/montar.mjs` lee el registro **publicado** (no `accesos.json`), así volver a montar no pisa lo hecho en el panel. `--importar` solo se usó la primera vez.
- Las contraseñas nuevas se enseñan una vez, para el Excel ADMIN GRUPO ENGLOBA. Ni el Hub ni el Mac las guardan.
- Pendiente de seguridad: al dar de baja a alguien, las llaves de los módulos (tokens) siguen siendo las mismas. Si la baja es delicada, cambiar los tokens de esos módulos y volver a montar.

## Productos (Juan, 23/11/2026)
- Datos: `fichas-producto/plantilla/para-hub.py` deja en `fichas-producto/hub/` el catálogo (textos, datos técnicos, etiquetas) y las fotos, fichas (JPG) y PDF. El montaje lo cifra todo (`--fichas`).
- Dos llaves (en `hub-secretos.json`, campo `fichas`): «ver» abre las 11 fichas activas; «admin» abre además las 8 eliminadas el 20/11. Los archivos se publican con nombres al azar.
- Perfiles: «Ver las fichas» y «Administrar». Los administradores del Hub reciben «Administrar» al montar.
- Qué fichas se ven: `productos/estado.json` (cifrado con la llave «ver»). Lo cambian los administradores desde la página (botón del ojo o interruptor «Visible para todos») y el montaje lo conserva. Ocultar es esconder: una ficha oculta no sale en la página, pero quien tiene la llave «ver» podría abrirla. Las eliminadas sí están bloqueadas de verdad.
- Para cambiar fichas: nueva ronda en `fichas-producto`, `python3 para-hub.py` y volver a montar y publicar.
