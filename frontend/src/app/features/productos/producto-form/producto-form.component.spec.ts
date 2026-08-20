import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router, ActivatedRoute, convertToParamMap } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { ProductoFormComponent } from './producto-form.component';
import { ProductoService } from '../../../core/services/producto.service';
import { Producto } from '../../../core/models/producto.model';

describe('ProductoFormComponent', () => {
  let productoServiceStub: Partial<ProductoService>;
  let router: Router;

  beforeEach(async () => {
    productoServiceStub = {
      crear: vi
        .fn()
        .mockReturnValue(of({ id: 1, nombre: 'Mouse', descripcion: '', precio: 100 } as Producto)),
      buscarPorId: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ProductoFormComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
        { provide: ProductoService, useValue: productoServiceStub },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({}) } } },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate');
  });

  it('el formulario es invalido si el nombre esta vacio', () => {
    const fixture = TestBed.createComponent(ProductoFormComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.form.invalid).toBe(true);
  });

  it('llama a crear() y navega a /productos al guardar un formulario valido', fakeAsync(() => {
    const fixture = TestBed.createComponent(ProductoFormComponent);
    fixture.detectChanges();

    fixture.componentInstance.form.setValue({
      nombre: 'Mouse',
      descripcion: 'Inalambrico',
      precio: 100,
    });

    fixture.componentInstance.guardar();
    tick(400);

    expect(productoServiceStub.crear).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/productos']);
  }));

  it('muestra el icono de check brevemente antes de navegar', fakeAsync(() => {
    const fixture = TestBed.createComponent(ProductoFormComponent);
    fixture.detectChanges();

    fixture.componentInstance.form.setValue({
      nombre: 'Mouse',
      descripcion: 'Inalambrico',
      precio: 100,
    });

    fixture.componentInstance.guardar();

    expect(fixture.componentInstance.guardadoOk()).toBe(true);
    expect(fixture.componentInstance.guardando()).toBe(false);

    tick(400);
  }));
});
