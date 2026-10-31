# Especificación del proyecto: Sitio web y dashboard para vivero

Oct 30, 2026 · @Saul Donas

## 1. Resumen y objetivo

**Instrucción para la IA que lea este documento:** construir un sitio web profesional para un vivero de plantas, con un sitio público y un dashboard de administración protegido por registro e inicio de sesión. Todo el contenido visible en el sitio (plantas, catálogos, temporadas, anuncios, textos institucionales, datos de contacto) se administra desde el dashboard, sin tocar código.

- **Idioma de la interfaz y del contenido:** español (México). Se planea agregar una versión en inglés en el futuro, así que los textos deben prepararse para internacionalización (i18n) desde el inicio.
- **Negocio:** Vivero El Encanto, ubicado en Atlixco, Puebla. Vende plantas de temporada (Nochebuena, Tulipán, Jacintos, Cempasúchil), plantas de todo el año, árboles y fertilizantes.
- **Propósito del sitio público:** mostrar el catálogo, destacar la temporada vigente y llevar al visitante a contactar al vivero, principalmente por WhatsApp. Es un escaparate: no muestra precios ni tiene carrito ni pagos en línea.
- **Propósito del dashboard:** que el dueño o encargado actualice el sitio de forma autónoma, con una interfaz simple, en español y pensada para personas no técnicas.
- **Referencias visuales:** las capturas de pantalla del dashboard que acompañan esta solicitud son el diseño objetivo. Deben respetarse su estructura, textos y estilo.

**Producto en una línea:** un sitio de vivero cuyo contenido y cuya portada cambian solos según la temporada del año, administrado desde un panel sencillo.

## 2. Usuarios, registro e inicio de sesión

El acceso al dashboard exige cuenta. Las capturas muestran a un usuario llamado «saul» y un campo **Usuario** (no correo) en Mi cuenta, por lo que el identificador de acceso es un nombre de usuario.

| Elemento | Requisito |
| --- | --- |
| Registro | Solo por invitación: formulario con código de invitación, usuario, contraseña (mínimo 8 caracteres) y repetir contraseña. Sin un código válido no se puede registrar. |
| Inicio de sesión | Usuario y contraseña; sesión persistente con cookie segura. |
| Cierre de sesión | Opción «Salir» en el menú del dashboard. |
| Cambio de contraseña | En «Mi cuenta»: contraseña actual, nueva (mínimo 8) y repetirla. |
| Seguridad | Contraseñas con hash (bcrypt o argon2), protección contra fuerza bruta, rutas del dashboard protegidas en servidor. |
| Roles | Un solo rol: administrador. El registro es solo por invitación. |

**Decisión tomada:** el registro es solo por invitación, para que nadie ajeno pueda editar el sitio. Un administrador genera códigos de invitación de un solo uso y con vencimiento desde el dashboard; la primera cuenta se crea con un código inicial definido en la configuración del servidor.

## 3. Sitio público: navbar y páginas

El sitio público tiene **6 apartados en la barra de navegación**. Todo su contenido sale de lo que se captura en el dashboard.

| # | Apartado | Contenido |
| --- | --- | --- |
| 1 | **Inicio** | Carrusel de portada (anuncios), temporada actual destacada, accesos a catálogos y una muestra de testimonios. |
| 2 | **Catálogos** | Menú desplegable con: Todo el año, Árboles, Fertilizantes y, al final, «Ver todas las plantas». |
| 3 | **Temporada** | Solo las plantas de la temporada vigente (hoy: Nochebuena). Cambia sola según fechas. |
| 4 | **Fertilizantes** | Página propia con los fertilizantes visibles: foto, para qué sirve, dosis, frecuencia, cómo se aplica, precauciones y presentación. |
| 5 | **Nosotros** | Historia, Misión, Visión y Valores, con fotos, galería y línea del tiempo de momentos importantes. |
| 6 | **Contacto** | Mapa de Google, ubicación, dirección, teléfonos, horarios, botón para escribir por WhatsApp, redes sociales y preguntas frecuentes al final. |

**Notas importantes:**

