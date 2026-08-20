import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { of } from 'rxjs';

import { ProductoListComponent } from './producto-list.component';
import { ProductoService } from '../../../core/services/producto.service';
import { Producto } from '../../../core/models/producto.model';

describe('ProductoListComponent', () => {
  const productos: Producto[] = [
    { id: 1, nombre: 'Mouse', descripcion: 'Inalambrico', precio: 59900 },
    { id: 2, nombre: 'Teclado', descripcion: 'Mecanico', precio: 189900 },
  ];

  let productoServiceStub: Partial<ProductoService>;

  beforeEach(async () => {
    productoServiceStub = {
      productos: signal<Producto[]>(productos),
      loading: signal(false),
      listar: vi.fn().mockReturnValue(of(productos)),
      eliminar: vi.fn().mockReturnValue(of(undefined)),
    };

    await TestBed.configureTestingModule({
      imports: [ProductoListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
        { provide: ProductoService, useValue: productoServiceStub },
      ],
    }).compileComponents();
  });

  it('filtra los productos por nombre al buscar', () => {
    const fixture = TestBed.createComponent(ProductoListComponent);
    fixture.detectChanges();

    fixture.componentInstance.onBuscar('tecl');

    expect(fixture.componentInstance.productosFiltrados()).toEqual([productos[1]]);
  });

  it('calcula total, valor total y precio promedio del inventario', () => {
    const fixture = TestBed.createComponent(ProductoListComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.totalProductos()).toBe(2);
    expect(fixture.componentInstance.valorTotalInventario()).toBe(59900 + 189900);
    expect(fixture.componentInstance.precioPromedio()).toBe((59900 + 189900) / 2);
  });
});
