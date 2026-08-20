# Frontend Angular para Producto API — Diseño

**Fecha:** 2026-08-19
**Estado:** Aprobado por el usuario, pendiente de implementación

## Contexto

`producto-api` es un backend Spring Boot 3 + JPA + PostgreSQL con CRUD de
productos (`/api/productos`), documentado en el análisis previo de este
proyecto. No tiene frontend. El objetivo es construir un frontend Angular
con Angular Material, publicarlo en Netlify, y desplegar el backend en
Render para que el sitio funcione en producción para cualquier visitante
(no solo localhost).

## Objetivo

Un frontend Angular pulido (dark mode moderno, Angular Material) que
consuma el CRUD existente de `producto-api`, desplegado en Netlify con el
backend en Render, listo para la entrega del curso.

## Fuera de alcance

- Autenticación/autorización (el backend no la tiene; no se agrega en
  esta iteración).
- Dashboard con gráficas o estadísticas (se descartó a favor de "CRUD
  pulido + búsqueda/filtro").
- Gestión de estado con NgRx (no se justifica para este alcance; se usa
  `signals`).
- Paginación server-side (la lista de productos es pequeña; se filtra
  client-side sobre lo ya cargado).

## Estructura del repositorio (monorepo)

```
producto-api/                       (raíz, ya existe)
├── src/main/java/...                (backend, sin cambios salvo CORS)
├── frontend/                        (proyecto Angular nuevo)
│   ├── src/app/
│   │   ├── core/
│   │   │   ├── models/producto.model.ts
│   │   │   ├── services/producto.service.ts
│   │   │   └── interceptors/error.interceptor.ts
│   │   ├── features/productos/
│   │   │   ├── producto-list/
│   │   │   │   ├── producto-list.component.ts
│   │   │   │   ├── producto-list.component.html
│   │   │   │   └── producto-list.component.scss
│   │   │   └── producto-form/
│   │   │       ├── producto-form.component.ts
│   │   │       ├── producto-form.component.html
│   │   │       └── producto-form.component.scss
│   │   ├── shared/
│   │   │   └── confirm-dialog/confirm-dialog.component.ts
│   │   ├── app.routes.ts
│   │   ├── app.component.ts        (shell: toolbar + router-outlet)
│   │   └── app.config.ts
│   ├── src/environments/
│   │   ├── environment.ts          (apiUrl: http://localhost:8080/api)
│   │   └── environment.prod.ts     (apiUrl: <URL de Render>/api)
│   ├── public/_redirects           ("/* /index.html 200")
│   ├── netlify.toml
│   ├── angular.json / package.json / tsconfig*.json (generados por Angular CLI)
├── docs/superpowers/specs/          (esta spec)
├── README.md                        (se actualiza con instrucciones del frontend)
```

## Arquitectura Angular

- **Angular CLI más reciente**, standalone components (sin NgModules).
- **Signals** para estado local (`productos = signal<Producto[]>([])`,
  `loading = signal(false)`) — sin librería de estado externa.
- **Angular Material**: `mat-toolbar`, `mat-table` + `matSort`,
  `mat-form-field`, `mat-dialog`, `mat-snack-bar`, `mat-button`,
  `mat-icon`, con un tema M3 custom (dark, acento cian) — ver
  "Diseño UI/UX" abajo para la paleta y tokens completos.
- **`@angular/animations`**: para la transición de página y el
  filtrado animado de filas de la tabla (ver "Diseño UI/UX").
- **Angular Router**, 3 rutas:
  - `/productos` → `ProductoListComponent`
  - `/productos/nuevo` → `ProductoFormComponent` (modo crear)
  - `/productos/:id/editar` → `ProductoFormComponent` (modo editar)
  - Redirect por defecto de `''` a `/productos`.
- **`ProductoService`** (`core/services`): inyecta `HttpClient`, expone
  signals de estado y métodos `listar()`, `buscarPorId(id)`, `crear(dto)`,
  `actualizar(id, dto)`, `eliminar(id)` que llaman a los 5 endpoints REST
  existentes del backend, usando `environment.apiUrl`.
- **`ErrorInterceptor`** (`core/interceptors`): captura errores HTTP,
  lee el cuerpo `ErrorResponse` del `GlobalExceptionHandler`
  (`{timestamp, status, error, message, path, detalles}`) y dispara un
  `MatSnackBar` con `message` (o el primer elemento de `detalles` si
  existe). Así los mensajes de validación del backend
  (`@NotBlank`, `@DecimalMin`, etc.) llegan tal cual al usuario.
- **Modelos** (`core/models/producto.model.ts`): `Producto`,
  `ProductoRequest` — reflejan `ProductoResponseDTO` / `ProductoRequestDTO`
  del backend.

## Diseño UI/UX

Angular Material sigue siendo la base **funcional** (`mat-table`,
`mat-dialog`, `mat-form-field`/Reactive Forms, `mat-snack-bar` como
mecanismo de notificación) — no se reescriben esos componentes. La
identidad visual se logra con una capa de tokens de diseño (colores,
tipografía, glassmorphism) por encima: un tema Material custom (M3,
dark) más una hoja de estilos globales de tokens, consumidos por CSS
custom properties en todos los componentes.

### Sistema de diseño (tokens)

`frontend/src/styles/_tokens.scss` es la fuente única de verdad,
importada por `styles.scss` y por cada componente vía `@use`:

- **Color:**
  - Fondo base: `#0a0b0f` (casi negro, tinte frío).
  - Superficie glass: `rgba(255, 255, 255, 0.04)` de fondo +
    `backdrop-filter: blur(16px)` + borde `1px solid rgba(255, 255, 255, 0.08)`.
  - Acento de marca: cian eléctrico, escala `--accent-500: #22d3ee`
    (base), `--accent-600: #06b6d4` (hover/active), `--accent-300: #67e8f9`
    (texto sobre superficies oscuras, focus ring). Usado consistentemente
    en: botones primarios, focus rings (`outline: 2px solid var(--accent-500)`),
    bordes de stat cards al hover, estado de éxito en toasts, ícono de
    check al guardar.
  - Texto: `#e4e6eb` (primario), `#8a8f98` (secundario/placeholder).
  - Error: `#f87171` (rojo, reservado a validación/errores — nunca se
    usa el acento cian para error).
- **Tipografía:** `Space Grotesk` (display: títulos, números de las
  stat cards) + `Inter` (cuerpo, labels, tabla), ambas vía
  `@import` de Google Fonts en `styles.scss` (`family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600`).
  Nunca Roboto (default de Material).
- **Espaciado/radios:** escala de espaciado en múltiplos de 4px
  (8/12/16/24/32/48), radios de borde 12–16px en cards/dialogs,
  8px en inputs/botones pequeños.
- **Sombras/transiciones:** sombra sutil `0 8px 24px rgba(0,0,0,0.35)`
  en cards; transiciones de 150–200ms (`ease-out`) en hovers, aperturas
  de diálogo, y la transición de página descrita abajo.

### Vista de lista (`/productos`)

- `mat-toolbar` con superficie glass (no el color sólido default):
  título "Producto API" en Space Grotesk, campo de búsqueda con ícono
  de lupa (filtro client-side en vivo sobre `nombre`, ver animación de
  filtrado abajo), botón primario "+ Nuevo producto" en acento cian.
- **Dashboard de estadísticas** (arriba de la tabla, 3 `StatCardComponent`
  en fila): "Total de productos" (`productos().length`), "Valor total
  del inventario" (suma de `precio` formateada como moneda), "Precio
  promedio" (promedio formateado como moneda). Los 3 valores se
  recalculan como `computed()` sobre `productoService.productos()` — no
  hay llamada nueva al backend.
  - Cada card: superficie glass, número grande en Space Grotesk que
    hace count-up (anima de 0 al valor final en ~800ms cuando cambian
    los datos, con easing) en vez de aparecer estático.
  - Tilt 3D al mover el mouse sobre la card (`mousemove` calcula el
    offset del cursor respecto al centro de la card y aplica
    `transform: perspective(600px) rotateX(...) rotateY(...)`,
    `mouseleave` resetea a `rotateX(0) rotateY(0)` con transición suave).
  - La card de "Total de productos" incluye una barra de progreso
    decorativa (ancho proporcional, sin unidad de comparación real —
    puramente decorativa, no es una métrica engañosa).
- `mat-table` con columnas: ID, Nombre, Descripción (truncada con
  ellipsis + `matTooltip` con el texto completo), Precio (formateado
  como moneda con `CurrencyPipe`), Acciones (íconos editar/eliminar).
- `matSort` habilitado en Nombre y Precio.
- **Micro-interacciones de la tabla:**
  - Hover en fila: elevación sutil (`box-shadow` + `background` más
    claro) y la celda de Acciones pasa de `opacity: 0` a `opacity: 1`
    con `transform: translateX(4px) → 0` (fade + slide, ~150ms) — los
    íconos de editar/eliminar no están siempre visibles.
  - Filtrado por búsqueda: las filas que salen del resultado animan
    `opacity`/`max-height` a 0 antes de desaparecer (transición
    ~150-200ms vía Angular `@for` + `animate.enter`/`animate.leave` o
    un `[@filterAnim]` trigger de `@angular/animations`), no aparecen/
    desaparecen de golpe.
- Loading: skeleton rows con shimmer real (`background: linear-gradient`
  animado con `@keyframes`, ya especificado en la implementación base
  — se mantiene, es el mismo mecanismo, ahora usando los tokens de
  color glass en vez de grises genéricos).
- **Estado vacío:** `EmptyStateComponent` compartido — ilustración SVG
  simple e inline (una caja/inventario en trazos, en `currentColor` con
  el acento cian, no un ícono gris de Material), texto con tono cercano
  ("Aún no hay productos por aquí — creemos el primero"), botón CTA.
  Mismo componente reutilizable si en el futuro se necesita un estado
  vacío en otra vista.
- Eliminar: abre `ConfirmDialogComponent` (`mat-dialog`, restyleado con
  superficie glass y botón destructivo en rojo de error, no el `warn`
  default de Material) con el nombre del producto antes de llamar a
  `eliminar()`. Nunca se borra sin confirmación explícita.

### Vista de formulario (`/productos/nuevo` y `/productos/:id/editar`)

- Card centrada con superficie glass, `ReactiveFormsModule`.
- Validadores en el form que espejan los del backend: `nombre`
  (`required`, `maxLength: 120`), `descripcion` (`maxLength: 500`),
  `precio` (`required`, `min: 0`).
- Mensajes de error bajo cada campo, mismo texto que los `message` del
  DTO de backend donde aplique.
- Campo precio con formato de moneda.
- Botón "Guardar": deshabilitado si el form es inválido. Mientras la
  petición está en curso, el ícono dentro del botón se transforma (no
  solo `disabled` + spinner genérico): pasa de un ícono neutro a un
  spinner de progreso, y al completarse con éxito muestra brevemente un
  ícono de check animado (~400ms, scale-in) antes de navegar — refuerza
  que la acción se completó, no solo que dejó de estar "loading".
- Al guardar con éxito: toast de confirmación (ver "Toasts" abajo) +
  navegación a `/productos`.
- En modo editar, el componente carga el producto vía
  `buscarPorId(id)` en `ngOnInit` y prellena el form.

### Toasts (éxito/error)

Se reemplaza el `MatSnackBar` gris default por un `panelClass` custom
(`app-toast`, `app-toast--success`, `app-toast--error`) aplicado en
`MatSnackBarConfig`: superficie glass, borde de 1px en el color
correspondiente (cian para éxito, rojo de error para error), mismo
radio/tipografía que el resto del sistema. Sigue siendo `MatSnackBar`
por debajo (no se reemplaza el mecanismo, solo su piel visual) — tanto
el toast de éxito del formulario como los del `ErrorInterceptor` usan
el mismo `panelClass`.

### Transición de página

`AppComponent` anima el `router-outlet` con un fade+slide de 200ms al
cambiar de ruta (`@angular/animations`, trigger en el contenedor del
outlet: `opacity 0→1` + `transform: translateY(8px)→0`), en vez de un
salto brusco entre `/productos` y el formulario.

## Cambios en el backend

**Único cambio de código:** agregar configuración CORS, porque hoy no
existe ninguna y el navegador bloqueará las llamadas cross-origin desde
Netlify hacia Render.

- Nueva clase `WebConfig implements WebMvcConfigurer` (o un
  `CorsConfigurationSource` bean) en un paquete `config/` nuevo.
- Origen permitido leído de variable de entorno `ALLOWED_ORIGIN`, con
  default `http://localhost:4200` para desarrollo local del frontend.
- Aplica solo a `/api/**`, métodos `GET, POST, PUT, DELETE, OPTIONS`.

**Fixes de seguridad incluidos en el mismo cambio** (encontrados por un
review automático sobre el commit inicial del backend):

- `application.properties`: se elimina el default débil de
  `DB_PASSWORD` (`123`). La variable de entorno pasa a ser obligatoria
  en local (sin default), documentado en el README.
- `GlobalExceptionHandler.handleGenericException`: deja de devolver
  `ex.getMessage()` en el cuerpo de la respuesta 500 (puede filtrar
  detalles internos). Se loguea el detalle completo server-side
  (`log.error(...)`) y se devuelve un mensaje genérico fijo al cliente
  ("Ha ocurrido un error interno. Intenta más tarde.").

No se modifica ninguna otra parte del backend (controller, service,
repository, DTOs, resto del exception handling quedan igual).

## Despliegue

### Backend → Render (plan free)

1. Web Service nuevo apuntando al repo de GitHub, build nativo Java
   (Maven), root directory = raíz del repo (donde está `pom.xml`).
2. Base de datos: Postgres free de Render.
3. Variables de entorno en Render: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`
   (las que genera el add-on de Postgres), `ALLOWED_ORIGIN=https://<sitio>.netlify.app`.
4. **Trade-off conocido:** el plan free de Render duerme el servicio
   tras ~15 min de inactividad; el primer request tras eso tarda
   30–50s (cold start). El frontend debe mostrar un loading state claro
   en ese caso, no un mensaje de error.

### Frontend → Netlify

1. Conectar el repo de GitHub (el mismo monorepo), **base directory:
   `frontend/`**, build command `ng build`, publish directory
   `dist/frontend/browser` (estructura de output de Angular CLI
   reciente).
2. `environment.prod.ts` con `apiUrl` apuntando a la URL pública del
   backend en Render.
3. `public/_redirects` con `/* /index.html 200` para que las rutas de
   Angular Router funcionen en recarga directa/deep-link.
4. Deploy continuo: cada push a `main` dispara redeploy automático en
   Netlify.

### Repositorio / Git

- Ya inicializado (`git init` + commit inicial del backend existente
  hecho como parte de este trabajo).
- Se creará el repositorio remoto en GitHub (vía `gh repo create`) y se
  hará push de `main`.

## Testing

- **Frontend:** pruebas unitarias de `ProductoService` con
  `HttpClientTestingModule` (verifican las 5 llamadas y el manejo de
  error), y pruebas de `ProductoListComponent` /
  `ProductoFormComponent` con `TestBed` (renderizado, validación de
  form, interacción básica). Cobertura razonable, sin sobre-invertir.
  `StatCardComponent` se prueba en su valor de count-up final (sin
  depender del timing exacto de la animación) y en que el `mousemove`
  produce un `transform` con `rotate`; `EmptyStateComponent` se prueba
  en que renderiza el mensaje y el CTA.
- **Backend:** no se agregan tests nuevos en esta iteración (fuera de
  alcance; ya se identificó como deuda en el análisis previo del
  proyecto).

## Riesgos / consideraciones

- Cold start de Render (ver arriba) — mitigado con loading state.
- CORS mal configurado es la causa más común de que "no cargue nada" en
  producción — se documentará claramente en el README cómo verificarlo.
- Si el usuario no tiene `gh` autenticado, la creación del repo en
  GitHub requerirá autenticación interactiva antes de continuar.
