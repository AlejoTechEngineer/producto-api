# Frontend Angular + Despliegue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir un frontend Angular (Material, dark mode, standalone components + signals) que consuma el CRUD existente de `producto-api`, endurecer dos puntos de seguridad del backend, y dejar todo listo para desplegar en Netlify (frontend) + Render (backend).

**Architecture:** Monorepo. `frontend/` es un proyecto Angular CLI nuevo con arquitectura `core` (servicios/interceptores/modelos compartidos) + `features/productos` (lista y formulario) + `shared` (diálogo de confirmación reutilizable). El backend gana un `WebConfig` para CORS y dos fixes puntuales en `application.properties` y `GlobalExceptionHandler`. Archivos de despliegue (`netlify.toml`, `public/_redirects`, `render.yaml`) quedan versionados para que el deploy sea repetible.

**Tech Stack:** Angular (CLI más reciente, standalone components, signals, Angular Material, Reactive Forms, Router), Spring Boot 3.3.4 / Java 17 (backend existente), Jasmine/Karma para tests de frontend, JUnit 5 + MockMvc para tests de backend, GitHub (`gh` CLI), Netlify, Render.

**Spec:** `docs/superpowers/specs/2026-08-19-frontend-angular-design.md`

## Global Constraints

- Backend: no se toca nada fuera de CORS + los 2 fixes de seguridad (controller, service, repository, DTOs quedan igual).
- Frontend: standalone components únicamente (sin NgModules), estado con `signals` (sin NgRx), Angular Material para todos los componentes de UI.
- Solo dark mode (sin toggle claro/oscuro).
- Filtro de búsqueda es client-side sobre los productos ya cargados (sin paginación server-side).
- Netlify: base directory `frontend/`, publish directory `dist/frontend/browser`.
- Render: plan free, build con Maven nativo (sin Docker).
- Estructura de rutas: `/productos`, `/productos/nuevo`, `/productos/:id/editar`.

---

## Task 1: Backend — Configuración CORS

**Files:**
- Create: `src/main/java/com/eafit/productoapi/config/WebConfig.java`
- Modify: `src/main/resources/application.properties`
- Test: `src/test/java/com/eafit/productoapi/config/WebConfigTest.java`

**Interfaces:**
- Consumes: nada nuevo (usa `ProductoController`/`ProductoService` existentes para el contexto de `@WebMvcTest`).
- Produces: mapeo CORS activo en `/api/**`, configurable vía la property `allowed.origin` (env var `ALLOWED_ORIGIN`).

- [ ] **Step 1: Escribir el test que falla**

Crear `src/test/java/com/eafit/productoapi/config/WebConfigTest.java`:

```java
package com.eafit.productoapi.config;

import com.eafit.productoapi.controller.ProductoController;
import com.eafit.productoapi.service.ProductoService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ProductoController.class)
@TestPropertySource(properties = "allowed.origin=https://ejemplo-frontend.netlify.app")
class WebConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ProductoService productoService;

    @Test
    void permiteOrigenConfiguradoEnPreflight() throws Exception {
        mockMvc.perform(options("/api/productos")
                        .header(HttpHeaders.ORIGIN, "https://ejemplo-frontend.netlify.app")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, HttpMethod.GET.name()))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN,
                        "https://ejemplo-frontend.netlify.app"));
    }
}
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `mvn -q test -Dtest=WebConfigTest`
Expected: FAIL (no hay `Access-Control-Allow-Origin` en la respuesta; sin CORS configurado, Spring devuelve 403 en el preflight o el header no aparece).

- [ ] **Step 3: Implementar `WebConfig`**

Crear `src/main/java/com/eafit/productoapi/config/WebConfig.java`:

```java
package com.eafit.productoapi.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${allowed.origin:http://localhost:4200}")
    private String allowedOrigin;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(allowedOrigin)
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*");
    }
}
```

En `src/main/resources/application.properties`, agregar (junto a las demás propiedades de configuración general):

```properties
# ==========================================================
# CORS: origen permitido para el frontend (Netlify en produccion,
# localhost:4200 por defecto en desarrollo).
# ==========================================================
allowed.origin=${ALLOWED_ORIGIN:http://localhost:4200}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `mvn -q test -Dtest=WebConfigTest`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/main/java/com/eafit/productoapi/config/WebConfig.java src/main/resources/application.properties src/test/java/com/eafit/productoapi/config/WebConfigTest.java
git commit -m "feat(backend): agrega configuracion CORS para el frontend"
```

---

## Task 2: Backend — Endurecimiento de seguridad

**Files:**
- Modify: `src/main/resources/application.properties`
- Modify: `src/main/java/com/eafit/productoapi/exception/GlobalExceptionHandler.java`
- Test: `src/test/java/com/eafit/productoapi/exception/GlobalExceptionHandlerTest.java`

**Interfaces:**
- Consumes: `ProductoController`, `ProductoService` (mockeado).
- Produces: el body de un error 500 ya no expone `ex.getMessage()`; siempre es el string fijo `"Ha ocurrido un error interno. Intenta mas tarde."`. `DB_PASSWORD` deja de tener default.

- [ ] **Step 1: Escribir el test que falla**

Crear `src/test/java/com/eafit/productoapi/exception/GlobalExceptionHandlerTest.java`:

```java
package com.eafit.productoapi.exception;

import com.eafit.productoapi.controller.ProductoController;
import com.eafit.productoapi.service.ProductoService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ProductoController.class)
class GlobalExceptionHandlerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ProductoService productoService;

    @Test
    void ocultaElDetalleInternoEnError500() throws Exception {
        when(productoService.listarTodos())
                .thenThrow(new RuntimeException("Detalle interno sensible: NPE en columna X"));

        mockMvc.perform(get("/api/productos"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value("Ha ocurrido un error interno. Intenta mas tarde."))
                .andExpect(jsonPath("$.message").value(not(containsString("Detalle interno sensible"))));
    }
}
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `mvn -q test -Dtest=GlobalExceptionHandlerTest`
Expected: FAIL (`$.message` actual es `"Detalle interno sensible: NPE en columna X"`).

