# Vivero El Encanto — sitio web y panel

Sitio público (escaparate, sin precios) y panel de administración de **Vivero El Encanto**, en Atlixco, Puebla.
La especificación completa está en [ESPECIFICACION.md](ESPECIFICACION.md).

**Tecnología:** Next.js 16 (App Router) con TypeScript, Tailwind CSS y shadcn/ui, MySQL/MariaDB con Prisma 7,
better-auth (usuario y contraseña con argon2, y Google), React Hook Form + Zod, next-intl (español de México, listo para inglés) y Playwright
para las pruebas.

## Documentación

| Documento | Para quién | Contenido |
| --- | --- | --- |
| [Manual de usuario](docs/Manual-de-Usuario-Vivero-El-Encanto.docx) | Personal del vivero y QA | Cómo usar el sitio y cada módulo del panel, con capturas de pantalla. |
| [Manual técnico](docs/Manual-Tecnico-Vivero-El-Encanto.docx) | Desarrollo y QA | Tecnologías, arquitectura, base de datos (diccionario de datos), estructura del código, seguridad, instalación, pruebas y despliegue. |
| [Matriz de pruebas QA](docs/Matriz-de-Pruebas-QA-Vivero-El-Encanto.xlsx) | Equipo de QA | 89 casos de prueba con pasos y resultado esperado, reporte de errores, correcciones y resumen automático. |
| [ESPECIFICACION.md](ESPECIFICACION.md) | Todos | Requisitos funcionales acordados con el cliente. |

### Para el equipo de QA

