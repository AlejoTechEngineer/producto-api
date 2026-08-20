# Producto API — Backend RESTful CRUD (Unidad 2)

API REST desarrollada con **Spring Boot 3 + Spring Data JPA (Hibernate) + PostgreSQL**
para gestionar productos, cumpliendo con la Actividad Sumativa de la Unidad 2 del
módulo *Arquitectura de Aplicaciones Web*.

## Arquitectura del proyecto

```
src/main/java/com/eafit/productoapi/
├── controller/        # Expone los endpoints REST (capa de presentación)
│   └── ProductoController.java
├── service/            # Interfaz de la lógica de negocio
│   ├── ProductoService.java
│   └── impl/
│       └── ProductoServiceImpl.java   # Implementación (capa de aplicación)
├── repository/         # Acceso a datos vía Spring Data JPA (ORM)
│   └── ProductoRepository.java
├── model/               # Entidad JPA mapeada a la tabla "productos"
│   └── Producto.java
├── dto/                  # Objetos de transferencia (entrada/salida) hacia el cliente
│   ├── ProductoRequestDTO.java
│   └── ProductoResponseDTO.java
├── exception/          # Manejo centralizado de errores
│   ├── ResourceNotFoundException.java
│   ├── ErrorResponse.java
│   └── GlobalExceptionHandler.java
└── ProductoApiApplication.java
```

Esta separación en paquetes (controller / service / repository / model / dto / exception)
facilita el mantenimiento, la escalabilidad y las pruebas del proyecto.

## Modelo de datos: Producto

| Campo        | Tipo       | Descripción                    |
|--------------|-----------|---------------------------------|
| id           | Long      | Identificador único (autogenerado) |
| nombre       | String    | Nombre del producto             |
| descripcion  | String    | Descripción breve               |
| precio       | BigDecimal| Precio del producto              |

## Endpoints disponibles

| Método | Endpoint              | Descripción                     |
|--------|------------------------|----------------------------------|
| GET    | `/api/productos`       | Lista todos los productos        |
| GET    | `/api/productos/{id}`  | Obtiene un producto por id       |
| POST   | `/api/productos`       | Crea un nuevo producto           |
| PUT    | `/api/productos/{id}`  | Actualiza un producto existente  |
| DELETE | `/api/productos/{id}`  | Elimina un producto              |

Ejemplo de body para POST / PUT:
```json
{
  "nombre": "Teclado mecanico",
  "descripcion": "Teclado mecanico switches rojos",
  "precio": 189900
}
```

## Manejo de errores

Todos los errores devuelven un cuerpo JSON consistente:
```json
{
  "timestamp": "2026-07-29 10:00:00",
  "status": 404,
  "error": "Recurso no encontrado",
  "message": "No se encontro el producto con id: 99",
  "path": "/api/productos/99"
}
```
- `404` — producto no encontrado.
- `400` — datos inválidos (validaciones `@NotBlank`, `@NotNull`, `@DecimalMin`) o tipo de parámetro incorrecto.
- `500` — error interno no controlado.

## Cómo ejecutar el proyecto localmente

### 1. Requisitos
- Java 17+
- Maven 3.9+
- PostgreSQL corriendo localmente, o una base de datos gratuita en **Supabase** o **Render**.

### 2. Crear la base de datos (si es local)
```sql
CREATE DATABASE producto_db;
```

### 3. Configurar las credenciales
El proyecto lee la conexión desde variables de entorno (ver `application.properties`).
Puedes exportarlas antes de correr la app, o crear un `application-local.properties` (ignorado por git):

```bash
export DB_URL=jdbc:postgresql://localhost:5432/producto_db
export DB_USERNAME=postgres
export DB_PASSWORD=tu_password
```

Si usas **Supabase** o **Render**, reemplaza `DB_URL`, `DB_USERNAME` y `DB_PASSWORD`
por los datos de conexión que te entrega el panel del proveedor (host, puerto, db, usuario y password).

### 4. Ejecutar
```bash
mvn spring-boot:run
```
La API quedará disponible en `http://localhost:8080/api/productos`.

Al arrancar, Hibernate (`spring.jpa.hibernate.ddl-auto=update`) crea automáticamente
la tabla `productos` — no es necesario escribir SQL manualmente.

### 5. Probar los endpoints
Importa `postman_collection.json` en Postman (o Insomnia) y ejecuta en orden:
1. Crear producto (POST)
2. Listar productos (GET)
3. Obtener por id (GET)
4. Actualizar (PUT)
5. Eliminar (DELETE)
6. Casos de error: id inexistente (404) y validación fallida (400)

También puedes probar con `curl`:
```bash
curl -X POST http://localhost:8080/api/productos \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Mouse","descripcion":"Mouse inalambrico","precio":59900}'

curl http://localhost:8080/api/productos
```

## Subir el proyecto a GitHub

```bash
cd producto-api
git init
git add .
git commit -m "Backend RESTful CRUD de Producto - Spring Boot + JPA + PostgreSQL"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/producto-api.git
git push -u origin main
```

> El `.gitignore` ya excluye `target/`, archivos de IDE y credenciales locales,
> por lo que solo subirás el código fuente relevante (criterio "Repositorio" de la rúbrica).

## Guion sugerido para el video de entrega (máx. 15 min)

1. **Explicar la arquitectura** (2-3 min): recorre los paquetes `controller`, `service`,
   `repository`, `model`, `dto`, `exception` y explica el rol de cada uno.
2. **Mostrar el modelo `Producto` y el repositorio JPA** (2 min): explica cómo el ORM
   crea la tabla sin SQL manual.
3. **Levantar la aplicación** (`mvn spring-boot:run`) y mostrar la consola con Hibernate
   creando la tabla `productos`.
4. **Probar los 4 métodos en Postman** (5-6 min): POST, GET, PUT, DELETE, y un caso
   de error (404 o 400) para demostrar el manejo de errores.
5. **Mostrar el repositorio en GitHub** (1-2 min): estructura de carpetas y el commit history.
