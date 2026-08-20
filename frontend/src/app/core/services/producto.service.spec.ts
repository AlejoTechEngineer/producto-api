import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProductoService } from './producto.service';
import { environment } from '../../../environments/environment';
import { Producto } from '../models/producto.model';

describe('ProductoService', () => {
  let service: ProductoService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/productos`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(ProductoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('listar() actualiza el signal productos con la respuesta', () => {
    const mockData: Producto[] = [
      { id: 1, nombre: 'Mouse', descripcion: 'Inalambrico', precio: 59900 },
    ];

    service.listar().subscribe();

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockData);

    expect(service.productos()).toEqual(mockData);
    expect(service.loading()).toBe(false);
  });

  it('crear() envia POST al endpoint correcto', () => {
    const dto = { nombre: 'Teclado', descripcion: null, precio: 189900 };
    const created: Producto = { id: 2, ...dto };

    service.crear(dto).subscribe((result) => {
      expect(result).toEqual(created);
    });

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush(created);
  });

  it('eliminar() envia DELETE al id correcto', () => {
    service.eliminar(5).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/5`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