- El navbar tiene exactamente 6 apartados y el sexto es Fertilizantes (confirmado por el dueño). Los testimonios no tienen enlace en el navbar: se muestran como sección dentro de Inicio.
- El menú Catálogos se genera desde los catálogos marcados como visibles en el dashboard, respetando su orden. Los catálogos de temporada (Nochebuena, Tulipán, Jacintos, Cempasúchil) no aparecen en el menú; se acceden desde «Temporada».
- La portada y los acentos de color del sitio toman el **color de la temporada activa** (por ejemplo, naranja para Cempasúchil).
- Botón flotante de WhatsApp en todas las páginas, usando el número de «Datos y redes».
- Cada planta tiene una ficha propia con fotos, descripción, cuidados, riego y fertilizante recomendado.
- Diseño adaptable (móvil primero) y SEO básico (títulos, descripciones, Open Graph).

## 4. Dashboard: Inicio y Catálogo

El dashboard tiene un menú lateral con estos grupos: **Inicio** (Inicio y Mensajes), **Catálogo** (Plantas, Catálogos, Temporadas, Fertilizantes), **Apartados de página** (Carrusel de portada, Nosotros, Preguntas frecuentes, Testimonios, Novedades, Datos y redes) y **Otros** (Ver el sitio, Mi cuenta, Salir). *Mensajes y Novedades se agregaron al menú a pedido del dueño (fase 6).* Estilo: fondo gris verdoso claro, tarjetas blancas redondeadas, verde oscuro como color de marca, botones en forma de píldora, títulos con tipografía serif de carácter y textos en sans-serif.

### 4.1 Inicio

- Saludo personalizado («Hola, saul») y subtítulo «Esto es lo que se ve hoy en el sitio».
- Botón **Ver el sitio** (esquina superior derecha) que abre la página principal del vivero.
- **Tarjeta de temporada actual:** muestra la temporada que se ve ahora (ej. Cempasúchil), su aviso («Flores para tu ofrenda»), usa el color de la temporada como fondo degradado y tiene el botón **Cambiar temporada**.
- **Accesos rápidos:** Agregar planta, Nuevo anuncio, Publicar novedad, Ver mensajes.
- **Pendientes** (con contadores y botón de acción): mensajes sin leer (Abrir), plantas ocultas (Revisar), plantas sin foto (Ver) y alerta «Falta número de WhatsApp» (Poner).
- **Anuncios en portada hoy:** lista de anuncios activos o el aviso «Ninguno para esta temporada» con enlace **Crear uno**.

### 4.2 Catálogo > Plantas

**Listado:** título «Plantas», contador («Tienes N en total»), botón **Agregar planta**, búsqueda por nombre, filtro por catálogo, filtro por color y botón Buscar. Tabla con columnas Planta, Catálogo, Fotos y Visible. Estado vacío: «Todavía no hay plantas. Agrega la primera.»

**Formulario «Nueva planta»** (botones Cancelar y Guardar arriba; abajo Guardar, Guardar y seguir editando, Cancelar):

| Campo | Tipo y comportamiento |
| --- | --- |
| Nombre | Texto obligatorio. Ej. «Nochebuena roja». |
| Variedad | Texto opcional. Ej. «Prestige». |
| Catálogo | Selector con los catálogos existentes. |
| Luz | Chips de selección múltiple: Sol, Media sombra, Sombra. |
| Colores | Chips de selección múltiple con punto de color, tomados de la lista de colores de «Datos y redes». |
| Tamaños de maceta | Chips de selección múltiple, tomados de «Datos y redes» (Maceta 4, 6, 8, 10, 12, 15). |
| Riego | Bloque con: días por semana (Sin dato, 1 a 6, Diario), cantidad de agua (selector, ej. Moderado), fertilizante recomendado (selector con los fertilizantes creados, o Ninguno), nota de riego opcional y una vista previa «Así se ve en la ficha». |
| Descripción corta | Textarea, una o dos frases para la tarjeta. |
| Cuidados | Textarea: temperatura, poda, trasplante. Se muestra en la ficha de la planta. |
| Etiqueta en la tarjeta | Selector (Sin etiqueta, y opciones como Nuevo o Oferta). |
| Visible en el sitio | Interruptor; apagado oculta la planta sin borrarla. |
| Fotos | Zona de arrastrar y soltar. JPG, PNG o WebP de hasta 15 MB, convertidas a WebP y reducidas automáticamente. La foto marcada en verde es la que sale en la tarjeta (portada). |

