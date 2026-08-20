import { Component, Input } from '@angular/core';
import { CurrencyPipe } from '@angular/common';

export interface ProductoBarra {
  nombre: string;
  precio: number;
}

@Component({
  selector: 'app-top-productos-chart',
  standalone: true,
  imports: [CurrencyPipe],
  templateUrl: './top-productos-chart.component.html',
  styleUrl: './top-productos-chart.component.scss',
})
export class TopProductosChartComponent {
  @Input() productos: ProductoBarra[] = [];

  get maximo(): number {
    return Math.max(...this.productos.map((p) => p.precio), 1);
  }

  anchoPorcentaje(precio: number): number {
    return Math.max((precio / this.maximo) * 100, 4);
  }
}