- [ ] **Step 3: Sanitizar el handler y quitar el password default**

En `src/main/java/com/eafit/productoapi/exception/GlobalExceptionHandler.java`, agregar el logger e importar `Logger`/`LoggerFactory`, y reemplazar `handleGenericException`:

```java
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
```

```java
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // 500 - Cualquier otro error no controlado explicitamente
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(
            Exception ex, HttpServletRequest request) {

        log.error("Error no controlado en {}: {}", request.getRequestURI(), ex.getMessage(), ex);

        ErrorResponse error = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .error("Error interno del servidor")
                .message("Ha ocurrido un error interno. Intenta mas tarde.")
                .path(request.getRequestURI())
                .build();

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
```

En `src/main/resources/application.properties`, cambiar la línea del password para que no tenga default:

```properties
spring.datasource.password=${DB_PASSWORD}
```

(antes era `spring.datasource.password=${DB_PASSWORD:123}`).

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `mvn -q test -Dtest=GlobalExceptionHandlerTest`
Expected: PASS

- [ ] **Step 5: Correr toda la suite de backend**

Run: `mvn -q test`
Expected: PASS (incluye `WebConfigTest`, `GlobalExceptionHandlerTest`, `ProductoApiApplicationTests`).

- [ ] **Step 6: Commit**

```bash
git add src/main/java/com/eafit/productoapi/exception/GlobalExceptionHandler.java src/main/resources/application.properties src/test/java/com/eafit/productoapi/exception/GlobalExceptionHandlerTest.java
git commit -m "fix(backend): oculta detalle interno en error 500 y quita password default"
```

---

## Task 3: Crear repositorio remoto en GitHub y push

**Files:** ninguno (solo operaciones de git/gh).

**Interfaces:**
- Consumes: repo local `main` con los commits de Tasks 1-2 (y el commit inicial + spec ya existentes).
- Produces: remoto `origin` en GitHub con el mismo historial, usado luego por Netlify/Render para deploy continuo.

- [ ] **Step 1: Verificar que no hay remoto todavía**

Run: `git remote -v`
Expected: sin salida (no hay remotos configurados).

- [ ] **Step 2: Crear el repo en GitHub y hacer push**

```bash
gh repo create producto-api --public --source=. --remote=origin --push
```

Expected: crea `https://github.com/<usuario>/producto-api`, agrega el remoto `origin`, y sube `main`.

- [ ] **Step 3: Verificar**

Run: `git remote -v` y `gh repo view --web=false`
Expected: `origin` apunta al repo recién creado; `gh repo view` muestra el repo con el commit history correcto.

(No hay "commit" en esta tarea — no se modifica código.)

---

## Task 4: Frontend — Scaffold del proyecto Angular

**Files:**
- Create: `frontend/` (proyecto Angular CLI completo)

**Interfaces:**
- Consumes: nada (primera tarea de frontend).
- Produces: proyecto Angular ejecutable (`ng serve`, `ng test`, `ng build`) con Angular Material y estructura de environments lista, que las Tasks 5-11 modifican.

- [ ] **Step 1: Generar el proyecto**

Desde la raíz del repo:

```bash
npx -y @angular/cli@latest new frontend --routing --style=scss --skip-git --ssr=false --package-manager=npm
```

Expected: se crea `frontend/` con un proyecto Angular standalone (sin NgModules), `app.routes.ts` vacío, `app.config.ts` con `provideRouter(routes)`.

- [ ] **Step 2: Generar la estructura de environments**

```bash
cd frontend
npx ng generate environments
```

Expected: crea `src/environments/environment.ts` (usado en build de producción) y `src/environments/environment.development.ts` (usado por `ng serve`), y agrega el `fileReplacements` correspondiente en `angular.json` bajo la configuración `development`.

- [ ] **Step 3: Agregar Angular Material**

```bash
npx ng add @angular/material --theme=custom --typography=true --animations=enabled --skip-confirmation
```

Expected: agrega las dependencias de `@angular/material`/`@angular/cdk`, genera un archivo de tema custom, y agrega providers de animaciones a `app.config.ts`.

- [ ] **Step 4: Verificar que compila y los tests por defecto pasan**

```bash
npx ng build
npx ng test --watch=false --browsers=ChromeHeadless
```

Expected: build exitoso; los specs por defecto generados por el CLI pasan (se ajustarán en la Task 8 cuando se reemplace `AppComponent`).

- [ ] **Step 5: Commit**

```bash
cd ..
git add frontend
git commit -m "chore(frontend): scaffold del proyecto Angular con Material"
```

---

## Task 5: Frontend — Modelo de Producto y configuración de environments

**Files:**
- Create: `frontend/src/app/core/models/producto.model.ts`
- Modify: `frontend/src/environments/environment.ts`
- Modify: `frontend/src/environments/environment.development.ts`

**Interfaces:**
- Consumes: nada.
- Produces: tipos `Producto` y `ProductoRequest` usados por `ProductoService` (Task 6) y ambos componentes de features (Tasks 10-11); `environment.apiUrl` usado por `ProductoService`.

- [ ] **Step 1: Crear el modelo**

Crear `frontend/src/app/core/models/producto.model.ts`:

```typescript
export interface Producto {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
}

export interface ProductoRequest {
  nombre: string;
  descripcion: string | null;
  precio: number;
}
```

- [ ] **Step 2: Configurar environments**

Editar `frontend/src/environments/environment.ts` (usado en build de producción):

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://REEMPLAZAR-CON-URL-DE-RENDER.onrender.com/api',
};
```

Editar `frontend/src/environments/environment.development.ts` (usado por `ng serve`):

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
};
```