**Disponibilidad (configurable):** el sitio muestra si una planta está disponible, pero el vivero decide si usa esta función.

- **Interruptor general** en el listado de Plantas: «Mostrar disponibilidad en el sitio». Apagado, no se muestra ninguna etiqueta de disponibilidad.
- **Interruptor por planta** en el formulario: «Disponible». Encendido muestra «Disponible»; apagado muestra «Agotado» (o la planta puede ocultarse con «Visible en el sitio»).
- El listado de Plantas del dashboard agrega una columna Disponible y un filtro por disponibilidad.
- En el sitio, la etiqueta aparece en la tarjeta y en la ficha de cada planta, y se puede filtrar por disponibles.
- No hay precios ni inventario numérico; solo disponible o no.

### 4.3 Catálogo > Catálogos

Lista ordenable que define el orden del menú y de la portada. Columnas: Catálogo (icono, nombre, punto de color y slug como `/nochebuena`), Temporada (píldora con el rango de meses), Plantas (cantidad, enlazada) y Visible (interruptor). Acciones por fila: subir, bajar, editar (lápiz) y eliminar. Botón **Nuevo catálogo**.

Catálogos iniciales sugeridos:

| Catálogo | Slug | Temporada | Color |
| --- | --- | --- | --- |
| Nochebuena | /nochebuena | Noviembre a diciembre | Rojo |
| Tulipán | /tulipan | Enero a marzo | Rosa fuerte |
| Jacintos | /jacintos | Febrero a abril | Azul índigo |
| Cempasúchil | /cempasuchil | Octubre a noviembre | Naranja |
| Todo el año | /todo-el-anio | Todo el año | Verde oscuro |
| Árboles | /arboles | Agosto a septiembre | Verde |

Cada catálogo tiene foto de portada, texto de presentación, puntos destacados, fechas de temporada y folleto PDF opcional; todo se edita en su ficha (lápiz). Se muestra la insignia «Se ve hoy» en el catálogo cuya temporada está activa.

### 4.4 Catálogo > Temporadas

**Selector de modo** (tarjeta «¿Qué temporada se muestra?»), con botón Guardar y el texto «Ahora se ve: Cempasúchil (Octubre)»:

1. **Automática por fechas** (por defecto): el sitio cambia solo según los meses de cada temporada y se repite cada año.
2. **Forzar una temporada:** muestra siempre la temporada elegida, sin importar la fecha.
3. **Fijo en Todo el año:** no se muestra ninguna temporada; usa los colores de Todo el año.

**Tarjeta por temporada** (borde superior del color de la temporada; la activa se resalta con borde verde e insignia «Se ve hoy»): nombre, rango de meses, selectores Empieza y Termina (mes), Texto del aviso (ej. «Ya llegó la Nochebuena»), Color (selector), Prioridad (número), botón Guardar y botón **Portada y textos**.

Nota visible: si dos temporadas caen en el mismo mes gana la de prioridad más alta; si empatan, la que va primero en Catálogos. Las temporadas ocultas no se usan en el modo automático.

### 4.5 Catálogo > Fertilizantes

**Listado:** «Los que vende el vivero, con sus indicaciones. Salen en la página Fertilizantes y en la ficha de cada planta.» Botón **Agregar fertilizante**. Estado vacío: «Todavía no hay fertilizantes.»

**Formulario «Nuevo fertilizante»:** Nombre (ej. Triple 17), Tipo (selector, ej. Granulado), Para qué sirve, Recomendado para (chips de catálogos), Dosis (ej. 5 ml por litro de agua), Cada cuánto (ej. cada 15 días), Cómo se aplica (un paso por renglón), Precauciones (opcional), Presentación (ej. Bolsa de 1 kg), Visible en el sitio (interruptor) y Foto del producto (JPG, PNG o WebP).

### 4.6 Mensajes (agregado en la fase 6)

