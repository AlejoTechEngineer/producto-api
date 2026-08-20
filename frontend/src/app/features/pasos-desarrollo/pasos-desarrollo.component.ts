import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

interface Paso {
  titulo: string;
  detalle: string;
}

interface GrupoPasos {
  criterio: string;
  puntaje: number;
  descripcion: string;
  pasos: Paso[];
}

@Component({
  selector: 'app-pasos-desarrollo',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './pasos-desarrollo.component.html',
  styleUrl: './pasos-desarrollo.component.scss',
})
export class PasosDesarrolloComponent {
  readonly grupos: GrupoPasos[] = [
    {
      criterio: 'Arquitectura de la solucion',
      puntaje: 40,
      descripcion: 'Organizacion del proyecto en paquetes y modulos claros.',
      pasos: [
        {
          titulo: 'Backend en capas',
          detalle:
            'Paquetes controller, service (con su impl), repository, model, dto y exception separados por responsabilidad.',
        },
        {
          titulo: 'Frontend por dominio',
          detalle:
            'core (servicios, modelos, guards, interceptores), features (productos, login, actividad) y shared (componentes reutilizables) separados.',
        },
        {
          titulo: 'Sistema de diseno propio',
          detalle: 'Tokens de color, tipografia y espaciado centralizados, reutilizados por todos los componentes.',
        },
      ],
    },
    {
      criterio: 'Implementacion',
      puntaje: 50,
      descripcion: 'Framework backend, ORM y CRUD funcional con manejo de errores.',
      pasos: [
        {
          titulo: 'Entidad Producto',
          detalle: 'id, nombre, descripcion y precio, mapeada con Hibernate (JPA) — crea la tabla automaticamente.',
        },
        {
          titulo: 'Framework backend',
          detalle: 'Spring Boot 3 con Spring Web para exponer los servicios REST.',
        },
        {
          titulo: 'CRUD completo',
          detalle: 'Endpoints GET, GET por id, POST, PUT y DELETE sobre /api/productos, sin SQL manual.',
        },
        {
          titulo: 'Manejo de errores',
          detalle:
            'Manejador centralizado: 404 para recurso no encontrado o ruta inexistente, 400 para validaciones o tipos invalidos, 500 con mensaje generico (sin exponer detalles internos).',
        },
        {
          titulo: 'CORS y seguridad',
          detalle: 'Origen configurable por variable de entorno, sin password por defecto en la base de datos.',
        },
      ],
    },
    {
      criterio: 'Pruebas',
      puntaje: 50,
      descripcion: 'GET, POST, PUT y DELETE verificados con un cliente HTTP.',
      pasos: [
        {
          titulo: 'Pruebas automatizadas',
          detalle: 'JUnit 5 + MockMvc para los 4 metodos y los casos de error, ejecutadas en cada cambio.',
        },
        {
          titulo: 'Coleccion de Postman',
          detalle: 'postman_collection.json en el repositorio con los 4 metodos listos para probar.',
        },
        {
          titulo: 'Frontend probado',
          detalle: 'Tests de componentes y servicios Angular (Vitest) para el flujo completo de creacion, listado, edicion y borrado.',
        },
      ],
    },
    {
      criterio: 'Repositorio',
      puntaje: 30,
      descripcion: 'Codigo cargado correctamente en GitHub.',
      pasos: [
        {
          titulo: 'Repositorio personal',
          detalle: 'Backend y frontend en el mismo repositorio, con .gitignore excluyendo target/, node_modules/ y credenciales.',
        },
        {
          titulo: 'Historial organizado',
          detalle: 'Commits separados por funcionalidad (CORS, seguridad, cada componente del frontend), con mensajes descriptivos.',
        },
        {
          titulo: 'README con runbook',
          detalle: 'Instrucciones para correr el backend y el frontend en local, y para desplegar en Render y Netlify.',
        },
      ],
    },
  ];
}