- [ ] **Step 3: Verificar que compila**

Run: `npx ng build` (desde `frontend/`)
Expected: PASS (no hay nada que consuma estos archivos todavía, pero deben compilar sin errores de sintaxis).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/core/models frontend/src/environments
git commit -m "feat(frontend): agrega modelo Producto y configuracion de environments"
```

---

## Task 6: Frontend — ProductoService

**Files:**
- Create: `frontend/src/app/core/services/producto.service.ts`
- Test: `frontend/src/app/core/services/producto.service.spec.ts`

**Interfaces:**
- Consumes: `Producto`, `ProductoRequest` (Task 5), `environment.apiUrl` (Task 5).
- Produces: `ProductoService` con signals `productos: Signal<Producto[]>`, `loading: Signal<boolean>`, y métodos `listar()`, `buscarPorId(id: number)`, `crear(dto: ProductoRequest)`, `actualizar(id: number, dto: ProductoRequest)`, `eliminar(id: number)` — todos devuelven `Observable`. Usado por `ProductoListComponent` (Task 10) y `ProductoFormComponent` (Task 11).

- [ ] **Step 1: Escribir el test que falla**

Crear `frontend/src/app/core/services/producto.service.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProductoService } from './producto.service';
import { environment } from '../../../environments/environment';
import { Producto } from '../models/producto.model';

describe('ProductoService', () => {
  let service: ProductoService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/productos`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(ProductoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('listar() actualiza el signal productos con la respuesta', () => {
    const mockData: Producto[] = [
      { id: 1, nombre: 'Mouse', descripcion: 'Inalambrico', precio: 59900 },
    ];

    service.listar().subscribe();

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockData);

    expect(service.productos()).toEqual(mockData);
    expect(service.loading()).toBe(false);
  });

  it('crear() envia POST al endpoint correcto', () => {
    const dto = { nombre: 'Teclado', descripcion: null, precio: 189900 };
    const created: Producto = { id: 2, ...dto };

    service.crear(dto).subscribe((result) => {
      expect(result).toEqual(created);
    });

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush(created);
  });

  it('eliminar() envia DELETE al id correcto', () => {
    service.eliminar(5).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/5`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx ng test --watch=false --browsers=ChromeHeadless --include='**/producto.service.spec.ts'`
Expected: FAIL (`ProductoService` no existe).

- [ ] **Step 3: Implementar `ProductoService`**

Crear `frontend/src/app/core/services/producto.service.ts`:

```typescript
import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Producto, ProductoRequest } from '../models/producto.model';

@Injectable({ providedIn: 'root' })
export class ProductoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/productos`;

  readonly productos = signal<Producto[]>([]);
  readonly loading = signal(false);

  listar(): Observable<Producto[]> {
    this.loading.set(true);
    return this.http.get<Producto[]>(this.baseUrl).pipe(
      tap({
        next: (data) => {
          this.productos.set(data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      })
    );
  }

  buscarPorId(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.baseUrl}/${id}`);
  }

  crear(dto: ProductoRequest): Observable<Producto> {
    return this.http.post<Producto>(this.baseUrl, dto);
  }

  actualizar(id: number, dto: ProductoRequest): Observable<Producto> {
    return this.http.put<Producto>(`${this.baseUrl}/${id}`, dto);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npx ng test --watch=false --browsers=ChromeHeadless --include='**/producto.service.spec.ts'`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/core/services
git commit -m "feat(frontend): agrega ProductoService con signals de estado"
```

---

## Task 7: Frontend — ErrorInterceptor

**Files:**
- Create: `frontend/src/app/core/interceptors/error.interceptor.ts`
- Test: `frontend/src/app/core/interceptors/error.interceptor.spec.ts`

**Interfaces:**
- Consumes: `MatSnackBar` (de `@angular/material/snack-bar`, ya disponible tras Task 4).
- Produces: `errorInterceptor: HttpInterceptorFn`, registrado en `app.config.ts` en la Task 8.

- [ ] **Step 1: Escribir el test que falla**

Crear `frontend/src/app/core/interceptors/error.interceptor.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let snackBarOpenSpy: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    const snackBar = TestBed.inject(MatSnackBar);
    snackBarOpenSpy = spyOn(snackBar, 'open');
  });

  afterEach(() => httpMock.verify());

  it('muestra el mensaje del backend en un snackbar cuando la peticion falla', () => {
    httpClient.get('/api/productos/999').subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/productos/999');
    req.flush(
      { message: 'No se encontro el producto con id: 999' },
      { status: 404, statusText: 'Not Found' }
    );

    expect(snackBarOpenSpy).toHaveBeenCalledWith(
      'No se encontro el producto con id: 999',
      'Cerrar',
      { duration: 5000 }
    );
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx ng test --watch=false --browsers=ChromeHeadless --include='**/error.interceptor.spec.ts'`
Expected: FAIL (`error.interceptor.ts` no existe).

- [ ] **Step 3: Implementar el interceptor**

Crear `frontend/src/app/core/interceptors/error.interceptor.ts`:

```typescript
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';

export interface ErrorResponseBody {
  message?: string;
  detalles?: string[];
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const body = error.error as ErrorResponseBody | null;
      const mensaje =
        body?.detalles?.[0] ?? body?.message ?? 'Ocurrio un error inesperado. Intenta de nuevo.';

      snackBar.open(mensaje, 'Cerrar', { duration: 5000 });

      return throwError(() => error);
    })
  );
};
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npx ng test --watch=false --browsers=ChromeHeadless --include='**/error.interceptor.spec.ts'`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/core/interceptors
git commit -m "feat(frontend): agrega ErrorInterceptor con notificaciones via snackbar"
```

---

## Task 8: Frontend — App shell (rutas, toolbar, providers)

**Files:**
- Modify: `frontend/src/app/app.routes.ts`
- Modify: `frontend/src/app/app.config.ts`
- Modify: `frontend/src/app/app.component.ts`
- Modify: `frontend/src/app/app.component.spec.ts`
- Delete (si el CLI los generó): `frontend/src/app/app.component.html`, `frontend/src/app/app.component.scss` (se inlinean en el componente)

**Interfaces:**
- Consumes: `errorInterceptor` (Task 7).
- Produces: rutas `/productos`, `/productos/nuevo`, `/productos/:id/editar` activas y navegables; `HttpClient` con el interceptor registrado, disponible para toda la app (usado por `ProductoService` en runtime).

- [ ] **Step 1: Definir las rutas**

Reemplazar el contenido de `frontend/src/app/app.routes.ts`:

```typescript
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'productos', pathMatch: 'full' },
  {
    path: 'productos',
    loadComponent: () =>
      import('./features/productos/producto-list/producto-list.component').then(
        (m) => m.ProductoListComponent
      ),
  },
  {
    path: 'productos/nuevo',
    loadComponent: () =>
      import('./features/productos/producto-form/producto-form.component').then(
        (m) => m.ProductoFormComponent
      ),
  },
  {
    path: 'productos/:id/editar',
    loadComponent: () =>
      import('./features/productos/producto-form/producto-form.component').then(
        (m) => m.ProductoFormComponent
      ),
  },
  { path: '**', redirectTo: 'productos' },
];
```

(Los componentes importados se crean en las Tasks 10 y 11 — hasta entonces `ng build` fallará al resolver esos imports; por eso esta tarea se prueba solo con `ng test`, no con `ng build`. `ng build` completo se valida al final de la Task 11.)

- [ ] **Step 2: Asegurar los providers en `app.config.ts`**

Editar `frontend/src/app/app.config.ts` para que el contenido final sea exactamente:

```typescript
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { routes } from './app.routes';
import { errorInterceptor } from './core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([errorInterceptor])),
    provideAnimationsAsync(),
  ],
};
```

(Si el schematic de Material ya agregó `provideAnimationsAsync()` u otro provider de animaciones con otro nombre, dejar solo uno — no duplicar providers de animaciones.)

- [ ] **Step 3: Reescribir `AppComponent` como shell con toolbar**

Reemplazar `frontend/src/app/app.component.ts` (elimina `app.component.html`/`app.component.scss` si el CLI los generó por separado; el componente pasa a usar `template`/`styles` inline):

```typescript
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MatToolbarModule, MatIconModule],
  template: `
    <mat-toolbar color="primary">
      <mat-icon>inventory_2</mat-icon>
      <span class="app-title">Producto API</span>
    </mat-toolbar>
    <main class="app-content">
      <router-outlet />
    </main>
  `,
  styles: [
    `
      .app-title {
        margin-left: 8px;
        font-weight: 600;
      }
      .app-content {
        max-width: 1100px;
        margin: 0 auto;
        padding: 24px 16px;
      }
    `,
  ],
})
export class AppComponent {}
```

- [ ] **Step 4: Actualizar el test de `AppComponent`**

Reemplazar `frontend/src/app/app.component.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
      ],
    }).compileComponents();
  });

  it('muestra el titulo "Producto API" en el toolbar', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.app-title')?.textContent).toContain('Producto API');
  });
});
```

- [ ] **Step 5: Correr el test y verificar que pasa**

Run: `npx ng test --watch=false --browsers=ChromeHeadless --include='**/app.component.spec.ts'`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/app.routes.ts frontend/src/app/app.config.ts frontend/src/app/app.component.ts frontend/src/app/app.component.spec.ts
git add -u frontend/src/app
git commit -m "feat(frontend): agrega rutas, toolbar y providers del app shell"
```