Los mensajes que llegan desde el formulario de Contacto del sitio. Pestañas **Todos** y **Sin leer** (con contador). Cada mensaje muestra nombre, teléfono o correo, fecha y el texto. Al abrirlo se marca como leído; se puede volver a marcar como no leído y eliminar (con confirmación). Según lo que dejó la persona, ofrece **Responder por WhatsApp** y **Llamar** (celular) o **Responder por correo**.

El formulario de Contacto tiene protección básica contra spam: un campo trampa que las personas no ven, un tiempo mínimo de llenado (3 segundos) y un máximo de 5 mensajes por hora desde una misma conexión.

## 5. Dashboard: Apartados de página

### 5.1 Carrusel de portada

«Los anuncios grandes de la portada, con foto o video y texto encima.» Dos pestañas: **Anuncios del carrusel** (tabla con Anuncio, Temporada, Fechas, Visible; botón **Nuevo anuncio**; flechas para ordenar e insignia «Sale hoy») y **Otros archivos** (decidido con el dueño en la fase 4: las fotos y videos guardados del carrusel, con su peso y qué anuncio usa cada uno; los que ya no usa ningún anuncio se pueden borrar para ahorrar espacio).

Regla visible en el panel: un anuncio sale en la portada si está visible, si es de «Siempre» o de la temporada que se ve hoy, y si hoy está dentro de sus fechas.

**Formulario «Nuevo anuncio»** con **vista previa en vivo** (Computadora / Celular) que se actualiza mientras se escribe:

- **Foto o video:** JPG, PNG, WebP o GIF (se achica a 2400 px); video MP4 o WebM de hasta 40 MB, sin sonido (en el sitio se reproduce siempre silenciado y en bucle; el archivo conserva su pista de audio, porque quitarla requiere un programa (ffmpeg) que normalmente no está disponible en el hosting). Opción «Más opciones de imagen»: foto para celular e imagen de espera del video.
- **Texto:** interruptor «La imagen ya trae su texto» (muestra la imagen completa, sin oscurecer ni texto encima; toda la imagen lleva al botón principal), texto pequeño de arriba (opcional), título, texto corto (opcional).
- **Botones:** botón principal con su destino y segundo botón opcional con su destino. En «Lleva a» se acepta una página del sitio (`/catalogos`, `/contacto`), la palabra `whatsapp` (abre el chat) o una dirección completa que empiece con `https://`.
- **Cómo y cuándo se ve:** posición del texto (Izquierda, Centro, Derecha), control deslizante «Oscurecer la foto para leer mejor» (0 a 100 %, por defecto 50 %), Temporada (Siempre o una temporada específica), fechas Desde y Hasta (opcionales) y el interruptor Visible en el sitio.

### 5.2 Nosotros

Una sola pantalla con botón Guardar arriba y abajo. Textos y fotos de las páginas del menú Nosotros.

| Sección | Campos |
| --- | --- |
| Historia | Texto «Cómo empezó el vivero» (renglón vacío entre párrafos), foto de arriba (mejor horizontal), galería (mosaico al final de la página: vivero, invernadero, familia, plantas). |
| Momentos importantes | Línea del tiempo editable con botón **Agregar momento**. Título libre (año como «1998» o palabra como «Hoy»), texto y foto opcional por momento. |
| Misión | Texto, foto de arriba y galería. |
| Visión | Texto, foto de arriba y galería. |
| Valores | Lista editable con botón **Agregar valor** (título y descripción), foto de arriba y galería. |

Fotos: JPG, PNG o WebP de hasta 15 MB, convertidas a WebP y reducidas automáticamente.

### 5.3 Preguntas frecuentes

«Aparecen al final de la página Contacto.» Listado con botón **Agregar pregunta** y estado vacío «Todavía no hay preguntas.» Formulario con Pregunta (ej. «¿Hacen envíos?»), Respuesta (textarea) y botón **Agregar**. Debe permitir editar, borrar y reordenar. En el sitio se muestra como acordeón.

### 5.4 Testimonios (apartado nuevo, no incluido en las capturas)

Se solicitó agregar este apartado; no existe diseño, así que debe seguir el mismo estilo que Preguntas frecuentes.

