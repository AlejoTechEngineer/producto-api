import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [RouterLink, MatButtonModule],
  template: `
    <div class="empty-state">
      <svg
        class="empty-state-icon"
        width="96"
        height="96"
        viewBox="0 0 96 96"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        aria-hidden="true"
      >
        <rect x="16" y="36" width="64" height="40" rx="6" />
        <path d="M16 44 L48 60 L80 44" />
        <path d="M34 36 L34 24 L62 24 L62 36" />
      </svg>
      <p class="empty-state-message">{{ mensaje }}</p>
      <button mat-flat-button color="primary" [routerLink]="ctaLink">
        {{ ctaLabel }}
      </button>
    </div>
  `,
  styleUrl: './empty-state.component.scss',
})
export class EmptyStateComponent {
  @Input() mensaje = 'Aun no hay nada por aqui';
  @Input() ctaLabel = 'Crear';
  @Input() ctaLink = '/';
}