---

## Task 9: Frontend — ConfirmDialogComponent (compartido)

**Files:**
- Create: `frontend/src/app/shared/confirm-dialog/confirm-dialog.component.ts`
- Test: `frontend/src/app/shared/confirm-dialog/confirm-dialog.component.spec.ts`

**Interfaces:**
- Consumes: `MatDialogModule` (disponible desde Task 4).
- Produces: `ConfirmDialogComponent` y `ConfirmDialogData { titulo: string; mensaje: string }`, abierto vía `MatDialog.open()` desde `ProductoListComponent` (Task 10); cierra con `true` (confirmado) o `false`/`undefined` (cancelado).

- [ ] **Step 1: Escribir el test que falla**

Crear `frontend/src/app/shared/confirm-dialog/confirm-dialog.component.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ConfirmDialogComponent, ConfirmDialogData } from './confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ConfirmDialogComponent>>;
  const data: ConfirmDialogData = { titulo: 'Eliminar producto', mensaje: '¿Eliminar "Mouse"?' };

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    }).compileComponents();
  });

  it('cierra el dialog con true al confirmar', () => {
    const fixture = TestBed.createComponent(ConfirmDialogComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const botones = compiled.querySelectorAll('button');
    const confirmarBtn = Array.from(botones).find((b) => b.textContent?.includes('Eliminar'));
    confirmarBtn?.dispatchEvent(new Event('click'));

    expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx ng test --watch=false --browsers=ChromeHeadless --include='**/confirm-dialog.component.spec.ts'`
Expected: FAIL (`ConfirmDialogComponent` no existe).

- [ ] **Step 3: Implementar el componente**

Crear `frontend/src/app/shared/confirm-dialog/confirm-dialog.component.ts`:

```typescript
import { Component, inject } from '@angular/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface ConfirmDialogData {
  titulo: string;
  mensaje: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.titulo }}</h2>
    <mat-dialog-content>{{ data.mensaje }}</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close(false)">Cancelar</button>
      <button mat-flat-button color="warn" (click)="dialogRef.close(true)">Eliminar</button>
    </mat-dialog-actions>
  `,
})
export class ConfirmDialogComponent {
  readonly dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);
  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npx ng test --watch=false --browsers=ChromeHeadless --include='**/confirm-dialog.component.spec.ts'`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/shared
git commit -m "feat(frontend): agrega ConfirmDialogComponent reutilizable"
```

---

## Task 10: Frontend — ProductoListComponent

**Files:**
- Create: `frontend/src/app/features/productos/producto-list/producto-list.component.ts`
- Create: `frontend/src/app/features/productos/producto-list/producto-list.component.html`
- Create: `frontend/src/app/features/productos/producto-list/producto-list.component.scss`
- Test: `frontend/src/app/features/productos/producto-list/producto-list.component.spec.ts`

**Interfaces:**
- Consumes: `ProductoService` (Task 6), `ConfirmDialogComponent`/`ConfirmDialogData` (Task 9), `Producto` (Task 5).
- Produces: componente enrutado en `/productos` (referenciado por `app.routes.ts`, Task 8); expone `busqueda: WritableSignal<string>`, `productosFiltrados: Signal<Producto[]>`, `onBuscar(termino: string)`, `onOrdenar(sort: Sort)`, `eliminar(producto: Producto)`.

- [ ] **Step 1: Escribir el test que falla**

Crear `frontend/src/app/features/productos/producto-list/producto-list.component.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { of } from 'rxjs';

import { ProductoListComponent } from './producto-list.component';
import { ProductoService } from '../../../core/services/producto.service';
import { Producto } from '../../../core/models/producto.model';

describe('ProductoListComponent', () => {
  const productos: Producto[] = [
    { id: 1, nombre: 'Mouse', descripcion: 'Inalambrico', precio: 59900 },
    { id: 2, nombre: 'Teclado', descripcion: 'Mecanico', precio: 189900 },
  ];

  let productoServiceStub: Partial<ProductoService>;

  beforeEach(async () => {
    productoServiceStub = {
      productos: signal<Producto[]>(productos),
      loading: signal(false),
      listar: jasmine.createSpy('listar').and.returnValue(of(productos)),
      eliminar: jasmine.createSpy('eliminar').and.returnValue(of(undefined)),
    };

    await TestBed.configureTestingModule({
      imports: [ProductoListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
        { provide: ProductoService, useValue: productoServiceStub },
      ],
    }).compileComponents();
  });

  it('filtra los productos por nombre al buscar', () => {
    const fixture = TestBed.createComponent(ProductoListComponent);
    fixture.detectChanges();

    fixture.componentInstance.onBuscar('tecl');

    expect(fixture.componentInstance.productosFiltrados()).toEqual([productos[1]]);
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx ng test --watch=false --browsers=ChromeHeadless --include='**/producto-list.component.spec.ts'`
Expected: FAIL (`ProductoListComponent` no existe).

- [ ] **Step 3: Implementar el componente**

Crear `frontend/src/app/features/productos/producto-list/producto-list.component.ts`:

```typescript
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ProductoService } from '../../../core/services/producto.service';
import { Producto } from '../../../core/models/producto.model';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-producto-list',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    RouterLink,
    MatToolbarModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatSortModule,
    MatTooltipModule,
  ],
  templateUrl: './producto-list.component.html',
  styleUrl: './producto-list.component.scss',
})
export class ProductoListComponent implements OnInit {
  private readonly productoService = inject(ProductoService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly columnas = ['id', 'nombre', 'descripcion', 'precio', 'acciones'];
  readonly busqueda = signal('');
  readonly ordenActivo = signal<Sort>({ active: '', direction: '' });

  readonly loading = this.productoService.loading;

  readonly productosFiltrados = computed(() => {
    const termino = this.busqueda().trim().toLowerCase();
    const base = this.productoService.productos();
    const filtrados = termino ? base.filter((p) => p.nombre.toLowerCase().includes(termino)) : base;

    const { active, direction } = this.ordenActivo();
    if (!active || !direction) {
      return filtrados;
    }

    return [...filtrados].sort((a, b) => {
      const valorA = a[active as keyof Producto];
      const valorB = b[active as keyof Producto];
      const comparacion = valorA! < valorB! ? -1 : valorA! > valorB! ? 1 : 0;
      return direction === 'asc' ? comparacion : -comparacion;
    });
  });

  ngOnInit(): void {
    this.productoService.listar().subscribe();
  }

  onBuscar(termino: string): void {
    this.busqueda.set(termino);
  }

  onOrdenar(sort: Sort): void {
    this.ordenActivo.set(sort);
  }

  eliminar(producto: Producto): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        titulo: 'Eliminar producto',
        mensaje: `¿Eliminar "${producto.nombre}"? Esta accion no se puede deshacer.`,
      },
    });

    dialogRef.afterClosed().subscribe((confirmado: boolean) => {
      if (!confirmado) {
        return;
      }

      this.productoService.eliminar(producto.id).subscribe(() => {
        this.snackBar.open(`"${producto.nombre}" eliminado`, 'Cerrar', { duration: 3000 });
        this.productoService.listar().subscribe();
      });
    });
  }
}
```

Crear `frontend/src/app/features/productos/producto-list/producto-list.component.html`:

```html
<mat-toolbar class="list-toolbar">
  <mat-form-field appearance="outline" class="buscador">
    <mat-icon matPrefix>search</mat-icon>
    <input
      matInput
      placeholder="Buscar por nombre..."
      [value]="busqueda()"
      (input)="onBuscar($any($event.target).value)"
    />
  </mat-form-field>

  <span class="spacer"></span>

  <button mat-flat-button color="primary" routerLink="/productos/nuevo">
    <mat-icon>add</mat-icon>
    Nuevo producto
  </button>
</mat-toolbar>

@if (loading()) {
  <div class="skeleton" *ngFor="let i of [1, 2, 3, 4]"></div>
} @else if (productosFiltrados().length === 0) {
  <div class="estado-vacio">
    <mat-icon>inventory_2</mat-icon>
    <p>Aun no hay productos</p>
    <button mat-stroked-button color="primary" routerLink="/productos/nuevo">
      Crear el primero
    </button>
  </div>
} @else {
  <table mat-table [dataSource]="productosFiltrados()" matSort (matSortChange)="onOrdenar($event)">
    <ng-container matColumnDef="id">
      <th mat-header-cell *matHeaderCellDef>ID</th>
      <td mat-cell *matCellDef="let p">{{ p.id }}</td>
    </ng-container>

    <ng-container matColumnDef="nombre">
      <th mat-header-cell *matHeaderCellDef mat-sort-header>Nombre</th>
      <td mat-cell *matCellDef="let p">{{ p.nombre }}</td>
    </ng-container>

    <ng-container matColumnDef="descripcion">
      <th mat-header-cell *matHeaderCellDef>Descripcion</th>
      <td mat-cell *matCellDef="let p" class="descripcion-cell" [matTooltip]="p.descripcion ?? ''">
        {{ p.descripcion }}
      </td>
    </ng-container>

    <ng-container matColumnDef="precio">
      <th mat-header-cell *matHeaderCellDef mat-sort-header>Precio</th>
      <td mat-cell *matCellDef="let p">{{ p.precio | currency: 'USD' }}</td>
    </ng-container>

    <ng-container matColumnDef="acciones">
      <th mat-header-cell *matHeaderCellDef>Acciones</th>
      <td mat-cell *matCellDef="let p">
        <button mat-icon-button [routerLink]="['/productos', p.id, 'editar']" aria-label="Editar">
          <mat-icon>edit</mat-icon>
        </button>
        <button mat-icon-button (click)="eliminar(p)" aria-label="Eliminar">
          <mat-icon>delete</mat-icon>
        </button>
      </td>
    </ng-container>

    <tr mat-header-row *matHeaderRowDef="columnas"></tr>
    <tr mat-row *matRowDef="let row; columns: columnas"></tr>
  </table>
}
```

Crear `frontend/src/app/features/productos/producto-list/producto-list.component.scss`:

```scss
.list-toolbar {
  gap: 16px;
  background: transparent;
  padding: 0 0 16px;
}

.buscador {
  width: 320px;
}

.spacer {
  flex: 1 1 auto;
}

table {
  width: 100%;
  background: #1c2028;
  border-radius: 12px;
  overflow: hidden;
}

.descripcion-cell {
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.estado-vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 64px 0;
  color: #8a8f98;
}

.skeleton {
  height: 48px;
  margin-bottom: 8px;
  border-radius: 8px;
  background: linear-gradient(90deg, #1c2028 25%, #22262f 37%, #1c2028 63%);
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
}

@keyframes shimmer {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0 50%;
  }
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npx ng test --watch=false --browsers=ChromeHeadless --include='**/producto-list.component.spec.ts'`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/features/productos/producto-list
git commit -m "feat(frontend): agrega ProductoListComponent con busqueda, orden y borrado"
```

---

## Task 11: Frontend — ProductoFormComponent

**Files:**
- Create: `frontend/src/app/features/productos/producto-form/producto-form.component.ts`
- Create: `frontend/src/app/features/productos/producto-form/producto-form.component.html`
- Create: `frontend/src/app/features/productos/producto-form/producto-form.component.scss`
- Test: `frontend/src/app/features/productos/producto-form/producto-form.component.spec.ts`

**Interfaces:**
- Consumes: `ProductoService` (Task 6), `Producto`/`ProductoRequest` (Task 5).
- Produces: componente enrutado en `/productos/nuevo` y `/productos/:id/editar` (referenciado por `app.routes.ts`, Task 8); con esta tarea completa, `ng build` del proyecto completo debe compilar.

- [ ] **Step 1: Escribir el test que falla**

Crear `frontend/src/app/features/productos/producto-form/producto-form.component.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router, ActivatedRoute, convertToParamMap } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { ProductoFormComponent } from './producto-form.component';
import { ProductoService } from '../../../core/services/producto.service';
import { Producto } from '../../../core/models/producto.model';