1. Instala el sistema con la guía de [Instalación en tu computadora](#instalación-en-tu-computadora) (casos INS-01 a INS-03 de la matriz).
2. Abre la [matriz de pruebas](docs/Matriz-de-Pruebas-QA-Vivero-El-Encanto.xlsx) y lee la hoja **Instrucciones**.
3. Ejecuta los casos en orden y llena solo las celdas amarillas. Registra cada falla en **Reporte de errores** con su
   evidencia (captura o video).
4. Entrega la matriz llena al equipo de desarrollo; las correcciones se documentan en la hoja **Correcciones**.

Los casos que usan Google son opcionales: requieren credenciales propias (ver
[Activar el inicio con Google](#activar-el-inicio-con-google-opcional)). Si no las configuras, márcalos como «No aplica».

## Estado

| Fase | Contenido | Estado |
| --- | --- | --- |
| 1 | Base, registro por invitación, inicio de sesión, Mi cuenta, Salir y menú del panel | Aprobada |
| 2 | Datos y redes | Aprobada |
| 3 | Catálogos, Temporadas, Plantas y Fertilizantes | Aprobada |
| 4 | Carrusel, Nosotros, Preguntas frecuentes y Testimonios | Aprobada |
| 5 | Sitio público | Aprobada |
| 6 | Inicio del panel (pendientes, accesos rápidos, mensajes y novedades) | Aprobada |
| 7 | Pulido | Terminada, en revisión (rama `fase-7-pulido`) |

## Instalación en tu computadora

Esta guía te lleva de cero hasta entrar al panel con tu cuenta. Toma unos 15 minutos. Los comandos son para
**PowerShell** (o la terminal de VS Code en Windows); donde cambian en macOS o Linux, se indica.

### Paso 1. Instala lo necesario

| Programa | Versión | Cómo revisar que ya lo tienes |
| --- | --- | --- |
| [Node.js](https://nodejs.org) | 22 o más nueva | `node -v` |
| [Git](https://git-scm.com) | cualquiera reciente | `git --version` |
| MySQL o MariaDB | MariaDB 10.11 o MySQL 8 | En Windows, con [XAMPP](https://www.apachefriends.org) basta |

**Si usas XAMPP:** abre el *XAMPP Control Panel* y presiona **Start** en la fila «MySQL». Déjalo encendido
mientras trabajas; si lo cierras, el sitio no puede leer la base de datos. XAMPP trae el usuario `root` sin
contraseña, que es lo que ya espera la plantilla de configuración.

### Paso 2. Descarga el proyecto e instala sus dependencias

```powershell
git clone https://github.com/Saul-MX/Vivero-Equipo-SI.git
cd Vivero-Equipo-SI
npm install
```

`npm install` tarda uno o dos minutos y al final prepara Prisma (la conexión con la base de datos).

> Es normal que al final aparezcan avisos de npm como «`N vulnerabilities`» o
> «`packages have install scripts not yet covered by allowScripts`». No impiden que el sitio funcione y no hace
> falta correr `npm audit fix`.

### Paso 3. Crea tu archivo de configuración (`.env`)

Copia la plantilla:

```powershell
Copy-Item .env.example .env
```

(En macOS o Linux: `cp .env.example .env`.)

Abre `.env` en tu editor y llena **dos valores obligatorios**:

1. **`CODIGO_INVITACION_INICIAL`**: inventa un código de al menos 12 letras o números, por ejemplo
   `MI-VIVERO-2026-ABC`. Con él vas a crear la primera cuenta.
   > **No dejes el valor de ejemplo** (`CAMBIA-ESTE-CODIGO-2026`): el sitio lo rechaza a propósito y verías
   > «El código no es válido» al registrarte.
2. **`BETTER_AUTH_SECRET`**: un secreto al azar para firmar las sesiones. Genera uno con este comando y pega lo que
   salga entre las comillas:
   ```powershell
   node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
   ```

Lo demás puede quedarse como viene. Solo cámbialo en estos casos:

- **Tu MySQL tiene contraseña:** agrégala en `DATABASE_URL` y en `DATABASE_URL_PRUEBA`:
  `mysql://root:TU_CONTRASEÑA@localhost:3306/vivero_encanto?connectionLimit=5`.
- **Quieres probar «Continuar con Google»:** llena `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` (ver
  [Activar el inicio con Google](#activar-el-inicio-con-google-opcional)). Si los dejas vacíos, el botón de Google
  simplemente no aparece y todo lo demás funciona igual.

> El archivo `.env` es tuyo: **nunca lo subas a Git** (ya está en `.gitignore`) ni lo compartas por chat.

### Paso 4. Crea la base de datos y carga los datos iniciales

Con MySQL encendido:

```powershell
npm run db:migrar
npm run db:semilla
```

- `db:migrar` crea la base `vivero_encanto` (si no existe) y todas sus tablas.
- `db:semilla` carga los catálogos, temporadas, colores y tamaños de maceta de inicio. Al terminar dice
  «Datos iniciales listos».

> Si ves un recuadro de Prisma que dice «This is a major update», ignóralo: solo avisa que existe una versión
> nueva. No actualices Prisma por tu cuenta.

### Paso 5. Arranca el sitio

```powershell
npm run dev
```

Cuando la terminal diga `Ready`, abre <http://localhost:3000>. La primera vez cada página tarda unos segundos en
aparecer, porque se prepara al momento; después es inmediata.

Para detener el sitio, presiona `Ctrl + C` en esa terminal. Para volver a trabajar otro día, basta con encender
MySQL y correr `npm run dev`; los pasos 2 a 4 no se repiten.

### Paso 6. Crea tu cuenta del panel

1. Abre <http://localhost:3000/panel/registro>.
2. Escribe el código que pusiste en `CODIGO_INVITACION_INICIAL`, un usuario (por ejemplo `saul`) y una contraseña
   de al menos 8 caracteres.
3. Presiona **Crear cuenta**. Entrarás al panel con el saludo «Hola, …».

Ese código **solo sirve para la primera cuenta**. Para que alguien más entre al panel, ve a **Mi cuenta → Crear
código de invitación** y compártele el código: sirve una sola vez y vence en 7 días.

### Activar el inicio con Google (opcional)

1. Entra a <https://console.cloud.google.com> con tu cuenta de Google y crea un proyecto (por ejemplo
   «Vivero El Encanto»).
2. Google te pedirá configurar la **pantalla de consentimiento** (lo que ve la gente al elegir su cuenta): elige
   tipo **Externo** y llena el nombre de la app y tu correo. Google cambia de lugar este menú seguido; si no lo
   encuentras, búscalo como «OAuth consent screen».
3. Ve a **APIs y servicios → Credenciales → Crear credenciales → ID de cliente de OAuth**, tipo
   **Aplicación web**, con:
   - **Orígenes autorizados de JavaScript:** `http://localhost:3000`
   - **URI de redireccionamiento autorizados:** `http://localhost:3000/api/auth/callback/google`
4. Copia el *ID de cliente* y el *Secreto del cliente* en `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` de tu `.env`.
5. Detén el sitio (`Ctrl + C`) y vuelve a correr `npm run dev`.

Ahora en «Entrar» y en «Crear cuenta» aparece **Continuar con Google**. Una cuenta de Google solo entra si ya está
vinculada:
- **Si ya tienes cuenta del panel:** entra con tu usuario y contraseña, y en **Mi cuenta → Vincular cuenta de
  Google** vincula tu Google.
- **Si eres nuevo:** en «Crear cuenta» escribe tu código de invitación y presiona **Continuar con Google**.

### Problemas comunes

| Lo que ves | Qué pasa y cómo se arregla |
| --- | --- |
| `P1001: Can't reach database server at localhost:3306` | MySQL está apagado. Enciéndelo en XAMPP (**Start** en «MySQL») y repite el comando. |
| `P1000: Authentication failed against database server` | El usuario o la contraseña de MySQL no coinciden: corrígelos en `DATABASE_URL` (paso 3). |
| «El código no es válido, ya se usó o ya venció» al crear la primera cuenta | Dejaste el código de ejemplo, escribiste otro distinto al de `.env`, o ya existe una cuenta. Si cambiaste `.env`, reinicia `npm run dev`. |
| No aparece «Continuar con Google» | Faltan `GOOGLE_CLIENT_ID` o `GOOGLE_CLIENT_SECRET`, o no reiniciaste `npm run dev` después de llenarlos. |
| Google dice `redirect_uri_mismatch` | La URI de redireccionamiento en Google Cloud no es exactamente `http://localhost:3000/api/auth/callback/google`. |
| `Port 3000 is in use` | Ya tienes el sitio abierto en otra terminal. Ciérralo, o usa la dirección que Next te propone. |
| «Demasiados intentos» o «Ya recibimos varios mensajes…» | Son los límites contra ataques (por ejemplo, 5 contraseñas equivocadas o 5 mensajes de Contacto por hora). Espera el tiempo que indica el aviso o, en tu computadora, corre `npm run db:limpiar-intentos`. |
| Contacto dice «¡Gracias!» pero el mensaje no llega al panel | El formulario se envió en menos de 3 segundos (protección contra programas de spam). Escribe con calma y vuelve a enviarlo. |
| En la terminal de `npm run dev` sale `⨯ Error: aborted` con `ECONNRESET` | No es un error del sitio: el navegador canceló una carga porque cambiaste de página muy rápido (pasa mucho con herramientas automáticas). Se puede ignorar. |
| La primera vez que abres una pantalla tarda unos segundos | En modo desarrollo, Next prepara cada pantalla la primera vez que se visita. Las siguientes veces carga rápido; en producción (`npm run build`) no pasa. |

## Comandos útiles

| Comando | Para qué sirve |
| --- | --- |
| `npm run dev` | Arranca el sitio en modo desarrollo (<http://localhost:3000>). |
| `npm run pruebas` | Corre todas las pruebas automáticas (usa su propia base de datos). |
| `npm run pruebas:reporte` | Abre el reporte de la última corrida de pruebas. |
| `npm run db:ver` | Abre Prisma Studio para ver y editar la base de datos en el navegador. |
| `npm run db:migrar` | Aplica cambios del modelo de datos a tu base local. |
| `npm run db:semilla` | Carga los datos iniciales (solo si la base está recién creada). |
| `npm run db:semilla:completar` | Vuelve a crear los datos iniciales que falten, sin tocar lo editado. |
| `npm run db:limpiar-intentos` | Borra los contadores de intentos (para seguir probando sin esperar los bloqueos temporales). |
| `npm run lint` / `npm run typecheck` | Revisan el estilo y los tipos del código. |
| `npm run build` y `npm run start` | Arman y arrancan el sitio como en producción. |

## Pruebas

La primera vez, descarga el navegador que usan las pruebas:

```powershell
npx playwright install chromium
```

Después, con MySQL encendido, `npm run pruebas` hace todo solo (tarda unos 5 minutos):

1. Borra y vuelve a crear la base **de pruebas** (`DATABASE_URL_PRUEBA`). Por seguridad, solo acepta una base cuyo
   nombre termine en `_prueba`, así que nunca toca tus datos reales.
2. Arma el sitio como en producción y lo abre en un navegador automático (Chromium).
3. Prueba registro, inicio de sesión (con contraseña y Google), bloqueo por intentos, cambio de contraseña,
   invitaciones, todas las pantallas del panel y del sitio, menú en computadora y celular, y accesibilidad
   (WCAG 2.1 AA).

Las pruebas no necesitan credenciales reales de Google: usan unas falsas y detienen el viaje a Google antes de
salir. Las pruebas que no usan navegador ni base de datos corren aparte y en segundos con `npm run pruebas:unidad`.

## Estructura

```
prisma/              modelo de datos (schema.prisma), migraciones y datos iniciales (seed.ts)
messages/es-MX.json  TODOS los textos de la interfaz (para traducir, se agrega en.json)
src/app/             pantallas: / (sitio público) y /panel (panel de administración)
src/components/      componentes: ui/ (shadcn), panel/, formularios/, marca/ (logotipo)
src/lib/auth/        better-auth (auth.ts), sesiones, contraseñas, invitaciones y límite de intentos
src/lib/validacion/  reglas de los formularios (las mismas en navegador y servidor)
src/proxy.ts         primera barrera: sin sesión no se entra al panel
e2e/                 pruebas automáticas (Playwright)
```

El logotipo vive en [src/components/marca/logo.tsx](src/components/marca/logo.tsx): cuando exista la imagen,
solo se cambia ese archivo.

**Sitio público:** las páginas están en [src/app/(sitio)/](src/app/(sitio)/) y leen todo con las funciones de
[src/lib/sitio/datos.ts](src/lib/sitio/datos.ts) (solo lo visible). Se guardan en caché: al guardar algo en el panel se
renuevan al momento, y lo que depende de la fecha (temporada vigente, anuncios de hoy) se recalcula cada 15 minutos.
El color de la temporada se aplica como acento; si es un tono medio difícil de leer, los botones usan una versión un
poco más oscura para cumplir el contraste (WCAG AA).

**Datos del negocio:** todo el sitio los lee con `obtenerDatosNegocio()` de
[src/lib/datos-negocio/datos.ts](src/lib/datos-negocio/datos.ts) (contacto, teléfonos ya separados, enlace de
WhatsApp listo, dirección, mapa y redes). Se guardan en caché y se renuevan al momento cuando se presiona
«Guardar datos» en el panel.

## Seguridad (resumen)

- Acceso con **better-auth**: usuario y contraseña, o «Continuar con Google» (opcional).
- Contraseñas guardadas con **argon2id**; nunca en texto.
- Sesión en una cookie `httpOnly` firmada con `BETTER_AUTH_SECRET` y guardada en la base: «Salir» la invalida
  al momento. Los tokens de Google se guardan cifrados.
- De las rutas de better-auth, desde fuera solo se puede abrir la vuelta de Google (`/api/auth/callback/google`);
  entrar, registrarse y cambiar la contraseña pasan por acciones del servidor que validan y limitan intentos.
- Google con `state` y PKCE. Una cuenta de Google nunca crea cuenta ni se une sola a una existente: para
  registrarse con Google hace falta un código de invitación, y una cuenta existente la vincula desde «Mi cuenta».
- Cada pantalla y cada acción del panel revisan la sesión en el servidor.
- Registro solo con código de invitación de un solo uso que vence en 7 días.
- Bloqueo temporal tras 5 contraseñas equivocadas (15 minutos) y tras 10 códigos equivocados por hora.
- Al cambiar la contraseña se cierran las sesiones de otros aparatos.
- Del código del mapa de Google solo se guarda la dirección (`src`), y solo si es un mapa de Google con https;
  los enlaces de Maps, Facebook e Instagram se validan contra sus dominios.
- Secretos solo en variables de entorno (`.env` nunca se sube a Git).
- Archivos subidos: se revisa su contenido real (no su nombre). Fotos JPG, PNG o WebP (y GIF en el carrusel)
  de hasta 15 MB, convertidas a WebP y sin datos de ubicación; videos MP4 o WebM de hasta 40 MB.
- Todos los textos del panel se limpian antes de guardarse (sin HTML ni caracteres invisibles).
- Los botones del carrusel solo aceptan páginas del sitio, `whatsapp` o direcciones `https://`.
- Los formularios (incluidos Contacto e inicio de sesión) aceptan como máximo 2 MB. Las fotos y videos se suben
  por `/panel/subir`, que revisa la sesión y el tamaño antes de leer el archivo.
- En producción se envían las cabeceras HSTS (siempre https) y CSP (el sitio solo carga cosas de su propio dominio,
  más el mapa de Google).
- Formulario de Contacto: campo trampa, tiempo mínimo de llenado y máximo 5 mensajes por hora por conexión.

## Despliegue en Hostinger (resumen)

Hostinger arma las apps de Next.js en modo servidor («standalone») y las arranca por su cuenta. Pasos previstos:

1. **Base de datos:** en hPanel → *Bases de datos → MySQL*, crea una base y un usuario. Anota nombre, usuario,
   contraseña y servidor.
2. **Código:** sube este repositorio a GitHub (privado). Hostinger lo vuelve a desplegar en cada `push`.
3. **App Node.js:** en hPanel → *Sitios web → Agregar → Node.js*, conecta el repositorio y elige:
   - Node.js **22**.
   - Script de compilación: **`build:hostinger`**. Antes de armar el sitio aplica las migraciones pendientes
     (no borra datos) y carga los datos iniciales solo la primera vez.
4. **Variables de entorno** (en la misma pantalla):
   - `DATABASE_URL` = `mysql://USUARIO:CONTRASEÑA@SERVIDOR:3306/BASE?connectionLimit=5`
   - `CODIGO_INVITACION_INICIAL` = un código nuevo y largo (no el de tu computadora).
   - `BETTER_AUTH_SECRET` = un secreto nuevo de al menos 32 caracteres al azar (no el de tu computadora).
   - `PROXIES_DE_CONFIANZA` = `1` (el proxy de Hostinger). Súbelo a `2` si pones un CDN delante. Sirve para
     saber la IP real de cada visita en los límites de intentos.
   - `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` (opcional), con `https://tu-dominio/api/auth/callback/google`
     registrada en Google Cloud como URI de redireccionamiento.
   - `SITIO_URL` = la dirección de tu dominio, por ejemplo `https://www.example.com` (para compartir enlaces
     y para el mapa del sitio que leen los buscadores).
5. **Dominio y HTTPS:** conecta el dominio y activa el certificado SSL en hPanel.
6. Entra a `https://tu-dominio/panel/registro` y crea la primera cuenta.

> **Importante para las fotos:** en cada despliegue Hostinger crea una carpeta nueva y descarta los archivos
> guardados dentro de la anterior. Por eso las fotos y folletos subidos desde el panel se guardan en una carpeta
> **fuera** del proyecto. Agrega la variable `UPLOADS_DIR` con la ruta completa de esa carpeta (por ejemplo
> `/home/TU_USUARIO/archivos-vivero`) y créala una sola vez desde el administrador de archivos de hPanel.
