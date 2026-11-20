/* Biofy Hub · configuración.
   Es el ÚNICO sitio que cambia al mudar la web a nuestro hosting (ver README, «Migración»).
   Aquí no va nunca una contraseña ni una clave. */
window.HUB_CONFIG = {
  nombre: 'Biofy Hub',
  // Dónde se guardan los datos. Hoy: «github» (repositorios privados). Mañana: «servidor».
  datos: { tipo: 'github' },
  // Cómo se entra. Hoy: «cifrado» (llavero por persona en comun/llaveros.js). Mañana: «servidor».
  acceso: { tipo: 'cifrado', recordarDias: 14 },
  // Prefijo de lo que se guarda en el navegador (tema, sesión).
  almacen: 'hub_'
};

/* Módulos del Hub.
   permiso: la clave del permiso de cada persona (archivo de accesos).
   ruta:    carpeta del módulo dentro del Hub (siempre relativa).
   fuera:   SOLO mientras se mete en el Hub: abre la web de siempre.
   estado:  «uso» (funciona) u «obra» (en construcción). etapa: la del cerebro. */
window.HUB_MODULOS = [
  { id:'pizarra',     permiso:'pizarra',     ruta:'pizarra/', nombre:'Pizarra', etiqueta:'Pizarra', icono:'trofeo', grupo:'ventas', estado:'uso', etapa:'estable', desc:'Las ventas del día en la TV de la reunión matinal.' },
  { id:'dashboard',   permiso:'dashboard',   fuera:'https://juan-biofy.github.io/panel-comercial/', nombre:'Dashboard', etiqueta:'Dashboard', icono:'barras', grupo:'ventas', estado:'uso', etapa:'beta', desc:'Métricas de la red comercial y el Informe Comercial.' },
  { id:'quinielas',   permiso:'quinielas',   nombre:'Quinielas', etiqueta:'Quinielas', icono:'quiniela', grupo:'ventas', estado:'obra', etapa:'concepto', desc:'La quiniela diaria y las hojas de producción, en digital.' },
  { id:'comisiones',  permiso:'comisiones',  nombre:'Comisiones', etiqueta:'Comisiones', icono:'euro', grupo:'ventas', estado:'obra', etapa:'concepto', desc:'Cálculo de las comisiones de la red comercial.' },
  { id:'academia',    permiso:'curso',       fuera:'https://juan-biofy.github.io/curso-elearning/', nombre:'Academia', etiqueta:'Academia', icono:'birrete', grupo:'formacion', estado:'obra', etapa:'alfa', desc:'El curso e-learning para comerciales, con el método de Cepas.' },
  { id:'fichas',      permiso:'fichas',      nombre:'Fichas de producto', etiqueta:'Productos', icono:'ficha', grupo:'formacion', estado:'obra', etapa:'alfa', desc:'Todas nuestras máquinas con su foto y sus datos.' },
  { id:'formularios', permiso:'formularios', fuera:'https://juan-biofy.github.io/formularios/', nombre:'Formularios', etiqueta:'Formularios', icono:'portapapeles', grupo:'herramientas', estado:'uso', etapa:'beta', desc:'Cuestionarios del equipo y sus respuestas.' },
  { id:'bot',         permiso:'bot',         nombre:'Bot de WhatsApp', etiqueta:'Bot', icono:'chat', grupo:'herramientas', estado:'obra', etapa:'concepto', desc:'Atención automática para las campañas.' },
  { id:'accesos',     permiso:'hub',         nombre:'Accesos', etiqueta:'Accesos', icono:'llave', grupo:'admin', estado:'obra', etapa:'concepto', desc:'Altas, bajas y qué módulos ve cada persona.' }
];

window.HUB_GRUPOS = [
  { id:'ventas',       nombre:'Ventas y equipo' },
  { id:'formacion',    nombre:'Formación y producto' },
  { id:'herramientas', nombre:'Herramientas' },
  { id:'admin',        nombre:'Administración' }
];

window.HUB_ETAPAS = ['concepto','alfa','beta','estable','definitivo'];
