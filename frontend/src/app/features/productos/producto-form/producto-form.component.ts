import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ProductoService } from '../../../core/services/producto.service';

@Component({
  selector: 'app-producto-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './producto-form.component.html',
  styleUrl: './producto-form.component.scss',
})
export class ProductoFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly productoService = inject(ProductoService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly guardando = signal(false);
  readonly guardadoOk = signal(false);
  productoId: number | null = null;

  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(120)]],
    descripcion: ['', [Validators.maxLength(500)]],
    precio: [0, [Validators.required, Validators.min(0)]],
  });

  get modoEdicion(): boolean {
    return this.productoId !== null;
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      return;
    }

    this.productoId = Number(idParam);
    this.productoService.buscarPorId(this.productoId).subscribe((producto) => {
      this.form.patchValue({
        nombre: producto.nombre,
        descripcion: producto.descripcion ?? '',
        precio: producto.precio,
      });
    });
  }

  guardar(): void {
    if (this.form.invalid) {
      return;
    }

    this.guardando.set(true);
    const dto = this.form.getRawValue();

    const peticion = this.modoEdicion
      ? this.productoService.actualizar(this.productoId!, dto)
      : this.productoService.crear(dto);

    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.guardadoOk.set(true);
        this.snackBar.open('Producto guardado', 'Cerrar', {
          duration: 3000,
          panelClass: ['app-toast', 'app-toast--success'],
        });

        setTimeout(() => this.router.navigate(['/productos']), 400);
      },
      error: () => this.guardando.set(false),
    });
  }
}