describe('ProductoFormComponent', () => {
  let productoServiceStub: Partial<ProductoService>;
  let router: Router;

  beforeEach(async () => {
    productoServiceStub = {
      crear: jasmine
        .createSpy('crear')
        .and.returnValue(of({ id: 1, nombre: 'Mouse', descripcion: '', precio: 100 } as Producto)),
      buscarPorId: jasmine.createSpy('buscarPorId'),
    };

    await TestBed.configureTestingModule({
      imports: [ProductoFormComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
        { provide: ProductoService, useValue: productoServiceStub },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({}) } } },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
  });

  it('el formulario es invalido si el nombre esta vacio', () => {
    const fixture = TestBed.createComponent(ProductoFormComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.form.invalid).toBe(true);
  });

  it('llama a crear() y navega a /productos al guardar un formulario valido', () => {
    const fixture = TestBed.createComponent(ProductoFormComponent);
    fixture.detectChanges();

    fixture.componentInstance.form.setValue({
      nombre: 'Mouse',
      descripcion: 'Inalambrico',
      precio: 100,
    });

    fixture.componentInstance.guardar();

    expect(productoServiceStub.crear).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/productos']);
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx ng test --watch=false --browsers=ChromeHeadless --include='**/producto-form.component.spec.ts'`
Expected: FAIL (`ProductoFormComponent` no existe).

- [ ] **Step 3: Implementar el componente**

Crear `frontend/src/app/features/productos/producto-form/producto-form.component.ts`:

```typescript
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ProductoService } from '../../../core/services/producto.service';

@Component({
  selector: 'app-producto-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './producto-form.component.html',
  styleUrl: './producto-form.component.scss',
})
export class ProductoFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly productoService = inject(ProductoService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly guardando = signal(false);
  productoId: number | null = null;

  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(120)]],
    descripcion: ['', [Validators.maxLength(500)]],
    precio: [0, [Validators.required, Validators.min(0)]],
  });

  get modoEdicion(): boolean {
    return this.productoId !== null;
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      return;
    }

    this.productoId = Number(idParam);
    this.productoService.buscarPorId(this.productoId).subscribe((producto) => {
      this.form.patchValue({
        nombre: producto.nombre,
        descripcion: producto.descripcion ?? '',
        precio: producto.precio,
      });
    });
  }

  guardar(): void {
    if (this.form.invalid) {
      return;
    }

    this.guardando.set(true);
    const dto = this.form.getRawValue();

    const peticion = this.modoEdicion
      ? this.productoService.actualizar(this.productoId!, dto)
      : this.productoService.crear(dto);

    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.snackBar.open('Producto guardado', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/productos']);
      },
      error: () => this.guardando.set(false),
    });
  }
}
```

Crear `frontend/src/app/features/productos/producto-form/producto-form.component.html`:

```html
<mat-card class="form-card">
  <mat-card-header>
    <mat-card-title>{{ modoEdicion ? 'Editar producto' : 'Nuevo producto' }}</mat-card-title>
  </mat-card-header>

  <mat-card-content>
    <form [formGroup]="form" (ngSubmit)="guardar()">
      <mat-form-field appearance="outline" class="campo">
        <mat-label>Nombre</mat-label>
        <input matInput formControlName="nombre" maxlength="120" />
        @if (form.controls.nombre.hasError('required')) {
          <mat-error>El nombre del producto es obligatorio</mat-error>
        }
        @if (form.controls.nombre.hasError('maxlength')) {
          <mat-error>El nombre no puede superar los 120 caracteres</mat-error>
        }
      </mat-form-field>

      <mat-form-field appearance="outline" class="campo">
        <mat-label>Descripcion</mat-label>
        <textarea matInput formControlName="descripcion" maxlength="500" rows="3"></textarea>
        @if (form.controls.descripcion.hasError('maxlength')) {
          <mat-error>La descripcion no puede superar los 500 caracteres</mat-error>
        }
      </mat-form-field>

      <mat-form-field appearance="outline" class="campo">
        <mat-label>Precio</mat-label>
        <input matInput type="number" formControlName="precio" min="0" step="0.01" />
        @if (form.controls.precio.hasError('required')) {
          <mat-error>El precio es obligatorio</mat-error>
        }
        @if (form.controls.precio.hasError('min')) {
          <mat-error>El precio no puede ser negativo</mat-error>
        }
      </mat-form-field>

      <div class="acciones">
        <button mat-button type="button" routerLink="/productos">Cancelar</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || guardando()">
          @if (guardando()) {
            <mat-spinner diameter="20"></mat-spinner>
          } @else {
            Guardar
          }
        </button>
      </div>
    </form>
  </mat-card-content>
</mat-card>
```

Crear `frontend/src/app/features/productos/producto-form/producto-form.component.scss`:

```scss
.form-card {
  max-width: 480px;
  margin: 0 auto;
  background: #1c2028;
  border-radius: 12px;
}

.campo {
  width: 100%;
  margin-bottom: 8px;
}

