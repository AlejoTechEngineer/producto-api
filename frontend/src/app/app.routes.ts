import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'productos',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/productos/producto-list/producto-list.component').then(
        (m) => m.ProductoListComponent
      ),
  },
  {
    path: 'productos/nuevo',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/productos/producto-form/producto-form.component').then(
        (m) => m.ProductoFormComponent
      ),
  },
  {
    path: 'productos/:id/editar',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/productos/producto-form/producto-form.component').then(
        (m) => m.ProductoFormComponent
      ),
  },
  {
    path: 'acerca-de',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/acerca-de/acerca-de.component').then((m) => m.AcercaDeComponent),
  },
  {
    path: 'actividad',
    canActivate: [authGuard],
    loadComponent: () => import('./features/actividad/actividad.component').then((m) => m.ActividadComponent),
  },
  {
    path: 'pasos',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/pasos-desarrollo/pasos-desarrollo.component').then(
        (m) => m.PasosDesarrolloComponent
      ),
  },
  { path: '**', redirectTo: 'login' },
];
