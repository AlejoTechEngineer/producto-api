import { Component, inject } from '@angular/core';
import { Router, RouterOutlet, RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { trigger, transition, style, animate } from '@angular/animations';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, MatToolbarModule, MatIconModule, MatButtonModule, MatTooltipModule],
  animations: [
    trigger('routeFade', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(8px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
      transition('* => *', [
        style({ opacity: 0, transform: 'translateY(8px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
  template: `
    <mat-toolbar class="app-toolbar glass-surface">
      <mat-icon>inventory_2</mat-icon>
      <span class="app-title">Producto API</span>
      <span class="app-spacer"></span>
      @if (authService.isAuthenticated()) {
        <button mat-icon-button routerLink="/actividad" matTooltip="Actividad a desarrollar" aria-label="Actividad a desarrollar">
          <mat-icon>assignment</mat-icon>
        </button>
        <button mat-icon-button routerLink="/pasos" matTooltip="Pasos del desarrollo" aria-label="Pasos del desarrollo">
          <mat-icon>checklist</mat-icon>
        </button>
        <button mat-icon-button routerLink="/acerca-de" matTooltip="Acerca de" aria-label="Acerca de">
          <mat-icon>info</mat-icon>
        </button>
        <button mat-icon-button (click)="cerrarSesion()" matTooltip="Cerrar sesion" aria-label="Cerrar sesion">
          <mat-icon>logout</mat-icon>
        </button>
      }
    </mat-toolbar>
    <main class="app-content">
      <div [@routeFade]="outlet.isActivated ? outlet.activatedRoute : ''">
        <router-outlet #outlet="outlet" />
      </div>
    </main>
  `,
  styles: [
    `
      .app-toolbar {
        background: transparent;
        border-radius: 0;
        border-width: 0 0 1px;
      }
      .app-title {
        margin-left: 8px;
        font-family: var(--font-display);
        font-weight: 600;
      }
      .app-spacer {
        flex: 1 1 auto;
      }
      .app-content {
        max-width: 1100px;
        margin: 0 auto;
        padding: 24px 16px;
      }
    `,
  ],
})
export class App {
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
