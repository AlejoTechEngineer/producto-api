import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MatToolbarModule, MatIconModule],
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
      .app-content {
        max-width: 1100px;
        margin: 0 auto;
        padding: 24px 16px;
      }
    `,
  ],
})
export class App {}
