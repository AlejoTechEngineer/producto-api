import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
  signal,
} from '@angular/core';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  template: `
    <div #card class="stat-card glass-surface glow-border" (mousemove)="onMouseMove($event)" (mouseleave)="onMouseLeave()">
      <p class="stat-label">{{ label }}</p>
      <p class="stat-value">{{ prefix }}{{ displayValue() }}</p>
      @if (showProgress) {
        <div class="stat-progress">
          <div class="stat-progress-fill" [style.width.%]="progressPercent"></div>
        </div>
      }
    </div>
  `,
  styleUrl: './stat-card.component.scss',
})
export class StatCardComponent implements OnChanges {
  @Input({ required: true }) label = '';
  @Input({ required: true }) value = 0;
  @Input() prefix = '';
  @Input() decimals = 0;
  @Input() showProgress = false;
  @Input() progressPercent = 0;

  @ViewChild('card') cardRef!: ElementRef<HTMLElement>;

  readonly displayValue = signal('0');

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value']) {
      this.animarCountUp(changes['value'].previousValue ?? 0, this.value);
    }
  }

  private animarCountUp(desde: number, hasta: number): void {
    const duracionMs = 800;
    let inicio: number | null = null;

    const paso = (ahora: number) => {
      if (inicio === null) {
        inicio = ahora;
      }
      const progreso = Math.min((ahora - inicio) / duracionMs, 1);
      const easedProgreso = 1 - Math.pow(1 - progreso, 3);
      const actual = desde + (hasta - desde) * easedProgreso;
      this.displayValue.set(actual.toFixed(this.decimals));

      if (progreso < 1) {
        requestAnimationFrame(paso);
      }
    };

    requestAnimationFrame(paso);
  }

  onMouseMove(event: MouseEvent): void {
    const el = this.cardRef.nativeElement;
    const rect = el.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const centroX = rect.width / 2;
    const centroY = rect.height / 2;
    const rotateY = ((x - centroX) / centroX) * 8;
    const rotateX = -((y - centroY) / centroY) * 8;

    el.style.transform = `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  }

  onMouseLeave(): void {
    this.cardRef.nativeElement.style.transform = 'perspective(600px) rotateX(0deg) rotateY(0deg)';
  }
}
