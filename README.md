# Vivero El Encanto — sitio web y panel

Sitio público (escaparate, sin precios) y panel de administración de **Vivero El Encanto**, en Atlixco, Puebla.
La especificación completa está en [ESPECIFICACION.md](ESPECIFICACION.md).

**Tecnología:** Next.js 16 (App Router) con TypeScript, Tailwind CSS y shadcn/ui, MySQL/MariaDB con Prisma 7,
sesiones propias con argon2, React Hook Form + Zod, next-intl (español de México, listo para inglés) y Playwright
para las pruebas.

## Estado

| Fase | Contenido | Estado |
| --- | --- | --- |
| 1 | Base, registro por invitación, inicio de sesión, Mi cuenta, Salir y menú del panel | Aprobada |
| 2 | Datos y redes | Aprobada |
| 3 | Catálogos, Temporadas, Plantas y Fertilizantes | Aprobada |
| 4 | Carrusel, Nosotros, Preguntas frecuentes y Testimonios | Aprobada |
| 5 | Sitio público | Aprobada |
| 6 | Inicio del panel (pendientes, accesos rápidos, mensajes y novedades) | Terminada, en revisión (rama `fase-6-inicio`) |
| 7 | Pulido | Pendiente |

## Requisitos

- **Node.js 22 o más nuevo** (`node -v` en la terminal).
- **MySQL o MariaDB.** En Windows sirve XAMPP: abre el *XAMPP Control Panel* y presiona **Start** en «MySQL».
- **Git.**

## Ponerlo a funcionar por primera vez

Todos los comandos se escriben en una terminal (PowerShell o la terminal de VS Code) dentro de la carpeta del proyecto.

1. Instala las dependencias:
   ```powershell
   npm install
   ```
2. Crea tu archivo de configuración copiando la plantilla:
   ```powershell
   Copy-Item .env.example .env
   ```
   Abre `.env` y cambia `CODIGO_INVITACION_INICIAL` por un código tuyo (mínimo 12 letras o números).
   Si tu MySQL tiene contraseña, agrégala en `DATABASE_URL` (`mysql://root:TU_CONTRASEÑA@localhost:3306/...`).
3. Crea la base de datos y sus tablas, y carga los datos iniciales:
   ```powershell
   npm run db:migrar
   npm run db:semilla
   ```
4. Arranca el sitio:
   ```powershell
   npm run dev
   ```
5. Abre <http://localhost:3000/panel/registro> y crea la primera cuenta con el código de `CODIGO_INVITACION_INICIAL`.
   Ese código **solo funciona mientras no exista ninguna cuenta**. Para invitar a más personas, entra a
   **Mi cuenta → Invitar a otra persona**.

Para detener el sitio, presiona `Ctrl + C` en la terminal.

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
| `npm run lint` / `npm run typecheck` | Revisan el estilo y los tipos del código. |
| `npm run build` y `npm run start` | Arman y arrancan el sitio como en producción. |

## Pruebas

`npm run pruebas` hace todo solo:

1. Borra y vuelve a crear la base **de pruebas** (`DATABASE_URL_PRUEBA`). Por seguridad, solo acepta una base cuyo
   nombre termine en `_prueba`, así que nunca toca tus datos reales.
2. Arma el sitio como en producción y lo abre en un navegador automático (Chromium).
3. Prueba registro, inicio de sesión, bloqueo por intentos, cambio de contraseña, invitaciones, menú en computadora
   y celular, y accesibilidad (WCAG 2.1 AA).

La primera vez descarga el navegador de pruebas con `npx playwright install chromium`.

## Estructura

```
prisma/              modelo de datos (schema.prisma), migraciones y datos iniciales (seed.ts)
messages/es-MX.json  TODOS los textos de la interfaz (para traducir, se agrega en.json)
src/app/             pantallas: / (sitio público) y /panel (panel de administración)
src/components/      componentes: ui/ (shadcn), panel/, formularios/, marca/ (logotipo)
src/lib/auth/        sesiones, contraseñas, invitaciones y límite de intentos
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

- Contraseñas guardadas con **argon2id**; nunca en texto.
- Sesión en una cookie `httpOnly` con un token aleatorio; en la base solo se guarda su hash. «Salir» la invalida.
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
   - `SITIO_URL` = la dirección de tu dominio, por ejemplo `https://viveroelencanto.com` (para compartir enlaces
     y para el mapa del sitio que leen los buscadores).
5. **Dominio y HTTPS:** conecta el dominio y activa el certificado SSL en hPanel.
6. Entra a `https://tu-dominio/panel/registro` y crea la primera cuenta.

> **Importante para las fotos:** en cada despliegue Hostinger crea una carpeta nueva y descarta los archivos
> guardados dentro de la anterior. Por eso las fotos y folletos subidos desde el panel se guardan en una carpeta
> **fuera** del proyecto. Agrega la variable `UPLOADS_DIR` con la ruta completa de esa carpeta (por ejemplo
> `/home/TU_USUARIO/archivos-vivero`) y créala una sola vez desde el administrador de archivos de hPanel.