- **Campos:** avatar del cliente (imagen que funciona como foto de perfil; si no sube una, se usa un avatar por defecto), nombre del cliente, texto del testimonio, Visible en el sitio (interruptor) y orden.
- **Dashboard:** listado con botón **Agregar testimonio**, editar, borrar, ocultar y reordenar.
- **Sitio público:** sección de tarjetas o carrusel dentro de Inicio, mostrando los testimonios visibles según su orden.
- Los testimonios los captura el administrador; no hay envío público de reseñas en esta versión.

### 5.5 Datos y redes

Botón **Guardar datos** arriba y abajo de los dos primeros bloques. Lo que aparece en el pie, en Contacto, en el mapa y en los botones de WhatsApp.

| Bloque | Campos |
| --- | --- |
| Contacto | WhatsApp (10 dígitos, sin espacios; ej. 2441234567), Teléfonos (separados con coma; ej. 244 761 52 53, 244 122 83 37), Correo (opcional), Horario (ej. Lunes a domingo de 8:00 a 18:00), Horario especial (opcional, para días festivos; ej. «24 y 31 de diciembre cerramos a las 14:00»). |
| Ubicación y mapa | Dirección (Segunda Calle de José María Morelos 48, Col. Cabrera, Atlixco, Puebla), Enlace de Google Maps (para el botón «Cómo llegar») y Mapa para insertar (código iframe opcional). Si se pega el iframe completo, el panel guarda solo la dirección del mapa (el `src`). |
| Redes sociales | Facebook (opcional) e Instagram (opcional). |
| Colores | Lista editable de los colores que se pueden elegir en cada planta, con nombre, selector de tono y contador de plantas que lo usan. Valores iniciales: Rojo, Blanco, Rosa, Amarillo, Naranja, Morado, Jaspeado, Verde, Azul, Variegado, Multicolor. Fila para agregar color nuevo y botón Guardar colores. |
| Tamaños de maceta | Lista ordenable (subir/bajar) con contador de plantas. Valores iniciales: Maceta 4, 6, 8, 10, 12 y 15. Fila para agregar tamaño nuevo y botón Guardar macetas. |

Eliminar un color o tamaño en uso debe advertir cuántas plantas lo usan.

### 5.6 Novedades (agregado en la fase 6)

«Publicar novedad» del Inicio. Listado de la más nueva a la más vieja, con botón **Publicar novedad**, interruptor Visible en el sitio y lápiz para editar. Formulario: título, texto, imagen (opcional) y Visible en el sitio; en la edición, botón **Eliminar novedad** (con confirmación; borra también la imagen; agregado a pedido del dueño). En el sitio, las 6 novedades visibles más recientes salen en una sección «Novedades» de Inicio.

## 6. Dashboard: Mi cuenta, Ver el sitio y Salir

- **Ver el sitio:** enlace que lleva a la página principal pública del vivero (se recomienda abrirlo en una pestaña nueva).
- **Mi cuenta:** título «Mi cuenta» y subtítulo «Cambia tu contraseña cuando quieras.» Campos: Usuario (solo lectura o editable según se decida), Contraseña actual, Contraseña nueva (mínimo 8) y Repítela. Botón **Cambiar contraseña**. Validar que coincidan, que la actual sea correcta y mostrar mensajes de éxito o error en español.
- **Salir:** cierra la sesión y regresa a la pantalla de inicio de sesión.

## 7. Modelo de datos

Entidades mínimas deducidas de las pantallas. Los nombres de campos son una propuesta; la IA puede ajustarlos a su stack.

