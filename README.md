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

## Plan
1. ✅ Boceto de la portada (20/11/2026).
2. Organización `biofy-hub` en GitHub y primera publicación.
3. Entrada real: contraseña por persona, módulos capados, credencial de la TV.
4. Meter los módulos que ya funcionan: Pizarra, Dashboard, Formularios.
5. Panel de Accesos.
6. Módulos nuevos: Fichas, Quinielas (con hojas de producción), Comisiones, Academia, Bot de WhatsApp.
7. Mudanza a nuestro hosting.
