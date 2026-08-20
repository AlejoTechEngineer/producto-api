import { Component, Input } from '@angular/core';

interface Categoria {
  label: string;
  valor: number;
  clase: string;
}

@Component({
  selector: 'app-distribucion-precios-chart',
  standalone: true,
  templateUrl: './distribucion-precios-chart.component.html',
  styleUrl: './distribucion-precios-chart.component.scss',
})
export class DistribucionPreciosChartComponent {
  @Input() bajo = 0;
  @Input() medio = 0;
  @Input() alto = 0;

  get total(): number {
    return this.bajo + this.medio + this.alto;
  }

  get categorias(): Categoria[] {
    return [
      { label: 'Bajo', valor: this.bajo, clase: 'bajo' },
      { label: 'Medio', valor: this.medio, clase: 'medio' },
      { label: 'Alto', valor: this.alto, clase: 'alto' },
    ];
  }

  porcentaje(valor: number): number {
    return this.total === 0 ? 0 : (valor / this.total) * 100;
  }
}
