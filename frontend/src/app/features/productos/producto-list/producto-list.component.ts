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
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { StatCardComponent } from '../../../shared/stat-card/stat-card.component';

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
    EmptyStateComponent,
    StatCardComponent,
  ],
  templateUrl: './producto-list.component.html',
  styleUrl: './producto-list.component.scss',
})
export class ProductoListComponent implements OnInit {
  protected readonly productoService = inject(ProductoService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly columnas = ['id', 'nombre', 'descripcion', 'precio', 'acciones'];
  readonly busqueda = signal('');
  readonly ordenActivo = signal<Sort>({ active: '', direction: '' });

  readonly loading = this.productoService.loading;

  readonly totalProductos = computed(() => this.productoService.productos().length);

  readonly valorTotalInventario = computed(() =>
    this.productoService.productos().reduce((acumulado, p) => acumulado + p.precio, 0)
  );

  readonly precioPromedio = computed(() => {
    const total = this.totalProductos();
    return total === 0 ? 0 : this.valorTotalInventario() / total;
  });

  readonly progresoDecorativo = computed(() => Math.min(this.totalProductos() * 10, 100));

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
      panelClass: 'app-confirm-dialog-panel',
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
        this.snackBar.open(`"${producto.nombre}" eliminado`, 'Cerrar', {
          duration: 3000,
          panelClass: ['app-toast', 'app-toast--success'],
        });
        this.productoService.listar().subscribe();
      });
    });
  }
}
