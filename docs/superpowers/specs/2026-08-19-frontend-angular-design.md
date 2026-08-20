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
  `mat-icon`.
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

### Vista de lista (`/productos`)

- `mat-toolbar` fija: título "Producto API", campo de búsqueda con ícono
  de lupa (filtro client-side en vivo sobre `nombre`), botón primario
  "+ Nuevo producto".
- `mat-table` con columnas: ID, Nombre, Descripción (truncada con
  ellipsis + `matTooltip` con el texto completo), Precio (formateado
  como moneda con `CurrencyPipe`), Acciones (íconos editar/eliminar).
- `matSort` habilitado en Nombre y Precio.
- Hover sutil en filas.
- Estado vacío: mensaje "Aún no hay productos" + botón para crear el
  primero, cuando la lista está vacía y no está cargando.
- Loading: skeleton rows (no spinner de página completa).
- Eliminar: abre `ConfirmDialogComponent` (`mat-dialog`) con el nombre
  del producto antes de llamar a `eliminar()`. Nunca se borra sin
  confirmación explícita.

### Vista de formulario (`/productos/nuevo` y `/productos/:id/editar`)

- Card centrada, `ReactiveFormsModule`.
- Validadores en el form que espejan los del backend: `nombre`
  (`required`, `maxLength: 120`), `descripcion` (`maxLength: 500`),
  `precio` (`required`, `min: 0`).
- Mensajes de error bajo cada campo, mismo texto que los `message` del
  DTO de backend donde aplique.
- Campo precio con formato de moneda.
- Botón "Guardar" deshabilitado si el form es inválido; muestra spinner
  mientras la petición está en curso.
- Al guardar con éxito: `MatSnackBar` de confirmación + navegación a
  `/productos`.
- En modo editar, el componente carga el producto vía
  `buscarPorId(id)` en `ngOnInit` y prellena el form.

### Estilo visual (dark mode moderno)

- Fondo base `#0f1115`, superficie de cards/tabla `#1c2028`.
- Acento primario: violeta o esmeralda (se decide una paleta concreta
  de 2-3 opciones durante la implementación, validando contraste WCAG
  AA).
- Tipografía: Inter o Roboto.
- Radios de borde 8–12px, sombras suaves en cards y dialogs,
  transiciones de 150–200ms en hovers y apertura de diálogos.
- Tema Angular Material custom (M3) en dark mode, no el tema claro por
  defecto.

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
- **Backend:** no se agregan tests nuevos en esta iteración (fuera de
  alcance; ya se identificó como deuda en el análisis previo del
  proyecto).

## Riesgos / consideraciones

- Cold start de Render (ver arriba) — mitigado con loading state.
- CORS mal configurado es la causa más común de que "no cargue nada" en
  producción — se documentará claramente en el README cómo verificarlo.
- Si el usuario no tiene `gh` autenticado, la creación del repo en
  GitHub requerirá autenticación interactiva antes de continuar.