.acciones {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npx ng test --watch=false --browsers=ChromeHeadless --include='**/producto-form.component.spec.ts'`
Expected: PASS

- [ ] **Step 5: Correr toda la suite de frontend y el build completo**

```bash
npx ng test --watch=false --browsers=ChromeHeadless
npx ng build
```

Expected: todos los specs pasan; `ng build` compila sin errores (ya se resuelven los `loadComponent` de `app.routes.ts`).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/features/productos/producto-form
git commit -m "feat(frontend): agrega ProductoFormComponent para crear y editar"
```

---

## Task 12: Archivos de despliegue (Netlify + Render)

**Files:**
- Create: `frontend/netlify.toml`
- Create: `frontend/public/_redirects`
- Create: `render.yaml` (raíz del repo)

**Interfaces:**
- Consumes: nada (archivos de configuración de plataforma, leídos por Netlify/Render, no por el código de la app).
- Produces: build/deploy reproducible en Netlify (lee `netlify.toml`) y blueprint listo para "New Blueprint" en Render (lee `render.yaml`).

- [ ] **Step 1: Crear `netlify.toml`**

Crear `frontend/netlify.toml`:

```toml
[build]
  command = "npm run build -- --configuration=production"
  publish = "dist/frontend/browser"

[build.environment]
  NODE_VERSION = "20"
```

- [ ] **Step 2: Crear el archivo de redirects para el SPA routing**

Crear `frontend/public/_redirects`:

```
/*  /index.html  200
```

(Angular CLI copia todo el contenido de `public/` a la raíz de `dist/frontend/browser/` durante el build, así que este archivo termina en `dist/frontend/browser/_redirects`, donde Netlify lo espera.)

- [ ] **Step 3: Crear el blueprint de Render**

Crear `render.yaml` en la raíz del repo:

```yaml
services:
  - type: web
    name: producto-api
    runtime: java
    plan: free
    buildCommand: mvn -B -DskipTests clean package
    startCommand: java -jar target/producto-api-1.0.0.jar
    envVars:
      - key: DB_URL
        sync: false
      - key: DB_USERNAME
        sync: false
      - key: DB_PASSWORD
        sync: false
      - key: ALLOWED_ORIGIN
        sync: false
```

(Las 4 variables quedan con `sync: false` a propósito: Render las pedirá manualmente al aplicar el blueprint, porque el valor de `DB_URL` debe construirse a mano — ver Task 13 — a partir de la base de datos Postgres que se cree por separado en Render.)

- [ ] **Step 4: Verificar sintaxis**

Run: `npx js-yaml render.yaml` (o simplemente inspección visual si `js-yaml` no está instalado — no es una dependencia del proyecto, no instalarla solo para esto).
Expected: el YAML es válido (sin tabs, indentación consistente).

- [ ] **Step 5: Commit**

```bash
git add frontend/netlify.toml frontend/public/_redirects render.yaml
git commit -m "chore(deploy): agrega configuracion de Netlify y blueprint de Render"
```

---

## Task 13: README y runbook de despliegue final

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: todo lo anterior (documenta el resultado final).
- Produces: instrucciones completas para correr el frontend en local y desplegar ambas partes.

- [ ] **Step 1: Agregar sección de frontend al README**

Agregar al final de `README.md` (después de la sección existente "Guion sugerido para el video de entrega"):

```markdown
## Frontend (Angular)

El frontend vive en `frontend/` — Angular con Angular Material, standalone
components, signals, dark mode.

### Correr en local

```bash
cd frontend
npm install
npx ng serve
```

Abre `http://localhost:4200`. Por defecto apunta a `http://localhost:8080/api`
(backend local) — asegúrate de tener el backend corriendo con
`mvn spring-boot:run` y con `ALLOWED_ORIGIN=http://localhost:4200` (o deja el
default, que ya es ese valor).

### Desplegar el backend en Render

1. En Render: **New > Blueprint**, conecta el repo de GitHub. Render detecta
   `render.yaml` automáticamente.
2. Antes de aplicar el blueprint, crea también una base de datos: **New >
   PostgreSQL** (plan free), nómbrala `producto-db`.
3. En el dashboard de `producto-db`, copia el **Internal Database URL**
   (algo como `postgres://usuario:password@host/nombre_db`). Reemplaza el
   prefijo `postgres://` por `jdbc:postgresql://` — ese es el valor de
   `DB_URL`.
4. Al aplicar el blueprint de `producto-api`, completa las 4 variables que
   pide: `DB_URL` (el valor armado en el paso anterior), `DB_USERNAME` y
   `DB_PASSWORD` (los que muestra el dashboard de `producto-db`), y
   `ALLOWED_ORIGIN` (déjalo en `http://localhost:4200` por ahora — se
   actualiza en el paso 6).
5. Espera el deploy y copia la URL pública que Render asigna (algo como
   `https://producto-api-xxxx.onrender.com`).
6. Vuelve al paso de Netlify de abajo, obtén la URL del sitio, y **regresa
   aquí** a actualizar la variable `ALLOWED_ORIGIN` en Render con esa URL
   (Settings > Environment), lo que dispara un redeploy automático.

> Nota: el plan free de Render duerme el servicio tras ~15 min sin tráfico.
> El primer request tras eso tarda 30-50s — es esperado, no un error.

### Desplegar el frontend en Netlify

1. Actualiza `frontend/src/environments/environment.ts` con la URL real de
   Render del paso anterior (`apiUrl: 'https://producto-api-xxxx.onrender.com/api'`),
   haz commit y push.
2. En Netlify: **Add new site > Import an existing project**, conecta el
   mismo repo de GitHub.
3. Base directory: `frontend`. Netlify lee `netlify.toml` para el resto del
   build automáticamente.
4. Deploy. Copia la URL que Netlify asigna (`https://<nombre>.netlify.app`).
5. Usa esa URL para completar el paso 6 de la sección de Render arriba.

Cada push a `main` redeploya frontend y backend automáticamente.
```

- [ ] **Step 2: Verificar el markdown renderiza bien**

Abrir `README.md` y confirmar que no hay bloques de código mal cerrados (los ```` ``` ```` anidados dentro de la sección nueva usan bloques `bash`/`markdown` correctamente delimitados).

- [ ] **Step 3: Push final de todo el trabajo**

```bash
git add README.md
git commit -m "docs: agrega instrucciones de frontend y runbook de despliegue"
git push origin main
```

Expected: todos los commits de las Tasks 1-13 quedan sincronizados en `https://github.com/<usuario>/producto-api`.

- [ ] **Step 4: Verificación final manual**

Run (backend): `mvn spring-boot:run` (con `DB_PASSWORD` exportado, ya no tiene default)
Run (frontend, en otra terminal): `cd frontend && npx ng serve`

Expected: abrir `http://localhost:4200` muestra la lista de productos (vacía al inicio), se puede crear un producto, verlo en la tabla, editarlo, buscarlo, y eliminarlo con confirmación — todo contra el backend local.

---

## Self-Review Notes

- **Cobertura de la spec:** estructura del monorepo (Tasks 4, 12), arquitectura Angular standalone+signals (Tasks 6-11), diseño de lista/formulario/dark mode (Tasks 10-11), cambios de backend CORS+seguridad (Tasks 1-2), despliegue Netlify+Render (Tasks 12-13), git/GitHub (Task 3) — todos cubiertos.
- **Sin placeholders:** cada paso de código trae el contenido completo del archivo; no quedan "TODO"/"similar a la Task N".
- **Consistencia de tipos:** `Producto`/`ProductoRequest` (Task 5) se usan idénticos en `ProductoService` (Task 6), `ProductoListComponent` (Task 10) y `ProductoFormComponent` (Task 11); `ConfirmDialogData` (Task 9) coincide entre definición y uso en Task 10.
- **Paleta de color exacta:** la spec dejó la paleta final (violeta vs. esmeralda) para decidir en implementación — el ejecutor de la Task 4/8 puede elegir cualquiera de las dos siempre que cumpla contraste WCAG AA sobre `#0f1115`/`#1c2028`; no bloquea ninguna otra tarea.