| Entidad | Campos principales |
| --- | --- |
| Usuario | id, usuario (único), hash de contraseña, fecha de creación. |
| Catálogo | id, nombre, slug, color, orden, visible, foto de portada, texto de presentación, puntos destacados, folleto PDF (opcional), temporada\_id (opcional). |
| Temporada | id, nombre, mes de inicio, mes de fin, texto del aviso, color, prioridad, visible, catálogo asociado. |
| Configuración del sitio | modo de temporada (automática, forzada, fijo todo el año), temporada forzada, mostrar disponibilidad (bool). |
| Planta | id, nombre, slug (único; sirve para la URL y para el QR), variedad, catálogo\_id, luz\[\], colores\[\], tamaños de maceta\[\], riego (días por semana, cantidad de agua, fertilizante\_id, nota), descripción corta, cuidados, etiqueta, disponible (bool), visible, fecha de creación. |
| Foto de planta | id, planta\_id, archivo WebP, orden, es\_portada. |
| Fertilizante | id, nombre, tipo, para qué sirve, catálogos recomendados\[\], dosis, frecuencia, pasos de aplicación\[\], precauciones, presentación, foto, visible. |
| Anuncio de carrusel | id, archivo (imagen o video), foto móvil, imagen de espera, imagen\_con\_texto (bool), texto pequeño, título, texto, botón 1 (texto, destino), botón 2 (texto, destino), posición del texto, oscurecido (0 a 100), temporada\_id o «siempre», fecha desde, fecha hasta, visible, orden. |
| Contenido «Nosotros» | historia, misión, visión (cada una con texto, foto superior y galería), valores\[\] (título, descripción), momentos\[\] (título, texto, foto). |
| Pregunta frecuente | id, pregunta, respuesta, orden. |
| Testimonio | id, nombre, texto, avatar, fecha, visible, orden. |
| Datos del negocio | WhatsApp, teléfonos\[\], correo, horario, horario especial, dirección, enlace de Maps, iframe del mapa, Facebook, Instagram. |
| Color | id, nombre, valor hexadecimal, orden. |
| Tamaño de maceta | id, nombre, orden. |
| Mensaje | id, nombre, contacto, texto, fecha, leído. Origen del contador «mensajes sin leer» y del acceso «Ver mensajes». |
| Novedad | id, título, texto, imagen, fecha, visible. Origen del acceso rápido «Publicar novedad». |

**Relaciones clave:** un catálogo tiene muchas plantas; una planta puede tener un fertilizante recomendado; un fertilizante se recomienda para varios catálogos; un anuncio pertenece a una temporada o a «siempre».

## 8. Reglas de negocio

1. **Temporada vigente (modo automático):** se calcula por el mes actual. Una temporada puede cruzar el año (ej. noviembre a enero). Si dos temporadas coinciden en el mes, gana la de mayor prioridad; si empatan, la que va primero en Catálogos. Las temporadas ocultas se ignoran. Si ninguna aplica, se usa «Todo el año».
2. **Modo forzado y modo fijo:** el modo forzado muestra siempre la temporada elegida; el modo fijo ignora todas las temporadas y usa los colores de «Todo el año».
3. **Tema visual por temporada:** el color de la temporada vigente se aplica a portada, botones y acentos del sitio público y a la tarjeta de temporada del dashboard.
4. **Página «Temporada»:** lista solo las plantas visibles cuyo catálogo es el de la temporada vigente.
5. **Menú «Catálogos»:** muestra los catálogos visibles marcados como permanentes (Todo el año, Árboles), más el enlace «Fertilizantes» y, al final, «Ver todas las plantas».
6. **Anuncios del carrusel:** aparecen si están visibles, son de «Siempre» o de la temporada vigente, y la fecha de hoy cae dentro de Desde y Hasta (si se definieron). Se ordenan por el campo orden.
7. **Ocultar no es borrar:** el interruptor «Visible en el sitio» oculta plantas, fertilizantes, anuncios, catálogos y testimonios sin eliminarlos.
8. **Pendientes del Inicio:** mensajes sin leer, plantas con visible apagado, plantas sin foto y falta de número de WhatsApp; cada uno con acceso directo a resolverlo.
9. **Imágenes:** validar tipo y tamaño (15 MB en fotos; 40 MB en video), convertir a WebP, reducir a un máximo razonable (2400 px en anuncios) y generar versiones ligeras para tarjetas.
10. **WhatsApp:** el botón del sitio abre `https://wa.me/52<número>` con un mensaje inicial prellenado (por ejemplo, con el nombre de la planta cuando se pulsa desde su ficha).
11. **Eliminaciones:** pedir confirmación; si un catálogo, color o tamaño tiene plantas, avisar cuántas y no permitir un borrado que deje datos huérfanos.

## 9. Diseño, UX y requisitos no funcionales

**Diseño**

- Estilo fiel a las capturas: fondo gris verdoso muy claro, tarjetas blancas con esquinas redondeadas y sombra suave, verde pino (#1E3A2E) como color de marca, botones en píldora, interruptores verdes, chips de selección, avisos amarillos para reglas importantes.
- Tipografía: serif con carácter para títulos de temporada y encabezados; sans-serif limpia para formularios.
- El sitio público se ve «profesional» y botánico: fotografía grande, mucho espacio, color de acento que cambia con la temporada.
- Diseño responsivo; el dashboard debe poder usarse desde un celular.

**Marca y paleta:** el nombre comercial es **Vivero El Encanto**. La paleta es verde botánica, tomada de la imagen de referencia que envió el dueño (tonos verdes profundos, salvia y crema). Los colores de cada temporada (rojo, naranja, rosa, etc.) se usan solo como acento sobre esta base.

| Color | Hex | Uso sugerido |
| --- | --- | --- |
| Verde bosque profundo | #0F1F17 | Fondos oscuros, pie de página, texto principal sobre fondos claros. |
| Verde pino | #1E3A2E | Color de marca: botones primarios, encabezados, menú del dashboard. |
| Verde hoja | #3E5A3F | Acentos, íconos, estados activos. |
| Verde salvia | #6B7F67 | Bordes, chips, texto secundario. |
| Crema hoja seca | #C7CBB8 | Fondos de tarjetas y secciones suaves. |
| Gris musgo | #3D4337 | Texto y fondos neutros oscuros. |

La IA debe verificar el contraste de texto (WCAG AA) al combinar estos colores. El logotipo aún no existe: usar el nombre en texto con la tipografía serif mientras tanto.

**UX del dashboard**

- Textos en español claro y sin tecnicismos, con ayudas breves bajo cada campo (como en las capturas).
- Estados vacíos con una invitación a la primera acción.
- Botones «Guardar», «Guardar y seguir editando» y «Cancelar» en los formularios largos; confirmación visual al guardar.

**Requisitos no funcionales**

| Tema | Requisito |
| --- | --- |
| Rendimiento | Imágenes en WebP con carga diferida; sitio público rápido en móvil. |
| Seguridad | HTTPS, contraseñas con hash, validación en servidor, sanitizar el iframe del mapa y los textos, límites de subida. |
| SEO | URLs limpias (`/catalogos/arboles`, `/temporada`), metadatos y mapa del sitio. |
| Accesibilidad | Contraste suficiente, etiquetas en formularios, texto alternativo en fotos. |
| Mantenimiento | Código modular, variables de entorno para secretos y datos de ejemplo (seeds) con los catálogos y temporadas iniciales. |

**Stack sugerido (la IA puede proponer otro con justificación):** el hosting y el dominio serán de Hostinger, plan Unlimited (según la captura del plan: sitios ilimitados, 50 GB de almacenamiento NVMe, dominio gratis el primer año, respaldos diarios, CDN incluido y Node.js entre las aplicaciones compatibles). Stack principal: Next.js (React) con TypeScript, MySQL con Prisma y sesiones seguras. Antes de programar, la IA debe verificar en la documentación de Hostinger que este plan permita ejecutar aplicaciones Node.js (versión, acceso SSH o despliegue desde Git), qué base de datos ofrece y sus límites de CPU y memoria. Si Node.js no es viable en el plan, usar Laravel (PHP) con MySQL, que sí es estándar en hosting compartido. Las imágenes se guardan en el servidor en WebP, cuidando el límite de 50 GB, y los datos de ejemplo (seeds) cargan los catálogos y temporadas iniciales.

## 10. Fases de desarrollo, supuestos y preguntas abiertas

**Fases recomendadas** (pedir a la IA que entregue y confirme cada una antes de pasar a la siguiente):

1. **Base y autenticación:** proyecto, base de datos, registro, inicio de sesión, «Mi cuenta», «Salir» y layout del dashboard con menú.
2. **Configuración:** Datos y redes (contacto, mapa, colores, macetas).
3. **Catálogo:** Catálogos, Temporadas (con la lógica automática), Plantas con subida de fotos y Fertilizantes.
4. **Contenido de página:** Carrusel de portada con vista previa, Nosotros, Preguntas frecuentes y Testimonios.
5. **Sitio público:** navbar de 6 apartados, Inicio, Catálogos, Temporada, Nosotros, Contacto y Testimonios con el tema por temporada.
6. **Inicio del dashboard:** pendientes, accesos rápidos y mensajes.
7. **Pulido:** responsivo, SEO, rendimiento, accesibilidad y pruebas.

**Supuestos tomados**

- El sexto apartado del navbar es «Fertilizantes» (página propia); los testimonios van como sección en Inicio.
- Hay un solo rol (administrador) y el nombre de usuario es el identificador de acceso.
- Los mensajes llegan desde un formulario de contacto del sitio y se guardan en el dashboard; además existe el botón de WhatsApp.
- «Publicar novedad» crea entradas cortas (título, texto, imagen) que se muestran en Inicio.
- Los catálogos de temporada se acceden desde la página «Temporada» y no desde el menú Catálogos.

**Preguntas abiertas para el dueño del proyecto**

- [ ] Resuelto: el registro es solo por invitación.
- [ ] Resuelto: el navbar tiene 6 apartados y el sexto es Fertilizantes.
- [ ] Resuelto: Fertilizantes tiene página propia en el navbar (y sigue enlazada en el menú Catálogos).
- [ ] Resuelto: escaparate sin precios, sin venta en línea.
- [ ] Resuelto: se muestra disponibilidad, configurable desde el dashboard (interruptor general y por planta). Sin precios.
- [ ] Resuelto: nombre «Vivero El Encanto» y paleta verde de referencia (sección 9). Por ahora no habrá logotipo: se usa el nombre en texto con tipografía serif, y debe quedar un espacio fácil de reemplazar cuando exista.
- [ ] Resuelto: hosting y dominio en Hostinger, plan Unlimited.
- [ ] Resuelto: llevan avatar como foto, nombre y texto; sin calificación.
- [ ] Resuelto: sí, se agregará inglés en el futuro; preparar i18n desde el inicio.

**Funciones futuras** (fuera del alcance inicial, pero la base debe quedar lista para agregarlas):

- **Código QR por planta o tipo de planta:** cada planta tiene una URL estable y permanente (por ejemplo `/plantas/<slug>`). Después, el dashboard generará un QR descargable (PNG o SVG, para imprimir en etiquetas) que, al escanearse, abre la ficha de esa planta con su información, riego y cuidados. Por eso el campo slug debe ser único y no cambiar al renombrar la planta sin dejar una redirección.
- **Versión del sitio en inglés** con selector de idioma.

## 11. Cambios y decisiones acordados durante el desarrollo

- **Prioridades de temporada** (fase 3): noviembre → Nochebuena; febrero y marzo → Tulipán.
- **Carrusel, pestaña «Otros archivos»** (fase 4): archivos del carrusel con quién los usa; se pueden borrar los que no se usan (ver 5.1).
- **Video «sin sonido»** (fase 4): se reproduce silenciado; la pista de audio no se elimina del archivo.
- **Contacto** (fase 5): los mensajes se guardan en la base con protección básica contra spam (ver 4.6).
- **Color de temporada legible** (fase 5): si el color elegido es un tono medio con el que ningún texto alcanza el contraste AA (por ejemplo, el rosa de Tulipán), los botones e insignias usan una versión un poco más oscura; franjas, puntos y bordes usan el color exacto.
- **Mensajes y Novedades** (fase 6): tienen pantalla propia y entrada en el menú; las novedades se pueden eliminar (ver 4.6 y 5.6).
- **Disponibilidad en el sitio** (fase 7): la etiqueta dice «Disponible» o «Agotado»; en las listas de plantas hay un botón «Solo disponibles» cuando el interruptor general está encendido.
- **Despliegue** (fases 3 y 5): variables de entorno `UPLOADS_DIR` (carpeta de fotos fuera del proyecto, para que no se pierdan al desplegar) y `SITIO_URL` (dominio, para Open Graph y el mapa del sitio).
